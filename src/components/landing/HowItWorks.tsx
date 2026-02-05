import { Settings, Play, LineChart } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: <Settings className="h-6 w-6" />,
    title: "Choose interview type",
    description: "Select Technical or HR interview and check your camera/microphone settings",
  },
  {
    number: "02",
    icon: <Play className="h-6 w-6" />,
    title: "Answer questions",
    description: "AI reads each question aloud. Record your response within the time limit",
  },
  {
    number: "03",
    icon: <LineChart className="h-6 w-6" />,
    title: "Review your results",
    description: "Get detailed analysis on speech, content quality, and body language",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-16">
          How it works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="relative inline-block mb-6">
                <div className="w-16 h-16 rounded-full bg-background border-2 border-border flex items-center justify-center">
                  {step.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-foreground text-background text-sm font-medium flex items-center justify-center">
                  {step.number}
                </span>
              </div>
              <h3 className="font-medium text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
