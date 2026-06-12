import { legalWorkflowService } from "../services/legalWorkflow.service.js";
import { mcpLegalService } from "../services/mcpLegal.service.js";
import { createComplianceResult, mergePolicyWithCompliance } from "../services/workflowCompliance.service.js";
import type { DocumentDraftInput, DocumentDraftWorkflowOutput } from "../types/workflow.types.js";
import { createPolicyResult, hasExcludedEducationContext } from "./policy.js";

export async function documentDraftWorkflow(input: DocumentDraftInput): Promise<DocumentDraftWorkflowOutput> {
  const context = [input.documentType, input.facts, input.recipient, input.requestedOutcome].filter(Boolean).join(" ");

  if (hasExcludedEducationContext(context)) {
    return {
      allowed: false,
      reason: "excluded_education_context",
      policy: createPolicyResult({ draftOnly: true, requiresExpertReview: true }),
    };
  }

  const mockResult = legalWorkflowService.createDocumentDraftMock(input);
  const authoritySearch = await mcpLegalService.draftDocumentAuthorities(input);
  const nextSteps = [
    "필수 사실관계와 첨부자료를 확인합니다.",
    "누락된 정보는 임의로 작성하지 않고 자리표시자로 남깁니다.",
    "사용 전 인용과 절차 요건을 확인합니다.",
  ];
  const compliance = createComplianceResult({
    authoritySearch,
    textParts: [
      input.documentType,
      input.facts,
      input.recipient ?? "미지정",
      input.requestedOutcome ?? "미지정",
      ...mockResult.sections,
      ...mockResult.placeholders,
      ...mockResult.deliveryChecklist,
      ...nextSteps,
    ],
    baseWarnings: ["생성된 문서는 초안이며 제출, 서명, 발송 전에 전문가 검토가 필요합니다."],
  });
  const policy = mergePolicyWithCompliance(
    createPolicyResult({
      draftOnly: true,
      requiresExpertReview: true,
    }),
    compliance,
  );

  return {
    allowed: true,
    workflow: "document_drafting",
    summary: "문서 초안 요청이 접수되었습니다. 현재는 제공된 사실관계를 기준으로 초안 작성 보조 결과를 생성합니다.",
    draftScope: {
      documentType: input.documentType,
      recipient: input.recipient ?? "미지정",
      requestedOutcome: input.requestedOutcome ?? "미지정",
    },
    nextSteps,
    mockResult,
    authoritySearch,
    safetyReview: compliance.safetyReview,
    citationVerification: compliance.citationVerification,
    policy,
  };
}

export const runDocumentDraftWorkflow = documentDraftWorkflow;
