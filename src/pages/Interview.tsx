import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { useInterviewSession } from "../hooks/useInterviewSession";
import { useMediaPermissions } from "../hooks/useMediaPermissions";
import { useMediaRecorder } from "../hooks/useMediaRecorder";
import { useQuestionNarration } from "../hooks/useQuestionNarration";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { startAiSession, submitAiTurn, finalizeAiSession, type AiQuestion } from "../lib/ai/interviewApi";
import { getQuestionsByType } from "../lib/interview-data";
import { saveSessionState } from "../lib/storage";
import type { InterviewTranscriptTurn, InterviewType, QuestionTimelineSegment, ResultsRouteState } from "../types/interview";

const NARRATION_SAFETY_TIMEOUT_MS = 11_000;
const AI_INTERVIEW_ENABLED = import.meta.env.VITE_AI_INTERVIEW_ENABLED !== "false";

export default function InterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewType = (location.state as { interviewType?: InterviewType } | null)?.interviewType;

  useEffect(() => {
    if (!interviewType) {
      navigate("/setup", { replace: true });
    }
  }, [interviewType, navigate]);

  const staticQuestions = useMemo(() => (interviewType ? getQuestionsByType(interviewType) : []), [interviewType]);
  const staticSession = useInterviewSession(staticQuestions);
  const { stream, state: permissionState, requestPermissions, stopStream } = useMediaPermissions();
  const recorder = useMediaRecorder(stream);
  const narration = useQuestionNarration("browser", "en-US");
  const speech = useSpeechRecognition("en-US");
  const stopListening = speech.stop;
  const resetListening = speech.reset;
  const startListening = speech.start;

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Preparing interview session...");
  const [timeline, setTimeline] = useState<QuestionTimelineSegment[]>([]);
  const [aiFlowActive, setAiFlowActive] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState<AiQuestion | null>(null);
  const [aiTimeLeftSec, setAiTimeLeftSec] = useState(120);
  const [answerDraft, setAnswerDraft] = useState("");
  const [aiTurns, setAiTurns] = useState<InterviewTranscriptTurn[]>([]);

  const previewRef = useRef<HTMLVideoElement>(null);
  const interviewStartMsRef = useRef<number | null>(null);
  const activeSegmentRef = useRef<QuestionTimelineSegment | null>(null);
  const timelineRef = useRef<QuestionTimelineSegment[]>([]);
  const endingRef = useRef(false);
  const aiSessionInitRef = useRef(false);

  const activeQuestion = aiFlowActive
    ? (aiQuestion
        ? {
            id: aiQuestion.id,
            category: aiQuestion.category,
            prompt: aiQuestion.prompt,
            timeLimitSec: aiQuestion.timeLimitSec
          }
        : null)
    : staticSession.currentQuestion;

  const displayCurrentIndex = aiFlowActive ? Math.max((aiQuestion?.coreIndex ?? 1) - 1, 0) : staticSession.currentIndex;
  const displayTotalQuestions = aiFlowActive
    ? (aiQuestion?.totalCoreQuestions ?? staticQuestions.length ?? 1)
    : staticQuestions.length;
  const progress = aiFlowActive
    ? ((aiQuestion?.coreIndex ?? 1) / Math.max(aiQuestion?.totalCoreQuestions ?? 1, 1)) * 100
    : staticSession.progress;
  const timeLeftSec = aiFlowActive ? aiTimeLeftSec : staticSession.timeLeftSec;

  useEffect(() => {
    requestPermissions();
    return () => {
      stopListening();
      stopStream();
    };
  }, [requestPermissions, stopListening, stopStream]);

  useEffect(() => {
    if (!previewRef.current || !stream) return;
    previewRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    if (!AI_INTERVIEW_ENABLED || !interviewType || aiSessionInitRef.current) return;

    aiSessionInitRef.current = true;
    setStatusMessage("Connecting to AI interviewer...");

    void startAiSession({
      interviewType,
      questionPool: staticQuestions,
      targetCoreQuestions: Math.min(5, staticQuestions.length || 5),
      maxFollowUpsPerCore: 1
    })
      .then((response) => {
        setAiFlowActive(true);
        setAiSessionId(response.sessionId);
        setAiQuestion(response.question);
        setAiTimeLeftSec(response.question.timeLimitSec);
        setStatusMessage("AI interviewer ready.");
      })
      .catch(() => {
        setAiFlowActive(false);
        setStatusMessage("AI interviewer unavailable. Using built-in question flow.");
      });
  }, [interviewType, staticQuestions]);

  useEffect(() => {
    if (!aiFlowActive) return;
    setAnswerDraft(speech.transcript);
  }, [aiFlowActive, speech.transcript]);

  const nowMs = useCallback(() => {
    const start = interviewStartMsRef.current ?? Date.now();
    return Math.max(Date.now() - start, 0);
  }, []);

  const commitSegment = useCallback((segment: QuestionTimelineSegment) => {
    const updated = [...timelineRef.current.filter((item) => item.questionId !== segment.questionId), segment];
    timelineRef.current = updated;
    setTimeline(updated);
  }, []);

  const finalizeCurrentSegment = useCallback(() => {
    const segment = activeSegmentRef.current;
    if (!segment) return null;

    const finalized: QuestionTimelineSegment = {
      ...segment,
      answerWindowEndMs: nowMs()
    };

    commitSegment(finalized);
    activeSegmentRef.current = null;
    return finalized;
  }, [commitSegment, nowMs]);

  const narrateCurrentQuestion = useCallback(async () => {
    if (!activeQuestion || !interviewStarted || endingRef.current) return;

    stopListening();
    resetListening();
    setAnswerDraft("");

    const narrationStartMs = nowMs();
    setStatusMessage("Narrating question...");
    let timedOut = false;
    let timeoutId: number | null = null;
    const spoken = await Promise.race<boolean>([
      narration.speak(activeQuestion.prompt),
      new Promise<boolean>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          timedOut = true;
          reject(new Error("Narration timed out."));
        }, NARRATION_SAFETY_TIMEOUT_MS);
      })
    ])
      .catch(() => {
        narration.cancel();
        return false;
      })
      .finally(() => {
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
      });
    const narrationEndMs = nowMs();

    if (endingRef.current) return;

    activeSegmentRef.current = {
      questionId: activeQuestion.id,
      questionText: activeQuestion.prompt,
      narrationStartMs,
      narrationEndMs,
      answerWindowStartMs: narrationEndMs,
      answerWindowEndMs: narrationEndMs
    };

    if (aiFlowActive) {
      setAiTimeLeftSec(activeQuestion.timeLimitSec);
    } else {
      staticSession.setTimeLeftSec(activeQuestion.timeLimitSec);
    }

    if (aiFlowActive && speech.supported) {
      startListening();
    }

    setTimerActive(true);
    if (spoken) {
      setStatusMessage("Answer timer running.");
      return;
    }
    setStatusMessage(timedOut ? "Narration timed out. Continue with text question." : "TTS unavailable. Continue with text question.");
  }, [activeQuestion, aiFlowActive, interviewStarted, narration, nowMs, resetListening, startListening, staticSession, stopListening]);

  const finishInterview = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;

    narration.cancel();
    stopListening();
    setTimerActive(false);
    finalizeCurrentSegment();

    const stopped = await recorder.stop();

    let aiReport: ResultsRouteState["aiReport"] = null;
    let aiSummary: string | null = null;
    let transcript = aiTurns;

    if (aiFlowActive && aiSessionId) {
      try {
        const finalized = await finalizeAiSession({ sessionId: aiSessionId });
        aiReport = finalized.report;
        aiSummary = finalized.summary;
        transcript = finalized.transcript;
      } catch {
        aiSummary = "AI analysis could not be generated for this run.";
      }
    }

    const payload: ResultsRouteState = {
      interviewType: interviewType ?? "technical",
      totalQuestions: displayTotalQuestions,
      answeredQuestions: aiFlowActive ? transcript.length : timelineRef.current.length,
      recording: stopped
        ? {
            mimeType: stopped.mimeType,
            durationSec: stopped.durationSec,
            startedAt: stopped.startedAt,
            endedAt: stopped.endedAt,
            pauseCount: stopped.pauseCount
          }
        : null,
      timeline: timelineRef.current,
      transcript,
      aiReport,
      aiSummary,
      tts: {
        provider: narration.provider,
        localeRequested: narration.localeRequested,
        localeResolved: narration.localeResolved,
        available: narration.available,
        fallbackUsed: narration.fallbackUsed
      }
    };

    saveSessionState(payload);
    navigate("/results", { state: payload });
  }, [
    aiFlowActive,
    aiSessionId,
    aiTurns,
    displayTotalQuestions,
    finalizeCurrentSegment,
    interviewType,
    narration,
    navigate,
    recorder,
    stopListening
  ]);

  const submitAiAnswerAndAdvance = useCallback(async () => {
    if (!aiFlowActive || !aiSessionId || !activeQuestion || endingRef.current) return;

    const answerText = answerDraft.trim() || "No answer captured.";

    setAiTurns((prev) => [
      ...prev,
      {
        questionId: activeQuestion.id,
        questionText: activeQuestion.prompt,
        category: activeQuestion.category,
        isFollowUp: Boolean(aiQuestion?.isFollowUp),
        answerText,
        answeredAt: new Date().toISOString()
      }
    ]);

    setStatusMessage("Analyzing your answer...");
    stopListening();

    try {
      const response = await submitAiTurn({ sessionId: aiSessionId, answerText });
      if (response.done || !response.question) {
        await finishInterview();
        return;
      }

      setAiQuestion(response.question);
      setAiTimeLeftSec(response.question.timeLimitSec);
      setStatusMessage("Next question ready.");
    } catch {
      setStatusMessage("AI turn request failed. Ending interview with captured data.");
      await finishInterview();
    }
  }, [activeQuestion, aiFlowActive, aiQuestion?.isFollowUp, aiSessionId, answerDraft, finishInterview, stopListening]);

  useEffect(() => {
    if (!interviewStarted || endingRef.current) return;
    void narrateCurrentQuestion();
  }, [displayCurrentIndex, interviewStarted, narrateCurrentQuestion]);

  useEffect(() => {
    if (!timerActive || endingRef.current) return;

    const id = window.setInterval(() => {
      if (aiFlowActive) {
        setAiTimeLeftSec((prev) => {
          if (prev <= 1) {
            window.clearInterval(id);
            setTimerActive(false);
            finalizeCurrentSegment();
            void submitAiAnswerAndAdvance();
            return 0;
          }
          return prev - 1;
        });
        return;
      }

      staticSession.setTimeLeftSec((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setTimerActive(false);
          finalizeCurrentSegment();

          if (staticSession.isLastQuestion) {
            void finishInterview();
          } else {
            staticSession.goToNext();
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [aiFlowActive, finishInterview, finalizeCurrentSegment, staticSession, submitAiAnswerAndAdvance, timerActive]);

  useEffect(() => {
    if (endingRef.current || interviewStarted || !activeQuestion) return;

    if (permissionState === "unsupported") {
      setStatusMessage("Media devices are not supported in this browser.");
      return;
    }

    if (permissionState === "denied") {
      setStatusMessage("Camera or microphone permission is required to start.");
      return;
    }

    if (permissionState !== "granted") {
      setStatusMessage("Waiting for camera and microphone permissions...");
      return;
    }

    if (!recorder.canRecord) {
      setStatusMessage("Recording is unavailable on this browser/device.");
      return;
    }

    interviewStartMsRef.current = Date.now();
    timelineRef.current = [];
    setTimeline([]);

    const started = recorder.start();
    if (!started) {
      setStatusMessage("Unable to start recording on this browser/device.");
      return;
    }

    setInterviewStarted(true);
    setStatusMessage("Interview recording started.");
  }, [activeQuestion, interviewStarted, permissionState, recorder]);

  if (!activeQuestion) return null;

  return (
    <main className="relative min-h-screen w-full overflow-hidden px-4 py-5 md:px-8 md:py-8">
      <section className="relative flex min-h-[calc(100vh-3rem)] w-full items-center justify-center rounded-2xl border border-white/60 bg-slate-900/95 shadow-2xl">
        <div className="absolute left-4 right-4 top-4 z-20 rounded-xl border border-white/20 bg-slate-950/75 p-4 backdrop-blur sm:left-6 sm:right-6 sm:top-6">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-300">Question {displayCurrentIndex + 1} of {displayTotalQuestions}</p>
              <h1 className="text-base font-semibold text-white sm:text-lg">{activeQuestion.category}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-300">Time Left</p>
              <p className="text-xl font-semibold text-white tabular-nums sm:text-2xl">{timeLeftSec}s</p>
            </div>
          </div>
          <p className="mb-3 text-sm text-slate-200">{activeQuestion.prompt}</p>
          <Progress value={progress} className="h-2 bg-slate-700" />
        </div>

        <div className="ai-stage-breath relative z-10 flex h-52 w-52 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-cyan-300 to-blue-500 shadow-[0_0_60px_rgba(34,211,238,0.35)] sm:h-72 sm:w-72 md:h-80 md:w-80">
          <div className="flex h-[86%] w-[86%] items-center justify-center rounded-full bg-slate-950/25">
            <span className="text-lg font-semibold tracking-[0.28em] text-white sm:text-xl">AI</span>
          </div>
        </div>

        <div className="absolute right-4 top-[8.5rem] z-30 w-36 overflow-hidden rounded-xl border border-white/35 bg-slate-950 shadow-xl sm:right-6 sm:w-44 md:w-52">
          <div className="aspect-video bg-slate-900">
            <video ref={previewRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          </div>
          <p className="truncate px-2 py-1 text-center text-xs font-medium text-slate-100">You</p>
        </div>

        <div className="absolute bottom-20 left-4 right-4 z-20 sm:left-6 sm:right-6">
          <div className="rounded-xl border border-white/20 bg-slate-950/75 px-4 py-3 text-sm text-slate-200 backdrop-blur">
            <p>{statusMessage}</p>
            {aiFlowActive ? <p className="mt-1 text-slate-300">Answer transcript: {speech.transcript || answerDraft || "(waiting...)"}</p> : null}
            {aiFlowActive && !speech.supported ? (
              <div className="mt-2 space-y-2">
                <p className="text-red-300">Speech recognition unavailable. Type your answer below.</p>
                <textarea
                  value={answerDraft}
                  onChange={(event) => setAnswerDraft(event.target.value)}
                  className="h-24 w-full rounded-md border border-white/25 bg-slate-900/80 p-2 text-sm text-slate-100"
                  placeholder="Type your answer..."
                />
                <Button
                  variant="outline"
                  onClick={() => void submitAiAnswerAndAdvance()}
                  disabled={!timerActive || endingRef.current}
                  className="border-white/30 bg-transparent text-slate-100 hover:bg-slate-900"
                >
                  Submit Answer
                </Button>
              </div>
            ) : null}
            {speech.error ? <p className="mt-1 text-red-300">{speech.error}</p> : null}
            {narration.error ? <p className="mt-1 text-red-300">{narration.error}</p> : null}
            {!narration.available ? <p className="mt-1 text-red-300">TTS unavailable. Questions will be text-only.</p> : null}
            {recorder.error ? <p className="mt-1 text-red-300">{recorder.error}</p> : null}
            {permissionState !== "granted" ? <p className="mt-1 text-red-300">Camera/mic permission is required to record.</p> : null}
            <p className="mt-1 text-slate-300">Timeline segments captured: {timeline.length}</p>
          </div>
        </div>

        <div className="absolute bottom-5 left-1/2 z-40 -translate-x-1/2">
          <Button
            variant="destructive"
            onClick={() => void finishInterview()}
            disabled={!interviewStarted || endingRef.current}
            className="h-11 min-w-40 rounded-full px-8"
          >
            End Interview
          </Button>
        </div>
      </section>
    </main>
  );
}
