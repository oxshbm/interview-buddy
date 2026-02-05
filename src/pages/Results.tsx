import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Home, 
  RotateCcw, 
  Mic, 
  FileText, 
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface RecordedResponse {
  questionId: string;
  question: string;
  videoBlob: Blob | null;
  duration: number;
}

// Mock analysis results - in production, this would come from AI analysis
const generateMockAnalysis = (responses: RecordedResponse[]) => {
  return {
    overall: {
      score: 72,
      grade: "B",
    },
    categories: {
      speech: {
        score: 68,
        label: "Speech & Delivery",
        feedback: "Good pace overall. Work on reducing filler words.",
        details: [
          { label: "Speaking Pace", score: 75, status: "good" as const },
          { label: "Filler Words", score: 55, status: "needs-work" as const },
          { label: "Clarity", score: 72, status: "good" as const },
        ],
      },
      content: {
        score: 78,
        label: "Content Quality",
        feedback: "Strong structure. Could include more specific examples.",
        details: [
          { label: "Relevance", score: 82, status: "good" as const },
          { label: "Structure", score: 80, status: "good" as const },
          { label: "Examples", score: 65, status: "needs-work" as const },
        ],
      },
      body: {
        score: 70,
        label: "Body Language",
        feedback: "Maintain more consistent eye contact with the camera.",
        details: [
          { label: "Eye Contact", score: 60, status: "needs-work" as const },
          { label: "Posture", score: 78, status: "good" as const },
          { label: "Expressions", score: 72, status: "good" as const },
        ],
      },
    },
    strengths: [
      "Clear and organized responses",
      "Good use of the STAR method",
      "Confident body language",
    ],
    improvements: [
      "Reduce use of filler words (um, uh, like)",
      "Maintain eye contact with the camera",
      "Include more specific examples and metrics",
    ],
    questionFeedback: responses.map((r, i) => ({
      question: r.question,
      duration: r.duration,
      score: 65 + Math.floor(Math.random() * 25),
      feedback: i % 2 === 0 
        ? "Good structure, but could use more specific examples."
        : "Strong response with clear examples. Watch speaking pace.",
    })),
  };
};

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { responses = [], interviewType = "technical" } = location.state || {};

  const analysis = generateMockAnalysis(responses);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getStatusIcon = (status: "good" | "needs-work") => {
    if (status === "good") return <TrendingUp className="h-4 w-4 text-success" />;
    return <TrendingDown className="h-4 w-4 text-warning" />;
  };

  return (
    <main className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold mb-2">Interview Complete!</h1>
          <p className="text-muted-foreground">
            Here's your performance analysis for the {interviewType === "technical" ? "Technical" : "HR"} interview
          </p>
        </div>

        {/* Overall Score */}
        <Card className="mb-8">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-bold ${getScoreColor(analysis.overall.score)}`}>
                    {analysis.overall.score}
                  </span>
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
              </div>
              
              <div className="flex gap-6">
                {Object.entries(analysis.categories).map(([key, cat]) => (
                  <div key={key} className="text-center">
                    <div className={`text-2xl font-semibold ${getScoreColor(cat.score)}`}>
                      {cat.score}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{cat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="speech">
              <Mic className="h-4 w-4 mr-2" />
              Speech
            </TabsTrigger>
            <TabsTrigger value="content">
              <FileText className="h-4 w-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="body">
              <Eye className="h-4 w-4 mr-2" />
              Body Language
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysis.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-success mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Areas for Improvement */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysis.improvements.map((improvement, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-warning mt-1">•</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Question by Question */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Question-by-Question Breakdown</CardTitle>
                <CardDescription>Feedback for each of your responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.questionFeedback.map((qf, i) => (
                    <div key={i} className="p-4 rounded-lg bg-secondary/50">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className="font-medium text-sm">Q{i + 1}: {qf.question}</p>
                        <span className={`text-sm font-semibold ${getScoreColor(qf.score)}`}>
                          {qf.score}/100
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{qf.feedback}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {["speech", "content", "body"].map((category) => (
            <TabsContent key={category} value={category} className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {analysis.categories[category as keyof typeof analysis.categories].label}
                  </CardTitle>
                  <CardDescription>
                    {analysis.categories[category as keyof typeof analysis.categories].feedback}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {analysis.categories[category as keyof typeof analysis.categories].details.map((detail, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(detail.status)}
                            <span className="text-sm font-medium">{detail.label}</span>
                          </div>
                          <span className={`text-sm font-semibold ${getScoreColor(detail.score)}`}>
                            {detail.score}/100
                          </span>
                        </div>
                        <Progress value={detail.score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" onClick={() => navigate("/setup")}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Practice Again
          </Button>
          <Button onClick={() => navigate("/")}>
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </main>
  );
}
