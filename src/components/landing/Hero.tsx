import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, Video, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-3xl mx-auto text-center animate-fade-in">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm text-muted-foreground mb-8">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          AI-Powered Interview Practice
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground mb-6 leading-tight">
          Practice interviews.
          <br />
          <span className="text-muted-foreground">Get real feedback.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10">
          Record your answers, receive AI analysis on your speech, content, and body language. 
          Improve with every session.
        </p>

        {/* CTA */}
        <Button
          size="lg"
          onClick={() => navigate("/setup")}
          className="h-14 px-8 text-lg font-medium group"
        >
          Start Interview
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* Feature Grid */}
      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <FeatureCard
          icon={<Mic className="h-6 w-6" />}
          title="AI Voice Questions"
          description="Questions read aloud by natural AI voice for realistic experience"
        />
        <FeatureCard
          icon={<Video className="h-6 w-6" />}
          title="Video Recording"
          description="See yourself as interviewers see you with live camera feed"
        />
        <FeatureCard
          icon={<BarChart3 className="h-6 w-6" />}
          title="Smart Analysis"
          description="Get detailed feedback on speech pace, content, and body language"
        />
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card hover:border-muted-foreground/20 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-foreground mb-4">
        {icon}
      </div>
      <h3 className="font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
