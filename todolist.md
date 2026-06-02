# Legal Harness Todo List

This document compares the original `/legal-harness` target structure with the current implementation and lists the missing or partially implemented items.

## Current Implementation Summary

The current repository is implemented as a TypeScript backend, a React frontend, and JSON harness metadata.

Implemented areas:

- Express backend API:
  - `src/server.ts`
  - `src/app.ts`
- Workflow layer:
  - `src/workflows/legalResearch.workflow.ts`
  - `src/workflows/contractReview.workflow.ts`
  - `src/workflows/documentDraft.workflow.ts`
- Service layer:
  - `src/services/mcpLegal.service.ts`
  - `src/services/safetyFilter.service.ts`
  - `src/services/citationVerifier.service.ts`
  - `src/services/legalWorkflow.service.ts`
- Harness metadata:
  - `harness/workflows/*.json`
  - `harness/policies/legal-service-policy.json`
  - `harness/evals/general-legal-service.json`
- React MVP UI:
  - `web/src/App.tsx`
  - `web/src/App.css`
  - `web/src/index.css`

## Original Target Structure

```text
/legal-harness
  /mcp_servers
    korean_law_mcp
    document_reader_mcp
  /agents
    issue_classifier.py
    law_retriever.py
    precedent_retriever.py
    legal_summarizer.py
    risk_checker.py
    draft_writer.py
  /prompts
    legal_search.prompt
    precedent_summary.prompt
    contract_review.prompt
    school_policy_review.prompt
  /evals
    citation_required_tests.yaml
    hallucination_tests.yaml
    outdated_law_tests.yaml
  /outputs
    reports
    checklists
    drafts
```

## Gap Analysis

### `/legal-harness`

Status: Missing.

Current equivalent:

- `src/` contains executable backend code.
- `harness/` contains JSON workflow, policy, and eval metadata.

Decision needed:

- Keep the current `src/` plus `harness/` structure, or
- Add a `/legal-harness` directory as a canonical harness artifact layer.

Recommended action:

- Add `/legal-harness` as a non-runtime documentation and artifact layer first.
- Do not move working TypeScript code until the artifact structure is stable.

### `/legal-harness/mcp_servers/korean_law_mcp`

Status: Partially implemented.

Current equivalent:

- `src/services/mcpLegal.service.ts` supports:
  - `LEGAL_PROVIDER=mock`
  - `LEGAL_PROVIDER=korean-law`
  - `LAW_OC`
  - `searchLaw(query)`
  - `searchPrecedents(query)`
  - `getLawArticle(lawName, articleNo)`

Missing:

- A dedicated MCP server config or adapter artifact under `/legal-harness/mcp_servers/korean_law_mcp`.
- Live verification of the exact `korean-law-mcp` CLI command contract.

Recommended action:

- Create `/legal-harness/mcp_servers/korean_law_mcp/README.md`.
- Add command contract notes once the live CLI invocation is confirmed.

### `/legal-harness/mcp_servers/document_reader_mcp`

Status: Missing.

Current equivalent:

- None.

Missing:

- Document ingestion interface.
- Contract/document parsing provider.
- File upload or text extraction strategy.

Recommended action:

- Add a mock `document_reader_mcp` adapter spec first.
- Decide supported inputs: plain text, PDF, DOCX, or uploaded file paths.

### `/legal-harness/agents/*.py`

Status: Missing as Python agents.

Current TypeScript equivalents:

- `issue_classifier.py`
  - Partially covered by workflow routing and `legalWorkflow.service.ts`.
- `law_retriever.py`
  - Partially covered by `mcpLegal.service.ts`.
- `precedent_retriever.py`
  - Partially covered by `mcpLegal.service.ts`.
- `risk_checker.py`
  - Partially covered by `safetyFilter.service.ts` and `citationVerifier.service.ts`.
- `draft_writer.py`
  - Partially covered by `documentDraft.workflow.ts`.
- `legal_summarizer.py`
  - Not explicitly implemented as a standalone module.

Decision needed:

- Add Python agents exactly as originally sketched, or
- Keep the TypeScript service/workflow architecture and add TypeScript agent modules.

