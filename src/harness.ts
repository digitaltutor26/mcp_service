import type { HarnessDefinition } from "./types.js";

const SERVER = "korean-law" as const;

export const LEGAL_SERVICE_HARNESS: HarnessDefinition = {
  name: "general-legal-service-mcp-harness",
  version: "1.0.0",
  description:
    "일반 사용자, 기업, 전문직 사용자를 위한 법률 리서치, 계약서 검토, 법률 문서 초안 작성용 한국 법령 MCP 하네스입니다.",
  serviceScope: ["legal_research", "contract_review", "document_drafting"],
  audiences: ["general_user", "business", "professional"],
  policy: {
    excludedContexts: [
      "학교",
      "교육기관",
      "수업",
      "학생 과제",
      "교사 피드백",
      "성적 평가",
    ],
    requiredDisclaimers: [
      "이 응답은 법률 정보 제공 및 문서 초안 작성 보조이며, 변호사 등 전문가의 자문을 대체하지 않습니다.",
      "기한, 관할, 사실관계, 최신 법령은 사용 전에 반드시 확인해야 합니다.",
    ],
    prohibitedBehaviors: [
      "불확실한 법률 결론을 보장된 결과처럼 제시하지 않습니다.",
      "사실 은폐, 증거 조작, 위법 행위를 돕는 문서를 작성하지 않습니다.",
      "교육기관, 학교, 수업 대상 워크플로 안내를 제공하지 않습니다.",
      "불필요한 민감 개인정보를 요청하지 않습니다.",
    ],
    citationRules: [
      "법률, 시행령, 시행규칙, 판례, 행정해석, 기관 결정례 등 1차 자료를 우선합니다.",
      "MCP 검색 결과에 도구명과 출처 식별자가 있으면 함께 표시합니다.",
      "확인된 법적 근거와 추론을 구분합니다.",
      "오래되었거나 누락되었거나 불명확한 근거는 검증 공백으로 표시합니다.",
    ],
    privacyRules: [
      "주민등록번호, 계좌번호, 접근 토큰, 관련 없는 제3자 개인정보는 삭제하도록 안내합니다.",
      "계약서 검토에서는 전체 식별자를 반복하지 않고 민감한 사실관계를 요약합니다.",
      "초안 결과는 사용자가 제공한 사실과 확인된 법적 근거 범위 안에서만 작성합니다.",
    ],
    escalationRules: [
      "형사 방어 전략, 임박한 제출 기한, 소송 전략, 규제 금융 자문, 고액 거래는 전문가 검토가 필요합니다.",
      "사실관계에 다툼이 있거나 증거가 불완전하거나 요청 문서가 중대한 법적 위험을 만들 수 있으면 전문가 검토가 필요합니다.",
    ],
  },
  tools: [
    {
      server: SERVER,
      tool: "chain_full_research",
      purpose:
        "법령, 판례, 해석례, 관련 결정례를 폭넓게 검색합니다.",
      requiredFor: ["legal_research", "document_drafting"],
    },
    {
      server: SERVER,
      tool: "search_law",
      purpose: "정확한 조문 조회 전에 법령 식별자를 찾습니다.",
      requiredFor: ["legal_research", "document_drafting"],
    },
    {
      server: SERVER,
      tool: "get_law_text",
      purpose: "법령 또는 특정 조문의 현행 본문을 조회합니다.",
      requiredFor: ["legal_research", "document_drafting"],
    },
    {
      server: SERVER,
      tool: "search_decisions",
      purpose: "판례, 행정심판, 조세심판, 노동 결정 등 결정례를 검색합니다.",
      requiredFor: ["legal_research", "contract_review"],
    },
    {
      server: SERVER,
      tool: "get_decision_text",
      purpose: "인용 기반 분석을 위해 선택한 결정례 본문을 조회합니다.",
      requiredFor: ["legal_research", "contract_review"],
    },
    {
      server: SERVER,
      tool: "chain_document_review",
      purpose: "계약 조항을 파싱하고 위험을 탐지하며 관련 법령과 판례에 매핑합니다.",
      requiredFor: ["contract_review"],
    },
    {
      server: SERVER,
      tool: "verify_citations",
      purpose: "분석 또는 초안 문서의 법령 및 조문 인용을 검증합니다.",
      requiredFor: ["contract_review", "document_drafting"],
    },
    {
      server: SERVER,
      tool: "chain_procedure_detail",
      purpose: "신청, 제출, 신고 등에 필요한 절차, 서식, 기한, 수수료 요건을 조사합니다.",
      requiredFor: ["document_drafting"],
    },
  ],
  workflows: [
    {
      id: "legal_research",
      title: "법률 리서치 메모",
      audience: ["general_user", "business", "professional"],
      allowedInputs: [
        "사실관계",
        "관할",
        "법률 질문",
        "선호 결정례 영역",
        "기한 또는 긴급성",
      ],
      steps: [
        {
          id: "research-triage",
          title: "사실관계 및 법률 쟁점 분류",
          instruction:
            "법률 분야, 누락된 사실관계, 긴급성, 서비스 범위 제외 여부를 확인합니다.",
          tools: [],
          output: "쟁점 목록, 전제, 범위 판단.",
        },
        {
          id: "research-authority",
          title: "주요 법적 근거 조회",
          instruction:
            "먼저 넓게 검색한 뒤 관련 법령과 결정례를 정확히 조회합니다.",
          tools: ["chain_full_research", "search_law", "get_law_text", "search_decisions", "get_decision_text"],
          output: "주요 법적 근거 목록, 인용 법령, 결정례, 해석례, 출처 공백.",
        },
        {
          id: "research-memo",
          title: "메모 종합",
          instruction:
            "법령, 사안 적용, 불확실성, 다음 조치를 구분합니다. 근거가 불완전하면 신중한 결론으로 표시합니다.",
          tools: [],
          output: "인용과 권장 다음 조치를 포함한 쉬운 표현의 메모.",
        },
      ],
      completionCriteria: [
        "범위에서 학교, 교육기관, 수업 요청을 제외합니다.",
        "하나 이상의 주요 법적 근거를 인용하거나 검증 공백을 표시합니다.",
        "결론은 법률 정보와 법률 자문을 구분합니다.",
      ],
    },
    {
      id: "contract_review",
      title: "계약서 위험 검토",
      audience: ["general_user", "business", "professional"],
      allowedInputs: [
        "계약서 본문",
        "당사자 지위",
        "거래 맥락",
        "위험 허용도",
        "특정 관심 조항",
      ],
      steps: [
        {
          id: "contract-intake",
          title: "입력 정보 및 비식별화 확인",
          instruction:
            "당사자 지위, 거래 맥락, 제공된 준거법, 민감 식별자 삭제 필요 여부를 확인합니다.",
          tools: [],
          output: "검토 전제와 비식별화 안내.",
        },
        {
          id: "contract-clause-review",
          title: "조항 위험 분석",
          instruction:
            "조항을 파싱하고 불공정하거나 일방적인 조건을 탐지하며 법적 근거와 거래상 영향을 정리합니다.",
          tools: ["chain_document_review", "search_decisions", "get_decision_text"],
          output: "근거 참조가 포함된 조항별 위험 표.",
        },
        {
          id: "contract-revisions",
          title: "수정안 제안",
          instruction:
            "거래 목적을 유지하면서 식별된 법적 위험을 줄이는 대체 조항 초안을 작성합니다.",
          tools: ["verify_citations"],
          output: "협상 쟁점, 수정 조항, 인용 검증 메모.",
        },
      ],
      completionCriteria: [
        "위험을 심각도와 실무 영향 기준으로 정렬합니다.",
        "수정 제안은 사용자의 당사자 지위와 연결합니다.",
        "분석 또는 수정 조항의 인용은 검증하거나 표시합니다.",
      ],
    },
    {
      id: "document_drafting",
      title: "법률 문서 초안 작성",
      audience: ["general_user", "business", "professional"],
      allowedInputs: [
        "문서 유형",
        "사실관계",
        "수신인",
        "희망 조치",
        "기한",
        "문체",
        "근거 자료",
      ],
      steps: [
        {
          id: "draft-intake",
          title: "초안 작성 요건",
          instruction:
            "문서 유형, 법적 목적, 수신자, 필수 사실관계, 첨부자료, 기한 민감도를 확인합니다.",
          tools: [],
          output: "초안 계획과 누락 사실 체크리스트.",
        },
        {
          id: "draft-authority",
          title: "근거 및 절차 확인",
          instruction:
            "청구, 통지, 제출용 문구를 생성하기 전 관련 법령과 절차 요건을 조회합니다.",
          tools: ["chain_full_research", "search_law", "get_law_text", "chain_procedure_detail"],
          output: "적용 법령, 절차 메모, 추가 검증 항목.",
        },
        {
          id: "draft-generate",
          title: "초안 생성",
          instruction:
            "제공된 사실관계와 확인된 근거만 사용해 초안을 작성합니다. 누락 사실은 자리표시자로 남기고 증거를 임의 생성하지 않습니다.",
          tools: ["verify_citations"],
          output: "구조화된 법률 문서 초안, 첨부자료 목록, 검증 메모.",
        },
      ],
      completionCriteria: [
        "초안은 누락 사실을 임의 작성하지 않고 자리표시자로 표시합니다.",
        "법적 인용은 검증하거나 검토 필요로 명시합니다.",
        "필요한 경우 제출 또는 발송 체크리스트를 포함합니다.",
      ],
    },
  ],
};

export function getWorkflow(id: HarnessDefinition["serviceScope"][number]) {
  return LEGAL_SERVICE_HARNESS.workflows.find((workflow) => workflow.id === id);
}

export function isExcludedContext(text: string): boolean {
  const normalized = text.toLowerCase();
  return LEGAL_SERVICE_HARNESS.policy.excludedContexts.some((context) =>
    normalized.includes(context.replaceAll("_", " ")),
  );
}
