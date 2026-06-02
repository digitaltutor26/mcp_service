import { legalWorkflowService } from "../services/legalWorkflow.service.js";
import { mcpLegalService } from "../services/mcpLegal.service.js";
import type { ContractReviewInput, ContractReviewWorkflowOutput } from "../types/workflow.types.js";
import { createPolicyResult, hasExcludedEducationContext } from "./policy.js";

export async function contractReviewWorkflow(input: ContractReviewInput): Promise<ContractReviewWorkflowOutput> {
  const context = [input.contractText, input.partyRole, input.concern].filter(Boolean).join(" ");

  if (hasExcludedEducationContext(context)) {
    return {
      allowed: false,
      reason: "excluded_education_context",
      policy: createPolicyResult({ requiresExpertReview: true }),
    };
  }

  const mockResult = legalWorkflowService.createContractReviewMock(input);
  const authoritySearch = await mcpLegalService.reviewContractAuthorities(input);

  return {
    allowed: true,
    workflow: "contract_review",
    summary: "Contract review request accepted. MCP clause analysis is not implemented yet.",
    reviewScope: {
      partyRole: input.partyRole,
      concern: input.concern ?? "general risk review",
    },
    nextSteps: [
      "Identify one-sided or ambiguous clauses.",
      "Rank legal and business risks.",
      "Prepare negotiation points and fallback language as draft suggestions only.",
    ],
    mockResult,
    authoritySearch,
    policy: createPolicyResult({
      requiresExpertReview: true,
      warnings: ["Contract changes should be reviewed by a qualified professional before signature or delivery."],
    }),
  };
}

export const runContractReviewWorkflow = contractReviewWorkflow;
