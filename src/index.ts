export { LEGAL_SERVICE_HARNESS, getWorkflow, isExcludedContext } from "./harness.js";
export {
  contractReviewWorkflow,
  documentDraftWorkflow,
  legalResearchWorkflow,
} from "./workflows/index.js";
export { filterLegalSafetyText, safetyFilterService } from "./services/safetyFilter.service.js";
export { citationVerifierService, verifyCitations } from "./services/citationVerifier.service.js";
export type {
  Audience,
  CapabilityId,
  EvalScenario,
  HarnessDefinition,
  LegalPolicy,
  McpToolRef,
  RiskLevel,
  Workflow,
  WorkflowStep,
} from "./types.js";
export type {
  BlockedWorkflowOutput,
  ContractReviewInput,
  ContractReviewWorkflowOutput,
  DocumentDraftInput,
  DocumentDraftWorkflowOutput,
  LegalResearchInput,
  LegalResearchWorkflowOutput,
  LegalWorkflowPolicy,
  LegalAuthoritySearchOutput,
  LegalLookupResult,
} from "./types/workflow.types.js";
