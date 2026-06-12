# 현재 프로젝트 점검 리포트

점검일: 2026-06-12

## 결론

현재 법률 MCP 하네스는 기본 검증 기준을 통과합니다.

검증 결과:

- `bash codex_harness/scripts/test.sh` 통과
- `npm test` 내부 검증 통과
- TypeScript 빌드 통과
- 하네스 eval 통과
- Vitest 6개 파일, 25개 테스트 통과
- 웹 빌드 통과
- `npm --prefix web run lint` 통과

## 적용된 codex_harness 상태

`codex_harness`는 프로젝트 루트 기준으로 사용할 수 있게 보정되었습니다.

사용 가능한 명령:

```bash
bash codex_harness/scripts/test.sh
bash codex_harness/scripts/review.sh
node codex_harness/scripts/agent-runner.mjs review-and-refactor "법률 MCP 하네스 전체 점검"
```

보정 내용:

- `agent-runner.mjs`가 프로젝트 루트와 `codex_harness` 경로를 자동 계산합니다.
- 역할 프롬프트는 `codex_harness/.agents/roles`에서 읽습니다.
- 실행 리포트는 `codex_harness/reports`에 저장합니다.
- `test.sh`, `review.sh`는 어느 위치에서 실행해도 프로젝트 루트로 이동합니다.
- 법률 MCP 전용 점검 기준은 `codex_harness/project-checklist.md`에 정리했습니다.

## 현재 강점

- 법률 리서치, 계약서 검토, 문서 초안 API가 분리되어 있습니다.
- 학교, 교육기관, 수업 맥락 차단 정책이 구현되어 있습니다.
- 한국어 사용자 화면과 한국어 mock 응답이 기본값입니다.
- 전문가 검토 필요 여부가 API와 UI에 반영됩니다.
- mock provider와 korean-law provider 계층이 분리되어 있습니다.
- 제공자 실패 시 워크플로가 중단되지 않고 `검색 실패`, `수동 확인 필요`를 반환하는 구조입니다.
- 안전 필터와 인용 검증 서비스의 단위 테스트가 있습니다.

## 주요 개선 필요 사항

### 1. 안전 필터를 실제 워크플로 출력에 연결

상태: 완료.

`legalResearchWorkflow`, `contractReviewWorkflow`, `documentDraftWorkflow`가 공통 컴플라이언스 서비스를 통해 `safetyReview`를 반환합니다.

### 2. 인용 검증을 authoritySearch 결과와 연결

상태: 완료.

`authoritySearch` 결과에서 법령명, 조문번호, 판례 식별자를 추출해 `citationVerification`을 반환합니다. 출처가 부족하면 `출처 확인 필요`와 단정 분석 제한 경고가 정책 경고에 반영됩니다.

### 3. korean-law provider live 검증

상태: 부분 완료.

`korean-law` 직접 CLI 호출 방식으로 provider와 검증 스크립트를 보정했습니다. 현재 환경에서는 `LAW_OC`가 설정되어 있으나 외부 API fetch 실패가 발생했습니다. 이 실패는 `검색 실패`, `수동 확인 필요`로 처리해야 합니다.

### 4. document_reader_mcp 최소 명세 추가

상태: 완료.

계약서 검토 품질을 높이려면 문서 입력 계층이 필요합니다.

1차 범위:

- 붙여넣은 텍스트 정규화
- 민감정보 마스킹 안내
- 조항 단위 분리
- 문서 유형 감지

PDF/DOCX 파일 처리는 이후 단계로 분리하는 것이 안전합니다.

### 5. eval 강화

상태: 완료.

`harness/evals/safety-and-citation.json`을 추가했고, 산출물 명세로 `legal-harness/evals/*.yaml`을 추가했습니다.

## 추천 다음 작업 순서

1. `codex_harness`와 `legal-harness` 산출물을 git에 추가하고 커밋합니다.
2. `korean-law` CLI 외부 API fetch 실패 원인을 별도로 확인합니다.
3. `document_reader_mcp` 명세를 실제 서비스 계층으로 구현합니다.
4. prompt 파일과 샘플 outputs 산출물을 추가합니다.
5. 브라우저 기반 프론트 e2e 테스트를 추가합니다.

## 남은 위험

- 실제 법령 검색 제공자 연동은 mock 테스트보다 불확실성이 큽니다.
- 사용자에게 보이는 응답은 한국어 중심이지만 API 필드명과 provider enum 값은 호환성 때문에 영어로 유지됩니다.
- Codex 역할 기반 runner는 경로 보정과 문법 검증까지 완료했지만, 실제 `codex exec` 워크플로 실행은 별도 환경 검증이 필요합니다.
