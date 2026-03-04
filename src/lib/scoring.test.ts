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
      recording: {
        mimeType: "video/webm",
        durationSec: 500,
        startedAt: "2025-01-01",
        endedAt: "2025-01-01",
        pauseCount: 1
      },
      timeline: [
        {
          questionId: "t1",
          questionText: "Q1",
          narrationStartMs: 0,
          narrationEndMs: 4000,
          answerWindowStartMs: 4000,
          answerWindowEndMs: 104000
        },
        {
          questionId: "t2",
          questionText: "Q2",
          narrationStartMs: 110000,
          narrationEndMs: 114000,
          answerWindowStartMs: 114000,
          answerWindowEndMs: 194000
        }
      ],
      tts: {
        provider: "browser" as const,
        localeRequested: "en-US",
        localeResolved: "en-US",
        available: true,
        fallbackUsed: false
      }
    };

    const one = buildInterviewReport(state);
    const two = buildInterviewReport(state);

    expect(one).toEqual(two);
    expect(one.overallScore).toBeGreaterThan(0);
    expect(one.questionScores).toHaveLength(2);
    expect(one.questionScores[0].questionText).toBe("Q1");
  });
});
