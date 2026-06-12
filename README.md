# 법률 MCP 하네스

이 저장소는 일반 사용자, 기업, 전문직 사용자를 위한 법률 리서치, 계약서 검토, 문서 초안 작성 보조 최소 기능 제품입니다.

학교, 교육기관, 수업, 과제, 교사 피드백, 성적 평가 등 교육 맥락은 서비스 범위에서 제외합니다.

이 서비스는 법률 정보 제공과 문서 초안 작성 보조만 제공합니다. 최종 법률 자문, 승소 보장, 위법 단정, 소송 결과 예측으로 사용할 수 없습니다.

## 주요 기능

- Express 백엔드 API와 Zod 입력 검증
- React 최소 기능 UI 3개 화면
  - 법률 질문
  - 계약서 검토
  - 문서 초안
- 개발용 규칙 기반 모의 워크플로
- 법령 검색 제공자 계층
  - `mock`
  - `korean-law`
- 단정적 법률 표현을 완화하는 안전 필터
- 법령/판례 출처 충분성을 확인하는 인용 검증기
- 워크플로 응답의 안전 검토 및 인용 검증 결과 표시
- API 응답과 UI에 전문가 검토 필요 여부 표시

## 저장소 구조

```text
src/        Express 백엔드, 워크플로, 서비스, 타입
harness/    JSON 기반 워크플로, 정책, 평가 메타데이터
web/        React 최소 기능 UI
```

초기 구상인 `/legal-harness` 산출물 구조는 아직 완전히 생성되어 있지 않습니다. 빠진 항목과 다음 작업 계획은 `todolist.md`를 참고하세요.

## 백엔드 실행

저장소 루트에서 실행합니다.

```bash
npm install
npm run dev
```

기본 백엔드 주소:

```text
http://localhost:3000
```

주요 엔드포인트:

```text
GET  /health
POST /api/legal-research
POST /api/contract-review
POST /api/document-draft
```

요청 예시:

```bash
curl -X POST http://localhost:3000/api/legal-research \
  -H "Content-Type: application/json" \
  -d '{"question":"프리랜서 용역대금을 지급받지 못한 경우 검토할 수 있는 민사 조치를 알려주세요."}'
```

## 프론트엔드 실행

다른 터미널에서 실행합니다.

```bash
cd web
npm install
npm run dev
```

기본 프론트엔드 주소:

```text
http://127.0.0.1:5173/
```

`5173` 포트가 이미 사용 중이면 Vite가 다음 사용 가능한 포트를 자동으로 선택합니다.

## 환경변수

필요하면 루트에 `.env` 파일을 만듭니다.

```bash
LEGAL_PROVIDER=mock
LAW_OC=
```

제공자 모드:

```text
LEGAL_PROVIDER=mock       개발용 결정론적 데이터를 사용합니다.
LEGAL_PROVIDER=korean-law korean-law CLI를 child_process로 호출합니다.
```

`LEGAL_PROVIDER=korean-law`를 사용할 때는 `LAW_OC` 값이 필요합니다.

실제 제공자 호출에 실패하더라도 워크플로는 중단되지 않고 다음 문구를 결과에 포함합니다.

```text
검색 실패
수동 확인 필요
```

## 테스트

백엔드, 서비스, 하네스 평가, 프론트엔드 빌드 검증을 모두 실행합니다.

```bash
npm test
```

프론트엔드 빌드만 확인:

```bash
npm run test:web
```

백엔드 검사만 실행:

```bash
npm run build
npm run eval
vitest run
```

## 현재 한계

- 실제 `korean-law` CLI 호출은 `scripts/verify-korean-law-provider.mjs`로 live 통합 검증이 필요합니다.
- 현재 환경에서 live 검증은 외부 API fetch 실패가 발생할 수 있으며, 이 경우 워크플로는 `검색 실패`, `수동 확인 필요`를 반환해야 합니다.
- 프론트엔드는 최소 기능 UI에서 수동 API 호출을 수행하며, 자동 브라우저 e2e 테스트는 아직 없습니다.
- 생성되는 문서 결과는 초안으로만 사용해야 하며 제출, 서명, 발송 전 전문가 검토가 필요합니다.

## 언어 정책

- 사용자에게 보이는 UI 라벨, API 모의 결과, 문서 설명은 한국어 중심으로 작성합니다.
- API 필드명, endpoint, 제공자 이름, 패키지명, 함수명 같은 기술 식별자는 호환성을 위해 영어를 유지합니다.
