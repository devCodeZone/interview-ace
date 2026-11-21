"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCoding } from "@/lib/data/coding";
import CodingPanel from "@/components/CodingPanel";

function Practice() {
  const id = useSearchParams().get("id") || "";
  const p = getCoding(id);
  const [code, setCode] = useState("");
  useEffect(() => { if (p) setCode(p.starter); }, [p]);
  if (!p) return <div className="mt-20 text-center text-mute">Problem not found. <Link className="text-teal underline" href="/bank">Back to bank</Link></div>;
  return (
    <div className="space-y-4 pt-4">
      <Link href="/bank" className="text-sm text-mute hover:text-text">← Question bank</Link>
      <div className="card p-5"><CodingPanel problem={p} code={code} setCode={setCode} height="420px" /></div>
    </div>
  );
}
export default function Page() { return <Suspense><Practice /></Suspense>; }
