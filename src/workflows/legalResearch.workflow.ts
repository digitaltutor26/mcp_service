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
    summary: "Legal research request accepted. MCP authority lookup is not implemented yet.",
    nextSteps: [
      "Identify controlling statutes and decisions.",
      "Separate cited authority from inference.",
      "Flag missing facts, deadlines, and jurisdiction issues.",
    ],
    mockResult,
    authoritySearch,
    policy: createPolicyResult({
      requiresExpertReview: true,
      warnings: ["Expert review is recommended before relying on research for filing, negotiation, or litigation strategy."],
    }),
  };
}

export const runLegalResearchWorkflow = legalResearchWorkflow;
