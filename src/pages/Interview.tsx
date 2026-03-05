import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
  const [interviewPaused, setInterviewPaused] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Click Start Interview to begin continuous recording.");
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
    if (!currentQuestion || !interviewStarted || interviewPaused || endingRef.current) return;

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

    if (endingRef.current || interviewPaused) return;

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
  }, [currentQuestion, interviewPaused, interviewStarted, narration, nowMs, setTimeLeftSec]);

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
    if (!interviewStarted || interviewPaused || endingRef.current) return;
    void narrateCurrentQuestion();
  }, [currentIndex, interviewPaused, interviewStarted, narrateCurrentQuestion]);

  useEffect(() => {
    if (!timerActive || interviewPaused || endingRef.current) return;

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
  }, [finishInterview, finalizeCurrentSegment, goToNext, interviewPaused, isLastQuestion, setTimeLeftSec, timerActive]);

  const handleStartInterview = () => {
    if (permissionState !== "granted" || !recorder.canRecord || !currentQuestion) {
      setStatusMessage("Camera/microphone permission and recording support are required.");
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
    setInterviewPaused(false);
    setStatusMessage("Interview recording started.");
  };

  const handlePauseResumeInterview = () => {
    if (!interviewStarted || endingRef.current) return;

    if (!interviewPaused) {
      narration.cancel();
      recorder.pause();
      setInterviewPaused(true);
      setTimerActive(false);
      setStatusMessage("Interview paused.");
      return;
    }

    recorder.resume();
    setInterviewPaused(false);
    setStatusMessage("Interview resumed.");

    if (activeSegmentRef.current) {
      setTimerActive(true);
    }
  };

  const handleReplayNarration = async () => {
    if (!currentQuestion || timerActive || !interviewStarted || endingRef.current) return;
    setStatusMessage("Replaying question audio...");
    await narration.speak(currentQuestion.prompt);
    if (!timerActive && !interviewPaused) {
      setStatusMessage("Answer timer running.");
    }
  };

  if (!currentQuestion) return null;

  return (
    <main className="mx-auto w-full max-w-5xl p-6 md:p-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
          <h1 className="text-2xl font-semibold">{currentQuestion.category}</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Time Left</p>
          <p className="text-2xl font-semibold tabular-nums">{timeLeftSec}s</p>
        </div>
      </div>
      <Progress value={progress} className="mb-6" />

      <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{currentQuestion.prompt}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-slate-900 p-1">
              <video ref={previewRef} autoPlay muted playsInline className="h-56 w-full rounded object-cover" />
            </div>
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
            {narration.error ? <p className="text-sm text-destructive">{narration.error}</p> : null}
            {!narration.available ? <p className="text-sm text-destructive">TTS unavailable. Questions will be text-only.</p> : null}
            {recorder.error ? <p className="text-sm text-destructive">{recorder.error}</p> : null}
            {permissionState !== "granted" ? <p className="text-sm text-destructive">Camera/mic permission is required to record.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interview Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleStartInterview} disabled={interviewStarted || permissionState !== "granted" || !recorder.canRecord} className="w-full">
              Start Interview
            </Button>
            <Button variant="outline" onClick={handlePauseResumeInterview} disabled={!interviewStarted || endingRef.current} className="w-full">
              {interviewPaused ? "Resume Interview" : "Pause Interview"}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleReplayNarration()}
              disabled={!interviewStarted || timerActive || narration.state === "narrating" || endingRef.current}
              className="w-full"
            >
              Replay Question Audio
            </Button>
            <Button variant="destructive" onClick={() => void finishInterview()} disabled={!interviewStarted || endingRef.current} className="w-full">
              End Interview
            </Button>
            <div className="rounded-md border bg-muted p-3 text-xs text-muted-foreground">
              Timeline segments captured: {timeline.length}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
