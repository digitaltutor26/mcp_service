import type { HarnessDefinition } from "./types.js";

const SERVER = "korean-law" as const;

export const LEGAL_SERVICE_HARNESS: HarnessDefinition = {
  name: "general-legal-service-mcp-harness",
  version: "1.0.0",
  description:
    "A Korean-law MCP harness for general users, companies, and professional legal workflows focused on legal research, contract review, and legal document drafting.",
  serviceScope: ["legal_research", "contract_review", "document_drafting"],
  audiences: ["general_user", "business", "professional"],
  policy: {
    excludedContexts: [
      "school",
      "education_institution",
      "classroom",
      "student_assignment",
      "teacher_feedback",
      "academic_grading",
    ],
    requiredDisclaimers: [
      "이 응답은 법률 정보 제공 및 문서 초안 작성 보조이며, 변호사 등 전문가의 자문을 대체하지 않습니다.",
      "기한, 관할, 사실관계, 최신 법령은 사용 전에 반드시 확인해야 합니다.",
    ],
    prohibitedBehaviors: [
      "Do not present uncertain legal conclusions as guaranteed outcomes.",
      "Do not draft documents that conceal facts, fabricate evidence, or assist unlawful conduct.",
      "Do not provide education-sector workflow guidance or classroom-facing content.",
      "Do not ask for unnecessary sensitive personal data.",
    ],
    citationRules: [
      "Prefer primary sources: statutes, enforcement decrees, enforcement rules, cases, administrative interpretations, and agency decisions.",
      "Attach tool names and source identifiers when an MCP lookup returns them.",
      "Separate cited law from model inference.",
      "Mark outdated, missing, or ambiguous authority as a verification gap.",
    ],
    privacyRules: [
      "Request redaction of resident registration numbers, account numbers, access tokens, and unrelated third-party personal data.",
      "For contract review, summarize sensitive facts instead of repeating full personal identifiers.",
      "Keep draft outputs fact-bounded to user-provided facts and retrieved legal authority.",
    ],
    escalationRules: [
      "Escalate to a licensed attorney for criminal defense strategy, imminent filing deadlines, litigation tactics, regulated financial advice, or high-value transactions.",
      "Escalate when facts are disputed, evidence is incomplete, or the requested document creates material legal exposure.",
    ],
  },
  tools: [
    {
      server: SERVER,
      tool: "chain_full_research",
      purpose:
        "Broad natural-language legal research across statutes, precedents, interpretations, and related decisions.",
      requiredFor: ["legal_research", "document_drafting"],
    },
    {
      server: SERVER,
      tool: "search_law",
      purpose: "Find statute identifiers before precise article lookup.",
      requiredFor: ["legal_research", "document_drafting"],
    },
    {
      server: SERVER,
      tool: "get_law_text",
      purpose: "Retrieve the current text of a statute or specific article.",
      requiredFor: ["legal_research", "document_drafting"],
    },
    {
      server: SERVER,
      tool: "search_decisions",
      purpose: "Search precedents, administrative appeals, tax decisions, labor decisions, and other decision domains.",
      requiredFor: ["legal_research", "contract_review"],
    },
    {
      server: SERVER,
      tool: "get_decision_text",
      purpose: "Retrieve the text of a selected decision for citation-grounded analysis.",
      requiredFor: ["legal_research", "contract_review"],
    },
    {
      server: SERVER,
      tool: "chain_document_review",
      purpose: "Parse contract clauses, detect risks, and map clauses to statutes and precedents.",
      requiredFor: ["contract_review"],
    },
    {
      server: SERVER,
      tool: "verify_citations",
      purpose: "Validate statute and article citations in generated analysis or draft documents.",
      requiredFor: ["contract_review", "document_drafting"],
    },
    {
      server: SERVER,
      tool: "chain_procedure_detail",
      purpose: "Research procedure, form, deadline, and fee requirements for legally relevant filings.",
      requiredFor: ["document_drafting"],
    },
  ],
  workflows: [
    {
      id: "legal_research",
      title: "Legal Research Memo",
      audience: ["general_user", "business", "professional"],
      allowedInputs: [
        "facts",
        "jurisdiction",
        "legal question",
        "preferred decision domain",
        "deadline or urgency",
      ],
      steps: [
        {
          id: "research-triage",
          title: "Triage facts and legal issue",
          instruction:
            "Identify the legal domain, missing facts, urgency, and whether the request falls outside the service scope.",
          tools: [],
          output: "Issue list, assumptions, and scope decision.",
        },
        {
          id: "research-authority",
          title: "Retrieve primary authority",
          instruction:
            "Use broad research first, then precise statute and decision lookups for the controlling sources.",
          tools: ["chain_full_research", "search_law", "get_law_text", "search_decisions", "get_decision_text"],
          output: "Primary authority list with cited statutes, decisions, interpretations, and source gaps.",
        },
        {
          id: "research-memo",
          title: "Synthesize memo",
          instruction:
            "Separate law, application, uncertainty, and next actions. Use cautious conclusions when authority is incomplete.",
          tools: [],
          output: "Plain-language memo with citations and recommended next steps.",
        },
      ],
      completionCriteria: [
        "Scope excludes education-sector and classroom requests.",
        "At least one primary legal authority is cited or a verification gap is stated.",
        "Conclusion distinguishes legal information from legal advice.",
      ],
    },
    {
      id: "contract_review",
      title: "Contract Risk Review",
      audience: ["general_user", "business", "professional"],
      allowedInputs: [
        "contract text",
        "party role",
        "transaction context",
        "risk tolerance",
        "specific clauses of concern",
      ],
      steps: [
        {
          id: "contract-intake",
          title: "Intake and redaction check",
          instruction:
            "Confirm party role, deal context, governing law if supplied, and whether sensitive identifiers should be redacted.",
          tools: [],
          output: "Review assumptions and redaction warning.",
        },
        {
          id: "contract-clause-review",
          title: "Clause risk analysis",
          instruction:
            "Parse clauses, detect unfair or one-sided terms, map risks to legal authority, and rank business/legal impact.",
          tools: ["chain_document_review", "search_decisions", "get_decision_text"],
          output: "Clause-by-clause risk table with authority references.",
        },
        {
          id: "contract-revisions",
          title: "Propose revisions",
          instruction:
            "Draft fallback clause language that preserves the deal purpose while reducing identified legal risk.",
          tools: ["verify_citations"],
          output: "Negotiation points, revised clauses, and citation validation notes.",
        },
      ],
      completionCriteria: [
        "Risks are ranked by severity and practical effect.",
        "Suggested revisions are tied to the user's party role.",
        "Citations in analysis or revised clauses are verified or flagged.",
      ],
    },
    {
      id: "document_drafting",
      title: "Legal Document Drafting",
      audience: ["general_user", "business", "professional"],
      allowedInputs: [
        "document type",
        "facts",
        "recipient",
        "desired remedy",
        "deadline",
        "tone",
        "supporting documents",
      ],
      steps: [
        {
          id: "draft-intake",
          title: "Drafting requirements",
          instruction:
            "Identify document type, legal purpose, audience, mandatory facts, attachments, and deadline sensitivity.",
          tools: [],
          output: "Draft plan and missing fact checklist.",
        },
        {
          id: "draft-authority",
          title: "Authority and procedure check",
          instruction:
            "Retrieve controlling law and procedural requirements before generating claims, notices, or filing-ready text.",
          tools: ["chain_full_research", "search_law", "get_law_text", "chain_procedure_detail"],
          output: "Applicable law, procedure notes, and open verification items.",
        },
        {
          id: "draft-generate",
          title: "Generate draft",
          instruction:
            "Draft only from supplied facts and retrieved authority. Include placeholders for missing facts and avoid invented evidence.",
          tools: ["verify_citations"],
          output: "Structured legal document draft, attachment list, and verification notes.",
        },
      ],
      completionCriteria: [
        "Draft contains placeholders for missing facts instead of fabricated details.",
        "Legal citations are verified or explicitly marked for review.",
        "Output includes a practical filing or delivery checklist when relevant.",
      ],
    },
  ],
};

export function getWorkflow(id: HarnessDefinition["serviceScope"][number]) {
  return LEGAL_SERVICE_HARNESS.workflows.find((workflow) => workflow.id === id);
}

export function isExcludedContext(text: string): boolean {
  const normalized = text.toLowerCase();
  return LEGAL_SERVICE_HARNESS.policy.excludedContexts.some((context) =>
    normalized.includes(context.replaceAll("_", " ")),
  );
}
