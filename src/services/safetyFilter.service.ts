export interface SafetyDetection {
  readonly phrase: string;
  readonly category: "guaranteed_outcome" | "definitive_illegality" | "criminal_liability" | "invalidity" | "no_expert_needed";
  readonly riskLevel: "medium" | "high";
}

export interface SafetyFilterResult {
  readonly originalText: string;
  readonly filteredText: string;
  readonly detections: readonly SafetyDetection[];
  readonly expertReviewRequired: boolean;
  readonly changed: boolean;
}

interface DetectionRule {
  readonly phrase: string;
  readonly category: SafetyDetection["category"];
  readonly riskLevel: SafetyDetection["riskLevel"];
}

interface ReplacementRule {
  readonly pattern: RegExp;
  readonly replacement: string;
}

const detectionRules: readonly DetectionRule[] = [
  { phrase: "반드시 승소", category: "guaranteed_outcome", riskLevel: "high" },
  { phrase: "무조건 승소", category: "guaranteed_outcome", riskLevel: "high" },
  { phrase: "100% 위법", category: "definitive_illegality", riskLevel: "high" },
  { phrase: "반드시 처벌", category: "criminal_liability", riskLevel: "high" },
  { phrase: "완전히 무효", category: "invalidity", riskLevel: "high" },
  { phrase: "소송하면 이김", category: "guaranteed_outcome", riskLevel: "high" },
  { phrase: "변호사 없이 가능", category: "no_expert_needed", riskLevel: "high" },
];

const replacementRules: readonly ReplacementRule[] = [
  { pattern: /위법입니다/g, replacement: "위법 소지가 있습니다" },
  {
    pattern: /승소합니다/g,
    replacement: "유리하게 검토될 가능성이 있으나 추가 검토가 필요합니다",
  },
  { pattern: /처벌됩니다/g, replacement: "형사책임 문제가 검토될 수 있습니다" },
  { pattern: /반드시 승소/g, replacement: "유리하게 검토될 가능성이 있으나 추가 검토가 필요합니다" },
  { pattern: /무조건 승소/g, replacement: "유리하게 검토될 가능성이 있으나 추가 검토가 필요합니다" },
  { pattern: /100% 위법/g, replacement: "위법 소지가 있어 추가 검토가 필요" },
  { pattern: /반드시 처벌/g, replacement: "형사책임 문제가 검토될 수 있어 추가 검토가 필요" },
  { pattern: /완전히 무효/g, replacement: "무효로 다툴 여지가 있을 수 있음" },
  {
    pattern: /소송하면 이김/g,
    replacement: "소송에서 유리하게 검토될 가능성이 있으나 결과를 보장할 수 없음",
  },
  {
    pattern: /변호사 없이 가능/g,
    replacement: "전문가 검토 없이 진행할 경우 위험이 있을 수 있음",
  },
];

function detectRiskyPhrases(text: string): SafetyDetection[] {
  return detectionRules
    .filter((rule) => text.includes(rule.phrase))
    .map((rule) => ({
      phrase: rule.phrase,
      category: rule.category,
      riskLevel: rule.riskLevel,
    }));
}

function softenText(text: string): string {
  return replacementRules.reduce(
    (current, rule) => current.replace(rule.pattern, rule.replacement),
    text,
  );
}

export function filterLegalSafetyText(text: string): SafetyFilterResult {
  const detections = detectRiskyPhrases(text);
  const filteredText = softenText(text);
  const hasHighRiskDetection = detections.some((detection) => detection.riskLevel === "high");

  return {
    originalText: text,
    filteredText,
    detections,
    expertReviewRequired: hasHighRiskDetection || filteredText !== text,
    changed: filteredText !== text,
  };
}

export const safetyFilterService = {
  filter: filterLegalSafetyText,
};
