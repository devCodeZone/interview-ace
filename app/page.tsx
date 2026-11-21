"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { InterviewConfig, InterviewMode, Level, ResumeProfile } from "@/lib/types";
import { analyseResumeOffline, extractResumeText, LEVEL_LABEL, levelFromYears } from "@/lib/resume";
import { aiStatus, callAI } from "@/lib/ai";
import { getProfile, setPendingConfig, setProfile } from "@/lib/store";
import { COMPANIES, getCompany } from "@/lib/data/companies";
import { TOPICS } from "@/lib/data/questions";
import { ROUND_OPTIONS } from "@/lib/offline";

const TECH_TOPICS = TOPICS.filter((t) => !["Behavioral / HR", "Managerial / Leadership"].includes(t as string)) as string[];
const LEVELS: Level[] = ["junior", "mid", "senior", "lead"];

export default function Home() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [ai, setAi] = useState<{ available: boolean } | null>(null);
  const [profile, setProf] = useState<ResumeProfile | undefined>();
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [mode, setMode] = useState<InterviewMode>("resume");
  const [company, setCompany] = useState<string>("");
  const [topics, setTopics] = useState<string[]>([]);
  const [level, setLevel] = useState<Level>("senior");
  const [role, setRole] = useState("Senior Frontend Developer");
  const [questionCount, setQuestionCount] = useState(8);
  const [codingCount, setCodingCount] = useState(1);
  const [rounds, setRounds] = useState<string[]>(["Technical", "Coding", "System Design", "Managerial", "HR"]);
  const [voice, setVoice] = useState(true);
  const [camera, setCamera] = useState(false);
  const [followUps, setFollowUps] = useState(true);
  const [liveResearch, setLiveResearch] = useState(true);
  const [minutes, setMinutes] = useState(3);

  useEffect(() => {
    aiStatus().then(setAi);
    const p = getProfile();
    if (p) applyProfile(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyProfile(p: ResumeProfile) {
    setProf(p);
    setLevel(p.level);
    if (p.role) setRole(p.role);
    setTopics(p.topics.filter((t) => TECH_TOPICS.includes(t)).slice(0, 6));
  }

  async function analyse(text: string) {
    if (text.trim().length < 80) { setErr("That resume text looks too short — upload the full resume or paste more."); return; }
    setErr(null);
    let p: ResumeProfile;
    if (ai?.available) {
      setBusy("The AI recruiter is reading your resume…");
      try { p = await callAI<ResumeProfile>("analyze", { text }); }
      catch (e) { setErr(`AI analysis failed (${(e as Error).message.slice(0, 80)}). Used offline analysis instead.`); p = analyseResumeOffline(text); }
    } else {
      p = analyseResumeOffline(text);
    }
    if (!LEVELS.includes(p.level)) p.level = levelFromYears(p.years || 0);
    p.topics = p.topics ?? []; p.skills = p.skills ?? []; p.focusAreas = p.focusAreas ?? []; p.likelyRounds = p.likelyRounds ?? [];
    setProfile(p); applyProfile(p); setBusy(null); setMode("resume");
  }

  async function onFile(f?: File) {
    if (!f) return;
    setBusy("Reading your resume…");
    try { const text = await extractResumeText(f); await analyse(text); }
    catch (e) { setErr(`Couldn't read that file: ${(e as Error).message}. Try PDF, DOCX or TXT, or paste the text.`); setBusy(null); }
  }

  const companyInfo = useMemo(() => getCompany(company), [company]);
  const toggle = (arr: string[], v: string, set: (a: string[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  function start() {
    const cfg: InterviewConfig = {
      mode, company: mode === "company" ? company || undefined : company || undefined,
      topics, level, role, questionCount, codingCount: rounds.includes("Coding") ? codingCount : 0,
      rounds, followUps: followUps && Boolean(ai?.available), voice, camera,
      liveResearch: liveResearch && Boolean(ai?.available), minutesPerQuestion: minutes,
    };
    if (mode === "company" && !company) { setErr("Pick a company for a company-wise mock."); return; }
    if (mode === "topic" && topics.length === 0) { setErr("Pick at least one topic for a topic-wise mock."); return; }
    try { sessionStorage.removeItem("ia.customQuestions"); } catch {}
    setPendingConfig(cfg);
    router.push("/interview");
  }

  return (
    <div className="space-y-8">
      <section className="grid items-end gap-6 pt-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="label mb-3">Mock interviews · resume-aware · company patterns</div>
          <h1 className="font-display text-4xl leading-[1.05] md:text-6xl">Sit the interview <em className="text-amber">before</em> the interview.</h1>
          <p className="mt-4 max-w-xl text-mute">Upload your resume and an AI panel reads it the way a recruiter would, then interviews you live. Questions appear on screen and are read aloud, you answer by voice, and coding tests run in the browser. At the end you get a hire / no-hire verdict and the questions most likely to come next.</p>
        </div>
        <div className="card p-4 text-sm">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${ai?.available ? "bg-good" : "bg-amber"}`} />
            <span className="font-semibold">{ai === null ? "Checking AI…" : ai.available ? "AI interviewer online" : "Offline mode"}</span>
          </div>
          <p className="mt-2 text-mute">{ai?.available
            ? "Gemini generates resume-specific questions, searches the web for recently reported questions, asks follow-ups and grades your answers."
            : <>Uses the built-in bank of 90+ questions, company patterns and keyword scoring. <Link className="text-teal underline" href="/settings">Add a free Gemini key</Link> for live AI interviews.</>}</p>
        </div>
      </section>

      {/* STEP 1 — Resume */}
      <section className="card p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div><div className="label">Step 1</div><h2 className="font-display text-2xl">Your resume</h2></div>
          {profile && <button className="text-xs text-mute hover:text-rose" onClick={() => { setProfile(undefined); setProf(undefined); }}>Remove</button>}
        </div>
        {!profile ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <button onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
              className="grid min-h-40 place-items-center rounded-2xl border-2 border-dashed border-line p-6 text-center transition hover:border-amber">
              <div>
                <div className="text-3xl">📄</div>
                <div className="mt-2 font-semibold">Upload resume</div>
                <div className="text-xs text-mute">PDF, DOCX or TXT · drag & drop · stays in your browser</div>
              </div>
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            <div className="flex flex-col gap-2">
              <textarea className="input min-h-32 flex-1 text-sm" placeholder="…or paste your resume text here" value={paste} onChange={(e) => setPaste(e.target.value)} />
              <button className="btn btn-ghost" onClick={() => analyse(paste)} disabled={!paste.trim() || Boolean(busy)}>Analyse pasted resume</button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.3fr]">
            <div className="rounded-2xl bg-panel2 p-4">
              <div className="font-display text-2xl">{profile.name || "Your profile"}</div>
              <div className="text-sm text-amber2">{profile.role}</div>
              <div className="mt-3 flex items-center gap-3">
                <label className="label">Experience</label>
                <input type="number" min={0} max={40} className="input py-1" style={{ width: 72 }} value={profile.years}
                  onChange={(e) => { const y = Number(e.target.value); const p = { ...profile, years: y, level: levelFromYears(y) }; setProf(p); setProfile(p); setLevel(p.level); }} />
                <span className="text-sm text-mute">yrs → {LEVEL_LABEL[profile.level]}</span>
              </div>
              <p className="mt-3 text-sm text-text/80">{profile.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">{profile.skills.slice(0, 16).map((s) => <span key={s} className="rounded-md bg-ink px-2 py-0.5 text-xs text-mute">{s}</span>)}</div>
              <div className="mt-3 text-xs text-mute">Analysed by {profile.analysedBy === "ai" ? "AI recruiter" : "offline parser"}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-line p-4">
                <div className="label mb-2">What they&apos;ll probe hardest</div>
                <ul className="space-y-1 text-sm">{profile.focusAreas.map((f) => <li key={f}>→ {f}</li>)}</ul>
              </div>
              <div className="rounded-2xl border border-line p-4">
                <div className="label mb-2">Likely rounds for this profile</div>
                <ol className="list-decimal space-y-1 pl-4 text-sm">{profile.likelyRounds.map((f) => <li key={f}>{f}</li>)}</ol>
              </div>
            </div>
          </div>
        )}
        {busy && <div className="mt-3 text-sm text-amber2">⏳ {busy}</div>}
      </section>

      {/* STEP 2 — Setup */}
      <section className="card p-5 md:p-6">
        <div className="label">Step 2</div>
        <h2 className="font-display text-2xl">Set up the interview</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {([
            ["resume", "Resume-based", "Questions an HR / hiring manager would ask after reading your resume"],
            ["company", "Company-wise", "Follows a company's reported rounds and question style"],
            ["topic", "Topic-wise", "Drill specific topics: JavaScript, React, Angular, Next.js…"],
          ] as const).map(([m, t, d]) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-2xl border p-4 text-left transition ${mode === m ? "border-amber bg-amber/10" : "border-line hover:border-mute"}`}>
              <div className="font-semibold">{t}</div><div className="mt-1 text-xs text-mute">{d}</div>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <div className="label mb-2">Company {mode !== "company" && <span className="normal-case tracking-normal">(optional)</span>}</div>
              <select className="input" value={company} onChange={(e) => setCompany(e.target.value)}>
                <option value="">Any / general market</option>
                {COMPANIES.map((c) => <option key={c.name} value={c.name}>{c.name} — {c.type}</option>)}
              </select>
              {companyInfo && (
                <div className="mt-2 rounded-xl bg-panel2 p-3 text-xs">
                  <div className="text-text/85">{companyInfo.notes}</div>
                  <div className="mt-2 text-mute">Reported rounds: {companyInfo.rounds.join(" → ")}</div>
                </div>
              )}
            </div>
            <div>
              <div className="label mb-2">Topics {mode === "resume" && <span className="normal-case tracking-normal">(pre-filled from resume)</span>}</div>
              <div className="flex flex-wrap gap-2">
                {TECH_TOPICS.map((t) => <span key={t} className="chip" data-on={topics.includes(t)} onClick={() => toggle(topics, t, setTopics)}>{t}</span>)}
              </div>
            </div>
            <div>
              <div className="label mb-2">Rounds to include</div>
              <div className="flex flex-wrap gap-2">
                {ROUND_OPTIONS.map((r) => <span key={r} className="chip" data-on={rounds.includes(r)} onClick={() => toggle(rounds, r, setRounds)}>{r}</span>)}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="label mb-2">Level</div>
                <select className="input" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
                  {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
                </select>
              </div>
              <div>
                <div className="label mb-2">Target role</div>
                <input className="input" value={role} onChange={(e) => setRole(e.target.value)} />
              </div>
              <div>
                <div className="label mb-2">Spoken questions: {questionCount}</div>
                <input type="range" min={3} max={20} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full accent-[var(--color-amber)]" />
              </div>
              <div>
                <div className="label mb-2">Coding tests: {rounds.includes("Coding") ? codingCount : 0}</div>
                <input type="range" min={0} max={4} value={codingCount} disabled={!rounds.includes("Coding")} onChange={(e) => setCodingCount(Number(e.target.value))} className="w-full accent-[var(--color-amber)]" />
              </div>
              <div className="col-span-2">
                <div className="label mb-2">Time per question: {minutes} min</div>
                <input type="range" min={1} max={10} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full accent-[var(--color-amber)]" />
              </div>
            </div>
            <div className="space-y-2 rounded-2xl border border-line p-4 text-sm">
              {([
                [voice, setVoice, "Voice mode", "Interviewer reads questions aloud; you answer by speaking (Chrome / Edge)", true],
                [camera, setCamera, "Camera on", "Shows your video like a real video call (nothing is recorded or uploaded)", true],
                [followUps, setFollowUps, "Follow-up questions", "Interviewer probes deeper based on your answer", ai?.available],
                [liveResearch, setLiveResearch, "Live market research", "Searches the web for recently reported questions before starting", ai?.available],
              ] as const).map(([v, set, t, d, enabled]) => (
                <label key={t} className={`flex cursor-pointer items-start gap-3 ${enabled ? "" : "opacity-45"}`}>
                  <input type="checkbox" className="mt-1 accent-[var(--color-amber)]" checked={Boolean(v) && Boolean(enabled)} disabled={!enabled} onChange={(e) => (set as (b: boolean) => void)(e.target.checked)} />
                  <span><span className="font-semibold">{t}</span><span className="block text-xs text-mute">{d}{!enabled && " — needs AI key"}</span></span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {err && <div className="mt-4 rounded-xl border border-rose/40 bg-rose/10 p-3 text-sm text-rose">{err}</div>}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button className="btn btn-primary px-6 py-3 text-base" onClick={start}>Start interview →</button>
          <span className="text-xs text-mute">~{questionCount * minutes + codingCount * 12} min · {mode === "resume" && !profile ? "No resume yet — questions will be based on level & topics" : "You can end early at any time"}</span>
        </div>
      </section>
    </div>
  );
}
