"use client";
import type { CodingTest } from "./types";

export interface TestResult { name: string; pass: boolean; error?: string; ms: number }
export interface RunResult { results: TestResult[]; logs: string[]; error?: string }

const WORKER = `
const fmt = (v) => { try { return typeof v === 'string' ? v : JSON.stringify(v); } catch { return String(v); } };
const deepEq = (a, b) => {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(k => deepEq(a[k], b[k]));
};
self.onmessage = async (e) => {
  const { code, tests } = e.data;
  const logs = [];
  const con = { log: (...a) => logs.push(a.map(fmt).join(' ')), error: (...a) => logs.push('ERROR: ' + a.map(fmt).join(' ')), warn: (...a) => logs.push('WARN: ' + a.map(fmt).join(' ')) };
  const results = [];
  try { new Function('console', code); } catch (err) { self.postMessage({ results: [], logs, error: 'Syntax error: ' + err.message }); return; }
  for (const t of tests) {
    const t0 = performance.now();
    try {
      const assert = (c, m) => { if (!c) throw new Error(m || 'Assertion failed'); };
      const deepEqual = (a, b, m) => { if (!deepEq(a, b)) throw new Error(m || ('Expected ' + fmt(b) + ' but got ' + fmt(a))); };
      const sleep = (ms) => new Promise(r => setTimeout(r, ms));
      const fn = new Function('console', 'assert', 'deepEqual', 'sleep', code + '\\n;return (async () => {' + t.code + '\\n})();');
      await fn(con, assert, deepEqual, sleep);
      results.push({ name: t.name, pass: true, ms: Math.round(performance.now() - t0) });
    } catch (err) {
      results.push({ name: t.name, pass: false, error: (err && err.message) || String(err), ms: Math.round(performance.now() - t0) });
    }
  }
  self.postMessage({ results, logs });
};`;

export function runTests(code: string, tests: CodingTest[], timeoutMs = 4000): Promise<RunResult> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER], { type: "text/javascript" }));
    const w = new Worker(url);
    const timer = setTimeout(() => { w.terminate(); URL.revokeObjectURL(url); resolve({ results: tests.map((t) => ({ name: t.name, pass: false, error: "Timed out (infinite loop?)", ms: timeoutMs })), logs: [], error: "Execution timed out" }); }, timeoutMs);
    w.onmessage = (e) => { clearTimeout(timer); w.terminate(); URL.revokeObjectURL(url); resolve(e.data as RunResult); };
    w.onerror = (e) => { clearTimeout(timer); w.terminate(); URL.revokeObjectURL(url); resolve({ results: [], logs: [], error: e.message }); };
    w.postMessage({ code, tests });
  });
}
