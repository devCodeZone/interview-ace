import type { AnswerEval, AnswerRecord, InterviewConfig, InterviewReport, Level, Question, ResumeProfile } from "./types";
import { QUESTIONS } from "./data/questions";
import { CODING } from "./data/coding";
import { getCompany } from "./data/companies";

export const ROUND_OPTIONS = ["Technical", "Coding", "System Design", "Managerial", "HR"] as const;

function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const levelOk = (q: { levels: Level[] }, l: Level) => q.levels.includes(l);

export function pickCoding(config: InterviewConfig, profile?: ResumeProfile, exclude: string[] = []) {
  const topics = new Set([...config.topics, ...(profile?.topics ?? [])]);
  const pool = CODING.filter((c) => !exclude.includes(c.id) && levelOk(c, config.level));
  const scored = pool.map((c) => {
    let s = Math.random();
    if (config.company && c.companies.includes(config.company)) s += 3;
    if (c.topics.some((t) => topics.has(t))) s += 2;
    if (c.kind === "js") s += 0.5;
    if (c.topics.includes("Angular") && !topics.has("Angular")) s -= 5;
    return { c, s };
  });
  return scored.sort((a, b) => b.s - a.s).slice(0, config.codingCount).map(({ c }) => c);
}

export function buildPlanOffline(config: InterviewConfig, profile?: ResumeProfile): Question[] {
  const rounds = new Set(config.rounds);
  const company = getCompany(config.company);
  const techTopics = new Set<string>(
    config.topics.length ? config.topics : profile?.topics?.length ? profile.topics : company?.focus ?? ["JavaScript", "React"]
  );
  const total = config.questionCount;

  const hr = QUESTIONS.filter((q) => q.topic === "Behavioral / HR" && levelOk(q, config.level));
  const mgr = QUESTIONS.filter((q) => q.topic === "Managerial / Leadership" && levelOk(q, config.level));
  const design = QUESTIONS.filter((q) => q.topic === "Frontend System Design" && levelOk(q, config.level));
  const tech = QUESTIONS.filter((q) => techTopics.has(q.topic as string) && !["Behavioral / HR", "Managerial / Leadership", "Frontend System Design"].includes(q.topic as string) && levelOk(q, config.level));

  const companyQs: Question[] = (company?.prompts ?? []).map((p, i) => ({
    id: `c-${company!.name}-${i}`, kind: p.kind, topic: p.topic, levels: ["junior", "mid", "senior", "lead"], question: p.q, points: p.points, source: "company", company: company!.name,
  }));

  const plan: Question[] = [];
  const add = (arr: Question[], k: number) => {
    for (const q of shuffle(arr)) {
      if (k <= 0) break;
      if (plan.some((p) => p.id === q.id)) continue;
      plan.push(q); k--;
    }
  };

  const opener = QUESTIONS.find((q) => q.question === "Tell me about yourself.")!;
  if (rounds.has("HR") || config.mode === "resume") plan.push(opener);

  add(companyQs, Math.min(companyQs.length, Math.ceil(total / 3)));
  const remaining = () => total - plan.length;
  const shares = {
    design: rounds.has("System Design") ? Math.max(1, Math.round(total * (config.level === "junior" ? 0.05 : config.level === "mid" ? 0.12 : 0.2))) : 0,
    mgr: rounds.has("Managerial") ? Math.max(1, Math.round(total * (config.level === "lead" ? 0.2 : config.level === "senior" ? 0.12 : 0.05))) : 0,
    hr: rounds.has("HR") ? Math.max(1, Math.round(total * 0.12)) : 0,
  };
  const techCount = Math.max(rounds.has("Technical") ? 1 : 0, remaining() - shares.design - shares.mgr - shares.hr);
  if (rounds.has("Technical")) add(tech.length ? tech : QUESTIONS.filter((q) => levelOk(q, config.level) && q.kind === "theory"), techCount);
  add(design, Math.min(shares.design, remaining()));
  add(mgr, Math.min(shares.mgr, remaining()));
  add(hr.filter((q) => q.id !== opener.id), Math.min(shares.hr, remaining()));
  if (remaining() > 0) add(QUESTIONS.filter((q) => levelOk(q, config.level) && q.kind !== "coding"), remaining());

  // Keep opener first, HR last-ish; interleave coding after technical questions
  const [first, ...rest] = plan;
  const order: Record<string, number> = { theory: 1, design: 2, behavioral: 3, coding: 1.5 };
  const sorted = first?.id === opener.id ? [first, ...rest.sort((a, b) => order[a.kind] - order[b.kind])] : plan.sort((a, b) => order[a.kind] - order[b.kind]);

  if (rounds.has("Coding") && config.codingCount > 0) {
    const coding = pickCoding(config, profile).map<Question>((c) => ({
      id: `code-${c.id}`, kind: "coding", topic: c.topics[0], levels: c.levels, question: c.title, points: [], codingId: c.id, source: "bank",
    }));
    const insertAt = Math.min(sorted.length, Math.max(2, Math.floor(sorted.length / 2)));
    sorted.splice(insertAt, 0, ...coding);
  }
  return sorted.slice(0, total + config.codingCount);
}

