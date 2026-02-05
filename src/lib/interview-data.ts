export type InterviewType = "technical" | "hr";

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  timeLimit: number; // in seconds
}

export interface InterviewConfig {
  type: InterviewType;
  title: string;
  description: string;
  duration: string;
  questionCount: number;
  questions: InterviewQuestion[];
}

export const technicalQuestions: InterviewQuestion[] = [
  {
    id: "tech-1",
    question: "Tell me about a challenging technical problem you solved recently and walk me through your approach.",
    category: "Problem Solving",
    timeLimit: 120,
  },
  {
    id: "tech-2",
    question: "Explain the concept of time complexity and give an example of when you optimized code for better performance.",
    category: "Technical Knowledge",
    timeLimit: 90,
  },
  {
    id: "tech-3",
    question: "How would you design a system to handle millions of requests per second?",
    category: "System Design",
    timeLimit: 180,
  },
  {
    id: "tech-4",
    question: "Describe your experience with version control. How do you handle merge conflicts?",
    category: "Development Practices",
    timeLimit: 90,
  },
  {
    id: "tech-5",
    question: "What testing strategies do you use to ensure code quality?",
    category: "Quality Assurance",
    timeLimit: 90,
  },
];

export const hrQuestions: InterviewQuestion[] = [
  {
    id: "hr-1",
    question: "Tell me about yourself and why you're interested in this role.",
    category: "Introduction",
    timeLimit: 90,
  },
  {
    id: "hr-2",
    question: "Describe a situation where you had to work with a difficult team member. How did you handle it?",
    category: "Teamwork",
    timeLimit: 120,
  },
  {
    id: "hr-3",
    question: "What are your greatest strengths and how do they help you in your work?",
    category: "Self-Assessment",
    timeLimit: 90,
  },
  {
    id: "hr-4",
    question: "Where do you see yourself in five years?",
    category: "Career Goals",
    timeLimit: 90,
  },
  {
    id: "hr-5",
    question: "Tell me about a time you failed and what you learned from it.",
    category: "Learning & Growth",
    timeLimit: 120,
  },
];

export const interviewConfigs: Record<InterviewType, InterviewConfig> = {
  technical: {
    type: "technical",
    title: "Technical Interview",
    description: "Coding, system design, and problem-solving questions",
    duration: "~15 mins",
    questionCount: technicalQuestions.length,
    questions: technicalQuestions,
  },
  hr: {
    type: "hr",
    title: "General HR",
    description: "Behavioral and situational questions",
    duration: "~12 mins",
    questionCount: hrQuestions.length,
    questions: hrQuestions,
  },
};
