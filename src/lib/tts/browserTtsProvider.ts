export interface SpeechSynthesisVoiceInfo {
  name: string;
  lang: string;
  default: boolean;
}

const BROWSER_TTS_TIMEOUT_MS = 10_000;
const DEBUG_TTS = import.meta.env.DEV;

let activeSpeakCancel: (() => void) | null = null;

function debugLog(message: string, payload?: unknown) {
  if (!DEBUG_TTS) return;
  if (typeof payload === "undefined") {
    console.debug(`[tts] ${message}`);
    return;
  }
  console.debug(`[tts] ${message}`, payload);
}

function selectVoice(voices: SpeechSynthesisVoice[], preferredLang: string): SpeechSynthesisVoice | null {
  const exact = voices.find((voice) => voice.lang.toLowerCase() === preferredLang.toLowerCase());
  if (exact) return exact;

  const english = voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
  if (english) return english;

  return voices[0] ?? null;
}

export function isBrowserTtsAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

export function listBrowserVoices(): SpeechSynthesisVoiceInfo[] {
  if (!isBrowserTtsAvailable()) return [];
  return window.speechSynthesis.getVoices().map((voice) => ({
    name: voice.name,
    lang: voice.lang,
    default: voice.default
  }));
}

export function speakWithBrowserTts(
  text: string,
  options?: { lang?: string; rate?: number; pitch?: number }
): Promise<{ localeResolved: string | null }> {
  return new Promise((resolve, reject) => {
    if (!isBrowserTtsAvailable()) {
      reject(new Error("Browser speech synthesis is not available."));
      return;
    }

    if (activeSpeakCancel) {
      activeSpeakCancel();
      activeSpeakCancel = null;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.lang ?? "en-US";
    utterance.rate = options?.rate ?? 1;
    utterance.pitch = options?.pitch ?? 1;

    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = selectVoice(voices, utterance.lang);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    let settled = false;
    const timerId = window.setTimeout(() => {
      finalizeReject(new Error("Question narration timed out."));
      window.speechSynthesis.cancel();
      debugLog("Narration timed out.");
    }, BROWSER_TTS_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timerId);
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onerror = null;
      if (activeSpeakCancel === cancelActiveNarration) {
        activeSpeakCancel = null;
      }
    };

    const finalizeResolve = (value: { localeResolved: string | null }) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const finalizeReject = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const cancelActiveNarration = () => {
      if (settled) return;
      window.speechSynthesis.cancel();
      finalizeReject(new Error("Question narration was canceled."));
      debugLog("Narration canceled.");
    };

    activeSpeakCancel = cancelActiveNarration;

    utterance.onstart = () => {
      debugLog("Narration started.", { lang: utterance.lang, voice: selectedVoice?.name ?? null });
    };

    utterance.onend = () => {
      debugLog("Narration completed.");
      finalizeResolve({ localeResolved: selectedVoice?.lang ?? utterance.lang ?? null });
    };

    utterance.onerror = (event) => {
      const errorType = "error" in event ? event.error : "unknown";
      debugLog("Narration failed.", { errorType });
      finalizeReject(new Error("Unable to play question narration."));
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    debugLog("Narration queued.", { lang: utterance.lang, voiceCount: voices.length });

    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      const cause = error instanceof Error ? error.message : "unknown error";
      finalizeReject(new Error(`Unable to play question narration: ${cause}`));
    }
  });
}

export function cancelBrowserTts(): void {
  if (!isBrowserTtsAvailable()) return;
  if (activeSpeakCancel) {
    activeSpeakCancel();
    return;
  }
  window.speechSynthesis.cancel();
}
