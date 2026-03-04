import { useMemo, useRef, useState } from "react";

type RecorderState = "idle" | "recording" | "paused";

interface StopResult {
  blob: Blob;
  mimeType: string;
  durationSec: number;
  startedAt: string;
  endedAt: string;
  pauseCount: number;
}

export function useMediaRecorder(stream: MediaStream | null) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const pausedTotalMsRef = useRef(0);
  const pauseCountRef = useRef(0);
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);

  const mimeType = useMemo(() => {
    if (typeof MediaRecorder === "undefined") return null;
    const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
  }, []);

  const canRecord = Boolean(stream && mimeType && typeof MediaRecorder !== "undefined");

  const start = () => {
    if (!stream || !mimeType) {
      setError("Recording is not supported on this browser/device.");
      return false;
    }

    setError(null);
    chunksRef.current = [];
    pausedTotalMsRef.current = 0;
    pauseCountRef.current = 0;
    startedAtRef.current = Date.now();

    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.start();
    recorderRef.current = recorder;
    setState("recording");
    return true;
  };

  const pause = () => {
    if (!recorderRef.current || state !== "recording") return;
    recorderRef.current.pause();
    pausedAtRef.current = Date.now();
    pauseCountRef.current += 1;
    setState("paused");
  };

  const resume = () => {
    if (!recorderRef.current || state !== "paused") return;
    recorderRef.current.resume();
    if (pausedAtRef.current) {
      pausedTotalMsRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
    setState("recording");
  };

  const stop = async (): Promise<StopResult | null> => {
    const recorder = recorderRef.current;
    if (!recorder || (state !== "recording" && state !== "paused")) return null;

    if (state === "paused") {
      resume();
    }

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    const endedAt = Date.now();
    const startedAt = startedAtRef.current ?? endedAt;
    const elapsedMs = Math.max(endedAt - startedAt - pausedTotalMsRef.current, 0);
    const blob = new Blob(chunksRef.current, { type: mimeType ?? "video/webm" });

    recorderRef.current = null;
    setState("idle");

    return {
      blob,
      mimeType: mimeType ?? "video/webm",
      durationSec: Math.round(elapsedMs / 1000),
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      pauseCount: pauseCountRef.current
    };
  };

  return {
    state,
    error,
    canRecord,
    start,
    pause,
    resume,
    stop
  };
}
