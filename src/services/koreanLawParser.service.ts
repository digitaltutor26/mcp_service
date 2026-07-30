/**
 * korean-law CLI(v4)는 직접 도구 실행 시 JSON이 아니라 사람이 읽는 텍스트를 출력합니다.
 * 이 모듈은 그 텍스트를 인용 검증기가 사용하는 구조화된 형태로 변환합니다.
 */

export interface ParsedLawSearchEntry {
  readonly lawName: string;
  readonly lawId?: string | undefined;
  readonly mst?: string | undefined;
  readonly promulgationDate?: string | undefined;
  readonly lawType?: string | undefined;
  readonly matchType: "exact" | "partial";
}

export interface ParsedPrecedentEntry {
  readonly precedentId: string;
  readonly title: string;
  readonly caseNumber?: string | undefined;
  readonly court?: string | undefined;
  readonly decisionDate?: string | undefined;
  readonly judgmentType?: string | undefined;
}

export interface ParsedArticle {
  readonly lawName?: string | undefined;
  readonly articleNo?: string | undefined;
  readonly title?: string | undefined;
  readonly text?: string | undefined;
  readonly promulgationDate?: string | undefined;
  readonly effectiveDate?: string | undefined;
}

/** CLI 출력에는 `OC=<인증키>`가 포함된 링크가 있어 그대로 응답에 실으면 키가 유출됩니다. */
export function redactApiKey(text: string): string {
  return text.replace(/([?&](?:amp;)?OC=)[^&\s"']+/gi, "$1***");
}

/** `[NOT_FOUND] ...` 처럼 대문자 토큰으로 시작하는 출력은 CLI가 보고하는 실패입니다. */
export function isNotFoundOutput(text: string): boolean {
  return /^\s*\[[A-Z][A-Z_]*\]/.test(text);
}

function parseFieldLine(line: string): readonly [string, string] | undefined {
  const match = /^\s*(?:-\s*)?([^:]+?)\s*:\s*(.+?)\s*$/.exec(line);
  if (!match?.[1] || !match[2]) {
    return undefined;
  }

  return [match[1], match[2]];
}

function normalizeDate(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const compact = value.replace(/[.\-\s]/g, "");
  return /^\d{8}$/.test(compact)
    ? `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`
    : value;
}

/**
 * `korean-law search_law --query ...` 출력을 파싱합니다.
 *
 * 검색 결과 (총 9건):
 * 📍 정확매칭 (1건):
 * 1. 민법
 *    - 법령ID: 001706
 *    - MST: 284415
 */
export function parseLawSearchText(text: string): readonly ParsedLawSearchEntry[] {
  if (isNotFoundOutput(text)) {
    return [];
  }

  const entries: ParsedLawSearchEntry[] = [];
  let matchType: ParsedLawSearchEntry["matchType"] = "exact";
  let current: { name: string; fields: Map<string, string> } | undefined;

  const flush = () => {
    if (!current) {
      return;
    }

    entries.push({
      lawName: current.name,
      lawId: current.fields.get("법령ID"),
      mst: current.fields.get("MST"),
      promulgationDate: normalizeDate(current.fields.get("공포일")),
      lawType: current.fields.get("구분"),
      matchType,
    });
    current = undefined;
  };

  for (const line of text.split("\n")) {
    if (line.includes("부분매칭")) {
      flush();
      matchType = "partial";
      continue;
    }

    if (line.includes("정확매칭")) {
      flush();
      matchType = "exact";
      continue;
    }

    const heading = /^\s*\d+\.\s+(.+?)\s*$/.exec(line);
    if (heading?.[1]) {
      flush();
      current = { name: heading[1], fields: new Map() };
      continue;
    }

    if (current && line.trimStart().startsWith("-")) {
      const field = parseFieldLine(line);
      if (field) {
        current.fields.set(field[0], field[1]);
      }
    }
  }

  flush();

  return entries;
}

/**
 * `korean-law search_precedents --query ...` 출력을 파싱합니다.
 *
 * [599609] 손해배상(기)[...]
 *   사건번호: 2024다267994
 *   법원: 대법원
 *   선고일: 2024.12.12
 */
export function parsePrecedentSearchText(text: string): readonly ParsedPrecedentEntry[] {
  if (isNotFoundOutput(text)) {
    return [];
  }

  const entries: ParsedPrecedentEntry[] = [];
  let current: { id: string; title: string; fields: Map<string, string> } | undefined;

  const flush = () => {
    if (!current) {
      return;
    }

    entries.push({
      precedentId: current.id,
      title: current.title,
      caseNumber: current.fields.get("사건번호"),
      court: current.fields.get("법원"),
      decisionDate: normalizeDate(current.fields.get("선고일")),
      judgmentType: current.fields.get("판결유형"),
    });
    current = undefined;
  };

  for (const line of text.split("\n")) {
    const heading = /^\s*\[(\d+)\]\s*(.+?)\s*$/.exec(line);
    if (heading?.[1] && heading[2]) {
      flush();
      current = { id: heading[1], title: heading[2], fields: new Map() };
      continue;
    }

    if (!current) {
      continue;
    }

    // `링크:` 값에는 인증키가 들어 있으므로 구조화된 결과에 담지 않습니다.
    const field = parseFieldLine(line);
    if (field && field[0] !== "링크") {
      current.fields.set(field[0], field[1]);
    }
  }

  flush();

  return entries;
}

/**
 * `korean-law query "<법령명> <조문>" --json` 의 `pipelineResult` 텍스트를 파싱합니다.
 *
 * 법령명: 민법
 * 공포일: 20260317
 * 시행일: 20260317
 *
 * 제390조 채무불이행과 손해배상
 * 채무자가 채무의 내용에 좇은 이행을 하지 아니한 때에는 ...
 */
export function parseArticleText(text: string): ParsedArticle | undefined {
  if (isNotFoundOutput(text)) {
    return undefined;
  }

  const lines = text.split("\n");
  const header = new Map<string, string>();
  let articleNo: string | undefined;
  let title: string | undefined;
  const body: string[] = [];

  for (const line of lines) {
    if (articleNo === undefined) {
      const article = /^\s*(제\d+조(?:의\d+)?)\s*(.*?)\s*$/.exec(line);
      if (article?.[1]) {
        articleNo = article[1];
        title = article[2] === "" ? undefined : article[2];
        continue;
      }

      const field = parseFieldLine(line);
      if (field) {
        header.set(field[0], field[1]);
      }
      continue;
    }

    body.push(line);
  }

  const lawName = header.get("법령명");
  const bodyText = body.join("\n").trim();

  if (!lawName && !articleNo) {
    return undefined;
  }

  return {
    lawName,
    articleNo,
    title,
    text: bodyText === "" ? undefined : bodyText,
    promulgationDate: normalizeDate(header.get("공포일")),
    effectiveDate: normalizeDate(header.get("시행일")),
  };
}

export interface ParsedChainArticle {
  readonly lawName: string;
  readonly articleNo: string;
  readonly title?: string | undefined;
  readonly text?: string | undefined;
  readonly effectiveDate?: string | undefined;
  readonly ministry?: string | undefined;
}

export interface ParsedResearchChain {
  readonly lawArticles: readonly ParsedChainArticle[];
  readonly precedents: readonly ParsedPrecedentEntry[];
  /** `▶ 관련 판례 [NOT_FOUND / FAILED]` 처럼 CLI가 명시적으로 실패를 표시한 섹션 이름입니다. */
  readonly failedSections: readonly string[];
}

/** `제0390조` 형태의 0 패딩 조문번호를 `제390조`로 정규화합니다. */
function normalizeArticleNo(value: string): string {
  return value.replace(/^제0*(\d+)/, "제$1");
}

function splitChainSections(text: string): ReadonlyMap<string, string> {
  const sections = new Map<string, string>();
  let name: string | undefined;
  let buffer: string[] = [];

  const flush = () => {
    if (name !== undefined) {
      sections.set(name, buffer.join("\n"));
    }
  };

  for (const line of text.split("\n")) {
    const heading = /^▶\s*(.+?)\s*$/.exec(line);
    if (heading?.[1]) {
      flush();
      name = heading[1];
      buffer = [];
      continue;
    }

    if (name !== undefined) {
      buffer.push(line);
    }
  }

  flush();

  return sections;
}

/**
 * `▶ AI 법령검색 결과` 섹션의 조문 목록을 파싱합니다.
 *
 * 민법
 *    제0390조 (채무불이행과 손해배상)
 *    제390조(채무불이행과 손해배상)
 *  채무자가 채무의 내용에 좇은 이행을 하지 아니한 때에는 ...
 *    시행: 2026.03.17 | 법무부
 */
function parseChainArticles(section: string): readonly ParsedChainArticle[] {
  const articles: ParsedChainArticle[] = [];
  let lawName: string | undefined;
  let current:
    | {
        articleNo: string;
        title?: string | undefined;
        body: string[];
        effective?: string | undefined;
        ministry?: string | undefined;
      }
    | undefined;

  const flush = () => {
    if (!lawName || !current) {
      return;
    }

    const text = current.body.join("\n").trim();
    articles.push({
      lawName,
      articleNo: current.articleNo,
      title: current.title,
      text: text === "" ? undefined : text,
      effectiveDate: normalizeDate(current.effective),
      ministry: current.ministry,
    });
    current = undefined;
  };

  for (const line of section.split("\n")) {
    // 들여쓰기 없는 비어있지 않은 줄은 법령명입니다.
    // 단 `[전문개정 2010.3.31]` 같은 개정 주석도 들여쓰기 없이 오므로 본문으로 넘깁니다.
    if (line.length > 0 && !/^\s/.test(line) && !line.startsWith("[")) {
      if (/^(지능형|💡|⚠️|힌트|대안|재시도|═)/.test(line)) {
        continue;
      }

      flush();
      lawName = line.trim();
      continue;
    }

    const heading = /^\s+(제\d+조(?:의\d+)?)\s*\((.+?)\)\s*$/.exec(line);
    if (heading?.[1] && heading[2]) {
      const articleNo = normalizeArticleNo(heading[1]);
      // CLI는 같은 조문을 0 패딩/비패딩 두 줄로 반복 출력하므로 중복을 접습니다.
      if (current?.articleNo === articleNo) {
        continue;
      }

      flush();
      current = { articleNo, title: heading[2], body: [] };
      continue;
    }

    if (!current) {
      continue;
    }

    const effective = /^\s*시행:\s*([\d.]+)\s*(?:\|\s*(.+?))?\s*$/.exec(line);
    if (effective?.[1]) {
      current.effective = effective[1];
      current.ministry = effective[2];
      continue;
    }

    // 비패딩 반복 줄(`제390조(채무불이행과 손해배상)`)은 본문에 넣지 않습니다.
    if (new RegExp(`^\\s*${current.articleNo}\\(`).test(line)) {
      continue;
    }

    current.body.push(line);
  }

  flush();

  return articles;
}

/** `korean-law query <자연어> --json`이 `chain_full_research`로 라우팅된 결과를 파싱합니다. */
export function parseResearchChainText(text: string): ParsedResearchChain {
  const sections = splitChainSections(text);
  const failedSections: string[] = [];
  let lawArticles: readonly ParsedChainArticle[] = [];
  let precedents: readonly ParsedPrecedentEntry[] = [];

  for (const [name, body] of sections) {
    if (/\[NOT_FOUND|FAILED\]/.test(name)) {
      failedSections.push(name.replace(/\s*\[.*\]\s*$/, "").trim());
      continue;
    }

    if (name.includes("법령검색")) {
      lawArticles = parseChainArticles(body);
      continue;
    }

    if (name.includes("판례") && !name.includes("상세")) {
      precedents = parsePrecedentSearchText(body);
    }
  }

  return { lawArticles, precedents, failedSections };
}

export interface KoreanLawQueryEnvelope {
  readonly query?: string | undefined;
  readonly route?: { readonly tool?: string | undefined; readonly reason?: string | undefined } | undefined;
  readonly result?: string | undefined;
  readonly pipelineResult?: string | undefined;
  readonly isError?: boolean | undefined;
}

/** `query --json` 응답 봉투를 안전하게 좁힙니다. */
export function asQueryEnvelope(value: unknown): KoreanLawQueryEnvelope | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const route = record.route !== null && typeof record.route === "object" && !Array.isArray(record.route)
    ? record.route as Record<string, unknown>
    : undefined;

  return {
    query: typeof record.query === "string" ? record.query : undefined,
    route: route
      ? {
          tool: typeof route.tool === "string" ? route.tool : undefined,
          reason: typeof route.reason === "string" ? route.reason : undefined,
        }
      : undefined,
    result: typeof record.result === "string" ? record.result : undefined,
    pipelineResult: typeof record.pipelineResult === "string" ? record.pipelineResult : undefined,
    isError: typeof record.isError === "boolean" ? record.isError : undefined,
  };
}
