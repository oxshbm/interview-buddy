import type { InterviewQuestion, InterviewTranscriptTurn, InterviewType } from "../../types/interview";
import type { InterviewReport } from "../../types/report";

const API_BASE = import.meta.env.VITE_AI_API_BASE ?? "";

export interface AiQuestion {
  id: string;
  category: string;
  prompt: string;
  timeLimitSec: number;
  isFollowUp: boolean;
  coreIndex: number;
  totalCoreQuestions: number;
}

export interface AiStartSessionResponse {
  sessionId: string;
  question: AiQuestion;
}

export interface AiTurnResponse {
  done: boolean;
  question: AiQuestion | null;
}

export interface AiFinalizeResponse {
  report: InterviewReport;
  summary: string;
  transcript: InterviewTranscriptTurn[];
}

interface ApiErrorShape {
  error?: string;
}

async function readError(res: Response): Promise<string> {
  try {
    const parsed = (await res.json()) as ApiErrorShape;
    return parsed.error ?? `Request failed with ${res.status}`;
  } catch {
    return `Request failed with ${res.status}`;
  }
}

export async function startAiSession(input: {
  interviewType: InterviewType;
  questionPool: InterviewQuestion[];
  targetCoreQuestions: number;
  maxFollowUpsPerCore: number;
}): Promise<AiStartSessionResponse> {
  const res = await fetch(`${API_BASE}/api/interview/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as AiStartSessionResponse;
}

export async function submitAiTurn(input: {
  sessionId: string;
  answerText: string;
}): Promise<AiTurnResponse> {
  const res = await fetch(`${API_BASE}/api/interview/session/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as AiTurnResponse;
}

export async function finalizeAiSession(input: {
  sessionId: string;
}): Promise<AiFinalizeResponse> {
  const res = await fetch(`${API_BASE}/api/interview/session/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as AiFinalizeResponse;
}
