import { useCallback, useMemo, useRef, useState } from "react";

type RecognitionState = "idle" | "listening" | "unsupported" | "error";

type SpeechCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
}

function resolveCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as Window & { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor }).SpeechRecognition
    ?? (window as Window & { webkitSpeechRecognition?: SpeechCtor }).webkitSpeechRecognition;
  return ctor ?? null;
}

export function useSpeechRecognition(preferredLang = "en-US") {
  const ctor = useMemo(() => resolveCtor(), []);
  const recognitionRef = useRef<InstanceType<SpeechCtor> | null>(null);
  const [state, setState] = useState<RecognitionState>(ctor ? "idle" : "unsupported");
  const [error, setError] = useState<string | null>(null);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    if (state !== "unsupported") {
      setState("idle");
    }
  }, [state]);

  const reset = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  const start = useCallback(() => {
    if (!ctor) {
      setState("unsupported");
      setError("Speech recognition is not supported in this browser.");
      return false;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new ctor();
    recognition.lang = preferredLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalChunk += transcript;
        } else {
          interimChunk += transcript;
        }
      }

      if (finalChunk) {
        setFinalTranscript((prev) => `${prev} ${finalChunk}`.trim());
      }
      setInterimTranscript(interimChunk.trim());
    };

    recognition.onerror = (event) => {
      setState("error");
      setError(event.error ? `Speech recognition error: ${event.error}` : "Speech recognition failed.");
    };

    recognition.onend = () => {
      setState((prev) => (prev === "unsupported" ? prev : "idle"));
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setError(null);
      setState("listening");
      return true;
    } catch {
      setState("error");
      setError("Unable to start speech recognition.");
      return false;
    }
  }, [ctor, preferredLang]);

  return {
    state,
    error,
    supported: Boolean(ctor),
    finalTranscript,
    interimTranscript,
    transcript: `${finalTranscript} ${interimTranscript}`.trim(),
    start,
    stop,
    reset
  };
}
