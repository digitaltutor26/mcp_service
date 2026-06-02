import { describe, expect, it } from "vitest";

import { citationVerifierService, verifyCitations } from "./citationVerifier.service.js";

describe("citationVerifierService", () => {
  it("accepts legal authorities with law name and article number", () => {
    const result = verifyCitations({
      legalAuthorities: [{ lawName: "민법", articleNo: "제390조" }],
      caseAuthorities: [{ caseNumber: "대법원 2020다12345" }],
    });

    expect(result.legalAuthoritiesValid).toBe(true);
    expect(result.caseAuthoritiesValid).toBe(true);
    expect(result.sourceSufficiency).toBe("sufficient");
    expect(result.limitations).not.toContain("출처 확인 필요");
    expect(result.blocksDefinitiveAnalysis).toBe(false);
  });

  it("requires law name and article number for legal authorities", () => {
    const result = citationVerifierService.verify({
      legalAuthorities: [{ lawName: "민법" }],
      caseAuthorities: [{ decisionDate: "2024-01-15" }],
      limitations: ["사실관계 추가 확인 필요"],
    });

    expect(result.legalAuthoritiesValid).toBe(false);
    expect(result.missingFields.legalAuthorities).toEqual(["legalAuthorities[0].articleNo"]);
    expect(result.limitations).toContain("사실관계 추가 확인 필요");
    expect(result.limitations).toContain("출처 확인 필요");
    expect(result.blocksDefinitiveAnalysis).toBe(true);
  });

  it("requires either case number or decision date for case authorities", () => {
    const result = verifyCitations({
      legalAuthorities: [{ lawName: "상법", articleNo: "제398조" }],
      caseAuthorities: [{ court: "대법원" }],
    });

    expect(result.caseAuthoritiesValid).toBe(false);
    expect(result.missingFields.caseAuthorities).toEqual(["caseAuthorities[0].caseNumber_or_decisionDate"]);
    expect(result.sourceSufficiency).toBe("partial");
    expect(result.limitations).toContain("출처 확인 필요");
    expect(result.blocksDefinitiveAnalysis).toBe(true);
  });

  it("blocks definitive analysis when no statute or case authority exists", () => {
    const result = verifyCitations({});

    expect(result.hasLegalAuthority).toBe(false);
    expect(result.hasCaseAuthority).toBe(false);
    expect(result.sourceSufficiency).toBe("insufficient");
    expect(result.limitations).toContain("출처 확인 필요");
    expect(result.blocksDefinitiveAnalysis).toBe(true);
  });
});
