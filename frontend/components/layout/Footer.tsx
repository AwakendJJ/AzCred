import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

const productLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/liquidity", label: "Liquidity", comingSoon: true },
]

const protocolLinks = [
  { href: "https://eips.ethereum.org/EIPS/eip-8004", label: "ERC-8004 Spec", external: true },
  { href: "https://docs.creditcoin.org", label: "Creditcoin Docs", external: true },
  { href: "https://ethereum-magicians.org/t/erc-8004-trustless-agents/25098", label: "EIP Discussion", external: true },
]

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/azcred-logo.png" alt="AzCred" className="h-8 w-8" />
              <span className="text-base font-bold text-white">AzCred</span>
            </Link>
            <p className="text-sm leading-relaxed text-white/40 max-w-xs">
              Credit infrastructure for AI agents on Creditcoin, powered by the ERC-8004 Trustless Agents standard.
            </p>
            <Badge
              variant="outline"
              className="w-fit border-orange-500/40 bg-orange-500/10 text-xs text-orange-400"
            >
              Testnet only — no real funds
            </Badge>
          </div>

          {/* Product */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/30">
              Product
            </p>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
                  >
                    {link.label}
                    {link.comingSoon && (
                      <Badge
                        variant="outline"
                        className="border-orange-500/40 bg-orange-500/10 px-1.5 py-0 text-[10px] text-orange-400"
                      >
                        Soon
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Protocol */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/30">
              Protocol
            </p>
            <ul className="space-y-3">
              {protocolLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/50 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-col items-center justify-between gap-3 text-xs text-white/30 sm:flex-row">
          <span>© {new Date().getFullYear()} AzCred. Built on Creditcoin.</span>
          <span>ERC-8004 · Trustless Agents · Open Standard</span>
        </div>
      </div>
    </footer>
  )
}
