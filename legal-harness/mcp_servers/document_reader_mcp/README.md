# document_reader_mcp 최소 명세

`document_reader_mcp`는 계약서 검토와 문서 초안 작성을 위해 입력 문서를 안전하게 정리하는 전처리 MCP입니다.

초기 범위는 파일 업로드가 아니라 붙여넣은 텍스트입니다. PDF/DOCX 파싱은 별도 단계에서 추가합니다.

## 대상 사용자

- 일반 사용자
- 기업 실무자
- 전문직 사용자

학교, 교육기관, 수업, 과제, 성적 평가 맥락은 지원하지 않습니다.

## 1차 지원 입력

```json
{
  "text": "계약서 또는 문서 본문",
  "documentType": "contract | notice | minutes | other",
  "partyRole": "검토 요청자의 지위",
  "language": "ko"
}
```

## 1차 출력

```json
{
  "ok": true,
  "documentType": "contract",
  "normalizedText": "정규화된 본문",
  "sections": [
    {
      "index": 1,
      "title": "계약 목적",
      "text": "조항 본문"
    }
  ],
  "detectedSensitiveData": [
    "주민등록번호 후보",
    "계좌번호 후보"
  ],
  "warnings": [
    "민감정보 삭제 후 검토 권장"
  ],
  "manualReviewRequired": true
}
```

## 처리 규칙

- 공백, 줄바꿈, 중복 문자를 정규화합니다.
- 조, 항, 호, 제목 패턴을 기준으로 섹션을 나눕니다.
- 주민등록번호, 계좌번호, 전화번호, 이메일 후보를 탐지합니다.
- 민감정보는 임의 삭제하지 않고 사용자에게 삭제 필요 경고를 제공합니다.
- 법률 판단은 하지 않습니다.
- 문서 내용이 수업, 과제, 교육기관 검토라면 차단 신호를 반환합니다.

## 실패 출력

```json
{
  "ok": false,
  "message": "문서 읽기 실패",
  "warnings": [
    "수동 확인 필요"
  ],
  "manualReviewRequired": true
}
```

## 백엔드 연결 후보

초기 연결 지점:

- `POST /api/contract-review`
- `POST /api/document-draft`

연결 방식:

1. 입력 텍스트를 `document_reader_mcp`로 정규화합니다.
2. 교육 맥락과 민감정보 경고를 확인합니다.
3. 정규화된 텍스트를 기존 워크플로에 전달합니다.
4. 조항별 결과는 계약서 검토 리포트의 분석 항목에 연결합니다.

## 테스트 기준

- 붙여넣은 계약서 본문을 섹션으로 분리합니다.
- 민감정보 후보를 탐지합니다.
- 교육 맥락 텍스트를 차단 신호로 표시합니다.
- 빈 본문은 실패로 처리합니다.
- 실패하더라도 기존 법률 워크플로가 예외로 중단되지 않게 합니다.
