import type { ResultsRouteState } from "../types/interview";

const SESSION_KEY = "interviewBuddy:session:v2";

export function saveSessionState(state: ResultsRouteState): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
}

export function readSessionState(): ResultsRouteState | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ResultsRouteState;
  } catch {
    return null;
  }
}

export function clearSessionState(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
