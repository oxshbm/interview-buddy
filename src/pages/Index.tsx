import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function IndexPage() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center p-6">
      <section className="grid w-full gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5 animate-fade-in">
          <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">Interview Buddy MVP</p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Practice technical and HR interviews with real interview flow.</h1>
          <p className="max-w-xl text-base text-muted-foreground md:text-lg">
            Set up your camera, answer timed questions, and get a structured performance report across speech, content, and body language.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button className="h-11 px-5" onClick={() => navigate("/setup")}>Start Interview</Button>
            <Button variant="outline" className="h-11 px-5">
              5 Questions · 12-15 min
            </Button>
          </div>
        </div>
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li>1. Choose interview type and enable camera + microphone.</li>
              <li>2. Record one answer per question with timer guidance.</li>
              <li>3. Review a deterministic analysis dashboard immediately.</li>
            </ol>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
