import { useMemo, useState } from "react";
import { createTtsService } from "../lib/tts/ttsService";
import type { TtsProvider } from "../types/interview";

type NarrationState = "idle" | "narrating" | "error";

export function useQuestionNarration(provider: TtsProvider = "browser", preferredLang = "en-US") {
  const service = useMemo(() => createTtsService(provider), [provider]);
  const [state, setState] = useState<NarrationState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [localeResolved, setLocaleResolved] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  const speak = async (text: string): Promise<boolean> => {
    if (!service.isAvailable()) {
      setState("idle");
      setError("TTS unavailable. Continuing in text-only mode.");
      setFallbackUsed(true);
      return false;
    }

    setState("narrating");
    setError(null);
    try {
      const result = await service.speak(text, { lang: preferredLang, rate: 1, pitch: 1 });
      setLocaleResolved(result.localeResolved);
      setState("idle");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      setState("idle");
      if (message.includes("timed out")) {
        setError("Narration timed out. Continuing in text-only mode.");
      } else if (message.includes("not allowed")) {
        setError("Narration is blocked by browser autoplay policy. Continuing in text-only mode.");
      } else {
        setError("Unable to narrate this question. Continuing in text-only mode.");
      }
      setFallbackUsed(true);
      return false;
    }
  };

  const cancel = () => {
    service.cancel();
    setState("idle");
    setError(null);
  };

  return {
    provider: service.provider,
    available: service.isAvailable(),
    state,
    error,
    localeRequested: preferredLang,
    localeResolved,
    fallbackUsed,
    speak,
    cancel
  };
}
