import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InterviewPage from "./Interview";
import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  navigateMock,
  requestPermissionsMock,
  stopStreamMock,
  startMock,
  stopMock,
  cancelMock,
  saveSessionStateMock,
  startAiSessionMock,
  finalizeAiSessionMock,
  speechStartMock,
  speechStopMock,
  speechResetMock
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  requestPermissionsMock: vi.fn(),
  stopStreamMock: vi.fn(),
  startMock: vi.fn(() => true),
  stopMock: vi.fn(async () => null),
  cancelMock: vi.fn(),
  saveSessionStateMock: vi.fn(),
  startAiSessionMock: vi.fn(async () => {
    throw new Error("AI unavailable");
  }),
  finalizeAiSessionMock: vi.fn(async () => ({
    report: {
      overallScore: 70,
      grade: "C",
      categoryBreakdown: { speech: 70, content: 70, bodyLanguage: 70 },
      questionScores: [],
      strengths: ["test"],
      improvements: ["test"]
    },
    summary: "none",
    transcript: []
  })),
  speechStartMock: vi.fn(() => false),
  speechStopMock: vi.fn(),
  speechResetMock: vi.fn()
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ state: { interviewType: "technical" } })
  };
});

vi.mock("../hooks/useInterviewSession", () => ({
  useInterviewSession: () => ({
    currentIndex: 0,
    currentQuestion: {
      id: "q1",
      type: "technical",
      category: "System Design",
      prompt: "Design a scalable notification service.",
      timeLimitSec: 60
    },
    isLastQuestion: true,
    timeLeftSec: 60,
    setTimeLeftSec: vi.fn(),
    progress: 20,
    goToNext: vi.fn()
  })
}));

vi.mock("../hooks/useMediaPermissions", () => ({
  useMediaPermissions: () => ({
    stream: null,
    state: "granted",
    error: null,
    requestPermissions: requestPermissionsMock,
    stopStream: stopStreamMock
  })
}));

vi.mock("../hooks/useMediaRecorder", () => ({
  useMediaRecorder: () => ({
    state: "idle",
    error: null,
    canRecord: true,
    start: startMock,
    pause: vi.fn(),
    resume: vi.fn(),
    stop: stopMock
  })
}));

vi.mock("../hooks/useQuestionNarration", () => ({
  useQuestionNarration: () => ({
    provider: "browser",
    available: true,
    state: "idle",
    error: null,
    localeRequested: "en-US",
    localeResolved: "en-US",
    fallbackUsed: false,
    speak: vi.fn(async () => true),
    cancel: cancelMock
  })
}));

vi.mock("../hooks/useSpeechRecognition", () => ({
  useSpeechRecognition: () => ({
    state: "unsupported",
    error: null,
    supported: false,
    finalTranscript: "",
    interimTranscript: "",
    transcript: "",
    start: speechStartMock,
    stop: speechStopMock,
    reset: speechResetMock
  })
}));

vi.mock("../lib/ai/interviewApi", () => ({
  startAiSession: startAiSessionMock,
  submitAiTurn: vi.fn(async () => ({ done: true, question: null })),
  finalizeAiSession: finalizeAiSessionMock
}));

vi.mock("../lib/interview-data", () => ({
  getQuestionsByType: () => [
    {
      id: "q1",
      type: "technical",
      category: "System Design",
      prompt: "Design a scalable notification service.",
      timeLimitSec: 60
    }
  ]
}));

vi.mock("../lib/storage", () => ({
  saveSessionState: saveSessionStateMock
}));

describe("InterviewPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    requestPermissionsMock.mockReset();
    stopStreamMock.mockReset();
    startMock.mockClear();
    stopMock.mockClear();
    cancelMock.mockReset();
    saveSessionStateMock.mockReset();
    startAiSessionMock.mockClear();
    finalizeAiSessionMock.mockClear();
    speechStartMock.mockClear();
    speechStopMock.mockClear();
    speechResetMock.mockClear();
  });

  it("renders only the End Interview control", async () => {
    render(<InterviewPage />);
    await waitFor(() => {
      expect(startMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole("button", { name: /End Interview/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Start Interview/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pause Interview/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Replay Question Audio/i })).not.toBeInTheDocument();
  });

  it("auto-starts recording and routes to results on End Interview", async () => {
    render(<InterviewPage />);

    await waitFor(() => {
      expect(startMock).toHaveBeenCalledTimes(1);
      expect(requestPermissionsMock).toHaveBeenCalledTimes(1);
    });

    await userEvent.click(screen.getByRole("button", { name: /End Interview/i }));

    await waitFor(() => {
      expect(stopMock).toHaveBeenCalledTimes(1);
      expect(saveSessionStateMock).toHaveBeenCalledTimes(1);
      expect(navigateMock).toHaveBeenCalledWith("/results", { state: expect.any(Object) });
    });
  });
});
