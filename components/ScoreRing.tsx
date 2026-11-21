export default function ScoreRing({ score, size = 140, label }: { score: number; size?: number; label?: string }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 10));
  const color = score >= 7.5 ? "var(--color-good)" : score >= 6 ? "var(--color-teal)" : score >= 4.5 ? "var(--color-amber)" : "var(--color-rose)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-line)" strokeWidth={10} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 1s" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-4xl" style={{ color }}>{score.toFixed(1)}</div>
          <div className="label">{label ?? "out of 10"}</div>
        </div>
      </div>
    </div>
  );
}
