# korean_law_mcp 연동 검증

이 문서는 `LEGAL_PROVIDER=korean-law` 모드에서 실제 법령 검색 제공자를 검증하는 절차입니다.

## 전제 조건

- `korean-law` CLI가 실행 가능해야 합니다.
- `LAW_OC` 환경변수에 법제처 Open API 인증키가 있어야 합니다.

## 검증 명령

프로젝트 루트에서 실행합니다.

```bash
LAW_OC=<법제처_API_KEY> node scripts/verify-korean-law-provider.mjs
```

검증 항목:

- `searchLaw`
- `searchPrecedents`
- `getLawArticle`

## 성공 기준

- 세 명령이 모두 종료 코드 0으로 완료됩니다.
- 빈 응답이 아니어야 합니다.
- JSON 응답이면 파싱에 성공해야 합니다.
- JSON이 아닌 원문 응답이면 서비스 계층이 `{ raw }` 형태로 보관할 수 있어야 합니다.

## 실패 처리 기준

실패하더라도 워크플로는 중단되지 않아야 합니다.

API 응답에는 다음 문구가 포함되어야 합니다.

```text
검색 실패
수동 확인 필요
```

## 현재 상태

- `LEGAL_PROVIDER=mock` 모드는 테스트로 검증되어 있습니다.
- `LAW_OC` 누락 시 `korean-law` provider가 예외를 던지지 않고 실패 메타데이터를 반환하는 테스트가 있습니다.
- 실제 호출은 `korean-law <tool_name> --query ...` 또는 `korean-law query ... --json` 형식을 사용합니다.
- `korean-law-mcp` 명령은 stdio MCP 서버용이므로 단발성 도구 호출에는 사용하지 않습니다.