const STOP = new Set("a an the and or of to in for on with by is are be as at it its this that from use using vs".split(" "));
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9.+#/ ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

export function scoreOffline(q: Question, answer: string, tests?: { passed: number; total: number }): AnswerEval {
  if (q.kind === "coding") {
    if (tests && tests.total > 0) {
      const score = Math.round((tests.passed / tests.total) * 10 * 10) / 10;
      return {
        score, by: "offline",
        verdict: score === 10 ? "All tests passed" : score >= 5 ? "Partially correct" : "Needs work",
        strengths: score >= 5 ? [`Passed ${tests.passed}/${tests.total} tests`] : [],
        gaps: score < 10 ? ["Some test cases fail — check edge cases (empty input, async timing, this binding)."] : [],
        ideal: "Explain your approach, time/space complexity and edge cases out loud — interviewers grade communication as much as the code.",
      };
    }
    const len = answer.trim().length;
    const score = len > 400 ? 6 : len > 150 ? 4 : len > 0 ? 2 : 0;
    return { score, by: "offline", verdict: "Self-review (add a Gemini key for AI code review)", strengths: len > 150 ? ["Substantial attempt submitted"] : [], gaps: ["Machine-coding tasks need AI or self review: check component structure, state, edge cases and accessibility."], ideal: "" };
  }
  const aw = new Set(words(answer));
  const hits: string[] = [];
  const misses: string[] = [];
  for (const p of q.points) {
    const pw = words(p);
    const matched = pw.filter((w) => aw.has(w) || [...aw].some((a) => a.length > 4 && (a.startsWith(w.slice(0, 5)) || w.startsWith(a.slice(0, 5)))));
    (pw.length && matched.length / pw.length >= 0.34 ? hits : misses).push(p);
  }
  const wc = answer.trim().split(/\s+/).filter(Boolean).length;
  const coverage = q.points.length ? hits.length / q.points.length : 0.5;
  const lengthFactor = wc < 12 ? 0.45 : wc < 35 ? 0.85 : wc > 450 ? 0.85 : 1;
  const score = Math.round(Math.min(10, (coverage * 8.5 + (wc >= 40 ? 1.5 : 0.5)) * lengthFactor) * 10) / 10;
  return {
    score, by: "offline",
    verdict: score >= 8 ? "Excellent" : score >= 6 ? "Good" : score >= 4 ? "Average" : "Weak",
    strengths: hits.map((h) => `Covered: ${h}`),
    gaps: [...misses.map((m) => `Missed: ${m}`), ...(wc < 40 ? ["Answer is short — interviewers expect explanation + a real example from your projects."] : [])],
    ideal: q.ideal ?? `A strong answer covers: ${q.points.join("; ")}.`,
  };
}

export function verdictFor(score: number): InterviewReport["verdict"] {
  return score >= 7.5 ? "Strong Hire" : score >= 6 ? "Hire" : score >= 4.5 ? "Borderline" : "Not Yet";
}

export function reportOffline(records: AnswerRecord[], config: InterviewConfig): InterviewReport {
  const scored = records.filter((r) => r.evaluation);
  const overall = scored.length ? Math.round((scored.reduce((s, r) => s + (r.evaluation!.score), 0) / scored.length) * 10) / 10 : 0;
  const byTopic = new Map<string, number[]>();
  scored.forEach((r) => byTopic.set(String(r.question.topic), [...(byTopic.get(String(r.question.topic)) ?? []), r.evaluation!.score]));
  const topicScores = [...byTopic].map(([topic, s]) => ({ topic, score: Math.round((s.reduce((a, b) => a + b, 0) / s.length) * 10) / 10 })).sort((a, b) => b.score - a.score);
  const weak = topicScores.filter((t) => t.score < 6).map((t) => t.topic);
  const strong = topicScores.filter((t) => t.score >= 7).map((t) => t.topic);
  const asked = new Set(records.map((r) => r.question.id));
  const nextQuestions = QUESTIONS.filter((q) => !asked.has(q.id) && q.levels.includes(config.level) && (weak.includes(q.topic as string) || config.topics.includes(q.topic as string))).slice(0, 6).map((q) => q.question);
  const verdict = verdictFor(overall);
  return {
    overall, verdict, by: "offline",
    summary: `You scored ${overall}/10 across ${scored.length} questions — ${verdict === "Strong Hire" || verdict === "Hire" ? "you would likely clear this round" : verdict === "Borderline" ? "this is a borderline result; a panel could go either way" : "you would likely not clear this round yet"}.${config.company ? ` (Pattern: ${config.company})` : ""}`,
    topicScores,
    strengths: strong.length ? strong.map((t) => `Strong in ${t}`) : ["Completed the full interview — consistency matters."],
    improvements: [
      ...weak.map((t) => `Revise ${t}: cover the key points listed in feedback and add a project example.`),
      "Use STAR (Situation, Task, Action, Result) for behavioural answers.",
      "Speak in structured steps: definition → how it works → example → trade-offs.",
    ],
    nextQuestions,
    studyPlan: weak.length ? weak.map((t, i) => `Day ${i + 1}: ${t} — re-attempt this topic in Topic mode until you score 7+.`) : ["Try a company-wise mock for your target company next.", "Increase difficulty by switching to a higher level."],
  };
}
