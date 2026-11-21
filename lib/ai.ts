"use client";
import { getKey } from "./store";

export async function aiStatus(): Promise<{ available: boolean; serverKey: boolean }> {
  try {
    const r = await fetch("/api/ai");
    const j = await r.json();
    return { available: Boolean(j.serverKey || getKey()), serverKey: Boolean(j.serverKey) };
  } catch {
    return { available: Boolean(getKey()), serverKey: false };
  }
}

export async function callAI<T = unknown>(action: string, payload: unknown): Promise<T> {
  const key = getKey();
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(key ? { "x-gemini-key": key } : {}) },
    body: JSON.stringify({ action, payload }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || "AI error");
  return j as T;
}
