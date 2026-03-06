import { Zap } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-500">
            <Zap className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">AzCred</span>
          <span className="text-sm text-white/40">— Credit infrastructure for AI agents</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-white/40">
          <Link
            href="https://eips.ethereum.org/EIPS/eip-8004"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/70 transition-colors"
          >
            ERC-8004
          </Link>
          <Link
            href="https://docs.creditcoin.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/70 transition-colors"
          >
            Creditcoin
          </Link>
          <span>Testnet only</span>
        </div>
      </div>
    </footer>
  )
}
