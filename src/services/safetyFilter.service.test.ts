import { describe, expect, it } from "vitest";

import { filterLegalSafetyText, safetyFilterService } from "./safetyFilter.service.js";

describe("safetyFilterService", () => {
  it("detects deterministic legal judgment phrases", () => {
    const result = filterLegalSafetyText("이 사안은 반드시 승소 가능하고 100% 위법입니다.");

    expect(result.detections.map((detection) => detection.phrase)).toContain("반드시 승소");
    expect(result.detections.map((detection) => detection.phrase)).toContain("100% 위법");
    expect(result.expertReviewRequired).toBe(true);
  });

  it("softens risky legal expressions", () => {
    const result = safetyFilterService.filter("상대방 행위는 위법입니다. 소송하면 이김. 처벌됩니다.");

    expect(result.filteredText).toContain("위법 소지가 있습니다");
    expect(result.filteredText).toContain("소송에서 유리하게 검토될 가능성이 있으나 결과를 보장할 수 없음");
    expect(result.filteredText).toContain("형사책임 문제가 검토될 수 있습니다");
    expect(result.changed).toBe(true);
  });

  it("marks no-lawyer-needed claims as high risk", () => {
    const result = safetyFilterService.filter("이 정도는 변호사 없이 가능");

    expect(result.detections).toEqual([
      {
        phrase: "변호사 없이 가능",
        category: "no_expert_needed",
        riskLevel: "high",
      },
    ]);
    expect(result.filteredText).toBe("이 정도는 전문가 검토 없이 진행할 경우 위험이 있을 수 있음");
    expect(result.expertReviewRequired).toBe(true);
  });

  it("leaves cautious text unchanged", () => {
    const text = "위법 소지가 있으나 사실관계와 자료에 따라 추가 검토가 필요합니다.";
    const result = safetyFilterService.filter(text);

    expect(result.filteredText).toBe(text);
    expect(result.detections).toEqual([]);
    expect(result.changed).toBe(false);
    expect(result.expertReviewRequired).toBe(false);
  });
});
