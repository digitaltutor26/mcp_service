# 법률 하네스 작업 목록

이 문서는 초기 `/legal-harness` 목표 구조와 현재 구현을 비교하고, 빠진 항목과 다음 작업 후보를 정리합니다.

## 현재 구현 요약

현재 저장소는 TypeScript 백엔드, React 프론트엔드, JSON 하네스 메타데이터로 구성되어 있습니다.

구현된 영역:

- Express 백엔드 API
  - `src/server.ts`
  - `src/app.ts`
- 워크플로 계층
  - `src/workflows/legalResearch.workflow.ts`
  - `src/workflows/contractReview.workflow.ts`
  - `src/workflows/documentDraft.workflow.ts`
- 서비스 계층
  - `src/services/mcpLegal.service.ts`
  - `src/services/safetyFilter.service.ts`
  - `src/services/citationVerifier.service.ts`
  - `src/services/legalWorkflow.service.ts`
- 하네스 메타데이터
  - `src/harness.ts` — 워크플로/정책 정의의 단일 소스(정적 JSON 사본은 2026-08-01에 제거,
    아래 "3순위" 참고)
  - `harness/evals/general-legal-service.json`, `harness/evals/safety-and-citation.json`
  - `legal-harness/evals/*.yaml`
- React 최소 기능 UI
  - `web/src/App.tsx`
  - `web/src/App.css`
  - `web/src/index.css`

## 초기 목표 구조

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

## 차이 분석

### `/legal-harness`

상태: 없음.

현재 대응 구조:

- `src/`는 실행 가능한 백엔드 코드를 포함하며, `src/harness.ts`가 워크플로/정책 정의의
  단일 소스입니다.
- `harness/evals/`는 하네스 정의 자체를 검증하는 평가 시나리오 JSON을 포함합니다
  (워크플로/정책 JSON 사본은 2026-08-01에 중복 제거, "3순위" 참고).

결정 필요:

- 현재 `src/`와 `harness/` 구조를 유지할지
- `/legal-harness`를 별도 산출물 계층으로 추가할지

추천 작업:

- 먼저 `/legal-harness`를 런타임과 분리된 문서/산출물 계층으로 추가합니다.
- TypeScript 런타임 코드는 산출물 구조가 안정될 때까지 이동하지 않습니다.

### `/legal-harness/mcp_servers/korean_law_mcp`

