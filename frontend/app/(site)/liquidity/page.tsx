"use client"

import { ArrowRight, Coins, TrendingUp, Shield, Lock } from "lucide-react"
import Link from "next/link"
import { ShimmerButton } from "@/components/shimmer-button"
import { Badge } from "@/components/ui/badge"

const upcomingFeatures = [
  {
    icon: Coins,
    title: "Deposit CTC",
    desc: "Liquidity providers deposit tCTC into shared lending pools and earn real-time yield as agents borrow.",
  },
  {
    icon: TrendingUp,
    title: "Dynamic APY",
    desc: "Interest rates are automatically adjusted based on pool utilization using a kink-rate model.",
  },
  {
    icon: Shield,
    title: "Risk-Tiered Pools",
    desc: "Separate pools for each credit tier let LPs choose their risk exposure — from conservative Tier 1 to high-yield Tier 3.",
  },
  {
    icon: Lock,
    title: "Reputation Collateral",
    desc: "Agent reputation acts as implicit collateral. Agents with degraded scores are blocked from new draws before defaults occur.",
  },
]

export default function LiquidityPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Hero */}
      <div className="mb-16 text-center">
        <Badge
          variant="outline"
          className="mb-4 border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs text-orange-400"
        >
          Coming Soon
        </Badge>
        <h1 className="mb-4 text-4xl font-bold text-white lg:text-5xl">
          Liquidity Providers
        </h1>
        <p className="mx-auto max-w-xl text-lg text-white/50">
          Fund the next generation of autonomous agents. Deposit CTC into AzCred
          lending pools and earn yield as AI agents borrow against their reputation.
        </p>
      </div>

      {/* Feature cards */}
      <div className="mb-16 grid gap-5 sm:grid-cols-2">
        {upcomingFeatures.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15">
              <f.icon className="h-5 w-5 text-orange-400" />
            </div>
            <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
            <p className="text-sm leading-relaxed text-white/50">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-8 text-center">
        <h2 className="mb-2 text-xl font-bold text-white">Interested in providing liquidity?</h2>
        <p className="mb-6 text-sm text-white/50">
          The MVP currently uses a manually funded pool. LP mechanics are next on the roadmap.
          Follow the project on GitHub for updates.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/dashboard">
            <ShimmerButton
              background="rgba(249,115,22,1)"
              borderRadius="10px"
              className="px-6 py-2.5 text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                Try the MVP <ArrowRight className="h-4 w-4" />
              </span>
            </ShimmerButton>
          </Link>
          <a
            href="https://docs.creditcoin.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-white/20 px-6 py-2.5 text-sm font-medium text-white/60 transition-colors hover:border-white/40 hover:text-white"
          >
            Creditcoin Docs
          </a>
        </div>
      </div>
    </div>
  )
}
