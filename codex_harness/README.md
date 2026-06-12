# Codex 프로젝트 점검 하네스

이 폴더는 법률 MCP 하네스 프로젝트를 점검하고 보완 작업을 반복하기 위한 Codex 작업용 하네스입니다.

## 사용 방법

프로젝트 루트에서 실행합니다.

```bash
bash codex_harness/scripts/test.sh
bash codex_harness/scripts/review.sh
```

Codex CLI가 설치되어 있고 `codex exec`를 사용할 수 있다면 역할 기반 워크플로도 실행할 수 있습니다.

```bash
node codex_harness/scripts/agent-runner.mjs review-and-refactor "법률 MCP 하네스 전체 점검"
node codex_harness/scripts/agent-runner.mjs implement-feature "document_reader_mcp 최소 명세 추가"
node codex_harness/scripts/agent-runner.mjs fix-bug "교육 맥락 차단 누락 케이스 수정"
```

역할별 실행 결과는 `codex_harness/reports/`에 저장됩니다.

## 현재 프로젝트 점검 기준

법률 MCP 하네스 점검은 `project-checklist.md`를 기준으로 수행합니다.

핵심 기준:

- 학교, 교육기관, 수업 맥락 차단
- 정보 제공 및 초안 작성 보조 범위 유지
- 승소 보장, 위법 단정, 최종 판단 금지
- 전문가 검토 필요 여부 표시
- 출처 부족 시 수동 확인 또는 출처 확인 필요 표시
- `npm test` 통과
