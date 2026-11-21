"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { InterviewSession } from "@/lib/types";
import { deleteSession, getSessions } from "@/lib/store";

export default function History() {
  const [list, setList] = useState<InterviewSession[]>([]);
  useEffect(() => setList(getSessions()), []);
  return (
    <div className="pt-4">
      <h1 className="font-display text-3xl">My results</h1>
      <p className="text-sm text-mute">Saved in this browser only.</p>
      {list.length === 0 && <div className="card mt-6 p-8 text-center text-mute">No interviews yet. <Link href="/" className="text-teal underline">Start one</Link></div>}
      {list.length > 1 && (
        <div className="card mt-6 p-5">
          <div className="label mb-3">Progress</div>
          <div className="flex h-28 items-end gap-2">
            {[...list].reverse().map((s) => (
              <div key={s.id} className="flex flex-1 flex-col items-center gap-1" title={new Date(s.createdAt).toLocaleString()}>
                <div className="w-full max-w-10 rounded-t bg-amber/80" style={{ height: `${(s.report?.overall ?? 0) * 10}%` }} />
                <span className="font-mono text-[10px] text-mute">{s.report?.overall.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 space-y-2">
        {list.map((s) => (
          <div key={s.id} className="card flex items-center gap-4 p-4">
            <div className="w-14 text-center font-display text-2xl text-amber2">{s.report?.overall.toFixed(1)}</div>
            <div className="flex-1">
              <div className="font-semibold">{s.config.company ? `${s.config.company} · ` : ""}{s.config.mode === "topic" ? s.config.topics.join(", ") : s.config.role}</div>
              <div className="text-xs text-mute">{new Date(s.createdAt).toLocaleString()} · {s.records.length} answers · {s.report?.verdict}</div>
            </div>
            <Link className="btn btn-ghost py-1.5 text-sm" href={`/report?id=${s.id}`}>Open</Link>
            <button className="text-xs text-mute hover:text-rose" onClick={() => { deleteSession(s.id); setList(getSessions()); }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
