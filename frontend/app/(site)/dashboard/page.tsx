"use client"

import { useEffect, useState, useCallback } from "react"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { formatEther } from "viem"
import { Loader2, Wallet, AlertTriangle, Zap } from "lucide-react"
import { ConnectButton } from "@rainbow-me/rainbowkit"

import { AgentCard, type AgentCreditProfile } from "@/components/ui/agent-card"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CONTRACT_ADDRESSES,
  IDENTITY_REGISTRY_ABI,
  REPUTATION_REGISTRY_ABI,
  AZCRED_CREDIT_LINE_ABI,
} from "@/lib/contracts"

// ─── helpers ──────────────────────────────────────────────────────────────────

function clamp(n: bigint): number {
  const v = Number(n)
  return Math.max(0, Math.min(100, v))
}

// ─── hook: load all agents owned by the connected wallet ─────────────────────

function useOwnedAgents(ownerAddress: `0x${string}` | undefined) {
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESSES.identityRegistry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "balanceOf",
    args: ownerAddress ? [ownerAddress] : undefined,
    query: { enabled: !!ownerAddress },
  })

  const indices = balance ? Array.from({ length: Number(balance) }, (_, i) => BigInt(i)) : []

  const tokenIdResults = useReadContracts({
    contracts: indices.map((i) => ({
      address: CONTRACT_ADDRESSES.identityRegistry,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "tokenOfOwnerByIndex" as const,
      args: [ownerAddress!, i] as const,
    })),
    query: { enabled: indices.length > 0 && !!ownerAddress },
  })

  const agentIds = tokenIdResults.data
    ?.map((r) => (r.status === "success" ? (r.result as bigint) : null))
    .filter((id): id is bigint => id !== null) ?? []

  return { agentIds, loading: !balance || tokenIdResults.isLoading }
}

// ─── hook: load credit profiles ───────────────────────────────────────────────

function useCreditProfiles(agentIds: bigint[]) {
  const profileResults = useReadContracts({
    contracts: agentIds.map((id) => ({
      address: CONTRACT_ADDRESSES.azCredCreditLine,
      abi: AZCRED_CREDIT_LINE_ABI,
      functionName: "getCreditProfile" as const,
      args: [id] as const,
    })),
    query: { enabled: agentIds.length > 0 },
  })

  // getLatestSignal takes (agentId, tag) — one call per signal per agent
  const TAGS = ["successRate", "uptime", "starred"] as const
  const signalResults = useReadContracts({
    contracts: agentIds.flatMap((id) =>
      TAGS.map((tag) => ({
        address: CONTRACT_ADDRESSES.reputationRegistry,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: "getLatestSignal" as const,
        args: [id, tag] as const,
      }))
    ),
    query: { enabled: agentIds.length > 0 },
  })

  const metaResults = useReadContracts({
    contracts: agentIds.map((id) => ({
      address: CONTRACT_ADDRESSES.identityRegistry,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "getMetadata" as const,
      args: [id] as const,
    })),
    query: { enabled: agentIds.length > 0 },
  })

  const loading =
    profileResults.isLoading || signalResults.isLoading || metaResults.isLoading

  const profiles: AgentCreditProfile[] = agentIds.map((id, i) => {
    const profileRaw = profileResults.data?.[i]
    const metaRaw = metaResults.data?.[i]

    // Each agent has 3 signal entries at indices i*3, i*3+1, i*3+2
    const ssRaw = signalResults.data?.[i * 3]
    const upRaw = signalResults.data?.[i * 3 + 1]
    const stRaw = signalResults.data?.[i * 3 + 2]

    const profile =
      profileRaw?.status === "success"
        ? (profileRaw.result as [bigint, bigint, bigint, number])
        : null
    const meta =
      metaRaw?.status === "success"
        ? (metaRaw.result as [string, string, string, string, string])
        : null

    // Each signal result is [int128 value, uint8 valueDecimals, bool found]
    const ssSignal = ssRaw?.status === "success" ? (ssRaw.result as [bigint, number, boolean]) : null
    const upSignal = upRaw?.status === "success" ? (upRaw.result as [bigint, number, boolean]) : null
    const stSignal = stRaw?.status === "success" ? (stRaw.result as [bigint, number, boolean]) : null

    const limit = profile?.[0] ?? 0n
    const outstanding = profile?.[1] ?? 0n
    // profile[2] = available (uint256), profile[3] = score (uint8)
    const score = profile?.[3] ?? 0

    const available = profile?.[2] ?? (limit > outstanding ? limit - outstanding : 0n)

    return {
      agentId: id,
      name: meta?.[4] ? meta[4].split(" ")[0] : `Agent #${id}`,
      limit,
      outstanding,
      available,
      score,
      successRate: ssSignal?.[2] ? clamp(ssSignal[0]) : null,
      uptime: upSignal?.[2] ? clamp(upSignal[0]) : null,
      starred: stSignal?.[2] ? clamp(stSignal[0]) : null,
    }
  })

  return { profiles, loading, refetch: () => { profileResults.refetch(); signalResults.refetch() } }
}

