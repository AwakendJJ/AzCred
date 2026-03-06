import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  sub?: string
  className?: string
  accent?: boolean
}

export function StatCard({ label, value, sub, className, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 px-4 py-3",
        accent && "border-orange-500/30 bg-orange-500/5",
        className
      )}
    >
      <p className="text-xs text-white/50">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-lg font-bold",
          accent ? "text-orange-400" : "text-white"
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-white/30">{sub}</p>}
    </div>
  )
}
