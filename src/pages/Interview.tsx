import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { useInterviewSession } from "../hooks/useInterviewSession";
import { useMediaPermissions } from "../hooks/useMediaPermissions";
import { useMediaRecorder } from "../hooks/useMediaRecorder";
import { useQuestionNarration } from "../hooks/useQuestionNarration";
import { getQuestionsByType } from "../lib/interview-data";
import { saveSessionState } from "../lib/storage";
import type { InterviewType, QuestionTimelineSegment, ResultsRouteState } from "../types/interview";

const NARRATION_SAFETY_TIMEOUT_MS = 11_000;

export default function InterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewType = (location.state as { interviewType?: InterviewType } | null)?.interviewType;

  useEffect(() => {
    if (!interviewType) {
      navigate("/setup", { replace: true });
    }
  }, [interviewType, navigate]);

  const questions = useMemo(() => (interviewType ? getQuestionsByType(interviewType) : []), [interviewType]);
  const { currentIndex, currentQuestion, isLastQuestion, timeLeftSec, setTimeLeftSec, progress, goToNext } = useInterviewSession(questions);
  const { stream, state: permissionState, requestPermissions, stopStream } = useMediaPermissions();
  const recorder = useMediaRecorder(stream);
  const narration = useQuestionNarration("browser", "en-US");

  const [interviewStarted, setInterviewStarted] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Preparing interview session...");
  const [timeline, setTimeline] = useState<QuestionTimelineSegment[]>([]);
  const previewRef = useRef<HTMLVideoElement>(null);
  const interviewStartMsRef = useRef<number | null>(null);
  const activeSegmentRef = useRef<QuestionTimelineSegment | null>(null);
  const timelineRef = useRef<QuestionTimelineSegment[]>([]);
  const endingRef = useRef(false);

  useEffect(() => {
    requestPermissions();
    return () => {
      stopStream();
    };
  }, [requestPermissions, stopStream]);

  useEffect(() => {
    if (previewRef.current && stream) {
      previewRef.current.srcObject = stream;
    }
  }, [stream]);

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
    if (!currentQuestion || !interviewStarted || endingRef.current) return;

    const narrationStartMs = nowMs();
    setStatusMessage("Narrating question...");
    let timedOut = false;
    let timeoutId: number | null = null;
    const spoken = await Promise.race<boolean>([
      narration.speak(currentQuestion.prompt),
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
      questionId: currentQuestion.id,
      questionText: currentQuestion.prompt,
      narrationStartMs,
      narrationEndMs,
      answerWindowStartMs: narrationEndMs,
      answerWindowEndMs: narrationEndMs
    };

    setTimeLeftSec(currentQuestion.timeLimitSec);
    setTimerActive(true);
    if (spoken) {
      setStatusMessage("Answer timer running.");
      return;
    }
    setStatusMessage(timedOut ? "Narration timed out. Continue with text question." : "TTS unavailable. Continue with text question.");
  }, [currentQuestion, interviewStarted, narration, nowMs, setTimeLeftSec]);

  const finishInterview = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    narration.cancel();
    setTimerActive(false);

    finalizeCurrentSegment();

    const stopped = await recorder.stop();
    const payload: ResultsRouteState = {
      interviewType: interviewType ?? "technical",
      totalQuestions: questions.length,
      answeredQuestions: timelineRef.current.length,
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
  }, [finalizeCurrentSegment, interviewType, narration, navigate, questions.length, recorder]);

  useEffect(() => {
    if (!interviewStarted || endingRef.current) return;
    void narrateCurrentQuestion();
  }, [currentIndex, interviewStarted, narrateCurrentQuestion]);

  useEffect(() => {
    if (!timerActive || endingRef.current) return;

    const id = window.setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setTimerActive(false);
          finalizeCurrentSegment();

          if (isLastQuestion) {
            void finishInterview();
          } else {
            goToNext();
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [finishInterview, finalizeCurrentSegment, goToNext, isLastQuestion, setTimeLeftSec, timerActive]);

  useEffect(() => {
    if (endingRef.current || interviewStarted || !currentQuestion) return;

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
  }, [currentQuestion, interviewStarted, permissionState, recorder]);

  if (!currentQuestion) return null;

  return (
    <main className="relative min-h-screen w-full overflow-hidden px-4 py-5 md:px-8 md:py-8">
      <section className="relative flex min-h-[calc(100vh-3rem)] w-full items-center justify-center rounded-2xl border border-white/60 bg-slate-900/95 shadow-2xl">
        <div className="absolute left-4 right-4 top-4 z-20 rounded-xl border border-white/20 bg-slate-950/75 p-4 backdrop-blur sm:left-6 sm:right-6 sm:top-6">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-300">Question {currentIndex + 1} of {questions.length}</p>
              <h1 className="text-base font-semibold text-white sm:text-lg">{currentQuestion.category}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-300">Time Left</p>
              <p className="text-xl font-semibold text-white tabular-nums sm:text-2xl">{timeLeftSec}s</p>
            </div>
          </div>
          <p className="mb-3 text-sm text-slate-200">{currentQuestion.prompt}</p>
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
