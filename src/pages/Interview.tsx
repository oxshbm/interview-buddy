import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  SkipForward, 
  Square, 
  Clock, 
  Video,
  VideoOff,
  Mic,
  MicOff
} from "lucide-react";
import { interviewConfigs, InterviewType, InterviewQuestion } from "@/lib/interview-data";

interface RecordedResponse {
  questionId: string;
  question: string;
  videoBlob: Blob | null;
  duration: number;
}

export default function Interview() {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewType = (location.state?.interviewType as InterviewType) || "technical";
  
  const config = interviewConfigs[interviewType];
  const questions = config.questions;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questions[0].timeLimit);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [responses, setResponses] = useState<RecordedResponse[]>([]);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    initializeMedia();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNextQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused, currentQuestionIndex]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Failed to initialize media:", error);
    }
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    startTimeRef.current = Date.now();

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm;codecs=vp9",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback((): Blob | null => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return null;
    }

    mediaRecorderRef.current.stop();
    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    return blob;
  }, []);

  const handleStartRecording = () => {
    startRecording();
  };

  const handlePauseResume = () => {
    if (isPaused) {
      mediaRecorderRef.current?.resume();
    } else {
      mediaRecorderRef.current?.pause();
    }
    setIsPaused(!isPaused);
  };

  const handleNextQuestion = useCallback(() => {
    const videoBlob = stopRecording();
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    const response: RecordedResponse = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      videoBlob,
      duration,
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setTimeLeft(questions[nextIndex].timeLimit);
      setIsRecording(false);
      setIsPaused(false);
    } else {
      // Interview complete
      handleEndInterview(newResponses);
    }
  }, [currentQuestion, currentQuestionIndex, questions, responses, stopRecording]);

  const handleEndInterview = (finalResponses: RecordedResponse[]) => {
    cleanup();
    navigate("/results", { 
      state: { 
        responses: finalResponses,
        interviewType,
        totalQuestions: questions.length,
      } 
    });
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">{config.title}</p>
            <p className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => handleEndInterview(responses)}
          >
            <Square className="mr-2 h-4 w-4" />
            End Interview
          </Button>
        </div>

        {/* Progress bar */}
        <Progress value={progress} className="h-2 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video preview - takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                
                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-sm">
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    REC
                  </div>
                )}

                {/* Timer */}
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur text-sm font-mono">
                  <Clock className="h-4 w-4" />
                  {formatTime(timeLeft)}
                </div>

                {/* Controls overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={toggleCamera}
                    className="rounded-full h-12 w-12"
                  >
                    {cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={toggleMic}
                    className="rounded-full h-12 w-12"
                  >
                    {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Question panel */}
          <div className="space-y-4">
            <Card className="p-6">
              <div className="mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {currentQuestion.category}
                </span>
              </div>
              <p className="text-lg font-medium leading-relaxed">
                {currentQuestion.question}
              </p>
            </Card>

            {/* Action buttons */}
            <div className="space-y-3">
              {!isRecording ? (
                <Button 
                  className="w-full h-12" 
                  onClick={handleStartRecording}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Recording
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full h-12"
                    onClick={handlePauseResume}
                  >
                    {isPaused ? (
                      <>
                        <Play className="mr-2 h-5 w-5" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="mr-2 h-5 w-5" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button 
                    className="w-full h-12" 
                    onClick={handleNextQuestion}
                  >
                    <SkipForward className="mr-2 h-5 w-5" />
                    {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Interview"}
                  </Button>
                </>
              )}
            </div>

            {/* Time info */}
            <p className="text-sm text-muted-foreground text-center">
              Time limit: {formatTime(currentQuestion.timeLimit)}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
