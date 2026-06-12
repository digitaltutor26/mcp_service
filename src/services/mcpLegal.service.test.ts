import { describe, expect, it } from "vitest";

import { createMcpLegalService } from "./mcpLegal.service.js";

describe("mcpLegalService providers", () => {
  it("returns mock search data from the mock provider", async () => {
    const service = createMcpLegalService("mock");

    const result = await service.searchLaw("unpaid freelance fee");

    expect(service.provider).toBe("mock");
    expect(result.ok).toBe(true);
    expect(result.provider).toBe("mock");
    expect(result.operation).toBe("searchLaw");
    expect(result.manualReviewRequired).toBe(true);
  });

  it("returns non-throwing failure metadata from korean-law provider when LAW_OC is missing", async () => {
    const originalLawOc = process.env.LAW_OC;
    delete process.env.LAW_OC;

    try {
      const service = createMcpLegalService("korean-law");
      const result = await service.searchPrecedents("supplier agreement liability");

      expect(service.provider).toBe("korean-law");
      expect(result.ok).toBe(false);
      expect(result.message).toBe("검색 실패");
      expect(result.notices).toContain("검색 실패");
      expect(result.notices).toContain("수동 확인 필요");
      expect(result.error).toContain("LAW_OC 환경변수");
      expect(result.manualReviewRequired).toBe(true);
    } finally {
      if (originalLawOc === undefined) {
        delete process.env.LAW_OC;
      } else {
        process.env.LAW_OC = originalLawOc;
      }
    }
  });
});
