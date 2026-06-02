import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type {
  ContractReviewInput,
  DocumentDraftInput,
  LegalResearchInput,
} from "../types/workflow.types.js";

const execFileAsync = promisify(execFile);

export type LegalProvider = "mock" | "korean-law";
export type LegalLookupOperation = "searchLaw" | "searchPrecedents" | "getLawArticle";

export interface LegalLookupResult<TData = unknown> {
  readonly ok: boolean;
  readonly provider: LegalProvider;
  readonly operation: LegalLookupOperation;
  readonly data: TData | null;
  readonly message: string;
  readonly notices: readonly string[];
  readonly manualReviewRequired: boolean;
  readonly error?: string;
}

export interface LegalAuthoritySearchResult {
  readonly provider: LegalProvider;
  readonly lawSearch?: LegalLookupResult;
  readonly precedentSearch?: LegalLookupResult;
  readonly article?: LegalLookupResult;
  readonly notices: readonly string[];
  readonly manualReviewRequired: boolean;
}

export interface LegalSearchProvider {
  searchLaw(query: string): Promise<LegalLookupResult>;
  searchPrecedents(query: string): Promise<LegalLookupResult>;
  getLawArticle(lawName: string, articleNo: string): Promise<LegalLookupResult>;
}

export interface McpLegalService extends LegalSearchProvider {
  readonly provider: LegalProvider;
  researchLegalAuthorities(request: LegalResearchInput): Promise<LegalAuthoritySearchResult>;
  reviewContractAuthorities(request: ContractReviewInput): Promise<LegalAuthoritySearchResult>;
  draftDocumentAuthorities(request: DocumentDraftInput): Promise<LegalAuthoritySearchResult>;
}

function getConfiguredProvider(): LegalProvider {
  return process.env.LEGAL_PROVIDER === "korean-law" ? "korean-law" : "mock";
}

function manualFailure(
  provider: LegalProvider,
  operation: LegalLookupOperation,
  error: unknown,
): LegalLookupResult {
  return {
    ok: false,
    provider,
    operation,
    data: null,
    message: "검색 실패",
    notices: ["검색 실패", "수동 확인 필요"],
    manualReviewRequired: true,
    error: error instanceof Error ? error.message : String(error),
  };
}

function mockSuccess<TData>(
  operation: LegalLookupOperation,
  data: TData,
  message = "mock 검색 결과",
): LegalLookupResult<TData> {
  return {
    ok: true,
    provider: "mock",
    operation,
    data,
    message,
    notices: ["개발용 mock provider 결과입니다.", "실제 법령 및 판례는 수동 확인 필요"],
    manualReviewRequired: true,
  };
}

function mergeAuthorityResults(
  provider: LegalProvider,
  results: {
    readonly lawSearch?: LegalLookupResult;
    readonly precedentSearch?: LegalLookupResult;
    readonly article?: LegalLookupResult;
  },
): LegalAuthoritySearchResult {
  const lookups = [results.lawSearch, results.precedentSearch, results.article].filter(
    (result): result is LegalLookupResult => Boolean(result),
  );
  const notices = Array.from(new Set(lookups.flatMap((result) => result.notices)));
  const manualReviewRequired = lookups.some((result) => result.manualReviewRequired || !result.ok);

  return {
    provider,
    ...results,
    notices,
    manualReviewRequired,
  };
}

class MockLegalProvider implements LegalSearchProvider {
  async searchLaw(query: string): Promise<LegalLookupResult> {
    return mockSuccess("searchLaw", {
      query,
      results: [
        {
          lawName: "민법",
          articleNo: "제390조",
          title: "채무불이행과 손해배상",
        },
        {
          lawName: "민법",
          articleNo: "제750조",
          title: "불법행위의 내용",
        },
      ],
    });
  }

  async searchPrecedents(query: string): Promise<LegalLookupResult> {
    return mockSuccess("searchPrecedents", {
      query,
      results: [
        {
          court: "대법원",
          topic: "계약상 채무불이행 및 손해배상 관련 판례 검색 필요",
        },
      ],
    });
  }

