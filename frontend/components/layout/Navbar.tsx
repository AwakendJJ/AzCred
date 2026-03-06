"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Zap } from "lucide-react"

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/liquidity", label: "Liquidity", comingSoon: true },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">AzCred</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              {link.label}
              {link.comingSoon && (
                <Badge
                  variant="outline"
                  className="border-orange-500/50 bg-orange-500/10 px-1.5 py-0 text-[10px] text-orange-400"
                >
                  Soon
                </Badge>
              )}
            </Link>
          ))}
        </nav>

        {/* Connect Wallet */}
        <ConnectButton
          accountStatus="avatar"
          chainStatus="icon"
          showBalance={false}
        />
      </div>
    </header>
  )
}
