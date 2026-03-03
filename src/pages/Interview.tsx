import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useInterviewSession } from "../hooks/useInterviewSession";
import { useMediaPermissions } from "../hooks/useMediaPermissions";
import { useMediaRecorder } from "../hooks/useMediaRecorder";
import { getQuestionsByType } from "../lib/interview-data";
import { saveSessionState } from "../lib/storage";
import type { InterviewType, ResponseMeta, ResultsRouteState } from "../types/interview";

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
  const { currentIndex, currentQuestion, responsesMeta, timeLeftSec, setTimeLeftSec, progress, saveResponseMeta, goToNext, resetTimer } =
    useInterviewSession(questions);

  const { stream, state: permissionState, requestPermissions, stopStream } = useMediaPermissions();
  const recorder = useMediaRecorder(stream);
  const [statusMessage, setStatusMessage] = useState<string>("Click Start Recording to begin your answer.");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const previewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    requestPermissions();
    return () => {
      stopStream();
    };
  }, [requestPermissions, stopStream]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    if (previewRef.current && stream) {
      previewRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!timerActive) return;
    const id = window.setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setTimerActive(false);
          void handleStop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [timerActive, setTimeLeftSec]);

  const handleStart = () => {
    const didStart = recorder.start();
    if (didStart) {
      setTimerActive(true);
      setStatusMessage("Recording in progress...");
    }
  };

  const handlePauseResume = () => {
    if (recorder.state === "recording") {
      recorder.pause();
      setTimerActive(false);
      setStatusMessage("Recording paused.");
    } else if (recorder.state === "paused") {
      recorder.resume();
      setTimerActive(true);
      setStatusMessage("Recording resumed.");
    }
  };

  const handleStop = async () => {
    const result = await recorder.stop();
    if (!result || !currentQuestion) return;

    const meta: ResponseMeta = {
      questionId: currentQuestion.id,
      durationSec: result.durationSec,
      startedAt: result.startedAt,
      endedAt: result.endedAt,
      pauseCount: result.pauseCount
    };

    saveResponseMeta(meta);
    const url = URL.createObjectURL(result.blob);
    setVideoUrl((existing) => {
      if (existing) URL.revokeObjectURL(existing);
      return url;
    });
    setTimerActive(false);
    setStatusMessage("Response recorded. You can continue to the next question.");
  };

  const buildPayload = (): ResultsRouteState => ({
    interviewType: interviewType ?? "technical",
    totalQuestions: questions.length,
    answeredQuestions: responsesMeta.length,
    responsesMeta
  });

  const goToResults = () => {
    const payload = buildPayload();
    saveSessionState(payload);
    navigate("/results", { state: payload });
  };

  const handleNext = () => {
    const moved = goToNext();
    if (!moved) {
      goToResults();
      return;
    }
    resetTimer();
    setStatusMessage("Click Start Recording to begin your answer.");
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
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
            {videoUrl ? (
              <div>
                <p className="mb-2 text-sm font-medium">Latest recording preview</p>
                <video controls className="w-full rounded border" src={videoUrl} />
              </div>
            ) : null}
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
            {recorder.error ? <p className="text-sm text-destructive">{recorder.error}</p> : null}
            {permissionState !== "granted" ? <p className="text-sm text-destructive">Camera/mic permission is required to record.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleStart} disabled={permissionState !== "granted" || recorder.state !== "idle" || !recorder.canRecord} className="w-full">
              Start Recording
            </Button>
            <Button variant="outline" onClick={handlePauseResume} disabled={recorder.state === "idle"} className="w-full">
              {recorder.state === "paused" ? "Resume" : "Pause"}
            </Button>
            <Button variant="outline" onClick={() => void handleStop()} disabled={recorder.state === "idle"} className="w-full">
              Stop Recording
            </Button>
            <Button onClick={handleNext} className="w-full">
              {currentIndex === questions.length - 1 ? "Finish Interview" : "Next Question"}
            </Button>
            <Button variant="destructive" onClick={goToResults} className="w-full">
              End Interview
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
