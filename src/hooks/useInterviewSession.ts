import { useMemo, useState } from "react";
import type { InterviewQuestion } from "../types/interview";

export function useInterviewSession(questions: InterviewQuestion[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState(questions[0]?.timeLimitSec ?? 120);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    return ((currentIndex + 1) / questions.length) * 100;
  }, [currentIndex, questions.length]);

  const goToNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) return false;
    setCurrentIndex(nextIndex);
    setTimeLeftSec(questions[nextIndex].timeLimitSec);
    return true;
  };

  const resetTimerToCurrent = () => {
    setTimeLeftSec(currentQuestion?.timeLimitSec ?? 120);
  };

  return {
    currentIndex,
    currentQuestion,
    isLastQuestion,
    timeLeftSec,
    setTimeLeftSec,
    progress,
    goToNext,
    resetTimerToCurrent
  };
}
