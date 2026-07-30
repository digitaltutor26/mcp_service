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

## 검증된 CLI 계약

`korean-law-mcp` v4.0.7 기준으로 live 검증한 내용입니다.

### 출력 형식

`search_law`, `search_precedents` 같은 도구 하위 명령은 **JSON이 아니라 사람이 읽는 텍스트**를 출력합니다.
JSON 출력 옵션(`--json`)은 `query` 명령에만 있습니다.

```text
korean-law search_law --query <법령명>        → 텍스트
korean-law search_precedents --query <키워드>  → 텍스트
korean-law query "<자연어>" --json             → JSON 봉투
```

`query --json` 봉투 구조:

```json
{
  "query": "...",
  "route": { "tool": "chain_full_research", "reason": "..." },
  "result": "▶ 로 구분된 섹션 텍스트",
  "pipelineResult": "법령명/조문 전문 (조문을 지목한 질문에서만 존재)",
  "isError": false
}
```

### 자연어 질문은 `search_law`에 넘기면 안 됩니다

법제처 Open API는 공백 구분 키워드를 **AND 조건**으로 처리합니다.
따라서 문장을 `search_law --query`에 그대로 넘기면 사실상 항상 `[NOT_FOUND]`가 됩니다.

자연어 입력은 `query` 명령으로 보내야 `chain_full_research`로 라우팅되어
법령 조문과 판례를 함께 얻을 수 있습니다.

### 실패 표기

- 도구 실패 시 종료 코드 `1`, 본문은 `[NOT_FOUND] ...`로 시작합니다.
- 체인 결과에서는 섹션 제목에 `[NOT_FOUND / FAILED]`가 붙습니다.

### 인증키 노출 주의

판례 결과의 `링크:` 필드에는 `OC=<인증키>`가 그대로 포함됩니다.
CLI 원문을 API 응답에 실으면 인증키가 프론트엔드로 유출되므로,
`koreanLawParser.service.ts`의 `redactApiKey`로 마스킹하고 `링크` 필드는 구조화 결과에서 제외합니다.

## 현재 상태

- `LEGAL_PROVIDER=mock` 모드는 테스트로 검증되어 있습니다.
- `LAW_OC` 누락 시 `korean-law` provider가 예외를 던지지 않고 실패 메타데이터를 반환하는 테스트가 있습니다.
- `LEGAL_PROVIDER=korean-law` live 호출을 검증했고, 실제 응답을 `src/services/fixtures/`에 고정해
  `koreanLawParser.service.test.ts`가 파싱 계약을 회귀 검증합니다.
- `korean-law-mcp` 명령은 stdio MCP 서버용이므로 단발성 도구 호출에는 사용하지 않습니다.
