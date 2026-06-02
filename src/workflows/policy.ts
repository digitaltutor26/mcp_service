import { LEGAL_SERVICE_HARNESS, isExcludedContext } from "../harness.js";
import type { LegalWorkflowPolicy } from "../types/workflow.types.js";

const koreanExcludedTerms = ["학교", "교육기관", "수업", "과제", "교사", "학생", "강의", "성적"];

export function hasExcludedEducationContext(text: string): boolean {
  const normalized = text.toLowerCase();
  return isExcludedContext(normalized) || koreanExcludedTerms.some((term) => normalized.includes(term));
}

export function createPolicyResult(options: {
  readonly draftOnly?: boolean;
  readonly requiresExpertReview: boolean;
  readonly warnings?: readonly string[];
}): LegalWorkflowPolicy {
  return {
    informationalOnly: true,
    draftOnly: options.draftOnly ?? false,
    prohibitsFinalJudgment: true,
    prohibitsGuaranteedOutcome: true,
    prohibitsDefinitiveIllegalityFinding: true,
    requiresExpertReview: options.requiresExpertReview,
    disclaimers: LEGAL_SERVICE_HARNESS.policy.requiredDisclaimers,
    warnings: [
      "This result must not be treated as a final legal judgment, a guaranteed litigation outcome, or a definitive finding of illegality.",
      ...(options.warnings ?? []),
    ],
  };
}
