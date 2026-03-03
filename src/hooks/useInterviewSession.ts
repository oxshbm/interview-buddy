import { useMemo, useState } from "react";
import type { InterviewQuestion, ResponseMeta } from "../types/interview";

export function useInterviewSession(questions: InterviewQuestion[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responsesMeta, setResponsesMeta] = useState<ResponseMeta[]>([]);
  const [timeLeftSec, setTimeLeftSec] = useState(questions[0]?.timeLimitSec ?? 120);

  const currentQuestion = questions[currentIndex];
  const progress = useMemo(() => ((currentIndex + 1) / Math.max(questions.length, 1)) * 100, [currentIndex, questions.length]);

  const saveResponseMeta = (meta: ResponseMeta) => {
    setResponsesMeta((prev) => {
      const exists = prev.some((r) => r.questionId === meta.questionId);
      if (exists) return prev.map((item) => (item.questionId === meta.questionId ? meta : item));
      return [...prev, meta];
    });
  };

  const goToNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) return false;
    setCurrentIndex(nextIndex);
    setTimeLeftSec(questions[nextIndex].timeLimitSec);
    return true;
  };

  const resetTimer = () => setTimeLeftSec(currentQuestion?.timeLimitSec ?? 120);

  return {
    currentIndex,
    currentQuestion,
    responsesMeta,
    timeLeftSec,
    setTimeLeftSec,
    progress,
    saveResponseMeta,
    goToNext,
    resetTimer
  };
}
