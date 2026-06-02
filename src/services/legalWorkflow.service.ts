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
        ? ["contract law", "civil claim procedure", "payment demand precedent search"]
        : ["statute lookup", "precedent search", "administrative interpretation search"],
      limitations: [
        "No external MCP authority lookup has been executed yet.",
        "The result is legal information only and does not decide the final legal position.",
      ],
    };
  },

  createContractReviewMock(input: ContractReviewInput) {
    const text = [input.contractText, input.concern].filter(Boolean).join(" ");
    const highRisk = containsAny(text, ["terminate at any time", "all fees", "unlimited", "indemnify", "손해배상"]);

    return {
      riskLevel: highRisk ? "high" : "medium",
      detectedIssues: highRisk
        ? ["one-sided termination or payment exposure", "potentially broad liability allocation"]
        : ["needs clause-by-clause authority review", "business impact depends on transaction facts"],
      suggestedReviewPoints: [
        "Confirm governing law and party role.",
        "Check whether risk allocation matches deal economics.",
        "Prepare fallback language before negotiation.",
      ],
    };
  },

  createDocumentDraftMock(input: DocumentDraftInput) {
    return {
      sections: [
        "sender and recipient",
        "background facts",
        "legal position summary",
        "requested action",
        "deadline and reservation of rights",
      ],
      placeholders: [
        `[${input.documentType} date]`,
        "[exact amount or disputed obligation]",
        "[supporting document list]",
      ],
      deliveryChecklist: [
        "Verify recipient identity and address.",
        "Attach supporting documents.",
        "Review deadlines and delivery proof requirements.",
      ],
    };
  },
};
