# Codex 하네스 사용 기록

이 문서는 법률 MCP 하네스 프로젝트에서 `codex_harness`를 어떻게 사용했는지와 다음 작업 때 참고할 실행 절차를 정리합니다.

## 이번에 사용한 하네스

핵심 파일:

- `codex_harness/project-checklist.md`
- `codex_harness/scripts/test.sh`
- `codex_harness/scripts/review.sh`
- `codex_harness/reports/current-project-review.md`
- `codex_harness/scripts/agent-runner.mjs`

## 이번에 검증한 작업

### 전체 테스트 검증

```bash
bash codex_harness/scripts/test.sh
```

검증 내용:

- TypeScript 빌드
- 하네스 eval
- Vitest
- 웹 빌드

검증 결과:

```text
6 files passed
25 tests passed
web build passed
```

### 변경 사항 리뷰

```bash
bash codex_harness/scripts/review.sh
```

검증 내용:

- git status
- git diff stat
- git diff

사용 목적:

- 현재 변경된 파일 확인
- 커밋 전 diff 검토
- 불필요한 변경 확인

### 프론트엔드 lint

```bash
npm --prefix web run lint
```

결과:

```text
eslint passed
```

### korean-law provider 검증 스크립트 문법 확인

```bash
node --check scripts/verify-korean-law-provider.mjs
```

결과:

```text
passed
```

### 실제 korean-law live 호출 확인

```bash
node scripts/verify-korean-law-provider.mjs
```

현재 확인 결과:

- 현재 환경에서는 외부 API `fetch failed` 발생
- 성공 live 응답은 아직 미검증
- 실패 경로는 서비스에서 `검색 실패`, `수동 확인 필요`로 처리하도록 보완됨

## 이번에 확인한 정책 기준

`codex_harness/project-checklist.md` 기준으로 다음 항목을 확인했습니다.

- 학교, 교육기관, 수업 맥락 제외
- 법률 자문이 아니라 정보 제공/초안 보조로 제한
- 최종 판단, 승소 보장, 위법 단정 금지
- 전문가 검토 필요 여부 표시
- 출처 부족 시 `출처 확인 필요` 또는 `수동 확인 필요` 표시
- API 3개 유지
  - `POST /api/legal-research`
  - `POST /api/contract-review`
  - `POST /api/document-draft`
- 프론트 UI에 결과를 카드 형태로 표시
- 문서 생성 결과는 초안으로 표시

## 이번에 하네스를 이용해 보완한 내용

- 워크플로 응답에 `safetyReview` 추가
- 워크플로 응답에 `citationVerification` 추가
- 프론트에 “안전 검토”, “인용 검증” 표시
- `korean-law` CLI 호출 방식 보정
- `document_reader_mcp` 최소 명세 추가
- YAML eval 산출물 추가
- JSON eval 시나리오 추가
- 현재 프로젝트 리뷰 리포트 생성

## 다음번 기본 사용 절차

작업 시작 전:

```bash
bash codex_harness/scripts/review.sh
```

현재 변경 상태를 확인합니다.

작업 후:

```bash
bash codex_harness/scripts/test.sh
npm --prefix web run lint
```

테스트와 프론트 lint를 확인합니다.

법령 provider를 확인할 때:

```bash
node --check scripts/verify-korean-law-provider.mjs
node scripts/verify-korean-law-provider.mjs
```

실제 live 호출은 `LAW_OC`와 외부 API 연결 상태가 필요합니다.

## 역할 기반 runner 사용

Codex CLI 환경에서 사용할 수 있습니다.

전체 점검:

```bash
node codex_harness/scripts/agent-runner.mjs review-and-refactor "법률 MCP 하네스 전체 점검"
```

기능 추가:

```bash
node codex_harness/scripts/agent-runner.mjs implement-feature "document_reader_mcp 실제 서비스 계층 구현"
```

버그 수정:

```bash
node codex_harness/scripts/agent-runner.mjs fix-bug "교육 맥락 차단 누락 케이스 수정"
```

역할별 실행 결과는 `codex_harness/reports/`에 저장됩니다.

## 다음 작업 추천

1. `document_reader_mcp` 명세를 실제 서비스 코드로 구현합니다.
2. `korean-law` live 호출 실패 원인을 확인합니다.
3. 브라우저 기반 프론트 e2e 테스트를 추가합니다.
4. prompt 파일을 추가합니다.
5. 샘플 리포트, 체크리스트, 초안 outputs를 추가합니다.
