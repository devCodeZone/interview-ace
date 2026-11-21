"use client";
import { useEffect, useState } from "react";
import { getKey, setKey } from "@/lib/store";
import { aiStatus, callAI } from "@/lib/ai";

export default function Settings() {
  const [k, setK] = useState("");
  const [server, setServer] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { setK(getKey()); aiStatus().then((s) => setServer(s.serverKey)); }, []);
  async function test() {
    setKey(k); setMsg("Testing…");
    try {
      await callAI("evaluate", { question: { question: "What is a closure?", kind: "theory", topic: "JavaScript", points: [] }, answer: "A function that remembers its outer scope.", level: "mid" });
      setMsg("✓ Key works — AI interviewer is enabled.");
    } catch (e) { setMsg(`✗ ${(e as Error).message.slice(0, 200)}`); }
  }
  return (
    <div className="max-w-2xl space-y-4 pt-4">
      <h1 className="font-display text-3xl">Settings</h1>
      <div className="card space-y-3 p-5">
        <div className="label">AI interviewer (Google Gemini — free tier)</div>
        <p className="text-sm text-mute">{server ? "This deployment already has a server key, so AI works for everyone. You can add your own key to use your own free quota." : "Add your own free Gemini API key to unlock AI resume analysis, live market research, follow-up questions and detailed grading."} Get one at <a className="text-teal underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a>. Your key is kept only in this browser and sent only to this app&apos;s server to call Gemini.</p>
        <input className="input font-mono text-sm" type="password" placeholder="AIza…" value={k} onChange={(e) => setK(e.target.value)} />
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={test} disabled={!k.trim()}>Save &amp; test</button>
          <button className="btn btn-ghost" onClick={() => { setKey(""); setK(""); setMsg("Key removed."); }}>Remove</button>
        </div>
        {msg && <div className="text-sm">{msg}</div>}
      </div>
      <div className="card space-y-2 p-5 text-sm text-mute">
        <div className="label">Privacy</div>
        <p>Your resume is read in your browser. In AI mode its text is sent to Gemini to generate questions. Interview results are stored only in this browser&apos;s local storage. Camera video is shown only to you and never recorded or uploaded.</p>
        <p>Voice recognition uses your browser&apos;s built-in speech service (best in Chrome or Edge).</p>
      </div>
    </div>
  );
}
