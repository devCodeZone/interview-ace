"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuth, getSyncState, setAuth, type SyncState } from "@/lib/store";
import InstallButton from "./InstallButton";

const LINKS = [
  { href: "/", label: "New interview" },
  { href: "/history", label: "My progress" },
  { href: "/bank", label: "Question bank" },
  { href: "/companies", label: "Companies" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const path = usePathname();
  const [user, setUser] = useState<string | null>(null);
  const [sync, setSync] = useState<SyncState>("local");
  useEffect(() => {
    const a = () => setUser(getAuth()?.username ?? null);
    const s = (e: Event) => setSync((e as CustomEvent).detail);
    a(); setSync(getSyncState());
    window.addEventListener("ia-auth", a); window.addEventListener("ia-sync", s);
    return () => { window.removeEventListener("ia-auth", a); window.removeEventListener("ia-sync", s); };
  }, []);
  if (path?.startsWith("/interview")) return null;

  async function logout() {
    const a = getAuth();
    if (!confirm("Log out on this device? Your data stays saved in your account.")) return;
    if (a) fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${a.token}` }, body: JSON.stringify({ action: "logout" }) }).catch(() => {});
    setAuth(null);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-ink/85 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber font-display text-lg font-bold text-[#1b1300]">A</span>
          <span className="hidden font-display text-xl tracking-tight sm:inline">Interview<span className="text-amber">Ace</span></span>
        </Link>
        {user && (
          <nav className="flex flex-1 gap-1 overflow-x-auto text-sm">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={`whitespace-nowrap rounded-lg px-3 py-1.5 ${path === l.href ? "bg-panel2 text-amber2" : "text-mute hover:text-text"}`}>{l.label}</Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <InstallButton />
          {user && (
            <div className="flex items-center gap-2 rounded-xl border border-line px-2.5 py-1 text-sm">
              <span title={sync === "synced" ? "All data saved to your account" : sync === "syncing" ? "Saving…" : sync === "offline" ? "Offline — will save when you're back online" : ""}
                className={`h-2 w-2 rounded-full ${sync === "synced" ? "bg-good" : sync === "syncing" ? "animate-pulse bg-amber" : sync === "offline" ? "bg-rose" : "bg-mute"}`} />
              <span className="max-w-24 truncate font-semibold">{user}</span>
              <button className="text-xs text-mute hover:text-rose" onClick={logout}>Log out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
