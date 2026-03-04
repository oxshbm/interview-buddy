export interface QuestionScore {
  questionId: string;
  speechScore: number;
  contentScore: number;
  bodyLanguageScore: number;
  overall: number;
}

export interface InterviewReport {
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  categoryBreakdown: {
    speech: number;
    content: number;
    bodyLanguage: number;
  };
  questionScores: QuestionScore[];
  strengths: string[];
  improvements: string[];
}
