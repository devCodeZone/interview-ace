"use client";
import type { Level, ResumeProfile } from "./types";
import { COMPANY_NAMES } from "./data/companies";

export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
    }
    return text;
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser");
    const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return res.value;
  }
  return await file.text();
}

const SKILLS: Record<string, string[]> = {
  JavaScript: ["javascript", "es6", "ecmascript"],
  TypeScript: ["typescript"],
  React: ["react", "react.js", "reactjs", "redux", "hooks"],
  "Next.js": ["next.js", "nextjs", "next js"],
  Angular: ["angular", "rxjs", "ngrx"],
  "HTML & CSS": ["html", "css", "scss", "sass", "tailwind", "bootstrap"],
  Performance: ["performance", "web vitals", "lighthouse", "optimiz", "optimis"],
  "Browser & Web": ["pwa", "service worker", "rest api", "graphql", "websocket"],
  Security: ["security", "oauth", "jwt", "xss"],
  Testing: ["jest", "testing library", "cypress", "playwright", "vitest", "jasmine", "karma", "unit test"],
  "State Management": ["redux", "ngrx", "zustand", "mobx", "context api", "react query"],
  "Frontend System Design": ["architecture", "micro-frontend", "micro frontend", "design system", "module federation", "monorepo"],
  Accessibility: ["accessibility", "wcag", "a11y", "aria"],
  "Adobe Target & Personalization": ["adobe target", "at.js", "personalization", "personalisation", "a/b test", "ab test", "adobe analytics", "aem", "web sdk", "alloy"],
  "AI in Frontend": ["genai", "generative ai", "llm", "openai", "gemini", "claude", "langchain", "ai agent", "chatgpt"],
  "Managerial / Leadership": ["lead", "mentor", "managed a team", "team of", "stakeholder", "scrum master"],
};

export function levelFromYears(y: number): Level {
  if (y >= 10) return "lead";
  if (y >= 6) return "senior";
  if (y >= 3) return "mid";
  return "junior";
}

export const LEVEL_LABEL: Record<Level, string> = {
  junior: "Junior (0–2 yrs)",
  mid: "Mid-level (3–5 yrs)",
  senior: "Senior (6–9 yrs)",
  lead: "Lead / Staff (10+ yrs)",
};

export function analyseResumeOffline(text: string): ResumeProfile {
  const lower = text.toLowerCase();
  let years = 0;
  const m = [...lower.matchAll(/(\d{1,2})(?:\.\d)?\s*\+?\s*(?:years|yrs|year)/g)].map((x) => parseInt(x[1], 10)).filter((x) => x < 40);
  if (m.length) years = Math.max(...m);
  if (!years) {
    const yrs = [...lower.matchAll(/\b(19[89]\d|20[0-3]\d)\b/g)].map((x) => parseInt(x[1], 10));
    if (yrs.length) years = Math.max(0, new Date().getFullYear() - Math.min(...yrs));
  }
  const topics = Object.entries(SKILLS).filter(([, kws]) => kws.some((k) => lower.includes(k))).map(([t]) => t);
  const skills = Array.from(new Set(
    ["React", "Angular", "Next.js", "TypeScript", "JavaScript", "Redux", "RxJS", "Node.js", "Tailwind", "Jest", "Cypress", "GraphQL", "Adobe Target", "AEM", "Webpack", "Vite", "Docker", "AWS", "Azure", "Git"]
      .filter((s) => lower.includes(s.toLowerCase()))
  ));
  const companies = COMPANY_NAMES.filter((c) => lower.includes(c.toLowerCase().split(" ")[0]));
  const firstLine = text.split("\n").map((l) => l.trim()).find((l) => l.length > 2 && l.length < 40 && /^[a-z .]+$/i.test(l));
  const level = levelFromYears(years);
  const role = lower.includes("full stack") || lower.includes("fullstack") ? "Full Stack Developer" : "Frontend Developer";
  return {
    name: firstLine,
    years,
    level,
    role: (level === "lead" ? "Lead / Senior " : level === "senior" ? "Senior " : "") + role,
    skills,
    topics: topics.length ? topics : ["JavaScript", "React", "HTML & CSS"],
    companies,
    projects: [],
    summary: `${years ? years + "+ years" : "Experience not detected"} · ${skills.slice(0, 6).join(", ") || "skills not detected"}`,
    focusAreas: level === "lead" || level === "senior"
      ? ["Architecture & system design", "Performance at scale", "Leadership & mentoring", "Deep framework internals"]
      : ["Core JavaScript", "Framework fundamentals", "Coding exercises", "Project explanation"],
    likelyRounds: level === "lead" || level === "senior"
      ? ["Technical deep-dive (JS + framework)", "Machine coding", "Frontend system design", "Managerial / leadership", "HR"]
      : ["Technical fundamentals", "Coding / machine coding", "Project discussion", "HR"],
    analysedBy: "offline",
  };
}
