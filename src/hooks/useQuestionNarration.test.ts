import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createTtsService } from "../lib/tts/ttsService";
import { useQuestionNarration } from "./useQuestionNarration";

vi.mock("../lib/tts/ttsService", () => ({
  createTtsService: vi.fn()
}));

describe("useQuestionNarration", () => {
  it("falls back and resets to idle when narration times out", async () => {
    const speak = vi.fn().mockRejectedValue(new Error("Question narration timed out."));
    vi.mocked(createTtsService).mockReturnValue({
      provider: "browser",
      isAvailable: () => true,
      getVoices: () => [],
      speak,
      cancel: vi.fn()
    });

    const { result } = renderHook(() => useQuestionNarration("browser", "en-US"));

    let spoken = true;
    await act(async () => {
      spoken = await result.current.speak("Question");
    });

    expect(spoken).toBe(false);
    expect(result.current.state).toBe("idle");
    expect(result.current.fallbackUsed).toBe(true);
    expect(result.current.error).toBe("Narration timed out. Continuing in text-only mode.");
  });

  it("returns false immediately if provider is unavailable", async () => {
    const speak = vi.fn();
    vi.mocked(createTtsService).mockReturnValue({
      provider: "browser",
      isAvailable: () => false,
      getVoices: () => [],
      speak,
      cancel: vi.fn()
    });

    const { result } = renderHook(() => useQuestionNarration("browser", "en-US"));

    let spoken = true;
    await act(async () => {
      spoken = await result.current.speak("Question");
    });

    expect(spoken).toBe(false);
    expect(speak).not.toHaveBeenCalled();
    expect(result.current.state).toBe("idle");
    expect(result.current.fallbackUsed).toBe(true);
    expect(result.current.error).toBe("TTS unavailable. Continuing in text-only mode.");
  });
});