상태: 완료 (2026-07-30, PR #1).

현재 대응 구조:

- `src/services/mcpLegal.service.ts`가 다음을 지원합니다.
  - `LEGAL_PROVIDER=mock`
  - `LEGAL_PROVIDER=korean-law`
  - `LAW_OC`
  - `searchLaw(query)`
  - `searchPrecedents(query)`
  - `getLawArticle(lawName, articleNo)`
  - `researchAuthorities(question)` — 자연어 질문을 `query --json`(`chain_full_research`)로 라우팅
- `src/services/koreanLawParser.service.ts`가 CLI 텍스트 출력을 구조화된 인용
  데이터로 변환합니다. 실제 CLI 응답을 `src/services/fixtures/`에 고정해
  회귀 테스트로 검증합니다.
- `legal-harness/mcp_servers/korean_law_mcp/README.md`에 검증된 CLI 계약(출력
  형식, 자연어 질문 라우팅 규칙, 실패 표기, API 키 노출 주의)을 문서화했습니다.

완료된 항목:

- `/legal-harness/mcp_servers/korean_law_mcp/README.md` 추가 및 검증된 CLI 계약 반영.
- 실제 `LAW_OC` 키로 live CLI 호출 검증 완료. 자연어 질문을 `search_law`에 그대로
  넘기면 법제처 API의 AND 키워드 검색 특성상 거의 항상 실패한다는 것을 확인하고
  `query --json` 경로로 전환.
- 판례 결과의 `링크:` 필드에 포함된 API 키(`OC=...`) 노출 문제를 발견해 마스킹 처리.

남은 항목: `USER_TESTING.md` 기준 사람에 의한 UI 수동 검증 (`PROGRESS.md` 참고).

### `/legal-harness/mcp_servers/document_reader_mcp`

상태: 없음.

현재 대응 구조:

- 없음.

빠진 항목:

- 문서 읽기 인터페이스
- 계약서/문서 파싱 제공자
- 파일 업로드 또는 텍스트 추출 전략

추천 작업:

- 먼저 mock `document_reader_mcp` adapter 명세를 추가합니다.
- 지원 입력을 정해야 합니다: 붙여넣은 텍스트, PDF, DOCX, 업로드 파일 경로.

### `/legal-harness/agents/*.py`

상태: Python agent 파일은 없음.

현재 TypeScript 대응 구조:

- `issue_classifier.py`
  - 워크플로 라우팅과 `legalWorkflow.service.ts`가 일부 역할을 수행합니다.
- `law_retriever.py`
  - `mcpLegal.service.ts`가 일부 역할을 수행합니다.
- `precedent_retriever.py`
  - `mcpLegal.service.ts`가 일부 역할을 수행합니다.
- `risk_checker.py`
  - `safetyFilter.service.ts`와 `citationVerifier.service.ts`가 일부 역할을 수행합니다.
- `draft_writer.py`
  - `documentDraft.workflow.ts`가 일부 역할을 수행합니다.
- `legal_summarizer.py`
  - 독립 모듈로는 아직 구현되지 않았습니다.

결정 필요:

- 초기 구상처럼 Python agent를 추가할지
- 현재 TypeScript 서비스/워크플로 구조를 유지하고 TypeScript agent를 추가할지

추천 작업:

- 현재 백엔드가 TypeScript이므로 우선 TypeScript agent를 권장합니다.
- 역할 분리가 실제로 필요해질 때 `src/agents/`를 추가합니다.
- 명확한 오케스트레이션 요구가 없다면 Python 런타임 복잡도는 추가하지 않습니다.

### `/legal-harness/prompts/*.prompt`

상태: 없음.

현재 대응 구조:

- prompt 파일은 아직 없습니다.
- `src/prompts/` 폴더는 있으나 비어 있습니다.

빠진 항목:

- `legal_search.prompt`
- `precedent_summary.prompt`
- `contract_review.prompt`

특이 사항:

- `school_policy_review.prompt`는 현재 제품 범위와 충돌합니다. 학교, 교육기관, 수업 맥락은 제외 대상입니다.

추천 작업:

- 교육 맥락이 아닌 prompt 3개를 추가합니다.
- `school_policy_review.prompt`는 추가하지 않거나, `education_context_exclusion.prompt`처럼 차단 정책용 prompt로 대체합니다.

### `/legal-harness/evals/*.yaml`

상태: 완료 (2026-08-01).

현재 대응 구조:

- `legal-harness/evals/citation_required_tests.yaml`, `hallucination_tests.yaml`,
  `outdated_law_tests.yaml` 3개 파일 작성 완료.
- `src/harnessEval.test.ts`가 위 YAML을 읽어 실제 HTTP 엔드포인트를 호출하고
  `must_include`/`must_not_include`/`fallback_must_include`를 검증. `vitest run`(=`npm test`)에
  자동 포함됨.
- `harness/evals/general-legal-service.json`, 기존 Vitest 서비스/API 테스트(인용 검증, 안전
  필터, MCP 제공자, API)와 함께 유지.

세부 내용은 `PROGRESS.md`의 "2순위 — YAML 평가 러너 연결" 항목 참고(실제 실행해서 발견한
YAML 기대값과 실제 응답 간 불일치 3건과 수정 내역 포함).

### `/legal-harness/outputs/reports`

상태: 없음.

현재 대응 구조:

- React UI가 리포트 카드를 렌더링합니다.
- API는 구조화된 JSON을 반환합니다.

빠진 항목:

- 저장된 리포트 예시
- 리포트 템플릿 형식

추천 작업:

- `/legal-harness/outputs/reports` 아래 샘플 리포트 산출물을 추가합니다.

### `/legal-harness/outputs/checklists`

상태: 없음.

현재 대응 구조:

- 워크플로 출력에 `nextSteps`가 포함됩니다.

빠진 항목:

- 저장된 체크리스트 예시
- 체크리스트 템플릿 형식

추천 작업:

- 법률 리서치, 계약서 검토, 문서 초안 흐름별 체크리스트 예시를 추가합니다.

### `/legal-harness/outputs/drafts`

상태: 없음.

현재 대응 구조:

- 문서 초안 워크플로가 초안 메타데이터와 mock 섹션을 반환합니다.

빠진 항목:

- 저장된 초안 예시
- 초안 출력 템플릿 형식

추천 작업:

- 초안 예시를 추가하고 모든 생성 문서는 초안 전용임을 명확히 표시합니다.

## 추천 다음 작업 계획

### 1단계: 산출물 구조 추가

생성 대상:

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

목적:

- 현재 동작하는 TypeScript 앱은 유지합니다.
- 초기 하네스 산출물 구조를 런타임 코드와 충돌 없이 추가합니다.

### 2단계: prompt 파일 추가

생성 대상:

```text
legal-harness/prompts/legal_search.prompt
legal-harness/prompts/precedent_summary.prompt
legal-harness/prompts/contract_review.prompt
legal-harness/prompts/education_context_exclusion.prompt
```

제품 범위가 바뀌기 전까지 학교 관련 검토 행위는 추가하지 않습니다.

### 3단계: YAML 평가 명세 추가

생성 대상:

```text
legal-harness/evals/citation_required_tests.yaml
legal-harness/evals/hallucination_tests.yaml
legal-harness/evals/outdated_law_tests.yaml
```

목적:

- 인용, 환각 방지, 최신 법령 확인 기준을 명확히 합니다.

### 4단계: 산출물 예시 추가

생성 위치:

```text
legal-harness/outputs/reports
legal-harness/outputs/checklists
legal-harness/outputs/drafts
```

목적:

- 리포트, 체크리스트, 초안 형식의 기대 결과를 구체화합니다.

### 5단계: agent 구조 결정

결정 사항:

- `src/agents` 아래 TypeScript agent를 둘지
- `legal-harness/agents` 아래 Python agent를 둘지

추천:

- Python을 도입해야 하는 명확한 이유가 생기기 전까지 TypeScript agent를 사용합니다.

## 사용자 결정 필요 사항

1. 현재 `src/` 런타임 구조를 유지한 채 `/legal-harness` 산출물 폴더를 추가할까요?
2. agent는 TypeScript로 만들까요, Python으로 만들까요?
3. `document_reader_mcp`는 붙여넣은 텍스트부터 지원할까요, PDF/DOCX까지 지원할까요?
4. `school_policy_review.prompt`는 완전히 제외할까요, 교육 맥락 차단 prompt로 대체할까요?
5. sample output은 정적 예시만 둘까요, 백엔드가 리포트/체크리스트/초안을 파일로 저장하게 할까요?
