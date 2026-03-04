import { describe, expect, it } from "vitest";
import { createTtsService } from "./ttsService";

describe("ttsService", () => {
  it("returns unavailable self-hosted service in phase 2", async () => {
    const service = createTtsService("self_hosted");
    expect(service.isAvailable()).toBe(false);
    await expect(service.speak("hello")).rejects.toThrow();
  });
});
