"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type SR = {
  lang: string; continuous: boolean; interimResults: boolean;
  start: () => void; stop: () => void; abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null;
};

export function speechSupported() {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function useSpeechToText(lang = "en-IN") {
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SR | null>(null);
  const wantRef = useRef(false);

  const start = useCallback(() => {
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) { setError("Speech recognition is not supported in this browser — use Chrome or Edge, or type your answer."); return; }
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = lang; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e) => {
      let fin = ""; let int = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) fin += r[0].transcript + " "; else int += r[0].transcript;
      }
      if (fin) setFinalText((t) => (t + " " + fin).replace(/\s+/g, " ").trimStart());
      setInterim(int);
    };
    rec.onerror = (e) => { if (e.error !== "no-speech" && e.error !== "aborted") setError(`Mic error: ${e.error}`); };
    rec.onend = () => {
      setInterim("");
      if (wantRef.current) { try { rec.start(); } catch { /* ignore */ } } else setListening(false);
    };
    recRef.current = rec;
    wantRef.current = true;
    setError(null);
    try { rec.start(); setListening(true); } catch (err) { setError(String(err)); }
  }, [lang]);

  const stop = useCallback(() => { wantRef.current = false; recRef.current?.stop(); setListening(false); }, []);
  const reset = useCallback(() => { setFinalText(""); setInterim(""); }, []);

  useEffect(() => () => { wantRef.current = false; recRef.current?.abort(); }, []);
  return { listening, text: finalText, interim, setText: setFinalText, start, stop, reset, error };
}

export function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  u.voice = voices.find((v) => v.lang === "en-IN") || voices.find((v) => v.lang.startsWith("en") && /female|zira|samantha|google/i.test(v.name)) || voices.find((v) => v.lang.startsWith("en")) || null;
  u.rate = 1; u.pitch = 1;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}
export const stopSpeaking = () => { if (typeof window !== "undefined") window.speechSynthesis?.cancel(); };
