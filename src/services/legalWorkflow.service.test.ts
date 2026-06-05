import { describe, expect, it } from "vitest";

import { legalWorkflowService } from "./legalWorkflow.service.js";

describe("legalWorkflowService", () => {
  it("returns Korean legal research mock sources for unpaid service fees", () => {
    const result = legalWorkflowService.createLegalResearchMock({
      question: "프리랜서 용역대금을 지급받지 못한 경우 어떤 조치를 검토할 수 있나요?",
    });

    expect(result.issue).toContain("프리랜서 용역대금");
    expect(result.likelySources).toEqual([
      "계약상 채무불이행 검토",
      "민사 청구 절차 검토",
      "대금 지급 관련 판례 검색",
    ]);
    expect(result.limitations).toContain("이 결과는 법률 정보 제공용이며 최종 법률 판단을 대체하지 않습니다.");
  });

  it("marks one-sided Korean contract terms as high risk", () => {
    const result = legalWorkflowService.createContractReviewMock({
      contractText: "공급자는 언제든 계약을 해지할 수 있고 고객은 남은 대금을 모두 부담합니다.",
      partyRole: "고객",
      concern: "일반 위험 검토",
    });

    expect(result.riskLevel).toBe("high");
    expect(result.detectedIssues).toContain("일방적 해지 또는 대금 부담 위험");
    expect(result.suggestedReviewPoints).toContain("준거법과 당사자 지위를 확인합니다.");
  });

  it("returns draft-only Korean document structure with missing fact placeholders", () => {
    const result = legalWorkflowService.createDocumentDraftMock({
      documentType: "내용증명 초안",
      facts: "거래처가 두 차례 독촉 후에도 청구 금액을 지급하지 않았습니다.",
      recipient: "거래처",
      requestedOutcome: "지급 요청",
    });

    expect(result.sections).toContain("요청 사항");
    expect(result.sections).toContain("기한 및 권리 유보 문구");
    expect(result.placeholders).toContain("[내용증명 초안 작성일]");
    expect(result.deliveryChecklist).toContain("기한과 발송 증빙 요건을 확인합니다.");
  });
});