// ─── Pool stat ─────────────────────────────────────────────────────────────────

function usePoolBalance() {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESSES.azCredCreditLine,
    abi: AZCRED_CREDIT_LINE_ABI,
    functionName: "poolBalance",
  })
  return data as bigint | undefined
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const { agentIds, loading: agentLoading } = useOwnedAgents(address)
  const { profiles, loading: profileLoading, refetch } = useCreditProfiles(agentIds)
  const poolBal = usePoolBalance()

  const totalLimit = profiles.reduce((sum, p) => sum + p.limit, 0n)
  const totalOutstanding = profiles.reduce((sum, p) => sum + p.outstanding, 0n)

  if (!isConnected) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-6">
        <Card className="w-full max-w-sm border-white/10 bg-white/[0.04] text-center backdrop-blur-sm">
          <CardContent className="flex flex-col items-center gap-5 px-8 py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/20">
              <Wallet className="h-7 w-7 text-orange-400" />
            </div>
            <div>
              <h2 className="mb-2 text-xl font-bold text-white">Connect your wallet</h2>
              <p className="text-sm text-white/50">
                Connect the wallet that owns your AI agents to view credit lines.
              </p>
            </div>
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  const isLoading = agentLoading || profileLoading

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Agent Dashboard</h1>
            <Badge
              variant="outline"
              className="border-orange-500/40 bg-orange-500/10 text-xs text-orange-400"
            >
              Testnet
            </Badge>
          </div>
          <p className="text-sm text-white/50">
            Credit lines for your registered AI agents
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Agents" value={isLoading ? "—" : agentIds.length.toString()} />
        <StatCard
          label="Total Limit"
          value={isLoading ? "—" : `${parseFloat(formatEther(totalLimit)).toFixed(0)} tCTC`}
        />
        <StatCard
          label="Total Drawn"
          value={isLoading ? "—" : `${parseFloat(formatEther(totalOutstanding)).toFixed(2)} tCTC`}
          accent={totalOutstanding > 0n}
        />
        <StatCard
          label="Pool Balance"
          value={poolBal !== undefined ? `${parseFloat(formatEther(poolBal)).toFixed(0)} tCTC` : "—"}
          sub="Available to borrow"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        </div>
      ) : agentIds.length === 0 ? (
        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-sm">
          <CardContent className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10">
              <Zap className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-semibold text-white">No agents found</h3>
              <p className="max-w-sm text-sm text-white/50">
                This wallet has no registered agents in the Identity Registry.
                Register an agent first to access credit.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400" />
              <span className="text-xs text-amber-400">
                Use the seed script to register test agents, or deploy on testnet.
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <AgentCard
              key={profile.agentId.toString()}
              profile={profile}
              onCreditUpdated={refetch}
            />
          ))}
        </div>
      )}
    </div>
  )
}
