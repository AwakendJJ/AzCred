"use client"

import { useState, useEffect } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther, formatEther } from "viem"
import { ExternalLink, TrendingUp } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { CreditTierBadge } from "@/components/ui/credit-tier-badge"
import { ReputationSignals } from "@/components/ui/reputation-signals"
import { StatCard } from "@/components/ui/stat-card"
import { TransactionButton } from "@/components/ui/transaction-button"
import { CONTRACT_ADDRESSES, AZCRED_CREDIT_LINE_ABI } from "@/lib/contracts"

export interface AgentCreditProfile {
  agentId: bigint
  name: string
  limit: bigint
  outstanding: bigint
  available: bigint
  score: number
  successRate: number | null
  uptime: number | null
  starred: number | null
}

interface AgentCardProps {
  profile: AgentCreditProfile
  onCreditUpdated?: () => void
}

export function AgentCard({ profile, onCreditUpdated }: AgentCardProps) {
  const [drawAmount, setDrawAmount] = useState("")
  const [repayAmount, setRepayAmount] = useState("")

  const { writeContract: drawWrite, data: drawTxHash, isPending: drawPending } =
    useWriteContract()
  const { writeContract: repayWrite, data: repayTxHash, isPending: repayPending } =
    useWriteContract()
  const { writeContract: assignWrite, data: assignTxHash, isPending: assignPending } =
    useWriteContract()

  const { isLoading: drawConfirming, isSuccess: drawSuccess } = useWaitForTransactionReceipt({
    hash: drawTxHash,
  })
  const { isLoading: repayConfirming, isSuccess: repaySuccess } = useWaitForTransactionReceipt({
    hash: repayTxHash,
  })
  const { isLoading: assignConfirming, isSuccess: assignSuccess } = useWaitForTransactionReceipt({
    hash: assignTxHash,
  })

  useEffect(() => {
    if (drawSuccess) {
      toast.success("Draw confirmed", { description: `${drawAmount} tCTC drawn` })
      setDrawAmount("")
      onCreditUpdated?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawSuccess])

  useEffect(() => {
    if (repaySuccess) {
      toast.success("Repayment confirmed", { description: `${repayAmount} tCTC repaid` })
      setRepayAmount("")
      onCreditUpdated?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repaySuccess])

  useEffect(() => {
    if (assignSuccess) {
      toast.success("Credit assigned!", { description: "Credit limit is now active." })
      onCreditUpdated?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignSuccess])

  const needsAssignment = profile.limit === 0n

  function handleAssign() {
    assignWrite(
      {
        address: CONTRACT_ADDRESSES.azCredCreditLine,
        abi: AZCRED_CREDIT_LINE_ABI,
        functionName: "assignCredit",
        args: [profile.agentId],
      },
      {
        onSuccess: () => toast.info("Credit assignment submitted..."),
        onError: (e) => toast.error("Assignment failed", { description: e.message }),
      }
    )
  }

  function handleDraw() {
    const amount = parseFloat(drawAmount)
    if (!drawAmount || isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid draw amount")
      return
    }
    drawWrite(
      {
        address: CONTRACT_ADDRESSES.azCredCreditLine,
        abi: AZCRED_CREDIT_LINE_ABI,
        functionName: "drawCredit",
        args: [profile.agentId, parseEther(drawAmount)],
      },
      {
        onSuccess: () => toast.info("Draw submitted, waiting for confirmation..."),
        onError: (e) => toast.error("Draw failed", { description: e.message }),
      }
    )
  }

  function handleRepay() {
    const amount = parseFloat(repayAmount)
    if (!repayAmount || isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid repay amount")
      return
    }
    repayWrite(
      {
        address: CONTRACT_ADDRESSES.azCredCreditLine,
        abi: AZCRED_CREDIT_LINE_ABI,
        functionName: "repayCredit",
        args: [profile.agentId],
        value: parseEther(repayAmount),
      },
      {
        onSuccess: () => toast.info("Repayment submitted, waiting for confirmation..."),
        onError: (e) => toast.error("Repayment failed", { description: e.message }),
      }
    )
  }

  const assignLoading = assignPending || assignConfirming
  const drawLoading = drawPending || drawConfirming
  const repayLoading = repayPending || repayConfirming

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/agent/${profile.agentId}`}
                className="group flex items-center gap-1.5 hover:text-orange-400 transition-colors"
              >
                <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                  {profile.name}
                </h3>
                <ExternalLink className="h-3.5 w-3.5 text-white/30 group-hover:text-orange-400 transition-colors" />
              </Link>
            </div>
            <p className="text-xs text-white/40">agentId #{profile.agentId.toString()}</p>
          </div>
          <CreditTierBadge score={profile.score} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Reputation signals */}
        <ReputationSignals
          successRate={profile.successRate}
          uptime={profile.uptime}
          starred={profile.starred}
        />

        <Separator className="bg-white/10" />

        {/* Credit stats */}
        {needsAssignment ? (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
            <p className="mb-3 text-sm text-white/60">
              Credit not yet assigned for this agent.
            </p>
            <TransactionButton
              loading={assignLoading}
              loadingText={assignPending ? "Check wallet..." : "Confirming..."}
              onClick={handleAssign}
              className="w-full"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Assign Credit
            </TransactionButton>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                label="Limit"
                value={`${formatEther(profile.limit)} tCTC`}
              />
              <StatCard
                label="Drawn"
                value={`${formatEther(profile.outstanding)} tCTC`}
                accent={profile.outstanding > 0n}
              />
              <StatCard
                label="Available"
                value={`${formatEther(profile.available)} tCTC`}
              />
            </div>

            <Separator className="bg-white/10" />

            {/* Draw credit */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/50">Draw Credit</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="Amount in tCTC"
                  value={drawAmount}
                  onChange={(e) => setDrawAmount(e.target.value)}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                />
                <TransactionButton
                  loading={drawLoading}
                  loadingText="Drawing..."
                  onClick={handleDraw}
                  disabled={!drawAmount || drawLoading}
                  className="shrink-0"
                >
                  Draw
                </TransactionButton>
              </div>
            </div>

            {/* Repay credit */}
            {profile.outstanding > 0n && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/50">Repay Credit</p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Amount in tCTC"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                  />
                  <TransactionButton
                    loading={repayLoading}
                    loadingText="Repaying..."
                    onClick={handleRepay}
                    disabled={!repayAmount || repayLoading}
                    variant="outline"
                    className="shrink-0 border-white/20 text-white hover:bg-white/10"
                  >
                    Repay
                  </TransactionButton>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
