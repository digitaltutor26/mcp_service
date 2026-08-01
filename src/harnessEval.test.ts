import { readFileSync, readdirSync } from "node:fs";
import { createServer, type Server } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parse } from "yaml";

import { createApp } from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const evalsDir = path.resolve(__dirname, "../legal-harness/evals");

type EvalWorkflow = "legal_research" | "contract_review" | "document_drafting";

interface EvalCase {
  readonly id: string;
  readonly input: {
    readonly workflow?: EvalWorkflow;
    readonly provider?: string;
    readonly prompt: string;
  };
  readonly expected: {
    readonly must_include?: readonly string[];
    readonly must_not_include?: readonly string[];
    readonly fallback_must_include?: readonly string[];
  };
}

interface EvalFile {
  readonly name: string;
  readonly description: string;
  readonly cases: readonly EvalCase[];
}

function loadEvalFiles(): readonly EvalFile[] {
  return readdirSync(evalsDir)
    .filter((file) => file.endsWith(".yaml"))
    .map((file) => parse(readFileSync(path.join(evalsDir, file), "utf-8")) as EvalFile);
}

/**
 * YAML의 `prompt`는 워크플로마다 다른 필드로 들어간다. 계약서 검토/문서 초안은
 * Zod 스키마상 프롬프트 하나만으로는 필수 필드(partyRole/facts 등)를 못 채우므로
 * 나머지는 중립적인 기본값으로 채운다.
 */
function buildRequest(input: EvalCase["input"]): { readonly path: string; readonly body: Record<string, unknown> } {
  switch (input.workflow) {
    case "contract_review":
      return { path: "/api/contract-review", body: { contractText: input.prompt, partyRole: "당사자" } };
    case "document_drafting":
      return {
        path: "/api/document-draft",
        body: { documentType: "내용증명", facts: input.prompt, recipient: "상대방" },
      };
    case "legal_research":
    default:
      return { path: "/api/legal-research", body: { question: input.prompt } };
  }
}

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createServer(createApp());
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Expected server to listen on a TCP address");
      }
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("legal-harness YAML evals", () => {
  const files = loadEvalFiles();

  for (const file of files) {
    describe(`${file.name} — ${file.description}`, () => {
      for (const testCase of file.cases) {
        // korean-law CLI가 실제로 응답을 준 경우에만 뜻이 있는 케이스라, 그 provider가
        // 활성화되지 않은 환경(기본 mock 모드)에서는 참/거짓을 판정할 근거가 없어 건너뛴다.
        const requiresLiveProvider =
          Boolean(testCase.input.provider) && process.env.LEGAL_PROVIDER !== testCase.input.provider;

        it.skipIf(requiresLiveProvider)(testCase.id, async () => {
          const { path: routePath, body } = buildRequest(testCase.input);
          const response = await fetch(`${baseUrl}${routePath}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
          const responseBody = (await response.json()) as Record<string, unknown>;
          const responseText = JSON.stringify(responseBody);

          // authoritySearch(검색 쿼리에 사용자 입력 원문 포함)와 safetyReview.detections
          // (안전 필터가 무엇을 감지했는지 투명하게 보여주는 진단 echo)는 사용자 입력을
          // 그대로 되돌려주는 메타데이터다. "시스템이 단정적 주장을 스스로 생성하지 않는다"는
          // must_not_include 검사는 시스템이 실제로 만들어낸 결론/경고 텍스트만 봐야 하므로
          // 이 두 필드는 제외한다 — 위험 문구를 감지해 투명하게 보여주는 것 자체는 안전장치가
          // 의도한 동작이지, 시스템이 그 문구를 주장으로 채택했다는 뜻이 아니다.
          const { authoritySearch: _authoritySearch, safetyReview: _safetyReview, ...generatedContent } =
            responseBody;
          const generatedText = JSON.stringify(generatedContent);

          const mustInclude = testCase.expected.must_include ?? [];
          const fallbackMustInclude = testCase.expected.fallback_must_include;

          if (fallbackMustInclude) {
            const matchesPrimary = mustInclude.every((phrase) => responseText.includes(phrase));
            const matchesFallback = fallbackMustInclude.every((phrase) => responseText.includes(phrase));
            expect(
              matchesPrimary || matchesFallback,
              `응답이 기대값(${JSON.stringify(mustInclude)}) 또는 폴백값(${JSON.stringify(fallbackMustInclude)}) ` +
                `중 어느 쪽과도 일치하지 않습니다: ${responseText}`,
            ).toBe(true);
          } else {
            for (const phrase of mustInclude) {
              expect(responseText, `"${phrase}"가 응답에 포함되어야 합니다`).toContain(phrase);
            }
          }

          for (const phrase of testCase.expected.must_not_include ?? []) {
            expect(generatedText, `"${phrase}"가 생성된 결과에 포함되면 안 됩니다`).not.toContain(phrase);
          }
        });
      }
    });
  }
});
