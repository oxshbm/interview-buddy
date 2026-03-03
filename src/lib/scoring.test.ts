import { describe, expect, it } from "vitest";
import { buildInterviewReport, clamp } from "./scoring";

describe("clamp", () => {
  it("keeps values in range", () => {
    expect(clamp(-10)).toBe(0);
    expect(clamp(110)).toBe(100);
    expect(clamp(55)).toBe(55);
  });
});

describe("buildInterviewReport", () => {
  it("returns deterministic output", () => {
    const state = {
      interviewType: "technical" as const,
      totalQuestions: 5,
      answeredQuestions: 5,
      responsesMeta: [
        { questionId: "t1", durationSec: 90, startedAt: "2025-01-01", endedAt: "2025-01-01", pauseCount: 0 },
        { questionId: "t2", durationSec: 95, startedAt: "2025-01-01", endedAt: "2025-01-01", pauseCount: 1 }
      ]
    };

    const one = buildInterviewReport(state);
    const two = buildInterviewReport(state);

    expect(one).toEqual(two);
    expect(one.overallScore).toBeGreaterThan(0);
    expect(one.questionScores).toHaveLength(2);
  });
});
