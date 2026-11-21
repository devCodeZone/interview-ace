"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Level } from "@/lib/types";
import { QUESTIONS, TOPICS } from "@/lib/data/questions";
import { CODING } from "@/lib/data/coding";
import { COMPANIES } from "@/lib/data/companies";
import { aiStatus } from "@/lib/ai";
import LiveResearch from "@/components/LiveResearch";

export default function Bank() {
  const [tab, setTab] = useState<"q" | "code">("q");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<Level | "">("");
  const [company, setCompany] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [ai, setAi] = useState(false);
  useEffect(() => { aiStatus().then((s) => setAi(s.available)); }, []);

  const companyQs = useMemo(() => COMPANIES.flatMap((c) => c.prompts.map((p, i) => ({ id: `c-${c.name}-${i}`, topic: p.topic, kind: p.kind, levels: ["junior", "mid", "senior", "lead"] as Level[], question: p.q, points: p.points, company: c.name, ideal: undefined as string | undefined }))), []);
  const qs = useMemo(() => [...QUESTIONS.map((q) => ({ ...q, company: undefined as string | undefined })), ...companyQs].filter((q) =>
    (!topic || q.topic === topic) && (!level || q.levels.includes(level)) && (!company || q.company === company || (!q.company && COMPANIES.find((c) => c.name === company)?.focus.includes(q.topic as never))) &&
    (!search || q.question.toLowerCase().includes(search.toLowerCase()))), [topic, level, company, search, companyQs]);
  const codes = CODING.filter((c) => (!topic || c.topics.includes(topic)) && (!level || c.levels.includes(level)) && (!company || c.companies.includes(company)) && (!search || c.title.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-5 pt-4">
      <div>
        <h1 className="font-display text-3xl">Question bank</h1>
        <p className="text-sm text-mute">{QUESTIONS.length + companyQs.length} spoken questions and {CODING.length} coding tests, by topic, level and company.</p>
      </div>
      <LiveResearch company={company || undefined} aiAvailable={ai} />
      <div className="card flex flex-wrap gap-2 p-3">
        <div className="flex rounded-xl border border-line p-0.5">
          <button className={`rounded-lg px-3 py-1.5 text-sm ${tab === "q" ? "bg-panel2 text-amber2" : "text-mute"}`} onClick={() => setTab("q")}>Interview questions</button>
          <button className={`rounded-lg px-3 py-1.5 text-sm ${tab === "code" ? "bg-panel2 text-amber2" : "text-mute"}`} onClick={() => setTab("code")}>Coding tests</button>
        </div>
        <input className="input max-w-56 py-1.5" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-52 py-1.5" value={topic} onChange={(e) => setTopic(e.target.value)}><option value="">All topics</option>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
        <select className="input max-w-40 py-1.5" value={level} onChange={(e) => setLevel(e.target.value as Level)}><option value="">All levels</option><option value="junior">Junior</option><option value="mid">Mid</option><option value="senior">Senior</option><option value="lead">Lead / 10+</option></select>
        <select className="input max-w-52 py-1.5" value={company} onChange={(e) => setCompany(e.target.value)}><option value="">All companies</option>{COMPANIES.map((c) => <option key={c.name}>{c.name}</option>)}</select>
      </div>

      {tab === "q" ? (
        <div className="space-y-2">
          {qs.map((q) => (
            <div key={q.id} className="card p-4">
              <button className="w-full text-left" onClick={() => setOpen(open === q.id ? null : q.id)}>
                <div className="flex flex-wrap gap-2"><span className="label">{q.topic}</span>{q.company && <span className="text-xs text-amber2">{q.company}</span>}<span className="text-xs text-mute">{q.levels.join(" · ")}</span></div>
                <div className="mt-1">{q.question}</div>
              </button>
              {open === q.id && (
                <div className="mt-3 rounded-xl bg-ink p-3 text-sm">
                  <div className="label mb-1">A strong answer covers</div>
                  <ul className="list-disc pl-5">{q.points.map((p) => <li key={p}>{p}</li>)}</ul>
                  {q.ideal && <p className="mt-2 text-text/80">{q.ideal}</p>}
                </div>
              )}
            </div>
          ))}
          {qs.length === 0 && <div className="text-mute">No matches.</div>}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {codes.map((c) => (
            <Link key={c.id} href={`/practice?id=${c.id}`} className="card block p-4 transition hover:border-amber">
              <div className="flex gap-2"><span className="label">{c.kind === "js" ? "JS · auto-tested" : "Machine coding"}</span><span className="text-xs text-mute">{c.difficulty}</span></div>
              <div className="mt-1 font-semibold">{c.title}</div>
              <div className="mt-1 line-clamp-2 text-sm text-mute">{c.prompt}</div>
              <div className="mt-2 text-xs text-amber2">{c.companies.join(" · ")}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
