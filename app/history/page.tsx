"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { InterviewSession } from "@/lib/types";
import { deleteSession, getAuth, getSessions, pullAll } from "@/lib/store";

const CLEARED = new Set(["Strong Hire", "Hire"]);
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const color = (s: number) => (s >= 7.5 ? "var(--color-good)" : s >= 6 ? "var(--color-teal)" : s >= 4.5 ? "var(--color-amber)" : "var(--color-rose)");

export default function Progress() {
  const [list, setList] = useState<InterviewSession[]>([]);
  const [filter, setFilter] = useState<"all" | "cleared" | "not">("all");
  useEffect(() => { setList(getSessions()); pullAll().then(() => setList(getSessions())); }, []);

  const stats = useMemo(() => {
    const done = list.filter((s) => s.report);
    const scores = done.map((s) => s.report!.overall);
    const cleared = done.filter((s) => CLEARED.has(s.report!.verdict));
    const answered = done.reduce((n, s) => n + s.records.length, 0);
    const minutes = Math.round(done.reduce((n, s) => n + s.records.reduce((m, r) => m + r.seconds, 0), 0) / 60);
    const coding = done.flatMap((s) => s.records.filter((r) => r.question.kind === "coding"));
    const codingPassed = coding.filter((r) => r.testsTotal && r.testsPassed === r.testsTotal).length;

    const byCompany = new Map<string, InterviewSession[]>();
    done.forEach((s) => { const k = s.config.company || (s.config.mode === "topic" ? "Topic drills" : "General / resume"); byCompany.set(k, [...(byCompany.get(k) ?? []), s]); });
    const companies = [...byCompany].map(([name, ss]) => ({
      name, attempts: ss.length, best: Math.max(...ss.map((s) => s.report!.overall)), last: ss[0].report!.overall,
      cleared: ss.some((s) => CLEARED.has(s.report!.verdict)),
    })).sort((a, b) => b.attempts - a.attempts);

    const topicMap = new Map<string, number[]>();
    done.forEach((s) => s.records.forEach((r) => { if (r.evaluation) topicMap.set(String(r.question.topic), [...(topicMap.get(String(r.question.topic)) ?? []), r.evaluation.score]); }));
    const topics = [...topicMap].map(([topic, sc]) => ({ topic, avg: avg(sc), n: sc.length })).sort((a, b) => b.avg - a.avg);

    const recent = scores.slice(0, 3), prev = scores.slice(3, 6);
    const trend = recent.length && prev.length ? avg(recent) - avg(prev) : 0;
    return { done, scores, cleared, answered, minutes, coding, codingPassed, companies, topics, trend, best: scores.length ? Math.max(...scores) : 0, average: avg(scores) };
  }, [list]);

  const shown = list.filter((s) => filter === "all" || (filter === "cleared" ? CLEARED.has(s.report?.verdict ?? "") : !CLEARED.has(s.report?.verdict ?? "")));

  return (
    <div className="space-y-5 pt-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl">My progress</h1>
          <p className="text-sm text-mute">Every interview is saved to <b className="text-text">{getAuth()?.username}</b>&apos;s account and shows up on any device you log in from.</p>
        </div>
        <Link href="/" className="btn btn-primary">New interview</Link>
      </div>

      {list.length === 0 ? (
        <div className="card p-10 text-center text-mute">No interviews yet. <Link href="/" className="text-teal underline">Start your first one</Link></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Interviews taken", String(stats.done.length), `${stats.answered} questions answered`],
              ["Cleared", `${stats.cleared.length}`, `${stats.done.length ? Math.round((stats.cleared.length / stats.done.length) * 100) : 0}% rated Hire or Strong Hire`],
              ["Average score", stats.average.toFixed(1), `${stats.trend >= 0 ? "▲" : "▼"} ${Math.abs(stats.trend).toFixed(1)} vs earlier attempts`],
              ["Best score", stats.best.toFixed(1), `${stats.minutes} min practised · ${stats.codingPassed}/${stats.coding.length} coding tests fully passed`],
            ].map(([l, v, sub]) => (
              <div key={l} className="card p-4">
                <div className="label">{l}</div>
                <div className="mt-1 font-display text-4xl text-amber2">{v}</div>
                <div className="mt-1 text-xs text-mute">{sub}</div>
              </div>
            ))}
          </div>

          {stats.scores.length > 1 && (
            <div className="card p-5">
              <div className="label mb-3">Score over time (oldest → newest)</div>
              <div className="relative flex h-36 items-end gap-1.5">
                <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-teal/50" style={{ bottom: "60%" }}><span className="absolute -top-4 right-0 text-[10px] text-teal">hire line 6.0</span></div>
                {[...stats.done].reverse().map((s) => (
                  <Link key={s.id} href={`/report?id=${s.id}`} className="group flex flex-1 flex-col items-center justify-end gap-1" style={{ height: "100%" }} title={`${new Date(s.createdAt).toLocaleDateString()} · ${s.config.company ?? s.config.role} · ${s.report!.overall}`}>
                    <span className="text-[10px] text-mute opacity-0 group-hover:opacity-100">{s.report!.overall.toFixed(1)}</span>
                    <div className="w-full max-w-9 rounded-t transition group-hover:opacity-80" style={{ height: `${Math.max(3, s.report!.overall * 10)}%`, background: color(s.report!.overall) }} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <div className="label mb-3">Mock tests by company / type</div>
              <div className="space-y-2">
                {stats.companies.map((c) => (
                  <div key={c.name} className="flex items-center gap-3 text-sm">
                    <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${c.cleared ? "bg-good/20 text-good" : "bg-line text-mute"}`}>{c.cleared ? "✓" : "·"}</span>
                    <span className="flex-1">{c.name}</span>
                    <span className="text-xs text-mute">{c.attempts} attempt{c.attempts > 1 ? "s" : ""}</span>
                    <span className="w-16 text-right font-mono" style={{ color: color(c.best) }}>best {c.best.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <div className="label mb-3">Topic strength (all interviews)</div>
              <div className="space-y-2.5">
                {stats.topics.map((t) => (
                  <div key={t.topic}>
                    <div className="flex justify-between text-sm"><span>{t.topic} <span className="text-xs text-mute">· {t.n}</span></span><span className="font-mono">{t.avg.toFixed(1)}</span></div>
                    <div className="mt-1 h-1.5 rounded bg-line"><div className="h-full rounded" style={{ width: `${t.avg * 10}%`, background: color(t.avg) }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="label flex-1">All interviews</div>
              {(["all", "cleared", "not"] as const).map((f) => <span key={f} className="chip" data-on={filter === f} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "cleared" ? "Cleared" : "Not cleared"}</span>)}
            </div>
            <div className="divide-y divide-line">
              {shown.map((s) => (
                <div key={s.id} className="flex items-center gap-4 py-3">
                  <div className="w-12 text-center font-display text-2xl" style={{ color: color(s.report?.overall ?? 0) }}>{s.report?.overall.toFixed(1)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{s.config.company ? `${s.config.company} · ` : ""}{s.config.mode === "topic" ? s.config.topics.join(", ") : s.config.role}</div>
                    <div className="text-xs text-mute">{new Date(s.createdAt).toLocaleString()} · {s.records.length} answers · <span className={CLEARED.has(s.report?.verdict ?? "") ? "text-good" : ""}>{s.report?.verdict}</span></div>
                  </div>
                  <Link className="btn btn-ghost py-1.5 text-sm" href={`/report?id=${s.id}`}>Report</Link>
                  <button className="text-xs text-mute hover:text-rose" onClick={() => { if (confirm("Hide this interview from your progress?")) { deleteSession(s.id); setList(getSessions()); } }}>Hide</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
