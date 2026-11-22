"use client";
import type { InterviewConfig, InterviewSession, ResumeProfile } from "./types";

const safe = <T,>(fn: () => T, fallback: T): T => { try { return fn(); } catch { return fallback; } };

// ---------------- Auth ----------------
export interface Auth { username: string; token: string }
export const getAuth = (): Auth | null => safe(() => JSON.parse(localStorage.getItem("ia.auth") || "null"), null);
export const setAuth = (a: Auth | null) => safe(() => { if (a) localStorage.setItem("ia.auth", JSON.stringify(a)); else localStorage.removeItem("ia.auth"); window.dispatchEvent(new Event("ia-auth")); }, undefined);

/** Per-user key so people sharing a device never see each other's data */
const k = (name: string) => `ia.u.${(getAuth()?.username || "guest").toLowerCase()}.${name}`;
const read = <T,>(name: string, fallback: T): T => safe(() => JSON.parse(localStorage.getItem(k(name)) || "null") ?? fallback, fallback);
const write = (name: string, v: unknown) => safe(() => localStorage.setItem(k(name), JSON.stringify(v)), undefined);

// ---------------- Gemini key (device-level) ----------------
export const getKey = () => safe(() => localStorage.getItem("ia.geminiKey") || "", "");
export const setKey = (key: string) => safe(() => localStorage.setItem("ia.geminiKey", key.trim()), undefined);

// ---------------- Profile ----------------
export const getProfile = (): ResumeProfile | undefined => read<ResumeProfile | null>("profile", null) ?? undefined;
export function setProfile(p?: ResumeProfile) {
  write("profile", p ?? null);
  queue({ profile: p ?? null });
}

// ---------------- Pending interview config (tab-level) ----------------
export const getPendingConfig = (): InterviewConfig | undefined => safe(() => JSON.parse(sessionStorage.getItem("ia.config") || "null") ?? undefined, undefined);
export const setPendingConfig = (c: InterviewConfig) => safe(() => sessionStorage.setItem("ia.config", JSON.stringify(c)), undefined);

// ---------------- Sessions ----------------
export const getSessions = (): InterviewSession[] => read<InterviewSession[]>("sessions", []);
export const getSession = (id: string) => getSessions().find((s) => s.id === id);
export function saveSession(s: InterviewSession) {
  const all = getSessions().filter((x) => x.id !== s.id);
  all.unshift(s);
  write("sessions", all.sort((a, b) => b.createdAt - a.createdAt));
  queue({ sessionIds: [s.id] });
}
export function deleteSession(id: string) {
  write("sessions", getSessions().filter((x) => x.id !== id));
  queue({ deleteIds: [id] });
}

// ---------------- Sync with server ----------------
interface Pending { sessionIds: string[]; deleteIds: string[]; profile?: ResumeProfile | null; hasProfile?: boolean }
const getPending = (): Pending => read<Pending>("pending", { sessionIds: [], deleteIds: [] });

function queue(change: { sessionIds?: string[]; deleteIds?: string[]; profile?: ResumeProfile | null }) {
  if (!getAuth()) return;
  const p = getPending();
  p.sessionIds = Array.from(new Set([...p.sessionIds, ...(change.sessionIds ?? [])]));
  p.deleteIds = Array.from(new Set([...p.deleteIds, ...(change.deleteIds ?? [])]));
  if ("profile" in change) { p.profile = change.profile; p.hasProfile = true; }
  write("pending", p);
  void flush();
}

export type SyncState = "synced" | "syncing" | "offline" | "local";
let syncState: SyncState = "local";
const setSync = (s: SyncState) => { syncState = s; safe(() => window.dispatchEvent(new CustomEvent("ia-sync", { detail: s })), undefined); };
export const getSyncState = () => syncState;

let flushing: Promise<boolean> | null = null;
export function flush(): Promise<boolean> {
  const a = getAuth();
  if (!a) return Promise.resolve(false);
  flushing ??= (async () => {
    const p = getPending();
    if (!p.sessionIds.length && !p.deleteIds.length && !p.hasProfile) { setSync("synced"); return true; }
    setSync("syncing");
    const all = getSessions();
    const body: Record<string, unknown> = {
      sessions: all.filter((s) => p.sessionIds.includes(s.id)),
      deleteIds: p.deleteIds,
    };
    if (p.hasProfile) body.profile = p.profile ?? null;
    try {
      const r = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${a.token}` }, body: JSON.stringify(body) });
      if (r.status === 401) { setAuth(null); return false; }
      if (!r.ok) throw new Error(String(r.status));
      // Only clear what we sent (new changes may have queued meanwhile)
      const now = getPending();
      write("pending", {
        sessionIds: now.sessionIds.filter((id) => !p.sessionIds.includes(id)),
        deleteIds: now.deleteIds.filter((id) => !p.deleteIds.includes(id)),
        ...(now.hasProfile && now.profile !== p.profile ? { profile: now.profile, hasProfile: true } : {}),
      });
      setSync("synced");
      return true;
    } catch {
      setSync("offline");
      return false;
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

/** Push unsynced local changes, then pull the server copy and merge. Server is the source of truth. */
export async function pullAll(): Promise<boolean> {
  const a = getAuth();
  if (!a) return false;
  await flush();
  try {
    setSync("syncing");
    const r = await fetch("/api/data", { headers: { Authorization: `Bearer ${a.token}` } });
    if (r.status === 401) { setAuth(null); return false; }
    if (!r.ok) throw new Error(String(r.status));
    const { sessions, profile, deletedIds } = (await r.json()) as { sessions: InterviewSession[]; profile: ResumeProfile | null; deletedIds: string[] };
    const pending = getPending();
    const local = getSessions().filter((s) => pending.sessionIds.includes(s.id)); // unsynced local wins
    const map = new Map<string, InterviewSession>();
    sessions.forEach((s) => map.set(s.id, s));
    local.forEach((s) => map.set(s.id, s));
    deletedIds.forEach((id) => map.delete(id));
    write("sessions", [...map.values()].sort((a2, b) => b.createdAt - a2.createdAt));
    if (!pending.hasProfile) write("profile", profile);
    setSync(getPending().sessionIds.length ? "offline" : "synced");
    return true;
  } catch {
    setSync("offline");
    return false;
  }
}

/** One-time: move data saved before accounts existed into the new account */
export function adoptGuestData() {
  const guest = safe(() => JSON.parse(localStorage.getItem("ia.sessions") || "[]"), []) as InterviewSession[];
  const guestProfile = safe(() => JSON.parse(localStorage.getItem("ia.profile") || "null"), null) as ResumeProfile | null;
  if (guest.length) {
    const have = new Set(getSessions().map((s) => s.id));
    const merged = [...getSessions(), ...guest.filter((s) => !have.has(s.id))].sort((a, b) => b.createdAt - a.createdAt);
    write("sessions", merged);
    queue({ sessionIds: guest.map((s) => s.id) });
    safe(() => localStorage.removeItem("ia.sessions"), undefined);
  }
  if (guestProfile && !getProfile()) { setProfile(guestProfile); }
  if (guestProfile) safe(() => localStorage.removeItem("ia.profile"), undefined);
}
