export type InterviewType = "technical" | "hr";
export type TtsProvider = "browser" | "self_hosted";

export interface InterviewQuestion {
  id: string;
  type: InterviewType;
  category: string;
  prompt: string;
  timeLimitSec: number;
}

export interface QuestionTimelineSegment {
  questionId: string;
  questionText: string;
  narrationStartMs: number;
  narrationEndMs: number;
  answerWindowStartMs: number;
  answerWindowEndMs: number;
}

export interface InterviewRecordingBundle {
  mimeType: string;
  durationSec: number;
  startedAt: string;
  endedAt: string;
  pauseCount: number;
}

export interface ResultsRouteState {
  interviewType: InterviewType;
  totalQuestions: number;
  answeredQuestions: number;
  recording: InterviewRecordingBundle | null;
  timeline: QuestionTimelineSegment[];
  tts: {
    provider: TtsProvider;
    localeRequested: string;
    localeResolved: string | null;
    available: boolean;
    fallbackUsed: boolean;
  };
}

export interface InterviewSessionState {
  interviewType: InterviewType;
  questions: InterviewQuestion[];
  currentIndex: number;
  timeline: QuestionTimelineSegment[];
  isRecording: boolean;
  timeLeftSec: number;
}
