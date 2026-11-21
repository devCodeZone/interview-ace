"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { CodingProblem } from "@/lib/types";
import { runTests, type RunResult } from "@/lib/runner";

const CodeEditor = dynamic(() => import("./CodeEditor"), { ssr: false, loading: () => <div className="h-[340px] animate-pulse rounded-xl bg-panel2" /> });

export default function CodingPanel({ problem, code, setCode, onResult, height }: {
  problem: CodingProblem; code: string; setCode: (c: string) => void; onResult?: (r: RunResult) => void; height?: string;
}) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const passed = result?.results.filter((r) => r.pass).length ?? 0;

  async function run() {
    setRunning(true);
    const r = await runTests(code, problem.tests);
    setResult(r); onResult?.(r); setRunning(false);
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="label">{problem.kind === "js" ? "Coding test" : "Machine coding"}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${problem.difficulty === "hard" ? "bg-rose/15 text-rose" : problem.difficulty === "medium" ? "bg-amber/15 text-amber2" : "bg-good/15 text-good"}`}>{problem.difficulty}</span>
          {problem.companies.slice(0, 4).map((c) => <span key={c} className="text-xs text-mute">· {c}</span>)}
        </div>
        <h3 className="mt-1 font-display text-xl">{problem.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-text/85">{problem.prompt}</p>
        {problem.hints?.length ? (
          <button className="mt-1 text-xs text-teal underline-offset-2 hover:underline" onClick={() => setShowHints((s) => !s)}>{showHints ? "Hide hints" : "Show hints"}</button>
        ) : null}
        {showHints && <ul className="mt-1 list-disc pl-5 text-xs text-mute">{problem.hints!.map((h) => <li key={h}>{h}</li>)}</ul>}
      </div>
      <CodeEditor value={code} onChange={setCode} height={height} />
      <div className="flex flex-wrap items-center gap-3">
        {problem.tests.length > 0 ? (
          <button className="btn btn-ghost" onClick={run} disabled={running}>{running ? "Running…" : "▶ Run tests"}</button>
        ) : (
          <span className="text-xs text-mute">No automated tests — your code is reviewed by the AI interviewer when you submit.</span>
        )}
        {result && problem.tests.length > 0 && (
          <span className={`text-sm font-semibold ${passed === problem.tests.length ? "text-good" : "text-amber2"}`}>{passed}/{problem.tests.length} passed</span>
        )}
      </div>
      {result && (
        <div className="space-y-1 rounded-xl border border-line bg-ink p-3 font-mono text-xs">
          {result.error && <div className="text-rose">{result.error}</div>}
          {result.results.map((r) => (
            <div key={r.name} className={r.pass ? "text-good" : "text-rose"}>{r.pass ? "✓" : "✗"} {r.name}{r.error ? ` — ${r.error}` : ""} <span className="text-mute">({r.ms}ms)</span></div>
          ))}
          {result.logs.length > 0 && <div className="mt-2 border-t border-line pt-2 text-mute">{result.logs.slice(0, 30).map((l, i) => <div key={i}>› {l}</div>)}</div>}
        </div>
      )}
    </div>
  );
}
