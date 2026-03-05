import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
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
    <main className="relative min-h-screen w-full overflow-hidden px-4 py-5 md:px-8 md:py-8">
      <section className="relative flex min-h-[calc(100vh-3rem)] w-full items-center justify-center rounded-2xl border border-white/60 bg-slate-900/95 shadow-2xl">
        <div className="absolute left-4 top-4 z-20 max-w-xl rounded-xl border border-white/20 bg-slate-950/75 p-4 text-slate-200 backdrop-blur sm:left-6 sm:top-6">
          <p className="text-xs uppercase tracking-wide text-slate-300">Interview Setup</p>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">Configure your session before entering the live interview.</h1>
          <p className="mt-2 text-sm text-slate-300">Choose a mode, enable camera/microphone, and start when everything is ready.</p>
        </div>

        <div className="ai-stage-breath relative z-10 flex h-52 w-52 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-cyan-300 to-blue-500 shadow-[0_0_60px_rgba(34,211,238,0.35)] sm:h-72 sm:w-72 md:h-80 md:w-80">
          <div className="flex h-[86%] w-[86%] items-center justify-center rounded-full bg-slate-950/25">
            <span className="text-lg font-semibold tracking-[0.28em] text-white sm:text-xl">AI</span>
          </div>
        </div>

        <div className="absolute left-4 top-36 z-30 w-36 overflow-hidden rounded-xl border border-white/35 bg-slate-950 shadow-xl sm:left-6 sm:w-44 md:w-52">
          <div className="aspect-video bg-slate-900">
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          </div>
          <p className="truncate px-2 py-1 text-center text-xs font-medium text-slate-100">Camera Preview</p>
        </div>

        <aside className="absolute bottom-5 left-4 right-4 z-40 rounded-2xl border border-white/20 bg-slate-950/80 p-4 text-slate-200 backdrop-blur lg:bottom-4 lg:left-auto lg:right-4 lg:top-4 lg:w-[24rem] lg:p-5">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-white">1. Choose interview mode</p>
              <div className="mt-3 space-y-3">
                <button
                  className={`w-full rounded-xl border p-4 text-left transition ${interviewType === "technical" ? "border-sky-300 bg-sky-500/20 text-white" : "border-white/20 bg-slate-900/70 text-slate-100 hover:bg-slate-900"}`}
                  onClick={() => setInterviewType("technical")}
                >
                  <p className="font-medium">Technical Interview</p>
                  <p className="mt-1 text-xs text-slate-300">System design, debugging, code quality, engineering tradeoffs</p>
                </button>
                <button
                  className={`w-full rounded-xl border p-4 text-left transition ${interviewType === "hr" ? "border-sky-300 bg-sky-500/20 text-white" : "border-white/20 bg-slate-900/70 text-slate-100 hover:bg-slate-900"}`}
                  onClick={() => setInterviewType("hr")}
                >
                  <p className="font-medium">General HR Interview</p>
                  <p className="mt-1 text-xs text-slate-300">Behavioral questions, collaboration, communication, growth</p>
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">2. Camera and microphone</p>
              <p className="mt-2 text-xs text-slate-300">
                Status: <span className="font-medium capitalize text-slate-100">{state === "idle" ? "Not checked" : state}</span>
              </p>
              {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={requestPermissions} disabled={state === "requesting"}>
                  {state === "requesting" ? "Requesting..." : "Enable Camera & Mic"}
                </Button>
                <Button variant="outline" onClick={stopStream} className="border-white/30 bg-transparent text-slate-100 hover:bg-slate-900">
                  Reset Device
                </Button>
              </div>
            </div>

            <Button onClick={startInterview} disabled={!canStart} className="h-11 w-full rounded-full">
              Start Interview
            </Button>
          </div>
        </aside>
      </section>
    </main>
  );
}
