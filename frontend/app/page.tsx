"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Menu, Bot, Shield, TrendingUp, CheckCircle, Circle, Fingerprint, Star, Repeat2, Puzzle, Layers, FileSearch } from "lucide-react"
import { LineShadowText } from "@/components/line-shadow-text"
import { ShimmerButton } from "@/components/shimmer-button"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const steps = [
  {
    icon: Bot,
    title: "Register Agent",
    desc: "Deploy your AI agent and register it in the ERC-8004 Identity Registry to receive a unique on-chain agentId.",
  },
  {
    icon: Shield,
    title: "Get Scored",
    desc: "AzCred reads your agent's on-chain reputation signals — success rate, uptime, and quality — to compute a credit score.",
  },
  {
    icon: TrendingUp,
    title: "Borrow tCTC",
    desc: "Based on your score, your agent is assigned a CTC credit line it can draw from to fund operations autonomously.",
  },
]

const roadmap = [
  { phase: "Phase 1", label: "Agent Credit Lines", desc: "MVP live on Creditcoin testnet", active: true },
  { phase: "Phase 2", label: "Liquidity Pools", desc: "Capital providers deposit CTC and earn yield", active: false },
  { phase: "Phase 3", label: "Agent-to-Agent Credit", desc: "Agents extend credit to other agents", active: false },
]

const stats = [
  { value: "3", label: "Credit Tiers" },
  { value: "0", label: "Human Underwriters" },
  { value: "100%", label: "On-Chain & Autonomous" },
  { value: "ERC-8004", label: "Identity Standard" },
]

const agentFeatures = [
  {
    icon: Fingerprint,
    title: "Trustless Identity",
    desc: "Your agent gets a unique on-chain agentId via the ERC-8004 Identity Registry — no KYC, no passwords, no middlemen.",
    badge: "Live",
    live: true,
  },
  {
    icon: Star,
    title: "Reputation-Backed Credit",
    desc: "AzCred reads your agent's on-chain reputation signals — success rate, uptime, task quality — and converts them into a credit score.",
    badge: "Live",
    live: true,
  },
  {
    icon: Repeat2,
    title: "Autonomous Draw & Repay",
    desc: "Agents draw from their credit line on demand and repay autonomously. No approvals, no intermediaries, no delays.",
    badge: "Live",
    live: true,
  },
]

const protocolFeatures = [
  {
    icon: Puzzle,
    title: "ERC-8004 Integration",
    desc: "AzCred is built natively on the ERC-8004 stack — plug in your own Identity, Reputation, or Validation registries.",
    badge: "Open Standard",
    live: true,
  },
  {
    icon: Layers,
    title: "Open Credit Pools",
    desc: "Liquidity providers will deposit CTC into shared pools. Agents draw from the pool; providers earn yield from repayment interest.",
    badge: "Coming Soon",
    live: false,
  },
  {
    icon: FileSearch,
    title: "On-Chain Audit Trail",
    desc: "Every credit assignment, draw, and repayment is emitted as on-chain events — fully auditable, fully transparent.",
    badge: "Live",
    live: true,
  },
]

