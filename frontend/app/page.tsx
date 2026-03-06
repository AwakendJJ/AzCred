"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Menu, Bot, Shield, TrendingUp, CheckCircle, Circle } from "lucide-react"
import { LineShadowText } from "@/components/line-shadow-text"
import { ShimmerButton } from "@/components/shimmer-button"
import { Button } from "@/components/ui/button"

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
              <radialGradient id="neonPulse1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,1)" />
                <stop offset="30%" stopColor="rgba(251,146,60,1)" />
                <stop offset="70%" stopColor="rgba(249,115,22,0.8)" />
                <stop offset="100%" stopColor="rgba(249,115,22,0)" />
              </radialGradient>
              <radialGradient id="neonPulse2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                <stop offset="25%" stopColor="rgba(251,146,60,0.9)" />
                <stop offset="60%" stopColor="rgba(234,88,12,0.7)" />
                <stop offset="100%" stopColor="rgba(234,88,12,0)" />
              </radialGradient>
              <radialGradient id="neonPulse3" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,1)" />
                <stop offset="35%" stopColor="rgba(251,146,60,1)" />
                <stop offset="75%" stopColor="rgba(234,88,12,0.6)" />
                <stop offset="100%" stopColor="rgba(234,88,12,0)" />
              </radialGradient>
              <radialGradient id="heroTextBg" cx="30%" cy="50%" r="70%">
                <stop offset="0%" stopColor="rgba(249,115,22,0.15)" />
                <stop offset="40%" stopColor="rgba(251,146,60,0.08)" />
                <stop offset="80%" stopColor="rgba(234,88,12,0.05)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              <filter id="heroTextBlur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="12" result="blur" />
                <feTurbulence baseFrequency="0.7" numOctaves="4" result="noise" />
                <feColorMatrix in="noise" type="saturate" values="0" result="monoNoise" />
                <feComponentTransfer in="monoNoise" result="alphaAdjustedNoise">
                  <feFuncA type="discrete" tableValues="0.03 0.06 0.09 0.12" />
                </feComponentTransfer>
                <feComposite in="blur" in2="alphaAdjustedNoise" operator="multiply" result="noisyBlur" />
                <feMerge>
                  <feMergeNode in="noisyBlur" />
                </feMerge>
              </filter>
              <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="threadFade1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,0,0,1)" />
                <stop offset="15%" stopColor="rgba(249,115,22,0.8)" />
                <stop offset="85%" stopColor="rgba(249,115,22,0.8)" />
                <stop offset="100%" stopColor="rgba(0,0,0,1)" />
              </linearGradient>
              <linearGradient id="threadFade2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,0,0,1)" />
                <stop offset="12%" stopColor="rgba(251,146,60,0.7)" />
                <stop offset="88%" stopColor="rgba(251,146,60,0.7)" />
                <stop offset="100%" stopColor="rgba(0,0,0,1)" />
              </linearGradient>
              <linearGradient id="threadFade3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,0,0,1)" />
                <stop offset="18%" stopColor="rgba(234,88,12,0.8)" />
                <stop offset="82%" stopColor="rgba(234,88,12,0.8)" />
                <stop offset="100%" stopColor="rgba(0,0,0,1)" />
              </linearGradient>
            </defs>

            <g>
              <ellipse cx="300" cy="350" rx="400" ry="200" fill="url(#heroTextBg)" filter="url(#heroTextBlur)" opacity="0.6" />
              <ellipse cx="350" cy="320" rx="500" ry="250" fill="url(#heroTextBg)" filter="url(#heroTextBlur)" opacity="0.4" />

              {[
                { id:"t1", d:"M50 720 Q200 590 350 540 Q500 490 650 520 Q800 550 950 460 Q1100 370 1200 340", sw:"0.8", op:"0.8", r:2, f:"neonPulse1", dur:"4s" },
                { id:"t2", d:"M80 730 Q250 620 400 570 Q550 520 700 550 Q850 580 1000 490 Q1150 400 1300 370", sw:"1.5", op:"0.7", r:3, f:"neonPulse2", dur:"5s" },
                { id:"t3", d:"M20 710 Q180 580 320 530 Q460 480 600 510 Q740 540 880 450 Q1020 360 1200 330", sw:"1.2", op:"0.8", r:2.5, f:"neonPulse1", dur:"4.5s" },
                { id:"t4", d:"M120 740 Q280 640 450 590 Q620 540 770 570 Q920 600 1070 510 Q1220 420 1350 390", sw:"0.6", op:"0.6", r:1.5, f:"neonPulse3", dur:"5.5s" },
                { id:"t5", d:"M60 725 Q220 600 380 550 Q540 500 680 530 Q820 560 960 470 Q1100 380 1280 350", sw:"1.0", op:"0.7", r:2.2, f:"neonPulse2", dur:"4.2s" },
                { id:"t6", d:"M150 735 Q300 660 480 610 Q660 560 800 590 Q940 620 1080 530 Q1220 440 1400 410", sw:"1.3", op:"0.6", r:2.8, f:"neonPulse1", dur:"5.2s" },
                { id:"t7", d:"M40 715 Q190 585 340 535 Q490 485 630 515 Q770 545 910 455 Q1050 365 1250 335", sw:"0.9", op:"0.8", r:2, f:"neonPulse3", dur:"4.8s" },
                { id:"t8", d:"M100 728 Q260 630 420 580 Q580 530 720 560 Q860 590 1000 500 Q1140 410 1320 380", sw:"1.4", op:"0.7", r:3, f:"neonPulse2", dur:"5.8s" },
                { id:"t9", d:"M85 719 Q235 605 385 555 Q535 505 675 535 Q815 565 955 475 Q1095 385 1320 355", sw:"1.5", op:"0.9", r:3.2, f:"neonPulse2", dur:"4.1s" },
                { id:"t10", d:"M50 720 Q190 745 340 705 Q490 665 630 685 Q770 705 910 645 Q1050 585 1200 340", sw:"1.1", op:"0.7", r:2.5, f:"neonPulse3", dur:"4.8s" },
                { id:"t11", d:"M50 720 Q205 755 365 715 Q525 675 665 695 Q805 715 945 655 Q1085 595 1200 340", sw:"1.4", op:"0.8", r:3, f:"neonPulse1", dur:"4.1s" },
                { id:"t12", d:"M50 720 Q240 715 400 675 Q560 635 700 655 Q840 675 980 615 Q1120 555 1200 340", sw:"1.5", op:"0.9", r:3.2, f:"neonPulse2", dur:"4.0s" },
                { id:"t16", d:"M85 719 Q235 605 385 555 Q535 505 675 535 Q815 565 955 475 Q1095 385 1320 355", sw:"1.5", op:"0.9", r:3.2, f:"neonPulse2", dur:"4.1s" },
                { id:"t17", d:"M50 720 Q180 660 320 620 Q460 580 600 600 Q740 620 880 560 Q1020 500 1200 340", sw:"0.6", op:"0.5", r:1.5, f:"neonPulse1", dur:"5.1s" },
                { id:"t18", d:"M50 720 Q200 680 350 640 Q500 600 650 620 Q800 640 950 580 Q1100 520 1200 340", sw:"1.2", op:"0.7", r:2.8, f:"neonPulse2", dur:"4.6s" },
                { id:"t19", d:"M50 720 Q160 670 280 630 Q400 590 540 610 Q680 630 820 570 Q960 510 1200 340", sw:"0.8", op:"0.6", r:2, f:"neonPulse3", dur:"5.4s" },
                { id:"t20", d:"M50 720 Q220 690 380 650 Q540 610 680 630 Q820 650 960 590 Q1100 530 1200 340", sw:"1.4", op:"0.8", r:3, f:"neonPulse1", dur:"4.4s" },
              ].map((t, i) => (
                <g key={t.id}>
                  <path
                    id={t.id}
                    d={t.d}
                    stroke={`url(#threadFade${(i % 3) + 1})`}
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
            </g>
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
