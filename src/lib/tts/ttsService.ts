import { cancelBrowserTts, isBrowserTtsAvailable, listBrowserVoices, speakWithBrowserTts } from "./browserTtsProvider";
import type { TtsProvider } from "../../types/interview";

export interface TtsSpeakResult {
  localeResolved: string | null;
}

export interface TtsService {
  provider: TtsProvider;
  isAvailable: () => boolean;
  getVoices: () => Array<{ name: string; lang: string; default: boolean }>;
  speak: (text: string, options?: { lang?: string; rate?: number; pitch?: number }) => Promise<TtsSpeakResult>;
  cancel: () => void;
}

export function createTtsService(provider: TtsProvider = "browser"): TtsService {
  if (provider === "self_hosted") {
    return {
      provider,
      isAvailable: () => false,
      getVoices: () => [],
      speak: async () => {
        throw new Error("Self-hosted TTS is not configured in this phase.");
      },
      cancel: () => {}
    };
  }

  return {
    provider: "browser",
    isAvailable: isBrowserTtsAvailable,
    getVoices: listBrowserVoices,
    speak: speakWithBrowserTts,
    cancel: cancelBrowserTts
  };
}
