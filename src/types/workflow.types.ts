export type LegalWorkflowName = "legal_research" | "contract_review" | "document_drafting";

export interface LegalResearchInput {
  readonly question: string;
  readonly facts?: string | undefined;
  readonly jurisdiction?: string | undefined;
}

export interface ContractReviewInput {
  readonly contractText: string;
  readonly partyRole: string;
  readonly concern?: string | undefined;
}

export interface DocumentDraftInput {
  readonly documentType: string;
  readonly facts: string;
  readonly recipient?: string | undefined;
  readonly requestedOutcome?: string | undefined;
}

export interface LegalWorkflowPolicy {
  readonly informationalOnly: true;
  readonly draftOnly: boolean;
  readonly prohibitsFinalJudgment: true;
  readonly prohibitsGuaranteedOutcome: true;
  readonly prohibitsDefinitiveIllegalityFinding: true;
  readonly requiresExpertReview: boolean;
  readonly disclaimers: readonly string[];
  readonly warnings: readonly string[];
}

export interface LegalLookupResult {
  readonly ok: boolean;
  readonly provider: "mock" | "korean-law";
  readonly operation: "searchLaw" | "searchPrecedents" | "getLawArticle";
  readonly data: unknown | null;
  readonly message: string;
  readonly notices: readonly string[];
  readonly manualReviewRequired: boolean;
  readonly error?: string;
}

export interface LegalAuthoritySearchOutput {
  readonly provider: "mock" | "korean-law";
  readonly lawSearch?: LegalLookupResult;
  readonly precedentSearch?: LegalLookupResult;
  readonly article?: LegalLookupResult;
  readonly notices: readonly string[];
  readonly manualReviewRequired: boolean;
}

export interface BlockedWorkflowOutput {
  readonly allowed: false;
  readonly reason: "excluded_education_context";
  readonly policy: LegalWorkflowPolicy;
}

export interface LegalResearchOutput {
  readonly allowed: true;
  readonly workflow: "legal_research";
  readonly summary: string;
  readonly nextSteps: readonly string[];
  readonly mockResult: {
    readonly issue: string;
    readonly likelySources: readonly string[];
    readonly limitations: readonly string[];
  };
  readonly authoritySearch: LegalAuthoritySearchOutput;
  readonly policy: LegalWorkflowPolicy;
}

export interface ContractReviewOutput {
  readonly allowed: true;
  readonly workflow: "contract_review";
  readonly summary: string;
  readonly reviewScope: {
    readonly partyRole: string;
    readonly concern: string;
  };
  readonly nextSteps: readonly string[];
  readonly mockResult: {
    readonly riskLevel: "low" | "medium" | "high";
    readonly detectedIssues: readonly string[];
    readonly suggestedReviewPoints: readonly string[];
  };
  readonly authoritySearch: LegalAuthoritySearchOutput;
  readonly policy: LegalWorkflowPolicy;
}

export interface DocumentDraftOutput {
  readonly allowed: true;
  readonly workflow: "document_drafting";
  readonly summary: string;
  readonly draftScope: {
    readonly documentType: string;
    readonly recipient: string;
    readonly requestedOutcome: string;
  };
  readonly nextSteps: readonly string[];
  readonly mockResult: {
    readonly sections: readonly string[];
    readonly placeholders: readonly string[];
    readonly deliveryChecklist: readonly string[];
  };
  readonly authoritySearch: LegalAuthoritySearchOutput;
  readonly policy: LegalWorkflowPolicy;
}

export type LegalResearchWorkflowOutput = LegalResearchOutput | BlockedWorkflowOutput;
export type ContractReviewWorkflowOutput = ContractReviewOutput | BlockedWorkflowOutput;
export type DocumentDraftWorkflowOutput = DocumentDraftOutput | BlockedWorkflowOutput;
