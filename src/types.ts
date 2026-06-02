export type Audience = "general_user" | "business" | "professional";

export type CapabilityId =
  | "legal_research"
  | "contract_review"
  | "document_drafting";

export type RiskLevel = "low" | "medium" | "high";

export interface McpToolRef {
  readonly server: "korean-law";
  readonly tool: string;
  readonly purpose: string;
  readonly requiredFor?: readonly CapabilityId[];
}

export interface WorkflowStep {
  readonly id: string;
  readonly title: string;
  readonly instruction: string;
  readonly tools: readonly string[];
  readonly output: string;
}

export interface Workflow {
  readonly id: CapabilityId;
  readonly title: string;
  readonly audience: readonly Audience[];
  readonly allowedInputs: readonly string[];
  readonly steps: readonly WorkflowStep[];
  readonly completionCriteria: readonly string[];
}

export interface LegalPolicy {
  readonly excludedContexts: readonly string[];
  readonly requiredDisclaimers: readonly string[];
  readonly prohibitedBehaviors: readonly string[];
  readonly citationRules: readonly string[];
  readonly privacyRules: readonly string[];
  readonly escalationRules: readonly string[];
}

export interface EvalScenario {
  readonly id: string;
  readonly capability: CapabilityId;
  readonly audience: Audience;
  readonly prompt: string;
  readonly expectedWorkflow: CapabilityId;
  readonly minimumRiskLevel: RiskLevel;
  readonly mustInclude: readonly string[];
  readonly mustNotInclude: readonly string[];
}

export interface HarnessDefinition {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly serviceScope: readonly CapabilityId[];
  readonly audiences: readonly Audience[];
  readonly policy: LegalPolicy;
  readonly tools: readonly McpToolRef[];
  readonly workflows: readonly Workflow[];
}
