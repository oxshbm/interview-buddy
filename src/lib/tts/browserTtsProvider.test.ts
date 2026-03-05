import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cancelBrowserTts, speakWithBrowserTts } from "./browserTtsProvider";

class MockSpeechSynthesisUtterance {
  text: string;
  lang = "en-US";
  rate = 1;
  pitch = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: ((event: Event) => void) | null = null;
  onend: ((event: Event) => void) | null = null;
  onerror: ((event: { error?: string }) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

describe("browserTtsProvider", () => {
  const originalSpeechSynthesis = (globalThis as { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
  const originalUtterance = (globalThis as { SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance }).SpeechSynthesisUtterance;
  let speechSynthesisMock: {
    getVoices: ReturnType<typeof vi.fn>;
    speak: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();

    speechSynthesisMock = {
      getVoices: vi.fn(() => [{ name: "Default", lang: "en-US", default: true }]),
      speak: vi.fn(),
      cancel: vi.fn(),
      resume: vi.fn()
    };

    Object.defineProperty(globalThis, "speechSynthesis", {
      value: speechSynthesisMock,
      configurable: true,
      writable: true
    });

    Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
      value: MockSpeechSynthesisUtterance,
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    vi.useRealTimers();

    Object.defineProperty(globalThis, "speechSynthesis", {
      value: originalSpeechSynthesis,
      configurable: true,
      writable: true
    });

    Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
      value: originalUtterance,
      configurable: true,
      writable: true
    });
  });

  it("resolves when narration ends", async () => {
    speechSynthesisMock.speak.mockImplementation((utterance: MockSpeechSynthesisUtterance) => {
      window.setTimeout(() => utterance.onstart?.(new Event("start")), 1);
      window.setTimeout(() => utterance.onend?.(new Event("end")), 5);
    });

    const promise = speakWithBrowserTts("hello");
    await vi.advanceTimersByTimeAsync(10);

    await expect(promise).resolves.toEqual({ localeResolved: "en-US" });
  });

  it("rejects if narration never emits terminal events", async () => {
    speechSynthesisMock.speak.mockImplementation(() => {});

    const promise = speakWithBrowserTts("hello");
    const rejection = expect(promise).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(10_001);
    await rejection;
  });

  it("cancel settles an in-flight narration", async () => {
    speechSynthesisMock.speak.mockImplementation(() => {});

    const promise = speakWithBrowserTts("hello");
    const rejection = expect(promise).rejects.toThrow("canceled");
    cancelBrowserTts();

    await rejection;
    expect(speechSynthesisMock.cancel).toHaveBeenCalled();
  });
});
