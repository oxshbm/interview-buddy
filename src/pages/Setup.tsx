import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useMediaPermissions } from "../hooks/useMediaPermissions";
import type { InterviewType } from "../types/interview";

export default function SetupPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [interviewType, setInterviewType] = useState<InterviewType | null>(null);
  const { state, stream, error, requestPermissions, stopStream } = useMediaPermissions();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => stopStream, [stopStream]);

  const canStart = useMemo(() => interviewType && state === "granted", [interviewType, state]);

  const startInterview = () => {
    if (!canStart || !interviewType) return;
    navigate("/interview", { state: { interviewType } });
  };

  return (
    <main className="mx-auto w-full max-w-5xl p-6 md:p-8">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold">Interview Setup</h1>
        <p className="text-muted-foreground">Select interview type and verify your camera + microphone before starting.</p>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1. Choose interview mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              className={`w-full rounded-md border p-4 text-left transition ${interviewType === "technical" ? "border-primary bg-sky-50" : "bg-white"}`}
              onClick={() => setInterviewType("technical")}
            >
              <p className="font-medium">Technical Interview</p>
              <p className="text-sm text-muted-foreground">System design, debugging, code quality, engineering tradeoffs</p>
            </button>
            <button
              className={`w-full rounded-md border p-4 text-left transition ${interviewType === "hr" ? "border-primary bg-sky-50" : "bg-white"}`}
              onClick={() => setInterviewType("hr")}
            >
              <p className="font-medium">General HR Interview</p>
              <p className="text-sm text-muted-foreground">Behavioral questions, collaboration, communication, growth</p>
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Camera and Microphone Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-md border bg-slate-900">
              <video ref={videoRef} autoPlay muted playsInline className="h-56 w-full object-cover" />
            </div>
            <div className="text-sm">
              <p>
                Status:{" "}
                <span className="font-medium capitalize">
                  {state === "idle" ? "Not checked" : state}
                </span>
              </p>
              {error ? <p className="mt-1 text-destructive">{error}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={requestPermissions} disabled={state === "requesting"}>
                {state === "requesting" ? "Requesting..." : "Enable Camera & Mic"}
              </Button>
              <Button variant="outline" onClick={stopStream}>Reset Device</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="mt-6 flex justify-end">
        <Button onClick={startInterview} disabled={!canStart} className="h-11 px-6">
          Start Interview
        </Button>
      </div>
    </main>
  );
}
