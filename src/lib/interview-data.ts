import type { InterviewQuestion, InterviewType } from "../types/interview";

const technical: InterviewQuestion[] = [
  {
    id: "t1",
    type: "technical",
    category: "System Design",
    prompt: "Design a URL shortener service handling 100M redirects/day.",
    timeLimitSec: 150
  },
  {
    id: "t2",
    type: "technical",
    category: "Problem Solving",
    prompt: "How would you optimize a slow SQL query used in a high-traffic endpoint?",
    timeLimitSec: 120
  },
  {
    id: "t3",
    type: "technical",
    category: "Code Quality",
    prompt: "Describe your approach to code reviews and maintaining clean architecture.",
    timeLimitSec: 120
  },
  {
    id: "t4",
    type: "technical",
    category: "Debugging",
    prompt: "Walk through a production incident you would triage under time pressure.",
    timeLimitSec: 150
  },
  {
    id: "t5",
    type: "technical",
    category: "Collaboration",
    prompt: "How do you align engineering tradeoffs with product deadlines?",
    timeLimitSec: 120
  }
];

const hr: InterviewQuestion[] = [
  {
    id: "h1",
    type: "hr",
    category: "Behavioral",
    prompt: "Tell me about yourself and what motivates you at work.",
    timeLimitSec: 120
  },
  {
    id: "h2",
    type: "hr",
    category: "Teamwork",
    prompt: "Describe a conflict in a team and how you resolved it.",
    timeLimitSec: 120
  },
  {
    id: "h3",
    type: "hr",
    category: "Ownership",
    prompt: "Share a time you took ownership beyond your formal role.",
    timeLimitSec: 150
  },
  {
    id: "h4",
    type: "hr",
    category: "Growth",
    prompt: "What is your biggest professional weakness and how are you improving it?",
    timeLimitSec: 120
  },
  {
    id: "h5",
    type: "hr",
    category: "Career Goals",
    prompt: "Where do you want your career to be in the next 3 years?",
    timeLimitSec: 120
  }
];

const questionBank: Record<InterviewType, InterviewQuestion[]> = {
  technical,
  hr
};

export function getQuestionsByType(type: InterviewType): InterviewQuestion[] {
  return questionBank[type].slice(0, 5);
}
