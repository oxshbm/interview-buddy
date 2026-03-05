import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { buildInterviewReport } from "../lib/scoring";
import { clearSessionState, readSessionState } from "../lib/storage";
import type { ResultsRouteState } from "../types/interview";

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location.state as ResultsRouteState | null;
  const state = routeState ?? readSessionState();

  if (!state) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">No interview data found</h1>
        <p className="text-muted-foreground">Start a new interview to generate your analysis report.</p>
        <Button onClick={() => navigate("/setup")}>Go to Setup</Button>
      </main>
    );
  }

  const report = state.aiReport ?? buildInterviewReport(state);

  return (
    <main className="mx-auto w-full max-w-6xl p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Interview Results</p>
          <h1 className="text-3xl font-semibold">Overall Score: {report.overallScore}/100 ({report.grade})</h1>
          <p className="text-sm text-muted-foreground">Answered {state.answeredQuestions} of {state.totalQuestions} questions</p>
        </div>
        <Button
          onClick={() => {
            clearSessionState();
            navigate("/setup");
          }}
        >
          Start New Interview
        </Button>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Speech & Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-2xl font-semibold">{report.categoryBreakdown.speech}</p>
            <Progress value={report.categoryBreakdown.speech} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Content Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-2xl font-semibold">{report.categoryBreakdown.content}</p>
            <Progress value={report.categoryBreakdown.content} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Body Language</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-2xl font-semibold">{report.categoryBreakdown.bodyLanguage}</p>
            <Progress value={report.categoryBreakdown.bodyLanguage} />
          </CardContent>
        </Card>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recording Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Total recording duration: {state.recording?.durationSec ?? 0}s</p>
            <p>Question timeline segments: {state.timeline.length}</p>
            <p>TTS provider: {state.tts.provider}</p>
            <p>TTS fallback used: {state.tts.fallbackUsed ? "Yes" : "No"}</p>
            {state.aiSummary ? <p>AI summary: {state.aiSummary}</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Areas to Improve</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {report.improvements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {report.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.questionScores.map((item) => (
              <div key={item.questionId} className="rounded-md border p-3">
                <p className="text-sm font-semibold">{item.questionId.toUpperCase()} · Overall {item.overall}</p>
                <p className="text-sm text-muted-foreground">{item.questionText}</p>
                <p className="text-sm text-muted-foreground">Speech {item.speechScore} · Content {item.contentScore} · Body Language {item.bodyLanguageScore}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {state.transcript?.length ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Conversation Transcript</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.transcript.map((turn) => (
              <div key={turn.questionId} className="rounded-md border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{turn.category}{turn.isFollowUp ? " · Follow-up" : ""}</p>
                <p className="text-sm font-medium">{turn.questionText}</p>
                <p className="mt-1 text-sm text-muted-foreground">{turn.answerText}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
