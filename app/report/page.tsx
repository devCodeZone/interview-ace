"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { InterviewSession } from "@/lib/types";
import { getSession, setPendingConfig } from "@/lib/store";
import ScoreRing from "@/components/ScoreRing";
import { LEVEL_LABEL } from "@/lib/resume";

const VERDICT_STYLE: Record<string, string> = {
  "Strong Hire": "bg-good/15 text-good border-good/40",
  Hire: "bg-teal/15 text-teal border-teal/40",
  Borderline: "bg-amber/15 text-amber2 border-amber/40",
  "Not Yet": "bg-rose/15 text-rose border-rose/40",
};

function Report() {
  const params = useSearchParams();
  const router = useRouter();
  const [s, setS] = useState<InterviewSession | undefined>();
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => { const id = params.get("id"); if (id) setS(getSession(id)); }, [params]);
  if (!s?.report) return <div className="mt-20 text-center text-mute">Report not found. <Link className="text-teal underline" href="/history">See your results</Link></div>;
  const r = s.report;

  function practiceWeak() {
    const weak = r.topicScores.filter((t) => t.score < 6).map((t) => t.topic);
    setPendingConfig({ ...s!.config, mode: "topic", topics: weak.length ? weak : s!.config.topics, questionCount: Math.max(5, s!.config.questionCount) });
    try { sessionStorage.removeItem("ia.customQuestions"); } catch {}
    router.push("/interview");
  }
  function retake() { setPendingConfig(s!.config); try { sessionStorage.removeItem("ia.customQuestions"); } catch {} router.push("/interview"); }

  return (
    <div className="space-y-6 pt-4">
      <div className="card grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center">
        <ScoreRing score={r.overall} size={160} />
        <div>
          <div className="label">Interview debrief · {new Date(s.createdAt).toLocaleString()}</div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-4 py-1.5 font-display text-xl ${VERDICT_STYLE[r.verdict]}`}>{r.verdict === "Not Yet" ? "Not selected (yet)" : r.verdict === "Borderline" ? "Borderline — could go either way" : `Likely selected · ${r.verdict}`}</span>
          </div>
          <p className="mt-3 text-text/85">{r.summary}</p>
          <div className="mt-2 text-xs text-mute">{s.config.company ? `${s.config.company} · ` : ""}{s.config.role} · {LEVEL_LABEL[s.config.level]} · graded by {r.by === "ai" ? "AI panel" : "offline scorer"}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={practiceWeak}>Practise weak topics</button>
            <button className="btn btn-ghost" onClick={retake}>Retake same interview</button>
            <button className="btn btn-ghost" onClick={() => window.print()}>Print / save PDF</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="label mb-3">Score by topic</div>
          <div className="space-y-2.5">
            {r.topicScores.map((t) => (
              <div key={t.topic}>
                <div className="flex justify-between text-sm"><span>{t.topic}</span><span className="font-mono">{Number(t.score).toFixed(1)}</span></div>
                <div className="mt-1 h-2 rounded bg-line"><div className="h-full rounded" style={{ width: `${t.score * 10}%`, background: t.score >= 7 ? "var(--color-good)" : t.score >= 5 ? "var(--color-amber)" : "var(--color-rose)" }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card space-y-4 p-5">
          <div><div className="label mb-2 text-good">Strengths</div><ul className="space-y-1 text-sm">{r.strengths.map((x) => <li key={x}>✓ {x}</li>)}</ul></div>
          <div><div className="label mb-2 text-amber2">Improve</div><ul className="space-y-1 text-sm">{r.improvements.map((x) => <li key={x}>→ {x}</li>)}</ul></div>
        </div>
        <div className="card p-5">
          <div className="label mb-2">Questions you&apos;ll most likely face next</div>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">{r.nextQuestions.map((x) => <li key={x}>{x}</li>)}</ol>
        </div>
        <div className="card p-5">
          <div className="label mb-2">Study plan</div>
          <ul className="space-y-1.5 text-sm">{r.studyPlan.map((x) => <li key={x}>• {x}</li>)}</ul>
        </div>
      </div>

      <div className="card p-5">
        <div className="label mb-3">Question-by-question</div>
        <div className="divide-y divide-line">
          {s.records.map((rec, i) => (
            <div key={i} className="py-3">
              <button className="flex w-full items-start gap-3 text-left" onClick={() => setOpen(open === i ? null : i)}>
                <span className={`mt-0.5 w-12 shrink-0 rounded-md py-0.5 text-center font-mono text-sm ${(rec.evaluation?.score ?? 0) >= 7 ? "bg-good/15 text-good" : (rec.evaluation?.score ?? 0) >= 5 ? "bg-amber/15 text-amber2" : "bg-rose/15 text-rose"}`}>{rec.evaluation?.score?.toFixed(1) ?? "–"}</span>
                <span className="flex-1"><span className="label">{rec.question.topic}{rec.question.source === "follow-up" ? " · follow-up" : ""}</span><span className="block">{rec.question.question}</span></span>
                <span className="text-mute">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && rec.evaluation && (
                <div className="mt-3 grid gap-3 pl-15 text-sm md:grid-cols-2 md:pl-15">
                  <div className="rounded-xl bg-ink p-3"><div className="label mb-1">Your answer · {rec.seconds}s</div><div className="prose-answer text-text/85">{rec.answer || <i className="text-mute">(no spoken answer)</i>}</div>
                    {rec.code && <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-panel2 p-2 font-mono text-xs">{rec.code}</pre>}
                    {rec.testsTotal ? <div className="mt-1 text-xs text-mute">Tests: {rec.testsPassed}/{rec.testsTotal}</div> : null}
                  </div>
                  <div className="space-y-2 rounded-xl bg-ink p-3">
                    <div className="font-semibold text-amber2">{rec.evaluation.verdict}</div>
                    {rec.evaluation.strengths.length > 0 && <ul className="text-good">{rec.evaluation.strengths.map((x) => <li key={x}>✓ {x}</li>)}</ul>}
                    {rec.evaluation.gaps.length > 0 && <ul className="text-rose/90">{rec.evaluation.gaps.map((x) => <li key={x}>✗ {x}</li>)}</ul>}
                    {rec.evaluation.ideal && <div><div className="label mb-1">Model answer</div><div className="text-text/85">{rec.evaluation.ideal}</div></div>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return <Suspense fallback={<div className="mt-20 text-center text-mute">Loading…</div>}><Report /></Suspense>;
}
