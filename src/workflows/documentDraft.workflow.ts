import { legalWorkflowService } from "../services/legalWorkflow.service.js";
import { mcpLegalService } from "../services/mcpLegal.service.js";
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

  return {
    allowed: true,
    workflow: "document_drafting",
    summary: "Document draft request accepted. MCP authority and procedure lookup is not implemented yet.",
    draftScope: {
      documentType: input.documentType,
      recipient: input.recipient ?? "unspecified",
      requestedOutcome: input.requestedOutcome ?? "unspecified",
    },
    nextSteps: [
      "Confirm mandatory facts and attachments.",
      "Insert placeholders for missing facts instead of inventing details.",
      "Verify citations and procedure before use.",
    ],
    mockResult,
    authoritySearch,
    policy: createPolicyResult({
      draftOnly: true,
      requiresExpertReview: true,
      warnings: ["Generated text is a draft only and should be reviewed before filing, signing, or sending."],
    }),
  };
}

export const runDocumentDraftWorkflow = documentDraftWorkflow;
