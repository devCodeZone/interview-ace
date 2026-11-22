"use client";
import { useEffect, useState } from "react";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallButton() {
  const [evt, setEvt] = useState<BIP | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    setInstalled(Boolean(standalone));
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIP); };
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", () => { setInstalled(true); setEvt(null); });
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  if (installed || (!evt && !ios)) return null;
  return (
    <div className="relative">
      <button className="btn btn-ghost px-3 py-1.5 text-sm" onClick={async () => { if (evt) { await evt.prompt(); await evt.userChoice; setEvt(null); } else setHelp((x) => !x); }}>⬇ Install app</button>
      {help && (
        <div className="absolute right-0 top-11 z-40 w-64 rounded-xl border border-line bg-panel p-3 text-xs shadow-xl">
          On iPhone / iPad: open this site in <b>Safari</b>, tap the <b>Share</b> button, then <b>Add to Home Screen</b>.
        </div>
      )}
    </div>
  );
}
