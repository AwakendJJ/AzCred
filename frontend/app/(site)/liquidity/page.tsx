"use client"

import { ArrowRight, Coins, TrendingUp, Shield, Lock } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

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
      <div className="mb-12 text-center">
        <Badge
          variant="outline"
          className="mb-5 border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs text-orange-400"
        >
          Coming Soon
        </Badge>
        <h1 className="mb-4 text-4xl font-bold text-white lg:text-5xl">
          Liquidity Providers
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-white/50">
          Fund the next generation of autonomous agents. Deposit CTC into AzCred
          lending pools and earn yield as AI agents borrow against their reputation.
        </p>
      </div>

      <Separator className="mb-12 bg-white/8" />

      {/* Feature cards */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        {upcomingFeatures.map((f) => (
          <Card
            key={f.title}
            className="border-white/10 bg-white/[0.04] backdrop-blur-sm transition-all duration-300 hover:border-orange-500/30 hover:bg-white/[0.07]"
          >
            <CardHeader className="pb-3">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15">
                <f.icon className="h-5 w-5 text-orange-400" />
              </div>
              <h3 className="font-semibold text-white">{f.title}</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-white/50">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <Card className="relative overflow-hidden border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />
        <CardContent className="relative px-8 py-10 text-center">
          <h2 className="mb-2 text-xl font-bold text-white">
            Interested in providing liquidity?
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-white/50">
            The MVP currently uses a manually funded pool. LP mechanics are next on the
            roadmap. Follow the project on GitHub for updates.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 font-semibold shadow-lg shadow-orange-500/20 transition-all duration-300 hover:scale-105">
                Try the MVP
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <a
              href="https://docs.creditcoin.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="border-white/20 bg-transparent text-white/60 hover:bg-white/5 hover:text-white px-6 transition-all duration-300"
              >
                Creditcoin Docs
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
