# 진행상황

이 문서는 저장소 감사(2026-07-30) 이후 진행된 작업과 현재 상태를 추적합니다.
초기 목표 구조 대비 차이 분석은 `todolist.md`를 참고하세요.

## 완료

### 1순위 — korean-law 실 연동 완성 ✅ (2026-07-30)

- **문제**: `.env`의 `LEGAL_PROVIDER`, `LAW_OC`가 비어 있어 모든 응답이 하드코딩된
  mock 데이터(`민법 제390조`, `제750조` 고정값)였음.
- **작업**:
  - `korean-law` CLI(v4.0.7)를 라이브 호출해 실제 계약을 확인. 도구 하위 명령은
    JSON이 아닌 텍스트를 출력하며, 자연어 질문은 `search_law`가 아니라
    `query --json`(`chain_full_research`)으로 라우팅해야 함을 발견.
  - `src/services/koreanLawParser.service.ts` 신규 작성 — CLI 텍스트를 인용
    검증기가 쓰는 구조화 데이터로 변환. 실제 응답을 `src/services/fixtures/`에
    고정해 회귀 테스트로 검증(파서 테스트 20개).
  - `mcpLegal.service.ts`에 `researchAuthorities(question)` 경로 추가, 3개
    워크플로가 자연어 질문을 올바른 CLI 경로로 보내도록 변경.
  - **보안 수정**: 판례 결과의 `링크:` 필드에 포함된 API 키(`OC=...`)가 응답에
    그대로 노출되던 문제를 발견해 `redactApiKey`로 마스킹 처리.
  - **버그 수정**: `[전문개정 ...]` 개정 주석이 들여쓰기 없이 시작해 법령명으로
    오인되던 파싱 버그를 라이브 테스트 중 발견 및 수정.
- **검증**:
  - `npm test`: 25 → 47개 테스트, 전부 통과
  - 실제 API 키로 3개 워크플로 HTTP 엔드포인트를 직접 호출 —
    `citationVerification.sourceSufficiency`가 `insufficient` → `sufficient`/`partial`로 개선
  - 브라우저 개발자도구 없이 응답 본문 직접 검사로 API 키 미노출 확인(코드 리뷰 수준)
- **상태**: PR #1로 제출, 저장소 소유자 검토 대기 중.
  https://github.com/luludaniel/mcp_service/pull/1
- **남은 검증**: 실제 UI 브라우저 조작을 통한 사람 확인은 아직 안 됨 →
  `USER_TESTING.md` 참고.

## 진행 중 / 대기

### 사용자 테스트 (UAT)

- `USER_TESTING.md`에 8개 테스트 케이스 작성 완료.
- 실행 여부: **미실행** — 저장소 소유자 또는 담당자가 브라우저에서 직접 확인 필요.
- 특히 TC-4/TC-5(검색 실패 시 안전 축소)와 TC-6(API 키 노출)은 법률 서비스의
  안전장치이므로 머지 전 필수 확인 항목.

## 다음 순위 (미착수)

### 2순위 — YAML 평가 러너 연결

- `legal-harness/evals/*.yaml` 3개 파일이 작성되어 있으나 코드에서 실행되지 않음.
- 계획: YAML을 읽어 워크플로를 실제 호출하고 `must_include`/`must_not_include`를
  검증하는 러너를 만들어 `npm test`에 연결.

### 3순위 — harness 디렉토리 정리

- `harness/*.json`(6개 파일)과 `src/harness.ts`가 같은 내용을 이중 관리 중.
- `legal-harness/prompts/`, `legal-harness/outputs/{reports,checklists,drafts}/`는
  빈 폴더로 남아 있음.

### 4순위 — LLM 도입 여부 결정 (사용자 판단 필요)

- 현재 "워크플로"는 키워드 매칭(`legalWorkflow.service.ts`)이며 실제 LLM 호출이
  전혀 없음. `package.json`에 anthropic/openai 등 의존성 없음.
- `analyze_document`, `chain_document_review` 등 계약서 검토에 적합한 korean-law
  CLI 도구(80개 이상 도구 중)가 아직 활용되지 않음.

## 참고 링크

- PR: https://github.com/luludaniel/mcp_service/pull/1
- 테스트 케이스: `USER_TESTING.md`
- 초기 구상 대비 차이 분석: `todolist.md`
