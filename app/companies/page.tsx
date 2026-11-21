"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COMPANIES } from "@/lib/data/companies";
import { aiStatus } from "@/lib/ai";
import { getProfile, setPendingConfig } from "@/lib/store";
import LiveResearch from "@/components/LiveResearch";

export default function Companies() {
  const router = useRouter();
  const [type, setType] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [ai, setAi] = useState(false);
  useEffect(() => { aiStatus().then((s) => setAi(s.available)); }, []);
  const types = Array.from(new Set(COMPANIES.map((c) => c.type)));

  function mock(name: string) {
    const p = getProfile();
    const c = COMPANIES.find((x) => x.name === name)!;
    setPendingConfig({ mode: "company", company: name, topics: c.focus.filter((t) => !["Behavioral / HR", "Managerial / Leadership"].includes(t)), level: p?.level ?? "senior", role: p?.role ?? "Senior Frontend Developer", questionCount: 8, codingCount: 1, rounds: ["Technical", "Coding", "System Design", "Managerial", "HR"], followUps: ai, voice: true, camera: false, liveResearch: ai, minutesPerQuestion: 3 });
    try { sessionStorage.removeItem("ia.customQuestions"); } catch {}
    router.push("/interview");
  }

  return (
    <div className="space-y-5 pt-4">
      <div>
        <h1 className="font-display text-3xl">Company-wise mocks</h1>
        <p className="text-sm text-mute">Round patterns compiled from publicly shared candidate reports for frontend roles. They change often, so use live research for the latest.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="chip" data-on={!type} onClick={() => setType("")}>All</span>
        {types.map((t) => <span key={t} className="chip" data-on={type === t} onClick={() => setType(t)}>{t}</span>)}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {COMPANIES.filter((c) => !type || c.type === type).map((c) => (
          <div key={c.name} className="card p-5">
            <div className="flex items-start justify-between gap-2">
              <div><div className="font-display text-xl">{c.name}</div><div className="label">{c.type}</div></div>
              <button className="btn btn-primary py-1.5 text-sm" onClick={() => mock(c.name)}>Start mock</button>
            </div>
            <p className="mt-2 text-sm text-text/80">{c.notes}</p>
            <ol className="mt-3 space-y-1 text-sm">{c.rounds.map((r, i) => <li key={r} className="flex gap-2"><span className="font-mono text-xs text-amber2">R{i + 1}</span>{r}</li>)}</ol>
            <div className="mt-3 flex flex-wrap gap-1">{c.focus.map((f) => <span key={f} className="rounded-md bg-ink px-2 py-0.5 text-xs text-mute">{f}</span>)}</div>
            <button className="mt-3 text-xs text-teal hover:underline" onClick={() => setSel(sel === c.name ? null : c.name)}>{sel === c.name ? "Hide" : "Live research for"} {c.name}</button>
            {sel === c.name && <div className="mt-3"><LiveResearch company={c.name} aiAvailable={ai} /></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
