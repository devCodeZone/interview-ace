import "server-only";
import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED;
export const dbConfigured = Boolean(URL);
type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>;

/** Neon's HTTP driver in production; plain node-postgres for a local Postgres during development. */
function makeSql(url: string): Sql {
  if (/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require("pg") as typeof import("pg");
    const pool = new Pool({ connectionString: url });
    return async (strings, ...values) => {
      const text = strings.reduce((acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""), "");
      return (await pool.query(text, values)).rows;
    };
  }
  return neon(url) as unknown as Sql;
}
export const sql: Sql | null = URL ? makeSql(URL) : null;

let ready: Promise<void> | null = null;
export function ensureSchema() {
  if (!sql) throw new Error("STORAGE_NOT_CONFIGURED");
  ready ??= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS ia_users (
      username TEXT PRIMARY KEY, display TEXT NOT NULL, pin_hash TEXT NOT NULL, salt TEXT NOT NULL,
      failed INT NOT NULL DEFAULT 0, locked_until TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS ia_tokens (
      token TEXT PRIMARY KEY, username TEXT NOT NULL REFERENCES ia_users(username) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS ia_sessions (
      id TEXT NOT NULL, username TEXT NOT NULL REFERENCES ia_users(username) ON DELETE CASCADE,
      data JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted BOOLEAN NOT NULL DEFAULT false,
      PRIMARY KEY (username, id))`;
    await sql`CREATE TABLE IF NOT EXISTS ia_profiles (
      username TEXT PRIMARY KEY REFERENCES ia_users(username) ON DELETE CASCADE, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

export const normalise = (u: string) => u.trim().toLowerCase();
export const validUsername = (u: string) => /^[a-zA-Z0-9_.-]{3,24}$/.test(u.trim());
export const validPin = (p: string) => /^\d{4,8}$/.test(p);

export function hashPin(pin: string, salt = randomBytes(16).toString("hex")) {
  return { salt, hash: scryptSync(pin, salt, 32).toString("hex") };
}
export function checkPin(pin: string, salt: string, hash: string) {
  const h = scryptSync(pin, salt, 32);
  const b = Buffer.from(hash, "hex");
  return b.length === h.length && timingSafeEqual(b, h);
}
export const newToken = () => randomBytes(24).toString("base64url");

export async function userFromRequest(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !sql) return null;
  await ensureSchema();
  const rows = await sql`SELECT username FROM ia_tokens WHERE token = ${token}`;
  return rows[0]?.username ?? null;
}
