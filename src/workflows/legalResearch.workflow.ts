import { legalWorkflowService } from "../services/legalWorkflow.service.js";
import { mcpLegalService } from "../services/mcpLegal.service.js";
import type { LegalResearchInput, LegalResearchWorkflowOutput } from "../types/workflow.types.js";
import { createPolicyResult, hasExcludedEducationContext } from "./policy.js";

export async function legalResearchWorkflow(input: LegalResearchInput): Promise<LegalResearchWorkflowOutput> {
  const context = [input.question, input.facts, input.jurisdiction].filter(Boolean).join(" ");

  if (hasExcludedEducationContext(context)) {
    return {
      allowed: false,
      reason: "excluded_education_context",
      policy: createPolicyResult({ requiresExpertReview: true }),
    };
  }

  const mockResult = legalWorkflowService.createLegalResearchMock(input);
  const authoritySearch = await mcpLegalService.researchLegalAuthorities(input);

  return {
    allowed: true,
    workflow: "legal_research",
    summary: "법률 리서치 요청이 접수되었습니다. 현재는 개발용 검색 결과를 기준으로 정보 제공 리포트를 생성합니다.",
    nextSteps: [
      "관련 법령과 판례 후보를 확인합니다.",
      "확인된 출처와 추론 내용을 구분합니다.",
      "누락된 사실관계, 기한, 관할 쟁점을 표시합니다.",
    ],
    mockResult,
    authoritySearch,
    policy: createPolicyResult({
      requiresExpertReview: true,
      warnings: ["신청, 협상, 소송 전략에 활용하기 전 전문가 검토가 필요합니다."],
    }),
  };
}

export const runLegalResearchWorkflow = legalResearchWorkflow;
