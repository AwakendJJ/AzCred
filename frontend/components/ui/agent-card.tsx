"use client"

import { useState, useEffect, useMemo } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContracts, useReadContract, useSimulateContract } from "wagmi"
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
  const { address: connectedAddress } = useAccount()

  // Check if connected wallet owns this agent NFT
  const { data: agentOwner } = useReadContract({
    address: CONTRACT_ADDRESSES.identityRegistry,
    abi: [{ type: "function", name: "ownerOf", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }], stateMutability: "view" }],
    functionName: "ownerOf",
    args: [profile.agentId],
  })
  const isOwner = agentOwner && connectedAddress
    ? agentOwner.toLowerCase() === connectedAddress.toLowerCase()
    : false

  // Parse draw amount to wei (undefined when invalid)
  const drawAmountWei = useMemo(() => {
    try {
      const n = parseFloat(drawAmount)
      if (!drawAmount || isNaN(n) || n <= 0) return undefined
      return parseEther(drawAmount)
    } catch { return undefined }
  }, [drawAmount])

  // Simulate draw before wallet popup — gives a decoded revert reason if it would fail
  const {
    error: drawSimError,
    isError: drawSimFailed,
  } = useSimulateContract({
    address: CONTRACT_ADDRESSES.azCredCreditLine,
    abi: AZCRED_CREDIT_LINE_ABI,
    functionName: "drawCredit",
    args: drawAmountWei !== undefined ? [profile.agentId, drawAmountWei] : undefined,
    query: {
      enabled: !!drawAmountWei && isOwner && profile.limit > 0n,
      retry: false,
    },
  })

  // Decode a human-readable hint from any contract revert error
  function decodeDrawError(err: unknown): string {
    if (!err) return "Transaction reverted. Try a smaller amount."
    // Walk the full error chain: message, cause, shortMessage, data
    const walk = (e: unknown): string => {
      if (!e) return ""
      const o = e as Record<string, unknown>
      const parts = [
        String(o.message ?? ""),
        String(o.shortMessage ?? ""),
        String(o.details ?? ""),
        walk(o.cause),
      ].join(" ")
      return parts
    }
    const msg = walk(err)
    console.error("[AgentCard draw error] full error:", err)
    console.error("[AgentCard draw error] message chain:", msg)
    if (msg.includes("NotAgentOwner"))
      return "Only the wallet that registered this agent can draw credit."
    if (msg.includes("InsufficientAvailableCredit") || msg.includes("ExceedsLimit"))
      return `Amount exceeds available credit. Max: ${formatEther(profile.available)} tCTC`
    if (msg.includes("InsufficientPoolBalance"))
      return "Protocol pool doesn't have enough tCTC. Try a smaller amount."
    if (msg.includes("CreditNotAssigned"))
      return "Credit has not been assigned yet. Click 'Assign Credit' first."
    if (msg.includes("User rejected") || msg.includes("user rejected") || msg.includes("4001"))
      return "Transaction cancelled."
    if (msg.includes("Transfer failed"))
      return "CTC transfer from pool failed. Contact support."
    return `Reverted on-chain — see console (F12) for details.`
  }

  // Fetch live interest data
  const { data: interestData, refetch: refetchInterest } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.azCredCreditLine,
        abi: AZCRED_CREDIT_LINE_ABI,
        functionName: "totalOwed",
        args: [profile.agentId],
      },
      {
        address: CONTRACT_ADDRESSES.azCredCreditLine,
        abi: AZCRED_CREDIT_LINE_ABI,
        functionName: "interestAccrued",
        args: [profile.agentId],
      },
      {
        address: CONTRACT_ADDRESSES.azCredCreditLine,
        abi: AZCRED_CREDIT_LINE_ABI,
        functionName: "annualInterestRateBps",
      },
    ],
    query: { enabled: profile.outstanding > 0n },
  })

  const totalOwedAmount = interestData?.[0]?.status === "success"
    ? (interestData[0].result as bigint)
    : profile.outstanding
  const interestAmount = interestData?.[1]?.status === "success"
    ? (interestData[1].result as bigint)
    : 0n
  const rateBps = interestData?.[2]?.status === "success"
    ? Number(interestData[2].result as bigint)
    : 500
  const ratePercent = (rateBps / 100).toFixed(1)

  const { writeContract: drawWrite, data: drawTxHash, isPending: drawPending } =
    useWriteContract()
  const { writeContract: repayWrite, data: repayTxHash, isPending: repayPending } =
    useWriteContract()
  const { writeContract: assignWrite, data: assignTxHash, isPending: assignPending } =
    useWriteContract()

  const {
    isLoading: drawConfirming,
    isSuccess: drawSuccess,
    isError: drawFailed,
    error: drawReceiptError,
    data: drawReceipt,
  } = useWaitForTransactionReceipt({ hash: drawTxHash })

  const {
    isLoading: repayConfirming,
    isSuccess: repaySuccess,
    isError: repayFailed,
    error: repayReceiptError,
    data: repayReceipt,
  } = useWaitForTransactionReceipt({ hash: repayTxHash })

  const {
    isLoading: assignConfirming,
    isSuccess: assignSuccess,
    isError: assignFailed,
    error: assignReceiptError,
  } = useWaitForTransactionReceipt({ hash: assignTxHash })

  useEffect(() => {
    if (drawSuccess) {
      // Guard: some chains return isSuccess=true but receipt.status='reverted'
      if (drawReceipt?.status === "reverted") {
        const explorerLink = drawTxHash
          ? `https://creditcoin-testnet.blockscout.com/tx/${drawTxHash}`
          : null
        console.error("[AgentCard] tx reverted but receipt came back success:", drawReceipt)
        toast.error("Draw reverted on-chain", {
          description: "Transaction was mined but execution reverted — see Blockscout for the exact reason.",
          action: explorerLink
            ? { label: "View on Blockscout", onClick: () => window.open(explorerLink, "_blank") }
            : undefined,
          duration: 12000,
        })
        return
      }
      toast.success("Draw confirmed", { description: `${drawAmount} tCTC drawn` })
      setDrawAmount("")
      onCreditUpdated?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawSuccess, drawReceipt])

  useEffect(() => {
    if (drawFailed) {
      const hint = decodeDrawError(drawReceiptError)
      const explorerLink = drawTxHash
        ? `https://creditcoin-testnet.blockscout.com/tx/${drawTxHash}`
        : null
      toast.error("Draw failed", {
        description: hint,
        action: explorerLink
          ? { label: "View on Blockscout", onClick: () => window.open(explorerLink, "_blank") }
          : undefined,
        duration: 12000,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawFailed])

  useEffect(() => {
    if (repaySuccess) {
      if (repayReceipt?.status === "reverted") {
        const link = repayTxHash
          ? `https://creditcoin-testnet.blockscout.com/tx/${repayTxHash}`
          : null
        console.error("[AgentCard] repay reverted on-chain:", repayReceipt)
        toast.error("Repayment reverted on-chain", {
          description: "Transaction was mined but execution reverted.",
          action: link ? { label: "View on Blockscout", onClick: () => window.open(link, "_blank") } : undefined,
          duration: 12000,
        })
        return
      }
      toast.success("Repayment confirmed", { description: `${formatEther(totalOwedAmount)} tCTC repaid` })
      onCreditUpdated?.()
      refetchInterest()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repaySuccess, repayReceipt])

  useEffect(() => {
    if (repayFailed) {
      const walk = (e: unknown): string => {
        if (!e) return ""
        const o = e as Record<string, unknown>
        return [String(o.message ?? ""), String(o.shortMessage ?? ""), walk(o.cause)].join(" ")
      }
      const msg = walk(repayReceiptError)
      console.error("[AgentCard repay receipt error]", repayReceiptError)
      const hint = msg.includes("InsufficientRepaymentWithInterest")
        ? "Sent value was less than principal + interest. Retrying should fix it."
        : msg.includes("NoOutstandingBalance")
        ? "No outstanding balance to repay."
        : "Repayment reverted on-chain — see Blockscout for details."
      const link = repayTxHash
        ? `https://creditcoin-testnet.blockscout.com/tx/${repayTxHash}`
        : null
      toast.error("Repayment failed", {
        description: hint,
        action: link ? { label: "View on Blockscout", onClick: () => window.open(link, "_blank") } : undefined,
        duration: 12000,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repayFailed])

  useEffect(() => {
    if (assignSuccess) {
      toast.success("Credit assigned!", { description: "Credit limit is now active." })
      onCreditUpdated?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignSuccess])

  useEffect(() => {
    if (assignFailed) {
      const msg = assignReceiptError?.message ?? ""
      const hint = msg.includes("CreditAlreadyAssigned")
        ? "Credit is already assigned for this agent."
        : "Assignment transaction reverted."
      toast.error("Assignment failed", { description: hint })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignFailed])

  const needsAssignment = profile.limit === 0n

  function handleAssign() {
    assignWrite(
      {
        address: CONTRACT_ADDRESSES.azCredCreditLine,
        abi: AZCRED_CREDIT_LINE_ABI,
        functionName: "assignCredit",
        args: [profile.agentId],
        gas: 500_000n,
      },
      {
        onSuccess: () => toast.info("Credit assignment submitted..."),
        onError: (e) => toast.error("Assignment failed", { description: e.message }),
      }
    )
  }

  function handleDraw() {
    if (!drawAmountWei) {
      toast.error("Enter a valid draw amount")
      return
    }
    if (drawAmountWei > profile.available) {
      toast.error("Amount exceeds available credit", {
        description: `Max drawable: ${formatEther(profile.available)} tCTC`,
      })
      return
    }
    if (drawSimFailed) {
      toast.error("Draw would fail", { description: decodeDrawError(drawSimError) })
      return
    }
    drawWrite(
      {
        address: CONTRACT_ADDRESSES.azCredCreditLine,
        abi: AZCRED_CREDIT_LINE_ABI,
        functionName: "drawCredit",
        args: [profile.agentId, drawAmountWei],
        gas: 500_000n, // Creditcoin testnet underestimates gas; hardcap avoids OOG
      },
      {
        onSuccess: () => toast.info("Draw submitted, waiting for confirmation..."),
        onError: (e) => toast.error("Draw failed", { description: decodeDrawError(e) }),
      }
    )
  }

  function handleRepay() {
    if (totalOwedAmount === 0n) {
      toast.error("Nothing to repay")
      return
    }
    // Add a 0.01% buffer (+ 1 wei floor) so the tx still satisfies
    // principal + interest even if a few extra seconds accrue between
    // fetching totalOwed and the block being mined.
    // The contract refunds any overpayment automatically.
    const repayValue = totalOwedAmount + totalOwedAmount / 10_000n + 1n
    repayWrite(
      {
        address: CONTRACT_ADDRESSES.azCredCreditLine,
        abi: AZCRED_CREDIT_LINE_ABI,
        functionName: "repayCredit",
        args: [profile.agentId],
        value: repayValue,
        gas: 500_000n,
      },
      {
        onSuccess: () => toast.info("Repayment submitted, waiting for confirmation..."),
        onError: (e) => {
          console.error("[AgentCard repay error]", e)
          toast.error("Repayment failed", { description: e.message })
        },
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
              {!isOwner && agentOwner ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-400">
                  ⚠ Only the agent owner can draw credit. Connect the wallet that registered this agent.
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder={`Max ${formatEther(profile.available)} tCTC`}
                      value={drawAmount}
                      onChange={(e) => setDrawAmount(e.target.value)}
                      className={`border-white/10 bg-white/5 text-white placeholder:text-white/30 ${drawSimFailed && drawAmount ? "border-red-500/40" : ""}`}
                    />
                    <TransactionButton
                      loading={drawLoading}
                      loadingText="Drawing..."
                      onClick={handleDraw}
                      disabled={!drawAmount || drawLoading || (drawSimFailed && !!drawAmount)}
                      className="shrink-0"
                    >
                      Draw
                    </TransactionButton>
                  </div>
                  {drawSimFailed && drawAmount && (
                    <p className="text-xs text-red-400">
                      {decodeDrawError(drawSimError)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Repay credit */}
            {profile.outstanding > 0n && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/50">Repay Credit</p>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Principal</span>
                    <span className="text-white">{formatEther(profile.outstanding)} tCTC</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Interest ({ratePercent}% p.a.)</span>
                    <span className="text-orange-400">+{parseFloat(formatEther(interestAmount)).toFixed(6)} tCTC</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold border-t border-white/10 pt-1.5 mt-1.5">
                    <span className="text-white/70">Total Owed</span>
                    <span className="text-white">{parseFloat(formatEther(totalOwedAmount)).toFixed(6)} tCTC</span>
                  </div>
                </div>
                <TransactionButton
                  loading={repayLoading}
                  loadingText={repayPending ? "Check wallet..." : "Confirming..."}
                  onClick={handleRepay}
                  disabled={repayLoading}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Repay {parseFloat(formatEther(totalOwedAmount)).toFixed(4)} tCTC
                </TransactionButton>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
