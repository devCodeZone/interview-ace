import { NextRequest, NextResponse } from "next/server";
import { checkPin, dbConfigured, ensureSchema, hashPin, newToken, normalise, sql, validPin, validUsername, userFromRequest } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!dbConfigured) return NextResponse.json({ configured: false });
  const u = req.nextUrl.searchParams.get("check");
  await ensureSchema();
  if (u) {
    const rows = await sql!`SELECT 1 FROM ia_users WHERE username = ${normalise(u)}`;
    return NextResponse.json({ configured: true, available: rows.length === 0 && validUsername(u) });
  }
  const me = await userFromRequest(req);
  return NextResponse.json({ configured: true, username: me });
}

export async function POST(req: NextRequest) {
  if (!dbConfigured) return NextResponse.json({ error: "Storage is not configured on the server yet." }, { status: 503 });
  await ensureSchema();
  const { action, username = "", pin = "" } = await req.json();
  const display = String(username).trim();
  const key = normalise(display);

  if (action === "logout") {
    const auth = req.headers.get("authorization") || "";
    if (auth.startsWith("Bearer ")) await sql!`DELETE FROM ia_tokens WHERE token = ${auth.slice(7)}`;
    return NextResponse.json({ ok: true });
  }
  if (!validUsername(display)) return NextResponse.json({ error: "Username must be 3–24 letters, numbers, dot, dash or underscore." }, { status: 400 });
  if (!validPin(String(pin))) return NextResponse.json({ error: "PIN must be 4–8 digits." }, { status: 400 });

  if (action === "register") {
    const { salt, hash } = hashPin(String(pin));
    const inserted = await sql!`INSERT INTO ia_users (username, display, pin_hash, salt) VALUES (${key}, ${display}, ${hash}, ${salt}) ON CONFLICT (username) DO NOTHING RETURNING username`;
    if (!inserted.length) return NextResponse.json({ error: `"${display}" is already taken. Choose another username, or log in if it's yours.` }, { status: 409 });
    const token = newToken();
    await sql!`INSERT INTO ia_tokens (token, username) VALUES (${token}, ${key})`;
    return NextResponse.json({ username: display, token });
  }

  if (action === "login") {
    const rows = await sql!`SELECT display, pin_hash, salt, failed, locked_until FROM ia_users WHERE username = ${key}`;
    const u = rows[0];
    if (!u) return NextResponse.json({ error: `No account called "${display}". Create it instead.` }, { status: 404 });
    if (u.locked_until && new Date(u.locked_until) > new Date()) return NextResponse.json({ error: "Too many wrong PINs. Try again in 15 minutes." }, { status: 429 });
    if (!checkPin(String(pin), u.salt, u.pin_hash)) {
      const failed = (u.failed ?? 0) + 1;
      if (failed >= 8) await sql!`UPDATE ia_users SET failed = 0, locked_until = now() + interval '15 minutes' WHERE username = ${key}`;
      else await sql!`UPDATE ia_users SET failed = ${failed} WHERE username = ${key}`;
      return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
    }
    await sql!`UPDATE ia_users SET failed = 0, locked_until = NULL WHERE username = ${key}`;
    const token = newToken();
    await sql!`INSERT INTO ia_tokens (token, username) VALUES (${token}, ${key})`;
    return NextResponse.json({ username: u.display, token });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
