"use client";
import { useEffect, useRef, useState } from "react";
import { adoptGuestData, getAuth, pullAll, setAuth, type Auth } from "@/lib/store";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [auth, setA] = useState<Auth | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sync = () => setA(getAuth());
    sync();
    window.addEventListener("ia-auth", sync);
    return () => window.removeEventListener("ia-auth", sync);
  }, []);

  useEffect(() => {
    if (!auth) return;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 5000);
    pullAll().finally(() => { clearTimeout(t); setLoading(false); });
    const online = () => void pullAll();
    window.addEventListener("online", online);
    return () => { clearTimeout(t); window.removeEventListener("online", online); };
  }, [auth?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (auth === undefined) return null;
  if (!auth) return <Login onDone={(a) => { setAuth(a); adoptGuestData(); }} />;
  if (loading) return <div className="mt-32 text-center text-mute"><div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-amber border-t-transparent" />Loading your interviews…</div>;
  return <>{children}</>;
}

function Login({ onDone }: { onDone: (a: Auth) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [avail, setAvail] = useState<boolean | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { fetch("/api/auth").then((r) => r.json()).then((j) => setConfigured(j.configured !== false)).catch(() => {}); }, []);

  useEffect(() => {
    if (mode !== "register" || username.trim().length < 3) { setAvail(null); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch(`/api/auth?check=${encodeURIComponent(username.trim())}`).then((r) => r.json()).then((j) => setAvail(j.available ?? null)).catch(() => setAvail(null));
    }, 350);
  }, [username, mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (mode === "register" && pin !== pin2) { setErr("PINs don't match."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: mode, username, pin }) });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "Something went wrong."); if (r.status === 404) setMode("register"); }
      else onDone({ username: j.username, token: j.token });
    } catch { setErr("Can't reach the server — check your internet connection."); }
    setBusy(false);
  }

  return (
    <div className="mx-auto mt-10 grid max-w-4xl items-center gap-8 md:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="label mb-3">Mock interviews · resume-aware · company patterns</div>
        <h1 className="font-display text-4xl leading-[1.05] md:text-5xl">Sit the interview <em className="text-amber">before</em> the interview.</h1>
        <p className="mt-4 text-mute">Your own account keeps every mock interview, score and report safe on the server, so it&apos;s the same on your phone, tablet and laptop.</p>
      </div>
      <form onSubmit={submit} className="card space-y-4 p-6">
        <div className="flex rounded-xl border border-line p-0.5">
          {(["login", "register"] as const).map((m) => (
            <button type="button" key={m} onClick={() => { setMode(m); setErr(null); }} className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === m ? "bg-panel2 text-amber2" : "text-mute"}`}>{m === "login" ? "Log in" : "Create username"}</button>
          ))}
        </div>
        <div>
          <label className="label mb-1.5 block">Username</label>
          <input className="input" autoFocus autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="e.g. Sujata" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} maxLength={24} />
          {mode === "register" && avail !== null && <div className={`mt-1 text-xs ${avail ? "text-good" : "text-rose"}`}>{avail ? "✓ Available — it will be yours permanently" : "✗ Taken or invalid (3–24 letters, numbers, . _ -)"}</div>}
        </div>
        <div className={mode === "register" ? "grid grid-cols-2 gap-3" : ""}>
          <div>
            <label className="label mb-1.5 block">{mode === "register" ? "Set a PIN" : "PIN"}</label>
            <input className="input tracking-[.4em]" type="password" inputMode="numeric" autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} />
          </div>
          {mode === "register" && (
            <div>
              <label className="label mb-1.5 block">Repeat PIN</label>
              <input className="input tracking-[.4em]" type="password" inputMode="numeric" autoComplete="new-password" placeholder="••••" value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 8))} />
            </div>
          )}
        </div>
        {mode === "register" && <p className="text-xs text-mute">The 4–8 digit PIN stops anyone else who types your username from opening your results. You stay logged in on each device, so you&apos;ll rarely need it.</p>}
        {!configured && <div className="rounded-lg bg-amber/10 p-2 text-xs text-amber2">Account storage isn&apos;t connected on the server yet.</div>}
        {err && <div className="rounded-lg bg-rose/10 p-2 text-sm text-rose">{err}</div>}
        <button className="btn btn-primary w-full py-3" disabled={busy || username.trim().length < 3 || pin.length < 4 || (mode === "register" && avail === false)}>
          {busy ? "Please wait…" : mode === "login" ? "Enter" : "Create & enter"}
        </button>
      </form>
    </div>
  );
}
