"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AnswerEval, AnswerRecord, InterviewConfig, InterviewReport, InterviewSession, Question, ResumeProfile } from "@/lib/types";
import { getPendingConfig, getProfile, saveSession } from "@/lib/store";
import { aiStatus, callAI } from "@/lib/ai";
import { buildPlanOffline, pickCoding, reportOffline, scoreOffline, verdictFor } from "@/lib/offline";
import { getCoding } from "@/lib/data/coding";
import { speak, speechSupported, stopSpeaking, useSpeechToText } from "@/lib/speech";
import { runTests } from "@/lib/runner";
import CodingPanel from "@/components/CodingPanel";
import { LEVEL_LABEL } from "@/lib/resume";

type Phase = "preparing" | "ready" | "asking" | "evaluating" | "finishing" | "error";

const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

export default function InterviewPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("preparing");
  const [status, setStatus] = useState<string[]>([]);
  const [config, setConfig] = useState<InterviewConfig>();
  const [profile, setProfileState] = useState<ResumeProfile>();
  const [useAI, setUseAI] = useState(false);
  const [plan, setPlan] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [code, setCode] = useState("");
  const [testRes, setTestRes] = useState<{ passed: number; total: number } | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lastEval, setLastEval] = useState<AnswerEval | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [research, setResearch] = useState<{ trends?: string[]; sources?: { uri?: string; title?: string }[] } | null>(null);
  const followUpsUsed = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stt = useSpeechToText("en-IN");

  const log = (s: string) => setStatus((x) => [...x, s]);
  const q = plan[idx];
  const problem = q?.kind === "coding" ? getCoding(q.codingId) : undefined;

  // ---------- Prepare the plan ----------
  useEffect(() => {
    const cfg = getPendingConfig();
    if (!cfg) { router.replace("/"); return; }
    const prof = cfg.mode === "resume" ? getProfile() : getProfile();
    setConfig(cfg); setProfileState(prof);
    (async () => {
      const { available } = await aiStatus();
      setUseAI(available);
      let custom: Question[] | null = null;
      try { custom = JSON.parse(sessionStorage.getItem("ia.customQuestions") || "null"); } catch {}
      let spoken: Question[] = [];
      let offlineUsed = false;
      if (custom?.length) {
        log(`Loaded ${custom.length} researched questions.`);
        spoken = custom.slice(0, cfg.questionCount);
      } else if (available) {
        let intel = "";
        if (cfg.liveResearch) {
          log(`Searching the web for recently reported ${cfg.company ?? ""} ${cfg.role} interview questions…`);
          try {
            const r = await withTimeout(callAI<{ rounds?: string[]; trends?: string[]; questions?: { question: string }[]; sources?: { uri?: string; title?: string }[] }>("research", { company: cfg.company, role: cfg.role, level: cfg.level, topics: cfg.topics }), 45000);
            setResearch({ trends: r.trends, sources: r.sources });
            intel = JSON.stringify({ rounds: r.rounds, trends: r.trends, questions: (r.questions ?? []).slice(0, 12).map((x) => x.question) });
            log(`Found ${(r.questions ?? []).length} recent questions and ${(r.sources ?? []).length} sources.`);
          } catch { log("Live research unavailable right now — continuing with resume + pattern-based questions."); }
        }
        log(prof && cfg.mode === "resume" ? "Interviewer is reading your resume and preparing questions…" : "Interviewer is preparing questions…");
        try {
          const r = await withTimeout(callAI<{ questions: Omit<Question, "id" | "levels">[] }>("plan", { config: cfg, profile: cfg.mode === "resume" ? prof : undefined, research: intel }), 50000);
          spoken = r.questions.filter((x) => x?.question).map((x, i) => ({
            ...x, id: `ai-${i}`, levels: [cfg.level], kind: (["theory", "behavioral", "design"].includes(x.kind) ? x.kind : "theory") as Question["kind"],
            points: x.points ?? [], source: intel ? "ai-live" : "ai", company: cfg.company,
          }));
        } catch (e) { log(`AI planning failed (${(e as Error).message.slice(0, 60)}) — using the built-in bank.`); }
      }
      let full: Question[];
      if (!spoken.length) {
        full = buildPlanOffline(cfg, cfg.mode === "resume" ? prof : undefined);
        offlineUsed = true;
      } else {
        full = [...spoken];
        if (cfg.rounds.includes("Coding") && cfg.codingCount > 0) {
          const coding = pickCoding(cfg, prof).map<Question>((c) => ({ id: `code-${c.id}`, kind: "coding", topic: c.topics[0], levels: c.levels, question: c.title, points: [], codingId: c.id, source: "bank" }));
          full.splice(Math.min(full.length, Math.max(2, Math.floor(full.length / 2))), 0, ...coding);
        }
      }
      if (offlineUsed) log(`Prepared ${full.length} questions from the built-in bank${cfg.company ? ` using ${cfg.company}'s pattern` : ""}.`);
      else log(`Prepared ${full.length} questions.`);
      setPlan(full);
      setPhase(full.length ? "ready" : "error");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Camera ----------
  useEffect(() => {
    if (!config?.camera || phase === "preparing") return;
    if (streamRef.current) return;
    navigator.mediaDevices?.getUserMedia({ video: { width: 480, height: 360 }, audio: false }).then((s) => {
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    }).catch(() => {});
  }, [config?.camera, phase]);
  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); stopSpeaking(); }, []);
  useEffect(() => { if (videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current; });

  // ---------- Timer ----------
  useEffect(() => {
    if (phase !== "asking") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase, idx]);

  const askCurrent = useCallback((question: Question) => {
    stt.stop(); stt.reset(); setElapsed(0); setTestRes(null);
    const prob = question.kind === "coding" ? getCoding(question.codingId) : undefined;
    setCode(prob?.starter ?? "");
    const spokenText = prob
      ? `Here's a coding exercise: ${prob.title}. Read the problem on screen, write your solution, and explain your approach out loud as you go.`
      : question.question;
    if (config?.voice) {
      setSpeaking(true);
      speak(spokenText, () => { setSpeaking(false); if (speechSupported()) stt.start(); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.voice]);

  function begin() {
    setPhase("asking");
    askCurrent(plan[0]);
  }

  async function evaluate(question: Question, answer: string, codeStr?: string, tests?: { passed: number; total: number }): Promise<AnswerEval> {
    const offline = scoreOffline(question, answer, tests);
    if (!useAI) return offline;
    try {
      const r = await withTimeout(callAI<AnswerEval>("evaluate", {
        question, answer, level: config!.level, code: codeStr, tests,
        followUps: config!.followUps && question.source !== "follow-up" && followUpsUsed.current < Math.ceil(config!.questionCount / 3),
      }), 40000);
      return { ...offline, ...r, score: Math.max(0, Math.min(10, Number(r.score) || 0)), strengths: r.strengths ?? [], gaps: r.gaps ?? [], by: "ai" };
    } catch { return offline; }
  }

  async function submit(skip = false) {
    if (!q || !config) return;
    stt.stop(); stopSpeaking(); setSpeaking(false);
    const answer = skip ? "" : (stt.text + " " + stt.interim).trim();
    setPhase("evaluating");
    let tests = testRes ?? undefined;
    if (problem && problem.tests.length && !skip && !tests) {
      const r = await runTests(code, problem.tests);
      tests = { passed: r.results.filter((x) => x.pass).length, total: problem.tests.length };
    }
    const evaluation = skip
      ? { score: 0, verdict: "Skipped", strengths: [], gaps: ["Question skipped"], ideal: q.ideal ?? (q.points.length ? `Key points: ${q.points.join("; ")}` : ""), by: "offline" as const }
      : await evaluate(q, answer, problem ? code : undefined, tests);
    const rec: AnswerRecord = { question: q, answer, code: problem ? code : undefined, testsPassed: tests?.passed, testsTotal: tests?.total, seconds: elapsed, evaluation };
    const nextRecords = [...records, rec];
    setRecords(nextRecords);
    setLastEval(evaluation);

    let nextPlan = plan;
    if (evaluation.followUp && evaluation.followUp.trim().length > 8 && !skip) {
      followUpsUsed.current += 1;
      const fu: Question = { id: `fu-${q.id}`, kind: q.kind === "coding" ? "theory" : q.kind, topic: q.topic, levels: q.levels, question: evaluation.followUp, points: [], source: "follow-up" };
      nextPlan = [...plan.slice(0, idx + 1), fu, ...plan.slice(idx + 1)];
      setPlan(nextPlan);
    }
    if (idx + 1 >= nextPlan.length) { finish(nextRecords); return; }
    setIdx(idx + 1);
    setPhase("asking");
    askCurrent(nextPlan[idx + 1]);
  }

  async function finish(recs = records) {
    if (!config) return;
    stt.stop(); stopSpeaking();
    setPhase("finishing");
    let report: InterviewReport = reportOffline(recs, config);
    if (useAI && recs.length) {
      try {
        const r = await withTimeout(callAI<InterviewReport>("report", { records: recs, config, profile }), 50000);
        const overall = Math.max(0, Math.min(10, Number(r.overall) || report.overall));
        report = { ...report, ...r, overall, verdict: (["Strong Hire", "Hire", "Borderline", "Not Yet"].includes(r.verdict) ? r.verdict : verdictFor(overall)), by: "ai" };
      } catch {}
    }
    const session: InterviewSession = { id: `s${Date.now()}`, createdAt: Date.now(), config, profile, records: recs, report };
    saveSession(session);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    router.push(`/report?id=${session.id}`);
  }

  const limit = (problem ? 15 : config?.minutesPerQuestion ?? 3) * 60;
  const remaining = limit - elapsed;
  const mmss = (s: number) => `${s < 0 ? "-" : ""}${Math.floor(Math.abs(s) / 60)}:${String(Math.abs(s) % 60).padStart(2, "0")}`;

  // ---------- Render ----------
  if (phase === "preparing" || phase === "error") {
    return (
      <div className="mx-auto mt-16 max-w-xl">
        <div className="card p-8">
          <div className="label">{phase === "error" ? "Something went wrong" : "Preparing your interview panel"}</div>
          <div className="mt-4 space-y-2 text-sm">
            {status.map((s, i) => <div key={i} className="flex gap-2"><span className="text-good">✓</span>{s}</div>)}
            {phase === "preparing" && <div className="flex items-center gap-2 text-amber2"><span className="h-2 w-2 animate-ping rounded-full bg-amber" /> Working…</div>}
          </div>
          {phase === "error" && <Link href="/" className="btn btn-ghost mt-6">← Back</Link>}
        </div>
      </div>
    );
  }

  if (phase === "ready") {
    return (
      <div className="mx-auto mt-10 max-w-2xl space-y-4">
        <div className="card p-8">
          <div className="label">You&apos;re in the waiting room</div>
          <h1 className="mt-2 font-display text-3xl">{config?.company ? `${config.company} · ` : ""}{config?.role}</h1>
          <p className="mt-1 text-mute">{LEVEL_LABEL[config!.level]} · {plan.length} questions · {config?.rounds.join(", ")}</p>
          <ul className="mt-5 space-y-2 text-sm text-text/85">
            <li>🎙️ {config?.voice ? (speechSupported() ? "Questions are read aloud. When the interviewer stops, your mic turns on — just speak. You can also edit or type your answer." : "This browser can't do speech recognition — the question is still read aloud, type your answers. Chrome or Edge works best.") : "Voice is off — read the question and type your answer."}</li>
            <li>⏱️ About {config?.minutesPerQuestion} min per question (15 min for coding). Click <b>Submit answer</b> when done.</li>
            <li>🧠 {useAI ? "The AI interviewer grades every answer and may ask follow-ups — like a real panel." : "Offline mode: answers are scored against the key points interviewers expect."}</li>
            <li>📊 Feedback comes at the end, so it feels like a real interview. You can end early at any time.</li>
          </ul>
          {research?.trends?.length ? (
            <div className="mt-5 rounded-xl bg-panel2 p-4 text-sm">
              <div className="label mb-2">What the market is asking right now</div>
              <ul className="list-disc space-y-1 pl-5">{research.trends.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          ) : null}
          <div className="mt-6 flex gap-3">
            <button className="btn btn-primary px-6 py-3 text-base" onClick={begin}>Join interview</button>
            <Link className="btn btn-ghost" href="/">Cancel</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rec-dot h-2.5 w-2.5 rounded-full bg-rose" />
          <span className="font-display text-lg">InterviewAce <span className="text-mute">· live</span></span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-mute">Question {Math.min(idx + 1, plan.length)} / {plan.length}</span>
          <span className={`rounded-lg px-2 py-1 font-mono ${remaining < 0 ? "bg-rose/20 text-rose" : remaining < 30 ? "bg-amber/20 text-amber2" : "bg-panel2"}`}>{mmss(remaining)}</span>
          <button className="btn btn-ghost py-1.5 text-sm" disabled={phase !== "asking"} onClick={() => finish()}>End &amp; get report</button>
        </div>
      </div>
      <div className="mb-4 h-1 overflow-hidden rounded bg-line"><div className="h-full bg-amber transition-all" style={{ width: `${(idx / Math.max(1, plan.length)) * 100}%` }} /></div>

      <div className={`grid gap-4 ${problem ? "lg:grid-cols-[340px_1fr]" : "lg:grid-cols-[340px_1fr]"}`}>
        {/* Left: video tiles */}
        <div className="space-y-3">
          <div className="card relative grid aspect-[4/3] place-items-center overflow-hidden">
            <div className={`grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-amber to-[#c77d12] font-display text-4xl text-[#1b1300] ${speaking ? "speaking" : ""}`}>A</div>
            <div className="absolute bottom-2 left-3 text-xs"><span className="font-semibold">Ace</span> <span className="text-mute">· {config?.company ? `${config.company} panel` : "Hiring manager"}</span></div>
            {speaking && <div className="absolute right-3 top-2 text-xs text-amber2">speaking…</div>}
            {phase === "evaluating" && <div className="absolute right-3 top-2 text-xs text-teal">taking notes…</div>}
          </div>
          <div className="card relative grid aspect-[4/3] place-items-center overflow-hidden">
            {config?.camera ? <video ref={videoRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" /> : <div className="grid h-20 w-20 place-items-center rounded-full bg-panel2 text-2xl">🙂</div>}
            <div className="absolute bottom-2 left-3 text-xs"><span className="font-semibold">{profile?.name || "You"}</span> {stt.listening && <span className="text-good">· mic on</span>}</div>
          </div>
          {lastEval && (
            <div className="card p-3 text-xs">
              <button className="text-mute hover:text-text" onClick={() => setShowFeedback((s) => !s)}>{showFeedback ? "Hide" : "Peek at"} last answer feedback</button>
              {showFeedback && <div className="mt-2"><b className="text-amber2">{lastEval.score}/10 · {lastEval.verdict}</b><ul className="mt-1 list-disc pl-4 text-mute">{lastEval.gaps.slice(0, 3).map((g) => <li key={g}>{g}</li>)}</ul></div>}
            </div>
          )}
        </div>

        {/* Right: question + answer */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="label">{q?.topic}</span>
              {q?.source === "follow-up" && <span className="rounded-full bg-teal/15 px-2 py-0.5 text-xs text-teal">follow-up</span>}
              {q?.source === "ai-live" && <span className="rounded-full bg-good/15 px-2 py-0.5 text-xs text-good">market-researched</span>}
              {q?.source === "company" && <span className="rounded-full bg-amber/15 px-2 py-0.5 text-xs text-amber2">{q.company} pattern</span>}
              <button className="ml-auto text-xs text-mute hover:text-amber2" onClick={() => { setSpeaking(true); speak(problem ? problem.title + ". " + problem.prompt : q.question, () => setSpeaking(false)); }}>🔊 Repeat</button>
            </div>
            {!problem && <h2 className="mt-2 font-display text-2xl leading-snug md:text-[28px]">{q?.question}</h2>}
            {problem && <div className="mt-2"><CodingPanel key={q.id} problem={problem} code={code} setCode={setCode} onResult={(r) => setTestRes({ passed: r.results.filter((x) => x.pass).length, total: problem.tests.length })} height="300px" /></div>}
          </div>

          <div className="card p-5">
            <div className="mb-2 flex items-center gap-3">
              <span className="label">{problem ? "Explain your approach (spoken)" : "Your answer"}</span>
              <div className="ml-auto flex gap-2">
                {speechSupported() && (stt.listening
                  ? <button className="btn btn-ghost py-1 text-sm" onClick={stt.stop}><span className="rec-dot h-2 w-2 rounded-full bg-rose" /> Pause mic</button>
                  : <button className="btn btn-ghost py-1 text-sm" onClick={() => { stopSpeaking(); setSpeaking(false); stt.start(); }}>🎙️ Speak</button>)}
                <button className="text-xs text-mute hover:text-rose" onClick={stt.reset}>Clear</button>
              </div>
            </div>
            <textarea className="input min-h-36 text-[15px] leading-relaxed" placeholder={speechSupported() ? "Start speaking — your words appear here. You can also type or correct the transcript." : "Type your answer here."}
              value={stt.text} onChange={(e) => stt.setText(e.target.value)} />
            {stt.interim && <div className="mt-1 text-sm italic text-mute">{stt.interim}</div>}
            {stt.error && <div className="mt-1 text-xs text-rose">{stt.error}</div>}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button className="btn btn-primary" disabled={phase !== "asking"} onClick={() => submit(false)}>{phase === "evaluating" ? "Evaluating…" : idx + 1 >= plan.length ? "Submit & finish" : "Submit answer →"}</button>
              <button className="btn btn-ghost" disabled={phase !== "asking"} onClick={() => submit(true)}>Skip</button>
              <span className="text-xs text-mute">{(stt.text.match(/\S+/g) || []).length} words</span>
            </div>
          </div>
        </div>
      </div>
      {phase === "finishing" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 backdrop-blur">
          <div className="card p-8 text-center"><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-amber border-t-transparent" />The panel is discussing your interview…</div>
        </div>
      )}
    </div>
  );
}
