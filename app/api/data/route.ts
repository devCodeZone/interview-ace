import { NextRequest, NextResponse } from "next/server";
import { dbConfigured, sql, userFromRequest } from "@/lib/db";

export const runtime = "nodejs";

async function auth(req: NextRequest) {
  if (!dbConfigured) return { error: NextResponse.json({ error: "Storage not configured" }, { status: 503 }) };
  const u = await userFromRequest(req);
  if (!u) return { error: NextResponse.json({ error: "Not logged in" }, { status: 401 }) };
  return { u };
}

/** GET: everything for the logged-in user */
export async function GET(req: NextRequest) {
  const { u, error } = await auth(req);
  if (error) return error;
  const sessions = await sql!`SELECT data FROM ia_sessions WHERE username = ${u} AND deleted = false ORDER BY created_at DESC`;
  const prof = await sql!`SELECT data FROM ia_profiles WHERE username = ${u}`;
  const deleted = await sql!`SELECT id FROM ia_sessions WHERE username = ${u} AND deleted = true`;
  return NextResponse.json({ sessions: sessions.map((r) => r.data), profile: prof[0]?.data ?? null, deletedIds: deleted.map((r) => r.id) });
}

/** POST: upsert sessions and/or profile; delete sessions (soft delete, kept on server) */
export async function POST(req: NextRequest) {
  const { u, error } = await auth(req);
  if (error) return error;
  const body = await req.json();
  for (const s of (body.sessions ?? []) as { id: string; createdAt: number }[]) {
    if (!s?.id) continue;
    await sql!`INSERT INTO ia_sessions (id, username, data, created_at) VALUES (${s.id}, ${u}, ${JSON.stringify(s)}::jsonb, to_timestamp(${(s.createdAt || Date.now()) / 1000}))
      ON CONFLICT (username, id) DO UPDATE SET data = EXCLUDED.data`;
  }
  for (const id of (body.deleteIds ?? []) as string[]) {
    await sql!`UPDATE ia_sessions SET deleted = true WHERE username = ${u} AND id = ${id}`;
  }
  if ("profile" in body) {
    if (body.profile) await sql!`INSERT INTO ia_profiles (username, data) VALUES (${u}, ${JSON.stringify(body.profile)}::jsonb) ON CONFLICT (username) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
    else await sql!`DELETE FROM ia_profiles WHERE username = ${u}`;
  }
  return NextResponse.json({ ok: true });
}
