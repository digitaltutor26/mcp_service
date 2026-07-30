import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  asQueryEnvelope,
  isNotFoundOutput,
  parseArticleText,
  parseLawSearchText,
  parsePrecedentSearchText,
  parseResearchChainText,
  redactApiKey,
} from "./koreanLawParser.service.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf8");
}

describe("parseLawSearchText", () => {
  const text = readFixture("search-law.txt");

  it("extracts the exact match with its identifiers", () => {
    const entries = parseLawSearchText(text);
    const exact = entries.filter((entry) => entry.matchType === "exact");

    expect(exact).toHaveLength(1);
    expect(exact[0]).toEqual({
      lawName: "민법",
      lawId: "001706",
      mst: "284415",
      promulgationDate: "2026-03-17",
      lawType: "법률",
      matchType: "exact",
    });
  });

  it("extracts partial matches without dropping entries", () => {
    const entries = parseLawSearchText(text);

    expect(entries).toHaveLength(9);
    expect(entries.filter((entry) => entry.matchType === "partial")).toHaveLength(8);
    expect(entries.map((entry) => entry.lawName)).toContain("난민법 시행령");
  });

  it("returns no entries for a NOT_FOUND response", () => {
    expect(parseLawSearchText(readFixture("not-found.txt"))).toEqual([]);
  });
});

describe("parsePrecedentSearchText", () => {
  const text = readFixture("search-precedents.txt");

  it("extracts case number, court and decision date", () => {
    const entries = parsePrecedentSearchText(text);

    expect(entries).toHaveLength(2);
    expect(entries[0]?.caseNumber).toBe("2024다267994");
    expect(entries[0]?.court).toBe("대법원");
    expect(entries[0]?.decisionDate).toBe("2024-12-12");
    expect(entries[0]?.precedentId).toBe("599609");
    expect(entries[1]?.caseNumber).toBe("2019다283725");
  });

  it("never carries the link field, which embeds the API key", () => {
    const entries = parsePrecedentSearchText(text);

    expect(JSON.stringify(entries)).not.toContain("OC=");
  });
});

describe("parseArticleText", () => {
  it("extracts law name, article number and body from a pipeline result", () => {
    const envelope = asQueryEnvelope(JSON.parse(readFixture("query-article.json")));
    const article = parseArticleText(envelope?.pipelineResult ?? "");

    expect(article?.lawName).toBe("민법");
    expect(article?.articleNo).toBe("제390조");
    expect(article?.title).toBe("채무불이행과 손해배상");
    expect(article?.promulgationDate).toBe("2026-03-17");
    expect(article?.effectiveDate).toBe("2026-03-17");
    expect(article?.text).toContain("채무자가 채무의 내용에 좇은 이행을 하지 아니한 때에는");
  });

  it("returns undefined for a NOT_FOUND response", () => {
    expect(parseArticleText(readFixture("not-found.txt"))).toBeUndefined();
  });
});

describe("parseResearchChainText", () => {
  const envelope = asQueryEnvelope(JSON.parse(readFixture("query-research-chain.json")));
  const chain = parseResearchChainText(envelope?.result ?? "");

  it("extracts article-level authorities with law name and article number", () => {
    expect(chain.lawArticles.length).toBeGreaterThan(0);

    const article390 = chain.lawArticles.find((entry) => entry.articleNo === "제390조");
    expect(article390?.lawName).toBe("민법");
    expect(article390?.title).toBe("채무불이행과 손해배상");
    expect(article390?.effectiveDate).toBe("2026-03-17");
    expect(article390?.ministry).toBe("법무부");
    expect(article390?.text).toContain("채무자가 채무의 내용에 좇은 이행을 하지 아니한 때에는");
  });

  it("normalizes zero-padded article numbers and does not duplicate them", () => {
    const numbers = chain.lawArticles.map((entry) => entry.articleNo);

    expect(numbers).not.toContain("제0390조");
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("never leaks the duplicated heading line into the article body", () => {
    const article390 = chain.lawArticles.find((entry) => entry.articleNo === "제390조");

    expect(article390?.text).not.toContain("제390조(채무불이행과 손해배상)");
  });

  it("reuses the precedent format from the 관련 판례 section", () => {
    expect(chain.precedents).toHaveLength(2);
    expect(chain.precedents[0]?.caseNumber).toBe("2024다267994");
    expect(chain.precedents[0]?.court).toBe("대법원");
  });

  it("reports sections the CLI explicitly marked as failed", () => {
    expect(chain.failedSections).toContain("법령 해석례");
    expect(chain.failedSections).not.toContain("관련 판례");
  });
});

describe("parseResearchChainText with revision annotations", () => {
  const envelope = asQueryEnvelope(JSON.parse(readFixture("query-research-chain-annotated.json")));
  const chain = parseResearchChainText(envelope?.result ?? "");

  it("keeps a column-zero [전문개정 ...] annotation inside the article body", () => {
    const article = chain.lawArticles.find(
      (entry) => entry.lawName === "집행관법" && entry.articleNo === "제27조",
    );

    expect(article).toBeDefined();
    expect(article?.text).toContain("[전문개정 2010.3.31]");
  });

  it("still reads the 시행 line that follows the annotation", () => {
    const article = chain.lawArticles.find(
      (entry) => entry.lawName === "집행관법" && entry.articleNo === "제27조",
    );

    expect(article?.effectiveDate).toBe("2021-04-21");
    expect(article?.ministry).toBe("법무부");
  });

  it("never treats an annotation line as a law name", () => {
    expect(chain.lawArticles.map((entry) => entry.lawName)).not.toContain("[전문개정 2010.3.31]");
    for (const entry of chain.lawArticles) {
      expect(entry.lawName.startsWith("[")).toBe(false);
    }
  });
});

describe("asQueryEnvelope", () => {
  it("narrows the query --json envelope", () => {
    const envelope = asQueryEnvelope(JSON.parse(readFixture("query-article.json")));

    expect(envelope?.isError).toBe(false);
    expect(envelope?.route?.tool).toBe("search_law");
    expect(envelope?.pipelineResult).toContain("제390조");
  });

  it("rejects non-object payloads", () => {
    expect(asQueryEnvelope("plain text")).toBeUndefined();
    expect(asQueryEnvelope(null)).toBeUndefined();
    expect(asQueryEnvelope([1, 2])).toBeUndefined();
  });
});

describe("redactApiKey", () => {
  it("masks the OC value in CLI links", () => {
    const redacted = redactApiKey(readFixture("search-precedents.txt"));

    expect(redacted).not.toContain("OC=TEST_OC_KEY");
    expect(redacted).toContain("OC=***");
  });

  it("masks both plain and html-escaped query separators", () => {
    expect(redactApiKey("/DRF/lawService.do?OC=secret&target=prec")).toBe(
      "/DRF/lawService.do?OC=***&target=prec",
    );
    expect(redactApiKey("/DRF/lawService.do?x=1&amp;OC=secret&amp;target=prec")).toBe(
      "/DRF/lawService.do?x=1&amp;OC=***&amp;target=prec",
    );
  });
});

describe("isNotFoundOutput", () => {
  it("detects CLI error markers", () => {
    expect(isNotFoundOutput(readFixture("not-found.txt"))).toBe(true);
    expect(isNotFoundOutput(readFixture("search-law.txt"))).toBe(false);
  });
});