  async getLawArticle(lawName: string, articleNo: string): Promise<LegalLookupResult> {
    return mockSuccess("getLawArticle", {
      lawName,
      articleNo,
      text: "개발용 mock 조문입니다. 실제 조문은 korean-law provider 또는 법제처 원문으로 확인해야 합니다.",
    });
  }
}

class KoreanLawCliProvider implements LegalSearchProvider {
  private readonly command = "korean-law-mcp";

  async searchLaw(query: string): Promise<LegalLookupResult> {
    return this.callCli("searchLaw", { query });
  }

  async searchPrecedents(query: string): Promise<LegalLookupResult> {
    return this.callCli("searchPrecedents", { query });
  }

  async getLawArticle(lawName: string, articleNo: string): Promise<LegalLookupResult> {
    return this.callCli("getLawArticle", { lawName, articleNo });
  }

  private async callCli(operation: LegalLookupOperation, params: Record<string, string>): Promise<LegalLookupResult> {
    if (!process.env.LAW_OC) {
      return manualFailure("korean-law", operation, new Error("LAW_OC is required for korean-law provider"));
    }

    try {
      const { stdout } = await execFileAsync(
        this.command,
        ["--tool", operation, "--json", JSON.stringify(params)],
        {
          env: {
            ...process.env,
            LAW_OC: process.env.LAW_OC,
          },
          timeout: 15_000,
          maxBuffer: 1024 * 1024,
        },
      );

      const trimmed = stdout.trim();
      const data = trimmed.length > 0 ? parseCliOutput(trimmed) : null;

      return {
        ok: true,
        provider: "korean-law",
        operation,
        data,
        message: "검색 완료",
        notices: ["korean-law CLI 검색 결과입니다. 인용 전 원문 확인이 필요합니다."],
        manualReviewRequired: true,
      };
    } catch (error) {
      return manualFailure("korean-law", operation, error);
    }
  }
}

function parseCliOutput(stdout: string): unknown {
  try {
    return JSON.parse(stdout);
  } catch {
    return { raw: stdout };
  }
}

function createProvider(provider: LegalProvider): LegalSearchProvider {
  return provider === "korean-law" ? new KoreanLawCliProvider() : new MockLegalProvider();
}

export function createMcpLegalService(provider: LegalProvider = getConfiguredProvider()): McpLegalService {
  const searchProvider = createProvider(provider);

  return {
    provider,

    searchLaw(query: string) {
      return searchProvider.searchLaw(query);
    },

    searchPrecedents(query: string) {
      return searchProvider.searchPrecedents(query);
    },

    getLawArticle(lawName: string, articleNo: string) {
      return searchProvider.getLawArticle(lawName, articleNo);
    },

    async researchLegalAuthorities(request: LegalResearchInput): Promise<LegalAuthoritySearchResult> {
      const query = [request.question, request.facts, request.jurisdiction].filter(Boolean).join(" ");
      const [lawSearch, precedentSearch] = await Promise.all([
        searchProvider.searchLaw(query),
        searchProvider.searchPrecedents(query),
      ]);

      return mergeAuthorityResults(provider, { lawSearch, precedentSearch });
    },

    async reviewContractAuthorities(request: ContractReviewInput): Promise<LegalAuthoritySearchResult> {
      const query = [request.partyRole, request.concern, request.contractText.slice(0, 500)].filter(Boolean).join(" ");
      const [lawSearch, precedentSearch] = await Promise.all([
        searchProvider.searchLaw(query),
        searchProvider.searchPrecedents(query),
      ]);

      return mergeAuthorityResults(provider, { lawSearch, precedentSearch });
    },

    async draftDocumentAuthorities(request: DocumentDraftInput): Promise<LegalAuthoritySearchResult> {
      const query = [request.documentType, request.facts, request.requestedOutcome].filter(Boolean).join(" ");
      const lawSearch = await searchProvider.searchLaw(query);

      return mergeAuthorityResults(provider, { lawSearch });
    },
  };
}

export const mcpLegalService = createMcpLegalService();
