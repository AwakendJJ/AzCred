"use client"

import { use } from "react"
import { useReadContracts } from "wagmi"
import { formatEther } from "viem"
import { Loader2, ArrowLeft, Bot, History } from "lucide-react"
import Link from "next/link"

import { CreditTierBadge, getTier, getTierLimit } from "@/components/ui/credit-tier-badge"
import { ReputationSignals } from "@/components/ui/reputation-signals"
import { StatCard } from "@/components/ui/stat-card"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CONTRACT_ADDRESSES,
  IDENTITY_REGISTRY_ABI,
  REPUTATION_REGISTRY_ABI,
  AZCRED_CREDIT_LINE_ABI,
} from "@/lib/contracts"

interface Props {
  params: Promise<{ agentId: string }>
}

export default function AgentProfilePage({ params }: Props) {
  const { agentId: agentIdStr } = use(params)
  const agentId = BigInt(agentIdStr)

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.identityRegistry,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: "ownerOf",
        args: [agentId],
      },
      {
        address: CONTRACT_ADDRESSES.identityRegistry,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: "getMetadata",
        args: [agentId],
      },
      {
        address: CONTRACT_ADDRESSES.reputationRegistry,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: "getLatestSignal",
        args: [agentId, "successRate"],
      },
      {
        address: CONTRACT_ADDRESSES.reputationRegistry,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: "getLatestSignal",
        args: [agentId, "uptime"],
      },
      {
        address: CONTRACT_ADDRESSES.reputationRegistry,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: "getLatestSignal",
        args: [agentId, "starred"],
      },
      {
        address: CONTRACT_ADDRESSES.azCredCreditLine,
        abi: AZCRED_CREDIT_LINE_ABI,
        functionName: "getCreditProfile",
        args: [agentId],
      },
    ],
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    )
  }

  const owner = data?.[0]?.status === "success" ? (data[0].result as `0x${string}`) : null
  const meta = data?.[1]?.status === "success" ? (data[1].result as [string, string, string, string, string]) : null

  // [int128 value, uint8 valueDecimals, bool found]
  const ssSignal = data?.[2]?.status === "success" ? (data[2].result as [bigint, number, boolean]) : null
  const upSignal = data?.[3]?.status === "success" ? (data[3].result as [bigint, number, boolean]) : null
  const stSignal = data?.[4]?.status === "success" ? (data[4].result as [bigint, number, boolean]) : null
  // getCreditProfile → (uint256 limit, uint256 outstanding, uint256 available, uint8 score)
  const creditRaw = data?.[5]?.status === "success" ? (data[5].result as [bigint, bigint, bigint, number]) : null

  const agentName = meta?.[4]?.split(" ")[0] ?? `Agent #${agentIdStr}`
  const agentType = meta?.[0] ?? "Unknown"
  const model = meta?.[1] ?? "—"
  const endpoint = meta?.[2] ?? "—"
  const version = meta?.[3] ?? "—"
  const description = meta?.[4] ?? "—"

  const successRate = ssSignal?.[2] ? Math.max(0, Math.min(100, Number(ssSignal[0]))) : null
  const uptime = upSignal?.[2] ? Math.max(0, Math.min(100, Number(upSignal[0]))) : null
  const starred = stSignal?.[2] ? Math.max(0, Math.min(100, Number(stSignal[0]))) : null
  const feedbackCount = [ssSignal, upSignal, stSignal].filter((s) => s?.[2]).length

  const limit = creditRaw?.[0] ?? 0n
  const outstanding = creditRaw?.[1] ?? 0n
  const available = creditRaw?.[2] ?? (limit > outstanding ? limit - outstanding : 0n)
  // creditRaw[3] = uint8 score (not bool assigned)
  const score = creditRaw?.[3] ?? 0
  const assigned = limit > 0n
  const tier = getTier(score)

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Back + History */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <Link
          href={`/agent/${agentIdStr}/history`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/50 transition-colors hover:border-orange-500/40 hover:text-orange-400"
        >
          <History className="h-3.5 w-3.5" />
          View History
        </Link>
      </div>

      {/* Agent header */}
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-500/20">
          <Bot className="h-7 w-7 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white">{agentName}</h1>
            <CreditTierBadge score={score} />
          </div>
          <p className="mt-0.5 text-sm text-white/40">agentId #{agentIdStr}</p>
          {owner && (
            <p className="mt-1 truncate font-mono text-xs text-white/25">{owner}</p>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {/* Agent Metadata */}
        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/70">Agent Metadata</h2>
              <Badge
                variant="outline"
                className="border-white/15 bg-white/5 text-xs text-white/40"
              >
                ERC-8004
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: "Type", value: agentType },
                { label: "Model", value: model },
                { label: "Version", value: version },
                { label: "Endpoint", value: endpoint },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-white/30">{item.label}</dt>
                  <dd className="mt-0.5 truncate text-sm text-white">{item.value}</dd>
                </div>
              ))}
            </dl>
            {description && description !== "—" && (
              <>
                <Separator className="my-4 bg-white/10" />
                <div>
                  <dt className="mb-1 text-xs text-white/30">Description</dt>
                  <dd className="text-sm leading-relaxed text-white/70">{description}</dd>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Reputation Signals */}
        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/70">Reputation Signals</h2>
              <span className="text-xs text-white/30">
                {feedbackCount} signal{feedbackCount !== 1 ? "s" : ""}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ReputationSignals successRate={successRate} uptime={uptime} starred={starred} />
          </CardContent>
        </Card>

        {/* Credit Profile */}
        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/70">Credit Profile</h2>
              {assigned && tier && (
                <Badge
                  variant="outline"
                  className="border-orange-500/40 bg-orange-500/10 text-xs text-orange-400"
                >
                  Tier {tier} · {getTierLimit(tier)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!assigned ? (
              <p className="text-sm text-white/40">
                Credit not yet assigned. Go to the Dashboard to assign.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Score" value={`${score}/100`} />
                <StatCard label="Tier" value={tier ? `Tier ${tier}` : "—"} sub={getTierLimit(tier)} />
                <StatCard label="Limit" value={`${formatEther(limit)} tCTC`} />
                <StatCard
                  label="Outstanding"
                  value={`${formatEther(outstanding)} tCTC`}
                  accent={outstanding > 0n}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
