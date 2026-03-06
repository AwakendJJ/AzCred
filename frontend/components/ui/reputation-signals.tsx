import { cn } from "@/lib/utils"

interface Signal {
  label: string
  value: number | null
  weight: string
}

interface ReputationSignalsProps {
  successRate: number | null
  uptime: number | null
  starred: number | null
  className?: string
}

function SignalBar({ value }: { value: number | null }) {
  const pct = value ?? 0
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          pct >= 67
            ? "bg-green-400"
            : pct >= 34
            ? "bg-amber-400"
            : "bg-red-400"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function ReputationSignals({
  successRate,
  uptime,
  starred,
  className,
}: ReputationSignalsProps) {
  const signals: Signal[] = [
    { label: "Success Rate", value: successRate, weight: "40%" },
    { label: "Uptime", value: uptime, weight: "35%" },
    { label: "Starred", value: starred, weight: "25%" },
  ]

  return (
    <div className={cn("space-y-3", className)}>
      {signals.map((s) => (
        <div key={s.label}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-white/50">
              {s.label}
              <span className="ml-1 text-white/30">({s.weight})</span>
            </span>
            <span className="text-xs font-medium text-white">
              {s.value !== null ? `${s.value}/100` : "—"}
            </span>
          </div>
          <SignalBar value={s.value} />
        </div>
      ))}
    </div>
  )
}
