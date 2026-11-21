"use client";
import type { InterviewConfig, InterviewSession, ResumeProfile } from "./types";

const safe = <T,>(fn: () => T, fallback: T): T => { try { return fn(); } catch { return fallback; } };

export const getKey = () => safe(() => localStorage.getItem("ia.geminiKey") || "", "");
export const setKey = (k: string) => safe(() => localStorage.setItem("ia.geminiKey", k.trim()), undefined);

export const getProfile = (): ResumeProfile | undefined => safe(() => JSON.parse(localStorage.getItem("ia.profile") || "null") ?? undefined, undefined);
export const setProfile = (p?: ResumeProfile) => safe(() => p ? localStorage.setItem("ia.profile", JSON.stringify(p)) : localStorage.removeItem("ia.profile"), undefined);

export const getPendingConfig = (): InterviewConfig | undefined => safe(() => JSON.parse(sessionStorage.getItem("ia.config") || "null") ?? undefined, undefined);
export const setPendingConfig = (c: InterviewConfig) => safe(() => sessionStorage.setItem("ia.config", JSON.stringify(c)), undefined);

export const getSessions = (): InterviewSession[] => safe(() => JSON.parse(localStorage.getItem("ia.sessions") || "[]"), []);
export const getSession = (id: string) => getSessions().find((s) => s.id === id);
export function saveSession(s: InterviewSession) {
  const all = getSessions().filter((x) => x.id !== s.id);
  all.unshift(s);
  safe(() => localStorage.setItem("ia.sessions", JSON.stringify(all.slice(0, 30))), undefined);
}
export function deleteSession(id: string) {
  safe(() => localStorage.setItem("ia.sessions", JSON.stringify(getSessions().filter((x) => x.id !== id))), undefined);
}
