# AzCred

> Credit infrastructure for AI agents on Creditcoin, powered by ERC-8004.

AzCred enables AI agents to access on-chain credit lines. An agent's ERC-8004
identity and reputation signals replace the traditional credit history — the
protocol reads on-chain performance data to compute a credit score and assign
a CTC credit limit to each registered agent.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Creditcoin EVM Testnet                │
│                                                         │
│  ┌──────────────────┐    ┌────────────────────────┐     │
│  │  IdentityRegistry│    │  ReputationRegistry    │     │
│  │  (ERC-8004/721)  │    │  (feedback signals)    │     │
│  └────────┬─────────┘    └──────────┬─────────────┘     │
│           │                         │                   │
│           └──────────┬──────────────┘                   │
│                      ▼                                  │
│           ┌──────────────────────┐                      │
│           │  AzCredCreditLine    │                      │
│           │  - assignCredit()    │                      │
│           │  - drawCredit()      │                      │
│           │  - repayCredit()     │                      │
│           └──────────────────────┘                      │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ wagmi v2 + viem
┌─────────────────────────────────────────────────────────┐
│              Next.js 15 Frontend                        │
│                                                         │
│   /               Landing page + protocol overview      │
│   /dashboard      Agent owner credit management         │
│   /agent/[id]     Public agent credit profile           │
│   /liquidity      Coming Soon — liquidity provider UI   │
└─────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
azcred/
├── contracts/          Hardhat project — Solidity contracts + scripts + tests
├── frontend/           Next.js app — agent dashboard and public profile
├── tasks/              PRD and implementation task list
└── package.json        npm workspaces root
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### 1. Install dependencies

```bash
npm install
```

### 2. Set up contracts environment

```bash
cp contracts/.env.example contracts/.env
# Fill in PRIVATE_KEY and CREDITCOIN_TESTNET_RPC in contracts/.env
```

### 3. Set up frontend environment

```bash
cp frontend/.env.local.example frontend/.env.local
# Fill in contract addresses after deployment
```

### 4. Compile contracts

```bash
npm run contracts:compile
```

### 5. Run contract tests

```bash
npm run contracts:test
```

### 6. Deploy to Creditcoin testnet

```bash
# Deploy all ERC-8004 registries
npm run contracts:deploy:testnet

# Seed test agents with reputation data
npm run contracts:seed
```

### 7. Run the frontend

```bash
npm run dev
```

---

## Network Details

| Property       | Value                                          |
|----------------|------------------------------------------------|
| Network        | Creditcoin EVM Testnet                         |
| Chain ID       | 102031                                         |
| RPC (HTTP)     | https://rpc.cc3-testnet.creditcoin.network     |
| RPC (WSS)      | wss://rpc.cc3-testnet.creditcoin.network       |
| Block Explorer | https://creditcoin-testnet.blockscout.com      |
| Currency       | tCTC (testnet CTC)                             |

---

## Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Contracts  | Solidity 0.8.20 + Hardhat 2.28 + OpenZeppelin |
| Frontend   | Next.js 15 + React 19 + TypeScript          |
| Styling    | Tailwind CSS v4 + shadcn/ui (new-york)      |
| Web3       | wagmi v2 + viem + RainbowKit                |
| Fonts      | Geist / Geist Mono                          |
| Animations | Framer Motion (motion)                      |

---

## Standard (ERC-8004)

This project implements the [ERC-8004: Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004)
draft standard, deploying its three on-chain registries as a dependency:

- **Identity Registry** — ERC-721-based agent registration
- **Reputation Registry** — on-chain feedback and performance signals
- **Validation Registry** — verification hooks (read-only for MVP)