Recommended action:

- Prefer TypeScript agents for now because the backend is TypeScript.
- Add `src/agents/` only if role separation becomes useful.
- Avoid adding Python runtime complexity unless there is a clear orchestration requirement.

### `/legal-harness/prompts/*.prompt`

Status: Missing.

Current equivalent:

- No prompt files are present.
- `src/prompts/` exists but is empty.

Missing:

- `legal_search.prompt`
- `precedent_summary.prompt`
- `contract_review.prompt`

Special note:

- `school_policy_review.prompt` conflicts with the current product scope because school, education institution, and classroom contexts are excluded.

Recommended action:

- Add the three non-education prompt files.
- Replace `school_policy_review.prompt` with an exclusion-oriented prompt such as `education_context_exclusion.prompt`, or place the original only in a clearly marked rejected/archived folder.

### `/legal-harness/evals/*.yaml`

Status: Missing.

Current equivalent:

- `harness/evals/general-legal-service.json`
- Vitest service/API tests:
  - citation verifier tests
  - safety filter tests
  - MCP provider tests
  - API tests

Missing:

- `citation_required_tests.yaml`
- `hallucination_tests.yaml`
- `outdated_law_tests.yaml`

Recommended action:

- Add YAML eval files as harness-level acceptance criteria.
- Keep Vitest tests as executable unit/integration tests.

### `/legal-harness/outputs/reports`

Status: Missing.

Current equivalent:

- React UI renders report cards.
- API returns structured JSON.

Missing:

- Saved report examples.
- Report template format.

Recommended action:

- Add sample report outputs under `/legal-harness/outputs/reports`.

### `/legal-harness/outputs/checklists`

Status: Missing.

Current equivalent:

- Workflow outputs include `nextSteps`.

Missing:

- Saved checklist examples.
- Checklist template format.

Recommended action:

- Add checklist examples for legal research, contract review, and document draft flows.

### `/legal-harness/outputs/drafts`

Status: Missing.

Current equivalent:

- Document draft workflow returns draft metadata and mock sections.

Missing:

- Saved draft examples.
- Draft output template format.

Recommended action:

- Add sample draft outputs and mark all generated document content as draft-only.

## Recommended Next Work Plan

### Phase 1: Add Artifact Structure

Create:

```text
legal-harness/
  mcp_servers/
  prompts/
  evals/
  outputs/
    reports/
    checklists/
    drafts/
```

Purpose:

- Preserve the current working TypeScript app.
- Add the original harness artifact structure without disrupting runtime code.

### Phase 2: Add Prompt Files

Create:

```text
legal-harness/prompts/legal_search.prompt
legal-harness/prompts/precedent_summary.prompt
legal-harness/prompts/contract_review.prompt
legal-harness/prompts/education_context_exclusion.prompt
```

Do not add school-facing review behavior unless the product scope changes.

### Phase 3: Add YAML Eval Specs

Create:

```text
legal-harness/evals/citation_required_tests.yaml
legal-harness/evals/hallucination_tests.yaml
legal-harness/evals/outdated_law_tests.yaml
```

Purpose:

- Define quality gates for citations, hallucination resistance, and current-law verification.

### Phase 4: Add Output Examples

Create sample files under:

```text
legal-harness/outputs/reports
legal-harness/outputs/checklists
legal-harness/outputs/drafts
```

Purpose:

- Make the expected report, checklist, and draft formats concrete.

### Phase 5: Decide Agent Architecture

Decision:

- TypeScript agents under `src/agents`, or
- Python agents under `legal-harness/agents`.

Recommendation:

- Use TypeScript agents unless there is a specific reason to introduce Python.

## User Decisions Needed

1. Should `/legal-harness` be added as an artifact directory while keeping the current `src/` runtime structure?
2. Should agents be TypeScript or Python?
3. Should `document_reader_mcp` support only pasted text first, or also PDF/DOCX ingestion?
4. Should `school_policy_review.prompt` be excluded entirely, or replaced with an education-context rejection prompt?
5. Should sample outputs be static examples only, or should the backend write generated reports/checklists/drafts to disk?
