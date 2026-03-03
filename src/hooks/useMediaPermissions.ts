import { useCallback, useEffect, useState } from "react";

type PermissionState = "idle" | "requesting" | "granted" | "denied" | "unsupported";

export function useMediaPermissions() {
  const [state, setState] = useState<PermissionState>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      setError("Media devices are not supported in this browser.");
      return;
    }

    setState("requesting");
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      setState("granted");
    } catch {
      setState("denied");
      setError("Camera or microphone access was denied. Update browser permissions and retry.");
    }
  }, []);

  const stopStream = useCallback(() => {
    setStream((activeStream) => {
      activeStream?.getTracks().forEach((track) => track.stop());
      return null;
    });
  }, []);

  useEffect(() => stopStream, [stopStream]);

  return {
    state,
    stream,
    error,
    requestPermissions,
    stopStream
  };
}
