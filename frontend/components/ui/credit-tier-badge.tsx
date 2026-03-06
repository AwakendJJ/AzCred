import { cn } from "@/lib/utils"

type Tier = 1 | 2 | 3 | null

interface CreditTierBadgeProps {
  score: number
  className?: string
}

export function getTier(score: number): Tier {
  if (score === 0) return null
  if (score <= 33) return 1
  if (score <= 66) return 2
  return 3
}

export function getTierLimit(tier: Tier): string {
  if (!tier) return "—"
  return { 1: "100 tCTC", 2: "500 tCTC", 3: "1,000 tCTC" }[tier]
}

const tierConfig = {
  1: {
    label: "Tier 1",
    className: "border-red-500/40 bg-red-500/10 text-red-400",
    dotClass: "bg-red-400",
  },
  2: {
    label: "Tier 2",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    dotClass: "bg-amber-400",
  },
  3: {
    label: "Tier 3",
    className: "border-green-500/40 bg-green-500/10 text-green-400",
    dotClass: "bg-green-400",
  },
}

export function CreditTierBadge({ score, className }: CreditTierBadgeProps) {
  const tier = getTier(score)

  if (!tier) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          "border-white/20 bg-white/5 text-white/40",
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        No Credit
      </span>
    )
  }

  const config = tierConfig[tier]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
      {config.label} · {getTierLimit(tier)}
    </span>
  )
}
