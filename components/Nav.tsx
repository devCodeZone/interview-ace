"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "New interview" },
  { href: "/bank", label: "Question bank" },
  { href: "/companies", label: "Companies" },
  { href: "/history", label: "My results" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const path = usePathname();
  if (path?.startsWith("/interview")) return null;
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber font-display text-lg font-bold text-[#1b1300]">A</span>
          <span className="font-display text-xl tracking-tight">Interview<span className="text-amber">Ace</span></span>
        </Link>
        <nav className="flex flex-1 gap-1 overflow-x-auto text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`whitespace-nowrap rounded-lg px-3 py-1.5 ${path === l.href ? "bg-panel2 text-amber2" : "text-mute hover:text-text"}`}>{l.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
