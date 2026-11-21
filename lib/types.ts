export type Level = "junior" | "mid" | "senior" | "lead";

export type Topic =
  | "JavaScript"
  | "TypeScript"
  | "React"
  | "Next.js"
  | "Angular"
  | "HTML & CSS"
  | "Performance"
  | "Browser & Web"
  | "Security"
  | "Testing"
  | "State Management"
  | "Frontend System Design"
  | "Accessibility"
  | "Adobe Target & Personalization"
  | "AI in Frontend"
  | "Behavioral / HR"
  | "Managerial / Leadership";

export type QuestionKind = "theory" | "behavioral" | "design" | "coding";

export interface Question {
  id: string;
  kind: QuestionKind;
  topic: Topic | string;
  levels: Level[];
  question: string;
  /** Key points a strong answer covers (used for scoring + feedback) */
  points: string[];
  ideal?: string;
  /** For kind = coding: id of a CodingProblem */
  codingId?: string;
  /** Source tag shown in UI */
  source?: "bank" | "ai" | "ai-live" | "company" | "follow-up";
  company?: string;
}

export interface CodingTest {
  name: string;
  /** JS body; has access to user code + assert/deepEqual helpers. May use await. */
  code: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  kind: "js" | "machine";
  difficulty: "easy" | "medium" | "hard";
  topics: string[];
  companies: string[];
  levels: Level[];
  prompt: string;
  starter: string;
  tests: CodingTest[];
  hints?: string[];
}

export interface Company {
  name: string;
  type: "Product" | "Service / Consulting" | "Fintech" | "E-commerce" | "Global Capability Centre";
  rounds: string[];
  focus: Topic[];
  notes: string;
  prompts: { q: string; topic: string; kind: QuestionKind; points: string[] }[];
}

export interface ResumeProfile {
  name?: string;
  years: number;
  level: Level;
  role: string;
  skills: string[];
  topics: string[];
  companies: string[];
  projects: string[];
  summary: string;
  focusAreas: string[];
  likelyRounds: string[];
  analysedBy: "ai" | "offline";
}

export type InterviewMode = "resume" | "company" | "topic";

export interface InterviewConfig {
  mode: InterviewMode;
  company?: string;
  topics: string[];
  level: Level;
  role: string;
  questionCount: number;
  codingCount: number;
  rounds: string[];
  followUps: boolean;
  voice: boolean;
  camera: boolean;
  liveResearch: boolean;
  minutesPerQuestion: number;
}

export interface AnswerEval {
  score: number; // 0-10
  verdict: string;
  strengths: string[];
  gaps: string[];
  ideal: string;
  followUp?: string;
  by: "ai" | "offline";
}

export interface AnswerRecord {
  question: Question;
  answer: string;
  code?: string;
  testsPassed?: number;
  testsTotal?: number;
  seconds: number;
  evaluation?: AnswerEval;
}

export interface InterviewReport {
  overall: number;
  verdict: "Strong Hire" | "Hire" | "Borderline" | "Not Yet";
  summary: string;
  topicScores: { topic: string; score: number }[];
  strengths: string[];
  improvements: string[];
  nextQuestions: string[];
  studyPlan: string[];
  by: "ai" | "offline";
}

export interface InterviewSession {
  id: string;
  createdAt: number;
  config: InterviewConfig;
  profile?: ResumeProfile;
  records: AnswerRecord[];
  report?: InterviewReport;
}
