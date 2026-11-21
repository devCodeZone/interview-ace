"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InterviewConfig, Level, Question } from "@/lib/types";
import { callAI } from "@/lib/ai";
import { getProfile, setPendingConfig } from "@/lib/store";

type R = { rounds?: string[]; trends?: string[]; questions?: { question: string; topic: string; kind: Question["kind"]; points: string[] }[]; sources?: { uri?: string; title?: string }[] };

export default function LiveResearch({ company, aiAvailable }: { company?: string; aiAvailable: boolean }) {
  const router = useRouter();
  const p = typeof window !== "undefined" ? getProfile() : undefined;
  const [role, setRole] = useState(p?.role || "Senior Frontend Developer");
  const [level, setLevel] = useState<Level>(p?.level || "senior");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<R | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setBusy(true); setErr(null);
    try { setRes(await callAI<R>("research", { company, role, level, topics: [] })); }
    catch (e) { setErr((e as Error).message.slice(0, 200)); }
    setBusy(false);
  }
  function interview() {
    if (!res?.questions?.length) return;
    const qs: Question[] = res.questions.map((q, i) => ({ id: `live-${i}`, kind: q.kind || "theory", topic: q.topic, levels: [level], question: q.question, points: q.points ?? [], source: "ai-live", company }));
    sessionStorage.setItem("ia.customQuestions", JSON.stringify(qs));
    const cfg: InterviewConfig = { mode: company ? "company" : "topic", company, topics: [], level, role, questionCount: qs.length, codingCount: 1, rounds: ["Technical", "Coding", "System Design", "Managerial", "HR"], followUps: true, voice: true, camera: false, liveResearch: false, minutesPerQuestion: 3 };
    setPendingConfig(cfg);
    router.push("/interview");
  }

  return (
    <div className="card p-5">
      <div className="label">Live market research {company ? `· ${company}` : ""}</div>
      <p className="mt-1 text-sm text-mute">Searches the web right now for recently reported interview questions and rounds, then lets you sit an interview made of them.</p>
      {!aiAvailable ? <p className="mt-3 text-sm text-amber2">Needs a Gemini key — add one in Settings.</p> : (
        <div className="mt-3 flex flex-wrap gap-2">
          <input className="input max-w-64" value={role} onChange={(e) => setRole(e.target.value)} />
          <select className="input max-w-44" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
            <option value="junior">Junior</option><option value="mid">Mid</option><option value="senior">Senior</option><option value="lead">Lead / 10+ yrs</option>
          </select>
          <button className="btn btn-primary" onClick={go} disabled={busy}>{busy ? "Researching…" : "Research now"}</button>
        </div>
      )}
      {err && <div className="mt-2 text-sm text-rose">{err}</div>}
      {res && (
        <div className="mt-4 space-y-3 text-sm">
          {res.rounds?.length ? <div><div className="label mb-1">Rounds reported</div>{res.rounds.join(" → ")}</div> : null}
          {res.trends?.length ? <div><div className="label mb-1">Trends</div><ul className="list-disc pl-5">{res.trends.map((t) => <li key={t}>{t}</li>)}</ul></div> : null}
          {res.questions?.length ? <div><div className="label mb-1">Questions</div><ol className="list-decimal space-y-1 pl-5">{res.questions.map((q) => <li key={q.question}>{q.question} <span className="text-xs text-mute">({q.topic})</span></li>)}</ol></div> : null}
          {res.sources?.length ? <div className="text-xs text-mute">Sources: {res.sources.map((s, i) => <a key={i} className="mr-2 underline" href={s.uri} target="_blank" rel="noreferrer">{s.title || "link"}</a>)}</div> : null}
          {res.questions?.length ? <button className="btn btn-primary" onClick={interview}>Interview me on these →</button> : null}
        </div>
      )}
    </div>
  );
}
