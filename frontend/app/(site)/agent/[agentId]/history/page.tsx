"use client"

import { use, useEffect, useState } from "react"
import { usePublicClient } from "wagmi"
import { formatEther, parseAbiItem } from "viem"
import { Loader2, ArrowLeft, History, ExternalLink } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CONTRACT_ADDRESSES } from "@/lib/contracts"

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = "Assigned" | "Draw" | "Repaid"

interface CreditEvent {
  type: EventType
  amount: bigint
  balanceAfter: bigint
  blockNumber: bigint
  txHash: `0x${string}`
  timestamp?: number
}

// ─── Event ABIs for getLogs ───────────────────────────────────────────────────

const ASSIGNED_ABI = parseAbiItem(
  "event CreditAssigned(uint256 indexed agentId, uint256 creditLimit, uint8 score)"
)
const DRAWN_ABI = parseAbiItem(
  "event CreditDrawn(uint256 indexed agentId, uint256 amount, uint256 outstandingBalance)"
)
const REPAID_ABI = parseAbiItem(
  "event CreditRepaid(uint256 indexed agentId, uint256 amount, uint256 outstandingBalance)"
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BLOCKSCOUT = "https://creditcoin-testnet.blockscout.com"

function typeBadge(type: EventType) {
  if (type === "Assigned")
    return (
      <Badge
        variant="outline"
        className="border-blue-500/40 bg-blue-500/10 text-xs text-blue-400"
      >
        Assigned
      </Badge>
    )
  if (type === "Draw")
    return (
      <Badge
        variant="outline"
        className="border-orange-500/40 bg-orange-500/10 text-xs text-orange-400"
      >
        Draw
      </Badge>
    )
  return (
    <Badge
      variant="outline"
      className="border-green-500/40 bg-green-500/10 text-xs text-green-400"
    >
      Repaid
    </Badge>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ agentId: string }>
}

export default function AgentHistoryPage({ params }: Props) {
  const { agentId: agentIdStr } = use(params)
  const agentId = BigInt(agentIdStr)

  const publicClient = usePublicClient()
  const [events, setEvents] = useState<CreditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!publicClient) return

    async function fetchHistory() {
      setLoading(true)
      setError(null)
      try {
        const address = CONTRACT_ADDRESSES.azCredCreditLine
        const filter = { agentId }

        const [assigned, drawn, repaid] = await Promise.all([
          publicClient!.getLogs({
            address,
            event: ASSIGNED_ABI,
            args: filter,
            fromBlock: 0n,
          }),
          publicClient!.getLogs({
            address,
            event: DRAWN_ABI,
            args: filter,
            fromBlock: 0n,
          }),
          publicClient!.getLogs({
            address,
            event: REPAID_ABI,
            args: filter,
            fromBlock: 0n,
          }),
        ])

        const mapped: CreditEvent[] = [
          ...assigned.map((e) => ({
            type: "Assigned" as EventType,
            amount: e.args.creditLimit ?? 0n,
            balanceAfter: 0n,
            blockNumber: e.blockNumber ?? 0n,
            txHash: e.transactionHash ?? "0x",
          })),
          ...drawn.map((e) => ({
            type: "Draw" as EventType,
            amount: e.args.amount ?? 0n,
            balanceAfter: e.args.outstandingBalance ?? 0n,
            blockNumber: e.blockNumber ?? 0n,
            txHash: e.transactionHash ?? "0x",
          })),
          ...repaid.map((e) => ({
            type: "Repaid" as EventType,
            amount: e.args.amount ?? 0n,
            balanceAfter: e.args.outstandingBalance ?? 0n,
            blockNumber: e.blockNumber ?? 0n,
            txHash: e.transactionHash ?? "0x",
          })),
        ]

        // Sort by block descending (newest first)
        mapped.sort((a, b) => (a.blockNumber > b.blockNumber ? -1 : 1))
        setEvents(mapped)
      } catch (err) {
        setError("Failed to load history. The RPC may not support getLogs with a wide range.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [publicClient, agentId])

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Back */}
      <Link
        href={`/agent/${agentIdStr}`}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Agent Profile
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/20">
          <History className="h-5 w-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Credit History</h1>
          <p className="text-sm text-white/40">Agent #{agentIdStr} · all on-chain credit events</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-orange-400" />
        </div>
      ) : error ? (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="py-8 text-center text-sm text-red-400">{error}</CardContent>
        </Card>
      ) : events.length === 0 ? (
        <Card className="border-white/10 bg-white/[0.04]">
          <CardContent className="py-16 text-center">
            <p className="text-sm text-white/40">No credit events found for this agent.</p>
            <p className="mt-2 text-xs text-white/25">
              Assign credit on the dashboard to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/70">Event Log</h2>
              <span className="text-xs text-white/30">{events.length} event{events.length !== 1 ? "s" : ""}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {events.map((ev, i) => (
              <div key={ev.txHash + i}>
                {i > 0 && <Separator className="bg-white/5" />}
                <div className="flex items-center gap-4 px-6 py-4">
                  {/* Type badge */}
                  <div className="w-20 flex-shrink-0">{typeBadge(ev.type)}</div>

                  {/* Amount */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">
                      {ev.type === "Assigned"
                        ? `Limit: ${formatEther(ev.amount)} tCTC`
                        : `${parseFloat(formatEther(ev.amount)).toFixed(4)} tCTC`}
                    </div>
                    {ev.type !== "Assigned" && (
                      <div className="text-xs text-white/30 mt-0.5">
                        Balance after: {parseFloat(formatEther(ev.balanceAfter)).toFixed(4)} tCTC
                      </div>
                    )}
                  </div>

                  {/* Block + Tx */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-white/30">Block #{ev.blockNumber.toString()}</div>
                    <a
                      href={`${BLOCKSCOUT}/tx/${ev.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs text-orange-400/70 hover:text-orange-400 transition-colors"
                    >
                      {ev.txHash.slice(0, 8)}…{ev.txHash.slice(-6)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
