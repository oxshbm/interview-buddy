import { scoreToGrade } from "./grading";
import type { ResultsRouteState } from "../types/interview";
import type { InterviewReport, QuestionScore } from "../types/report";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function scoreDuration(durationSec: number): number {
  if (durationSec >= 70 && durationSec <= 130) return 95;
  if (durationSec >= 45 && durationSec <= 150) return 82;
  if (durationSec >= 25) return 70;
  return 50;
}

export function buildInterviewReport(state: ResultsRouteState): InterviewReport {
  const completionRatio = state.totalQuestions > 0 ? state.answeredQuestions / state.totalQuestions : 0;

  const perQuestion: QuestionScore[] = state.responsesMeta.map((response) => {
    const durationQuality = scoreDuration(response.durationSec);
    const pausePenalty = response.pauseCount * 3;

    const speechScore = clamp(Math.round(durationQuality - pausePenalty));
    const contentScore = clamp(Math.round(60 + completionRatio * 35 + Math.min(response.durationSec / 3, 12)));
    const bodyLanguageScore = clamp(Math.round(72 + (durationQuality - 70) * 0.35 - pausePenalty * 0.6));
    const overall = clamp(Math.round((speechScore + contentScore + bodyLanguageScore) / 3));

    return {
      questionId: response.questionId,
      speechScore,
      contentScore,
      bodyLanguageScore,
      overall
    };
  });

  const speech = clamp(Math.round(avg(perQuestion.map((q) => q.speechScore))));
  const content = clamp(Math.round(avg(perQuestion.map((q) => q.contentScore))));
  const bodyLanguage = clamp(Math.round(avg(perQuestion.map((q) => q.bodyLanguageScore))));

  const completionContribution = completionRatio * 20;
  const durationContribution = avg(perQuestion.map((q) => q.speechScore)) / 10;
  const stabilityContribution = clamp(10 - avg(state.responsesMeta.map((r) => r.pauseCount * 2)), 0, 10);

  const overallScore = clamp(Math.round(60 + completionContribution + durationContribution + stabilityContribution));
  const grade = scoreToGrade(overallScore);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (speech >= 80) strengths.push("Consistent speaking pace with low interruption.");
  if (content >= 80) strengths.push("Strong answer coverage across interview prompts.");
  if (bodyLanguage >= 80) strengths.push("Steady on-camera presence during responses.");

  if (speech < 75) improvements.push("Use fewer pauses and maintain a steadier speaking rhythm.");
  if (content < 75) improvements.push("Increase answer depth with clearer examples and outcomes.");
  if (bodyLanguage < 75) improvements.push("Improve posture and maintain better eye-line consistency.");
  if (completionRatio < 1) improvements.push("Complete all questions to maximize overall score impact.");

  if (strengths.length === 0) strengths.push("You maintained interview flow and completed core prompts.");
  if (improvements.length === 0) improvements.push("Keep practicing for sharper, more concise delivery.");

  return {
    overallScore,
    grade,
    categoryBreakdown: {
      speech,
      content,
      bodyLanguage
    },
    questionScores: perQuestion,
    strengths,
    improvements
  };
}

export { clamp };