const faqs = [
  {
    q: "What is ERC-8004 and why does it matter for AI agents?",
    a: "ERC-8004 is the 'Trustless Agents' standard that gives AI agents a verifiable on-chain identity, a reputation ledger, and a validation registry. Instead of trusting an API key or a human attestation, any protocol can look up an agent's on-chain track record and make autonomous decisions based on it.",
  },
  {
    q: "How does AzCred assign a credit line to my agent?",
    a: "AzCred reads three reputation signals from the ERC-8004 Reputation Registry — success rate, uptime, and task quality. These are combined into a score that maps to one of three credit tiers (Tier 1: 10 tCTC, Tier 2: 50 tCTC, Tier 3: 100 tCTC). No human ever reviews the application.",
  },
  {
    q: "What is tCTC and how do agents borrow it?",
    a: "tCTC is the testnet version of CTC, the native token of the Creditcoin blockchain. An agent with an assigned credit line calls drawCredit(agentId, amount) on the AzCredCreditLine contract. The requested amount is transferred directly to the agent's wallet — no forms, no waiting.",
  },
  {
    q: "Is this live on mainnet?",
    a: "AzCred is currently deployed on the Creditcoin testnet. All credit is in tCTC (testnet tokens) with no real monetary value. A mainnet deployment is planned after the MVP phase is validated.",
  },
  {
    q: "How do I register an agent and get started?",
    a: "Connect your wallet, navigate to the Dashboard, and click 'Register Agent'. Your agent receives a unique agentId from the ERC-8004 Identity Registry. Once reputation signals are submitted, AzCred can assign a credit line automatically.",
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* ── Animated SVG Background ── */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1200 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Glowing dot gradients */}
              <radialGradient id="neonPulse1" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="rgba(255,255,255,1)" />
                <stop offset="30%"  stopColor="rgba(251,146,60,1)" />
                <stop offset="70%"  stopColor="rgba(249,115,22,0.8)" />
                <stop offset="100%" stopColor="rgba(249,115,22,0)" />
              </radialGradient>
              <radialGradient id="neonPulse2" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="rgba(255,255,255,0.9)" />
                <stop offset="25%"  stopColor="rgba(251,146,60,0.9)" />
                <stop offset="60%"  stopColor="rgba(234,88,12,0.7)" />
                <stop offset="100%" stopColor="rgba(234,88,12,0)" />
              </radialGradient>
              <radialGradient id="neonPulse3" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="rgba(255,255,255,1)" />
                <stop offset="35%"  stopColor="rgba(251,146,60,1)" />
                <stop offset="75%"  stopColor="rgba(234,88,12,0.6)" />
                <stop offset="100%" stopColor="rgba(234,88,12,0)" />
              </radialGradient>

              {/* Ambient glow where the waves originate (bottom-right) */}
              <radialGradient id="originGlow" cx="70%" cy="95%" r="65%">
                <stop offset="0%"   stopColor="rgba(249,115,22,0.22)" />
                <stop offset="45%"  stopColor="rgba(249,115,22,0.08)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>

              {/* Dot bloom filter */}
              <filter id="neonGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Diagonal wave-line gradients — fade in from origin, fade out off-screen */}
              <linearGradient id="waveFade1" x1="40%" y1="100%" x2="100%" y2="0%" gradientUnits="objectBoundingBox">
                <stop offset="0%"   stopColor="rgba(249,115,22,0)" />
                <stop offset="18%"  stopColor="rgba(249,115,22,0.75)" />
                <stop offset="75%"  stopColor="rgba(249,115,22,0.55)" />
                <stop offset="100%" stopColor="rgba(249,115,22,0)" />
              </linearGradient>
              <linearGradient id="waveFade2" x1="40%" y1="100%" x2="100%" y2="0%" gradientUnits="objectBoundingBox">
                <stop offset="0%"   stopColor="rgba(251,146,60,0)" />
                <stop offset="18%"  stopColor="rgba(251,146,60,0.65)" />
                <stop offset="75%"  stopColor="rgba(251,146,60,0.50)" />
                <stop offset="100%" stopColor="rgba(251,146,60,0)" />
              </linearGradient>
              <linearGradient id="waveFade3" x1="40%" y1="100%" x2="100%" y2="0%" gradientUnits="objectBoundingBox">
                <stop offset="0%"   stopColor="rgba(234,88,12,0)" />
                <stop offset="18%"  stopColor="rgba(234,88,12,0.80)" />
                <stop offset="75%"  stopColor="rgba(234,88,12,0.60)" />
                <stop offset="100%" stopColor="rgba(234,88,12,0)" />
              </linearGradient>
            </defs>

            {/* Warm ambient glow at bottom-right origin */}
            <ellipse cx="840" cy="760" rx="700" ry="380" fill="url(#originGlow)" />

            {/* Wave paths — fan from bottom-center-right up to top-right (matches template) */}
            {([
              { id:"w1",  d:"M 500 800 Q 700 580 900 280 Q 1000 120 1200 50",   sw:"1.0", op:"0.80", r:2.2, f:"neonPulse1", dur:"4.2s" },
              { id:"w2",  d:"M 545 800 Q 745 600 945 305 Q 1045 145 1245 68",   sw:"1.5", op:"0.78", r:3.0, f:"neonPulse2", dur:"5.0s" },
              { id:"w3",  d:"M 460 800 Q 658 558 858 258 Q 960 98 1160 28",     sw:"0.8", op:"0.70", r:1.8, f:"neonPulse3", dur:"4.6s" },
              { id:"w4",  d:"M 590 800 Q 790 622 975 335 Q 1065 175 1275 95",   sw:"1.6", op:"0.75", r:3.2, f:"neonPulse1", dur:"5.4s" },
              { id:"w5",  d:"M 480 800 Q 680 590 880 293 Q 980 133 1182 52",    sw:"1.2", op:"0.72", r:2.4, f:"neonPulse2", dur:"4.8s" },
              { id:"w6",  d:"M 565 800 Q 762 612 958 318 Q 1052 158 1258 82",   sw:"0.7", op:"0.65", r:1.5, f:"neonPulse3", dur:"5.2s" },
              { id:"w7",  d:"M 432 800 Q 630 545 838 248 Q 944 88 1148 18",     sw:"1.1", op:"0.68", r:2.2, f:"neonPulse1", dur:"4.4s" },
              { id:"w8",  d:"M 615 800 Q 812 632 998 348 Q 1082 188 1304 108",  sw:"1.3", op:"0.70", r:2.6, f:"neonPulse2", dur:"5.6s" },
              { id:"w9",  d:"M 515 800 Q 715 595 916 308 Q 1016 148 1218 65",   sw:"0.9", op:"0.73", r:2.0, f:"neonPulse3", dur:"4.3s" },
              { id:"w10", d:"M 472 800 Q 670 572 872 272 Q 972 112 1174 42",    sw:"1.5", op:"0.78", r:3.0, f:"neonPulse1", dur:"5.1s" },
              { id:"w11", d:"M 598 800 Q 796 626 985 340 Q 1072 180 1288 100",  sw:"0.6", op:"0.62", r:1.4, f:"neonPulse2", dur:"5.8s" },
              { id:"w12", d:"M 450 800 Q 648 553 850 255 Q 952 95 1155 25",     sw:"1.2", op:"0.70", r:2.4, f:"neonPulse3", dur:"4.7s" },
              { id:"w13", d:"M 532 800 Q 730 597 930 312 Q 1026 152 1228 70",   sw:"1.0", op:"0.74", r:2.1, f:"neonPulse1", dur:"4.9s" },
              { id:"w14", d:"M 492 800 Q 690 582 890 288 Q 990 128 1194 48",    sw:"1.4", op:"0.76", r:2.8, f:"neonPulse2", dur:"5.3s" },
            ] as const).map((t, i) => (
              <g key={t.id}>
                <path
                  id={t.id}
                  d={t.d}
                  stroke={`url(#waveFade${(i % 3) + 1})`}
                  strokeWidth={t.sw}
                  fill="none"
                  opacity={t.op}
                />
                <circle r={t.r} fill={`url(#${t.f})`} opacity="1" filter="url(#neonGlow)">
                  <animateMotion dur={t.dur} repeatCount="indefinite">
                    <mpath href={`#${t.id}`} />
                  </animateMotion>
                </circle>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* ── Hero Viewport (positioning context for decorative element) ── */}
      <div className="relative min-h-screen overflow-hidden">

      {/* ── Header Navigation ── */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 lg:px-12">
        <div className="flex items-center space-x-2 pl-3 sm:pl-6 lg:pl-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/azcred-logo.png" alt="AzCred" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
        </div>

        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <a
            href="#how-it-works"
            className="text-white/80 hover:text-white transition-colors text-sm lg:text-base"
          >
            How it works
          </a>
          <a
            href="#roadmap"
            className="text-white/80 hover:text-white transition-colors text-sm lg:text-base"
          >
            Roadmap
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="hidden md:block">
            <ShimmerButton
              background="rgba(249,115,22,1)"
              borderRadius="12px"
              className="px-4 lg:px-6 py-2 text-sm lg:text-base font-medium shadow-lg"
            >
              Launch App
            </ShimmerButton>
          </Link>
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-sm border-b border-white/10 z-20">
          <nav className="flex flex-col space-y-4 px-6 py-6">
            <a href="#how-it-works" className="text-white/80 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>
              How it works
            </a>
            <a href="#roadmap" className="text-white/80 hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Roadmap
            </a>
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <ShimmerButton background="rgba(249,115,22,1)" borderRadius="12px" className="px-6 py-2.5 text-sm font-medium shadow-lg w-fit">
                Launch App
              </ShimmerButton>
            </Link>
          </nav>
        </div>
      )}

      {/* ── Hero ── */}
      <main className="relative z-10 flex flex-col items-start justify-center min-h-[calc(100vh-80px)] pl-6 sm:pl-12 lg:pl-20 pr-6 sm:pr-12 lg:pr-20 max-w-6xl">
        {/* Badge */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-4 py-2">
            <span className="text-white text-xs">Live on Creditcoin Testnet · ERC-8004</span>
          </div>
        </div>

        {/* Heading — extra bottom margin clears the LineShadowText ghost offset */}
        <h1 className="text-white text-4xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-8xl font-bold leading-tight mb-10 sm:mb-12 text-balance">
          Credit for AI
          <br />
          Agents,{" "}
          <LineShadowText className="italic font-light" shadowColor="white">
            on-chain.
          </LineShadowText>
        </h1>

        {/* Subtitle */}
        <p className="text-white/70 text-sm sm:text-base md:text-sm lg:text-2xl mb-8 sm:mb-10 max-w-2xl text-pretty">
          AzCred reads your agent&apos;s ERC-8004 reputation to assign a credit line
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          in CTC — no human underwriter, no paperwork, fully autonomous.
        </p>

        {/* CTA */}
        <Link href="/dashboard">
          <Button className="group relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base md:text-xs lg:text-lg font-semibold flex items-center gap-2 backdrop-blur-sm border border-orange-400/30 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5">
            Launch App
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 group-hover:-rotate-12 transition-transform duration-300" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>
        </Link>
      </main>

      {/* ── Decorative "on-chain." background glow — positioned like template's wave motif ── */}
      <div className="absolute bottom-0 right-0 pointer-events-none select-none translate-y-[22%] translate-x-[6%] animate-glow-pulse">
        <span
          className="text-[7rem] sm:text-[11rem] lg:text-[15rem] xl:text-[19rem] font-bold italic leading-none whitespace-nowrap"
          style={{ color: "transparent", WebkitTextStroke: "1.5px rgba(249,115,22,0.6)" }}
        >
          on-chain.
        </span>
      </div>

      </div>{/* end hero viewport */}

      {/* ── Tech Ticker ── */}
      {(() => {
        const items = [
          "ERC-8004",
          "Creditcoin",
          "AI Agents",
          "EIP-712",
          "Credit Infra",
          "tCTC",
        ]
        const track = [...items, ...items]
        return (
          <section className="relative z-10 pt-20 pb-0">
            <div className="overflow-hidden border-y border-white/8 bg-white/[0.02] py-4">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-black to-transparent" />
              <div className="flex animate-marquee whitespace-nowrap">
                {track.map((label, i) => (
                  <span key={i} className="inline-flex items-center gap-4 px-8">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                      {label}
                    </span>
                    <span className="text-orange-500/50 text-xs">◆</span>
                  </span>
                ))}
              </div>
            </div>
          </section>
        )
      })()}

      {/* ── Stats Row ── */}
      <section className="relative z-10 border-y border-white/8 bg-white/[0.02] px-6 py-14 lg:px-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between sm:gap-0">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-8 sm:gap-0">
                <div className="flex flex-col items-center text-center sm:flex-1 sm:px-10">
                  <span className="text-4xl font-bold text-orange-400 lg:text-5xl">{stat.value}</span>
                  <span className="mt-1 text-sm text-white/40 tracking-wide">{stat.label}</span>
                </div>
                {i < stats.length - 1 && (
                  <Separator orientation="vertical" className="hidden sm:block h-12 bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative z-10 border-t border-white/10 bg-black/60 px-6 py-24 backdrop-blur-sm lg:px-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-sm font-medium text-orange-400">How it works</p>
          <h2 className="mb-12 text-3xl font-bold text-white lg:text-4xl">
            Three steps to agent credit
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
                  <step.icon className="h-5 w-5 text-orange-400" />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-medium text-white/30">0{i + 1}</span>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-white/50">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Tabs ── */}
      <section className="relative z-10 px-6 py-24 lg:px-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-sm font-medium text-orange-400">Built for the agentic web</p>
          <h2 className="mb-10 text-3xl font-bold text-white lg:text-4xl">
            Everything your agent needs
          </h2>
          <Tabs defaultValue="agents" className="w-full">
            <TabsList className="mb-10 bg-white/5 border border-white/10 p-1 h-auto">
              <TabsTrigger
                value="agents"
                className="px-6 py-2.5 text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=inactive]:text-white/50 rounded-md transition-all"
              >
                For AI Agents
              </TabsTrigger>
              <TabsTrigger
                value="protocols"
                className="px-6 py-2.5 text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=inactive]:text-white/50 rounded-md transition-all"
              >
                For Protocols
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agents">
              <div className="grid gap-5 md:grid-cols-3">
                {agentFeatures.map((f) => (
                  <Card
                    key={f.title}
                    className="border-l-2 border-l-orange-500 border-t-white/10 border-r-white/10 border-b-white/10 bg-white/[0.04] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-orange-500/10"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15">
                          <f.icon className="h-5 w-5 text-orange-400" />
                        </div>
                        <Badge
                          variant={f.live ? "default" : "secondary"}
                          className={f.live ? "bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/20" : "bg-white/10 text-white/40 border-white/10"}
                        >
                          {f.badge}
                        </Badge>
                      </div>
                      <h3 className="mt-3 font-semibold text-white">{f.title}</h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-white/50">{f.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="protocols">
              <div className="grid gap-5 md:grid-cols-3">
                {protocolFeatures.map((f) => (
                  <Card
                    key={f.title}
                    className="border-l-2 border-l-orange-500 border-t-white/10 border-r-white/10 border-b-white/10 bg-white/[0.04] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-orange-500/10"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15">
                          <f.icon className="h-5 w-5 text-orange-400" />
                        </div>
                        <Badge
                          variant={f.live ? "default" : "secondary"}
                          className={f.live ? "bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/20" : "bg-white/10 text-white/40 border-white/10"}
                        >
                          {f.badge}
                        </Badge>
                      </div>
                      <h3 className="mt-3 font-semibold text-white">{f.title}</h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-white/50">{f.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* ── Roadmap ── */}
      <section id="roadmap" className="relative z-10 px-6 py-24 lg:px-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-sm font-medium text-orange-400">Roadmap</p>
          <h2 className="mb-12 text-3xl font-bold text-white lg:text-4xl">
            Where we&apos;re headed
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {roadmap.map((item) => (
              <div
                key={item.phase}
                className={`rounded-2xl border p-6 ${
                  item.active
                    ? "border-orange-500/40 bg-orange-500/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  {item.active ? (
                    <CheckCircle className="h-4 w-4 text-orange-400" />
                  ) : (
                    <Circle className="h-4 w-4 text-white/20" />
                  )}
                  <span className={`text-xs font-medium ${item.active ? "text-orange-400" : "text-white/30"}`}>
                    {item.phase}
                  </span>
                </div>
                <h3 className={`mb-1 font-semibold ${item.active ? "text-white" : "text-white/50"}`}>
                  {item.label}
                </h3>
                <p className="text-sm text-white/40">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative z-10 border-t border-white/10 bg-black/60 px-6 py-24 backdrop-blur-sm lg:px-20">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-sm font-medium text-orange-400">FAQ</p>
          <h2 className="mb-10 text-3xl font-bold text-white lg:text-4xl">
            Common questions
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 data-[state=open]:border-orange-500/40 data-[state=open]:bg-orange-500/[0.04] transition-all"
              >
                <AccordionTrigger className="py-5 text-left text-sm font-medium text-white/80 hover:text-white hover:no-underline data-[state=open]:text-orange-300">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-white/50">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── CTA Card ── */}
      <section className="relative z-10 px-6 py-24 lg:px-20">
        <div className="mx-auto max-w-5xl">
          <Card className="relative overflow-hidden border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent backdrop-blur-sm">
            {/* subtle corner glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
            <CardContent className="relative flex flex-col items-center gap-8 px-8 py-16 text-center sm:px-16">
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/20">
                Testnet Live
              </Badge>
              <div>
                <h2 className="text-3xl font-bold text-white lg:text-4xl">
                  Start building with agent credit
                </h2>
                <p className="mt-4 text-white/50 max-w-lg mx-auto text-sm lg:text-base">
                  Register your AI agent, let AzCred read its on-chain reputation, and receive a tCTC credit line — in minutes, with zero human approval.
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <Link href="/dashboard">
                  <Button className="group relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105">
                    Launch App
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
                <a
                  href="https://eips.ethereum.org/EIPS/eip-8004"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="border-white/20 bg-transparent text-white/70 hover:bg-white/5 hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300"
                  >
                    Read ERC-8004 Spec
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-8 lg:px-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/azcred-logo.png" alt="AzCred" className="h-5 w-5" />
            <span className="text-sm font-semibold text-white">AzCred</span>
            <span className="text-sm text-white/30">— Credit for AI agents on Creditcoin</span>
          </div>
          <div className="flex gap-6 text-sm text-white/30">
            <a href="https://eips.ethereum.org/EIPS/eip-8004" target="_blank" rel="noopener noreferrer" className="hover:text-white/60">ERC-8004</a>
            <a href="https://docs.creditcoin.org" target="_blank" rel="noopener noreferrer" className="hover:text-white/60">Creditcoin</a>
            <span>Testnet only</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
