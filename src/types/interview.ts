export type InterviewType = "technical" | "hr";

export interface InterviewQuestion {
  id: string;
  type: InterviewType;
  category: string;
  prompt: string;
  timeLimitSec: number;
}

export interface RecordedResponse {
  questionId: string;
  blob: Blob;
  durationSec: number;
  startedAt: string;
  endedAt: string;
  pauseCount: number;
}

export interface ResponseMeta {
  questionId: string;
  durationSec: number;
  startedAt: string;
  endedAt: string;
  pauseCount: number;
}

export interface ResultsRouteState {
  interviewType: InterviewType;
  totalQuestions: number;
  answeredQuestions: number;
  responsesMeta: ResponseMeta[];
}

export interface InterviewSessionState {
  interviewType: InterviewType;
  questions: InterviewQuestion[];
  currentIndex: number;
  responsesMeta: ResponseMeta[];
  isRecording: boolean;
  timeLeftSec: number;
}
