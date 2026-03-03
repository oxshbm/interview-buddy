import { describe, expect, it } from "vitest";
import { scoreToGrade } from "./grading";

describe("scoreToGrade", () => {
  it("maps score bands correctly", () => {
    expect(scoreToGrade(95)).toBe("A");
    expect(scoreToGrade(80)).toBe("B");
    expect(scoreToGrade(74)).toBe("C");
    expect(scoreToGrade(61)).toBe("D");
    expect(scoreToGrade(40)).toBe("F");
  });
});
