export interface SpeechSynthesisVoiceInfo {
  name: string;
  lang: string;
  default: boolean;
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

    utterance.onend = () => {
      resolve({ localeResolved: selectedVoice?.lang ?? utterance.lang ?? null });
    };

    utterance.onerror = () => {
      reject(new Error("Unable to play question narration."));
    };

    window.speechSynthesis.speak(utterance);
  });
}

export function cancelBrowserTts(): void {
  if (!isBrowserTtsAvailable()) return;
  window.speechSynthesis.cancel();
}
