# Legal MCP Harness

Legal MCP Harness is an Express and React MVP for legal research, contract review, and legal document draft assistance.

The product scope is general users, businesses, and professional users. It excludes school, education institution, classroom, student assignment, and similar education contexts.

This service provides legal information and document drafting support only. It does not provide final legal advice, guaranteed outcomes, definitive illegality findings, or litigation predictions.

## Features

- Backend API with Express and Zod validation
- React MVP UI with three tabs:
  - Legal question
  - Contract review
  - Document draft
- Rule-based workflow mocks for development
- Provider layer for legal lookup:
  - `mock`
  - `korean-law`
- Safety filter for deterministic or risky legal language
- Citation verifier for statute and case source sufficiency
- Expert review required flags in workflow output and UI

## Repository Layout

```text
src/        Express backend, workflows, services, and types
harness/    JSON workflow, policy, and eval metadata
web/        React MVP UI
```

The original `/legal-harness` artifact structure is not fully created yet. See `todolist.md` for the gap analysis and next-work plan.

## Backend API

Run from the repository root:

```bash
npm install
npm run dev
```

Default backend URL:

```text
http://localhost:3000
```

Endpoints:

```text
GET  /health
POST /api/legal-research
POST /api/contract-review
POST /api/document-draft
```

Example:

```bash
curl -X POST http://localhost:3000/api/legal-research \
  -H "Content-Type: application/json" \
  -d '{"question":"프리랜서 용역대금을 지급받지 못한 경우 검토할 수 있는 민사 조치를 알려주세요."}'
```

## Frontend

Run in another terminal:

```bash
cd web
npm install
npm run dev
```

Default frontend URL:

```text
http://127.0.0.1:5173/
```

If `5173` is already in use, Vite will choose the next available port.

## Environment

Create a local `.env` file if needed:

```bash
LEGAL_PROVIDER=mock
LAW_OC=
```

Provider modes:

```text
LEGAL_PROVIDER=mock       Uses deterministic development data.
LEGAL_PROVIDER=korean-law Calls korean-law-mcp through child_process.
```

`LAW_OC` is required for `LEGAL_PROVIDER=korean-law`.

If the real provider fails, workflows continue and include:

```text
검색 실패
수동 확인 필요
```

## Tests

Run all backend, service, harness, and frontend build checks from the repository root:

```bash
npm test
```

Run frontend build only:

```bash
npm run test:web
```

Run backend checks only:

```bash
npm run build
npm run eval
vitest run
```

## Current Limits

- Real `korean-law-mcp` command format still needs live integration verification.
- The frontend currently performs manual API calls through the MVP UI; automated browser e2e tests are not included.
- Generated document output must be treated as a draft and reviewed before filing, signing, or sending.
