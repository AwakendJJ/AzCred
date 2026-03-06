# AzCred Frontend

Next.js 15 web application for the AzCred credit protocol. Allows AI agent
owners to connect their wallet, view agent credit profiles, draw and repay
credit, and explore the protocol roadmap.

## Pages

| Route              | Description                                             |
|--------------------|---------------------------------------------------------|
| `/`                | Landing page — value prop, how it works, roadmap        |
| `/dashboard`       | Agent owner dashboard — credit management (auth-gated)  |
| `/agent/[agentId]` | Public agent credit profile — searchable by agentId     |
| `/liquidity`       | Coming Soon — liquidity provider teaser                 |

## Setup

```bash
# Install dependencies (from repo root)
npm install

# Copy environment file
cp .env.local.example .env.local
# Fill in:
#   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID  (from https://cloud.walletconnect.com)
#   NEXT_PUBLIC_*_ADDRESS                 (from contracts/deployments/testnet.json)
```

## Commands

```bash
# Start dev server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint
npm run lint
```

## Environment Variables

| Variable                                   | Description                            |
|--------------------------------------------|----------------------------------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`     | WalletConnect Cloud project ID         |
| `NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS`    | Deployed IdentityRegistry address      |
| `NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS`  | Deployed ReputationRegistry address    |
| `NEXT_PUBLIC_VALIDATION_REGISTRY_ADDRESS`  | Deployed ValidationRegistry address    |
| `NEXT_PUBLIC_AZCRED_CREDIT_LINE_ADDRESS`   | Deployed AzCredCreditLine address      |

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4 + shadcn/ui (new-york style)
- **Web3:** wagmi v2 + viem + RainbowKit
- **Wallet:** RainbowKit (Creditcoin testnet configured)
- **Animations:** Framer Motion (`motion`)
- **Fonts:** Geist / Geist Mono (via `next/font/google`)

## Design System

The visual theme is sourced from `mnimal-animated-hero-template/` with the
following design tokens defined in `app/globals.css`:

- **Base colors:** OKLCH CSS variables (neutral palette)
- **Brand accent:** `--accent-brand` — orange-500 (`#f97316`)
- **Dark mode:** class-based (`.dark`)
- **Border radius:** `--radius: 0.625rem` (10px base)
- **Fonts:** Geist sans + mono

Custom components carried from the template:
- `components/shimmer-button.tsx` — animated CTA button
- `components/line-shadow-text.tsx` — animated headline text

## Contract Integration

All contract addresses and ABIs are centralised in `lib/contracts.ts`.
Use wagmi `useReadContract` / `useWriteContract` hooks with the exported
`CONTRACT_ADDRESSES` and `*_ABI` constants throughout the app.
