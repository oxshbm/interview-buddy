import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Camera, Mic, CheckCircle2, XCircle, Code, Users } from "lucide-react";
import { interviewConfigs, InterviewType } from "@/lib/interview-data";

export default function Setup() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<InterviewType>("technical");
  const [cameraPermission, setCameraPermission] = useState<"pending" | "granted" | "denied">("pending");
  const [micPermission, setMicPermission] = useState<"pending" | "granted" | "denied">("pending");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkPermissions();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraPermission("granted");
      setMicPermission("granted");
    } catch (error) {
      console.error("Permission error:", error);
      setCameraPermission("denied");
      setMicPermission("denied");
    }
  };

  const config = interviewConfigs[selectedType];
  const canProceed = cameraPermission === "granted" && micPermission === "granted";

  const handleStart = () => {
    // Stop preview stream before navigating
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    navigate("/interview", { state: { interviewType: selectedType } });
  };

  return (
    <main className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-3xl font-semibold mb-2">Set up your interview</h1>
        <p className="text-muted-foreground mb-10">
          Choose your interview type and verify your camera and microphone are working.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Interview type selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interview Type</CardTitle>
                <CardDescription>Select the type of interview you want to practice</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as InterviewType)}
                  className="space-y-4"
                >
                  <Label
                    htmlFor="technical"
                    className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedType === "technical"
                        ? "border-foreground bg-secondary"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <RadioGroupItem value="technical" id="technical" className="mt-1" />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        <span className="font-medium">Technical Interview</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Coding, system design, and problem-solving questions
                      </p>
                    </div>
                  </Label>

                  <Label
                    htmlFor="hr"
                    className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedType === "hr"
                        ? "border-foreground bg-secondary"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <RadioGroupItem value="hr" id="hr" className="mt-1" />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">General HR</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Behavioral and situational questions
                      </p>
                    </div>
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Interview details */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-2xl font-semibold">{config.questionCount}</p>
                    <p className="text-sm text-muted-foreground">Questions</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-2xl font-semibold">{config.duration}</p>
                    <p className="text-sm text-muted-foreground">Duration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Camera preview and permissions */}
          <div className="space-y-6">
            {/* Camera preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Camera Preview</CardTitle>
                <CardDescription>Make sure you're visible and well-lit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                  {cameraPermission === "granted" ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {cameraPermission === "pending"
                            ? "Requesting camera access..."
                            : "Camera access denied"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Permission status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <PermissionItem
                  icon={<Camera className="h-4 w-4" />}
                  label="Camera"
                  status={cameraPermission}
                />
                <PermissionItem
                  icon={<Mic className="h-4 w-4" />}
                  label="Microphone"
                  status={micPermission}
                />

                {!canProceed && (
                  <Button onClick={checkPermissions} variant="outline" className="w-full mt-4">
                    Request Permissions
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Start button */}
        <div className="mt-10 flex justify-end">
          <Button
            size="lg"
            onClick={handleStart}
            disabled={!canProceed}
            className="h-12 px-8"
          >
            Start Interview
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </main>
  );
}

function PermissionItem({
  icon,
  label,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  status: "pending" | "granted" | "denied";
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      {status === "granted" ? (
        <CheckCircle2 className="h-5 w-5 text-success" />
      ) : status === "denied" ? (
        <XCircle className="h-5 w-5 text-destructive" />
      ) : (
        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
      )}
    </div>
  );
}
