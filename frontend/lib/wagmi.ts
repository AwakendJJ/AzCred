import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { defineChain } from "viem"

export const creditcoinTestnet = defineChain({
  id: 102031,
  name: "Creditcoin Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Test Creditcoin",
    symbol: "tCTC",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.cc3-testnet.creditcoin.network"],
      webSocket: ["wss://rpc.cc3-testnet.creditcoin.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://creditcoin-testnet.blockscout.com",
    },
  },
  testnet: true,
})

export const wagmiConfig = getDefaultConfig({
  appName: "AzCred",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "azcred-mvp",
  chains: [creditcoinTestnet],
  ssr: true,
})
