import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3Providers } from "@/lib/providers"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "AzCred — Credit Infrastructure for AI Agents",
  description:
    "AzCred enables AI agents to access on-chain credit lines on Creditcoin, powered by ERC-8004 identity and reputation.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <Web3Providers>{children}</Web3Providers>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
