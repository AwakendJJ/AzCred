<p align="center">
  <img src="frontend/public/azcred-logo.png" alt="AzCred" width="80" />
</p>

<h1 align="center">AzCred</h1>
<p align="center">
  <strong>Credit infrastructure for AI agents</strong> — built on Creditcoin & ERC-8004
</p>

<p align="center">
  <a href="https://eips.ethereum.org/EIPS/eip-8004"><img src="https://img.shields.io/badge/ERC--8004-Trustless%20Agents-orange?style=flat-square" alt="ERC-8004" /></a>
  <a href="https://docs.creditcoin.org"><img src="https://img.shields.io/badge/Creditcoin-L1%20Testnet-orange?style=flat-square" alt="Creditcoin" /></a>
  <a href="https://creditcoin-testnet.blockscout.com/address/0x14ff68b60d69170eb4d1fD9752426758c629763C"><img src="https://img.shields.io/badge/Contracts-Verified-orange?style=flat-square" alt="Verified" /></a>
</p>

<p align="center">
  <a href="#-the-problem">Problem</a> •
  <a href="#-the-solution">Solution</a> •
  <a href="#-live-demo">Demo</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a>
</p>

---

## 🎯 The Problem

AI agents are becoming **autonomous economic actors** — they call APIs, execute transactions, manage workflows. But every agent starts from **zero**:

- No credit history
- No financial rails
- No way to operate without a human co-signer

ERC-8004 reputation exists on-chain. **Nothing uses it for credit.** The primitive is idle — and the gap is wide open.

---

## ✨ The Solution

**AzCred** is the first trustless credit layer for AI agents. We turn on-chain ERC-8004 reputation into tiered CTC credit lines:

1. **Register** — Agent gets an identity NFT on Creditcoin
2. **Build reputation** — Success rate, uptime, performance signals accumulate on-chain
3. **Get credit** — AzCred reads the data, computes a score, assigns a limit — instantly
4. **Draw & repay** — Agent borrows tCTC, repays with 5% annual interest — fully on-chain

No oracles. No human approval. No intermediaries.

---

## 🚀 Live Demo

| | |
|---|---|
| **Testnet** | [Creditcoin EVM Testnet](https://creditcoin-testnet.blockscout.com) (Chain ID 102031) |
| **Frontend** | Deploy to Vercel or run locally — see [Quick Start](#-quick-start) |
| **Contracts** | [IdentityRegistry](https://creditcoin-testnet.blockscout.com/address/0x0eE5eB4A7A4e6dd3FFcE897196F90564F3Ba9572#code) · [ReputationRegistry](https://creditcoin-testnet.blockscout.com/address/0x16445e50e70f37a7795C5a4Ad1583E9250C85494#code) · [AzCredCreditLine](https://creditcoin-testnet.blockscout.com/address/0x14ff68b60d69170eb4d1fD9752426758c629763C#code) |

**Flow:** Connect wallet → View agents → Assign credit → Draw tCTC → Repay + interest → View history

---

## ⚡ Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp contracts/.env.example contracts/.env      # Add PRIVATE_KEY
cp frontend/.env.local.example frontend/.env.local  # Add addresses after deploy

# 3. Compile & test
npm run contracts:compile
npm run contracts:test

# 4. Deploy to Creditcoin testnet
npm run contracts:deploy:testnet

# 5. Seed test agents
npm run contracts:seed
npm run contracts:seed:more   # Optional: 4 more agents

# 6. Run frontend
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) and connect your wallet to Creditcoin Testnet.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Creditcoin EVM Testnet                        │
│                                                                 │
│  ┌──────────────────┐    ┌────────────────────────┐            │
│  │  IdentityRegistry │    │  ReputationRegistry    │            │
│  │  (ERC-8004/721)   │    │  (feedback signals)    │            │
│  └────────┬──────────┘    └──────────┬─────────────┘            │
│           │                          │                          │
│           └────────────┬─────────────┘                          │
│                        ▼                                        │
│           ┌────────────────────────┐                           │
│           │   AzCredCreditLine     │                           │
│           │   assign · draw · repay│                           │
│           │   5% interest model    │                           │
│           └────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
                         ▲
                         │ wagmi v2 + viem
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js 15 Frontend                            │
│   /           Landing · /dashboard · /agent/[id] · /liquidity   │
└─────────────────────────────────────────────────────────────────┘
```

**Credit tiers:** Score 0–33 → 100 tCTC · 34–66 → 500 tCTC · 67–100 → 1,000 tCTC

---

## 📁 Repo Structure

```
azcred/
├── contracts/     Solidity 0.8.28 · Hardhat · ERC-8004 + AzCredCreditLine
├── frontend/      Next.js 15 · wagmi · RainbowKit · shadcn/ui
└── package.json   npm workspaces
```

---

## 🛠 Tech Stack

| Layer | Stack |
|-------|-------|
| **Contracts** | Solidity 0.8.28 · Hardhat · OpenZeppelin v5 |
| **Frontend** | Next.js 15 · React 19 · TypeScript |
| **Web3** | wagmi v2 · viem · RainbowKit |
| **UI** | Tailwind CSS v4 · shadcn/ui · Framer Motion |

---

## 📜 Standard

Implements [ERC-8004: Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004):

- **Identity Registry** — Agent NFT identity (ERC-721)
- **Reputation Registry** — On-chain feedback signals
- **Validation Registry** — Verification framework (read-only in MVP)

---

## 📡 Network

| Property | Value |
|----------|-------|
| Network | Creditcoin EVM Testnet |
| Chain ID | 102031 |
| RPC | `https://rpc.cc3-testnet.creditcoin.network` |
| Explorer | [creditcoin-testnet.blockscout.com](https://creditcoin-testnet.blockscout.com) |
| Currency | tCTC |

---

## 📄 License

MIT
