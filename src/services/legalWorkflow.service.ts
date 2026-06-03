import type {
  ContractReviewInput,
  DocumentDraftInput,
  LegalResearchInput,
} from "../types/workflow.types.js";

export interface LegalWorkflowMockService {
  createLegalResearchMock(input: LegalResearchInput): {
    readonly issue: string;
    readonly likelySources: readonly string[];
    readonly limitations: readonly string[];
  };
  createContractReviewMock(input: ContractReviewInput): {
    readonly riskLevel: "low" | "medium" | "high";
    readonly detectedIssues: readonly string[];
    readonly suggestedReviewPoints: readonly string[];
  };
  createDocumentDraftMock(input: DocumentDraftInput): {
    readonly sections: readonly string[];
    readonly placeholders: readonly string[];
    readonly deliveryChecklist: readonly string[];
  };
}

function containsAny(text: string, terms: readonly string[]): boolean {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

export const legalWorkflowService: LegalWorkflowMockService = {
  createLegalResearchMock(input: LegalResearchInput) {
    const context = [input.question, input.facts, input.jurisdiction].filter(Boolean).join(" ");

    return {
      issue: input.question,
      likelySources: containsAny(context, ["fee", "invoice", "대금", "용역", "임금"])
        ? ["계약상 채무불이행 검토", "민사 청구 절차 검토", "대금 지급 관련 판례 검색"]
        : ["관련 법령 검색", "판례 검색", "행정해석 검색"],
      limitations: [
        "현재 결과는 개발용 mock 검색을 포함할 수 있으며 실제 법령 원문 확인이 필요합니다.",
        "이 결과는 법률 정보 제공용이며 최종 법률 판단을 대체하지 않습니다.",
      ],
    };
  },

  createContractReviewMock(input: ContractReviewInput) {
    const text = [input.contractText, input.concern].filter(Boolean).join(" ");
    const highRisk = containsAny(text, ["terminate at any time", "all fees", "unlimited", "indemnify", "손해배상"]);

    return {
      riskLevel: highRisk ? "high" : "medium",
      detectedIssues: highRisk
        ? ["일방적 해지 또는 대금 부담 위험", "책임 배분 범위가 과도할 가능성"]
        : ["조항별 법적 근거 검토 필요", "거래상 영향은 구체적 사실관계에 따라 달라질 수 있음"],
      suggestedReviewPoints: [
        "준거법과 당사자 지위를 확인합니다.",
        "위험 배분이 거래 조건과 균형을 이루는지 확인합니다.",
        "협상 전 대체 문구 초안을 준비합니다.",
      ],
    };
  },

  createDocumentDraftMock(input: DocumentDraftInput) {
    return {
      sections: [
        "발신인 및 수신인",
        "배경 사실관계",
        "법적 입장 요약",
        "요청 사항",
        "기한 및 권리 유보 문구",
      ],
      placeholders: [
        `[${input.documentType} 작성일]`,
        "[정확한 금액 또는 다툼이 있는 의무]",
        "[첨부자료 목록]",
      ],
      deliveryChecklist: [
        "수신인 신원과 주소를 확인합니다.",
        "근거 자료를 첨부합니다.",
        "기한과 발송 증빙 요건을 확인합니다.",
      ],
    };
  },
};
