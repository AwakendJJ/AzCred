# PRD: AzCred MVP — Credit Infrastructure for AI Agents on Creditcoin

## 1. Introduction / Overview

AzCred is a credit infrastructure protocol that enables AI agents to autonomously
access on-chain credit lines on the Creditcoin blockchain. Unlike traditional
credit systems designed for human borrowers, AzCred treats AI agents as
first-class economic participants — capable of borrowing, drawing down, and
repaying credit based on their on-chain identity and reputation.

The protocol integrates with ERC-8004 (Trustless Agents standard), which provides
three on-chain registries: an Identity Registry (agent registration via ERC-721),
a Reputation Registry (feedback and performance signals), and a Validation Registry
(verification hooks). AzCred reads these signals to compute a credit score and
assign a credit limit to each registered agent.

**Problem:** AI agents increasingly perform economic tasks (ordering services,
paying APIs, executing trades) but have no native way to access credit. There is
no on-chain primitive that treats an agent's track record as a credit history.

**Goal:** Build a working MVP that allows an AI agent — identified by its ERC-8004
`agentId` — to receive a credit line in CTC (Creditcoin's native token) based on
its on-chain reputation, and allow the agent's owner to draw and repay that credit
via a web frontend.

---

## 2. Goals

1. Deploy the three ERC-8004 registries (Identity, Reputation, Validation) on
   Creditcoin EVM testnet as a prerequisite dependency.
2. Build an `AzCredCreditLine.sol` smart contract that reads ERC-8004 reputation
   signals and assigns tiered credit limits to registered agents.
3. Allow agent owners to draw down and repay credit in CTC through the smart
   contract.
4. Build a 3-page web frontend where agent owners can connect their wallet,
   view their agents' credit profiles, and manage credit (draw/repay).
5. Apply a consistent visual theme extracted from a user-provided landing page
   template across the entire platform.
6. Include a visible but locked "Liquidity" tab with a Coming Soon teaser that
   communicates the protocol's roadmap to lenders/capital providers.
7. Provide a public, searchable agent credit profile page accessible by `agentId`.

---

## 3. User Stories

**As an AI agent owner:**
- I want to connect my wallet and see all AI agents I own (by ERC-8004 agentId),
  so I can manage their credit positions in one place.
- I want to see my agent's credit score and assigned credit limit, so I understand
  how much credit it can access.
- I want to draw CTC credit on behalf of my agent, so the agent can fund its
  on-chain operations.
- I want to repay my agent's outstanding credit balance, so I can maintain its
  credit standing and access future credit.

**As an observer / third party:**
- I want to look up any agent by agentId and see its public credit profile
  (reputation signals, credit score, credit history), so I can evaluate an agent
  before working with it.

**As a prospective liquidity provider:**
- I want to see what AzCred's lending features will look like and join a waitlist,
  so I can participate when the liquidity pool launches.

**As the AzCred protocol:**
- I need to verify that an agent has a valid ERC-8004 identity before granting
  credit, so only legitimate registered agents can participate.
- I need to compute a simple credit score from on-chain reputation signals,
  so credit limits are tied to verifiable agent performance data.

---

## 4. Functional Requirements

### 4.1 Smart Contracts

**FR-1:** The system MUST deploy the three ERC-8004 registry contracts (Identity,
Reputation, Validation) on Creditcoin EVM testnet if not already deployed.

**FR-2:** The `AzCredCreditLine` contract MUST verify that an agent has a valid
registered `agentId` in the ERC-8004 Identity Registry before assigning credit.

**FR-3:** The contract MUST read the following reputation signals from the ERC-8004
Reputation Registry for a given `agentId`:
- `successRate` (task completion rate, %)
- `uptime` (endpoint availability, %)
- `starred` (quality rating, 0–100)

**FR-4:** The contract MUST compute a composite credit score (0–100) from the
three signals using a simple weighted average:
- `successRate`: 40% weight
- `uptime`: 35% weight
- `starred`: 25% weight

**FR-5:** The contract MUST map the credit score to a tiered credit limit in CTC:

| Score Range | Credit Limit |
|-------------|--------------|
| 0 – 33      | 100 CTC      |
| 34 – 66     | 500 CTC      |
| 67 – 100    | 1,000 CTC    |

**FR-6:** The contract MUST allow only the owner of an `agentId` (as recorded in
the ERC-8004 Identity Registry) to draw down credit up to the agent's assigned
limit.

**FR-7:** The contract MUST track the outstanding balance for each `agentId`.

**FR-8:** The contract MUST allow the agent owner to repay part or all of the
outstanding balance in CTC.

**FR-9:** The contract MUST prevent drawing credit beyond the assigned limit
(outstanding balance + draw amount must not exceed the credit limit).

**FR-10:** The contract MUST emit events for all state changes:
- `CreditAssigned(agentId, creditLimit, score)`
- `CreditDrawn(agentId, amount, outstandingBalance)`
- `CreditRepaid(agentId, amount, outstandingBalance)`

### 4.2 Frontend

**FR-11:** The frontend MUST support wallet connection using RainbowKit configured
for Creditcoin EVM testnet.

**FR-12:** The frontend MUST have exactly three pages for MVP:
- `/` — Landing page
- `/dashboard` — Agent owner dashboard (wallet required)
- `/agent/[agentId]` — Public agent credit profile (no wallet required)

**FR-13:** A persistent navigation bar MUST include: Logo, Dashboard link, a
"Liquidity" tab marked with a "Coming Soon" badge, and a Connect Wallet button.

**FR-14:** The `/dashboard` page MUST display all `agentId`s owned by the connected
wallet address, queried from the ERC-8004 Identity Registry.

**FR-15:** For each agent on the dashboard, the frontend MUST display:
- Agent name and `agentId`
- Raw reputation signals: successRate, uptime, starred
- Computed credit score and tier label (Tier 1 / Tier 2 / Tier 3)
- Credit limit, amount drawn, and available credit
- Outstanding balance

**FR-16:** Each agent card on the dashboard MUST include:
- A "Draw Credit" input (amount) and submit button
- A "Repay" input (amount) and submit button
- Real-time balance updates after transaction confirmation

**FR-17:** The `/agent/[agentId]` public profile page MUST display:
- Agent identity info (name, agentId, owner address)
- Reputation signals breakdown
- Credit score and tier
- Transaction history log (draw and repay events from contract)

**FR-18:** The landing page (`/`) MUST include:
- Hero section with AzCred value proposition
- A 3-step explainer: Register Agent → Get Scored → Borrow CTC
- Connect Wallet CTA
- Protocol roadmap section showing current MVP and upcoming phases

**FR-19:** The "Liquidity" Coming Soon tab MUST display a teaser section with:
- What liquidity providers will be able to do (deposit CTC, earn yield, view
  pool utilization)
- A roadmap card: `MVP (now) → Liquidity Pools → Agent-to-Agent Credit`
- An email/wallet waitlist input field

**FR-20:** Transaction states (pending, confirmed, failed) MUST be clearly
communicated to the user via toast notifications or inline status indicators.

### 4.3 Design System

**FR-21:** The visual theme MUST be sourced from the provided template at
`mnimal-animated-hero-template/` and applied consistently across all pages.
The following tokens are authoritative:
- **Colors:** OKLCH CSS variables defined in `globals.css` (`--background`,
  `--foreground`, `--primary`, `--muted`, `--border`, etc.)
- **Brand accent:** Orange — `orange-500` (`#f97316`) for CTAs, highlights,
  tier badges, and interactive elements
- **Dark mode:** Class-based (`.dark`) not media-query based
- **Font:** Geist (`--font-sans`) and Geist Mono (`--font-mono`) via
  `next/font/google`
- **Border radius base:** `0.625rem` (10px) mapped to `--radius`
- **Tailwind version:** v4 — all config lives in `globals.css` via
  `@theme inline {}`, no `tailwind.config.ts`

**FR-22:** All pages MUST use shadcn/ui components (new-york style, neutral
base, CSS variables mode) with the extracted theme applied consistently.

**FR-23:** The two custom animation components from the template —
`shimmer-button.tsx` and `line-shadow-text.tsx` — MUST be carried into the
AzCred frontend and used where appropriate (hero CTA, section headings).

**FR-24:** The animated SVG background (thread paths with orange glow dots)
from the template landing page MUST be reused on the AzCred landing page hero
section to maintain visual continuity.

---

## 5. Non-Goals (Out of Scope for MVP)

- **No agent-to-agent lending:** Agents cannot lend to other agents in MVP.
- **No cross-chain support:** Creditcoin EVM testnet only.
- **No Creditcoin Phase 2 / Universal Smart Contract features.**
- **No fiat on/off ramps.**
- **No functional lender UI:** The Liquidity tab is a teaser only; no actual
  deposit/withdrawal for capital providers.
- **No liquidation engine:** Defaulted credit lines are not handled in MVP.
- **No agent registration UI:** Agents are registered via scripts or direct
  contract calls, not through the frontend.
- **No complex risk models or ML-based scoring:** Simple weighted average only.
- **No notification or alerting system.**
- **No mainnet deployment:** MVP is testnet only.

---

## 6. Design Considerations

- The user will provide a landing page HTML/CSS template. The theme must be
  extracted from it before any frontend development begins.
- UI tone: developer/operator-facing — clean, structured, data-forward. Not a
  consumer product.
- Agent cards on the dashboard should use color-coded tier indicators:
  - Tier 1 (score 0–33): muted/red tone
  - Tier 2 (score 34–66): amber/yellow tone
  - Tier 3 (score 67–100): green tone
- The public agent profile page should feel like a credit report — structured,
  readable, and trustworthy.
- All interactive elements (draw, repay, connect wallet) must have clear loading
  and disabled states during transaction processing.
- The Coming Soon teaser should look polished and aspirational, not like a
  placeholder — it communicates product vision to investors and early users.

---

## 7. Technical Considerations

### Smart Contracts
- **Language:** Solidity ^0.8.20
- **Framework:** Hardhat (TypeScript) with `@nomicfoundation/hardhat-toolbox`
- **Network:** Creditcoin EVM Testnet
- **Key contracts:**
  - ERC-8004 Identity Registry (ERC-721 + URIStorage) — deploy as dependency
  - ERC-8004 Reputation Registry — deploy as dependency
  - ERC-8004 Validation Registry — deploy as dependency (read-only for MVP)
  - `AzCredCreditLine.sol` — core AzCred contract
- **Credit currency:** CTC (native token of Creditcoin)
- The `AzCredCreditLine` contract must hold a CTC reserve (pre-funded by deployer)
  to disburse credit draws.
- Since ERC-8004 is a draft standard, all three registry contracts must be deployed
  and seeded with mock agent data for development and demo purposes.

### Frontend
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Web3:** wagmi v2 + viem
- **Wallet UI:** RainbowKit
- **Contract reads:** Direct on-chain reads via wagmi hooks (no subgraph for MVP)
- **Chain config:** Creditcoin EVM testnet RPC endpoint

### Build Order
```
1. Project setup (monorepo structure, tooling)
2. Deploy ERC-8004 registries on Creditcoin testnet
3. Seed registries with test agent data and reputation signals
4. Build and deploy AzCredCreditLine.sol
5. Write and run contract unit tests
6. Extract design tokens from user-provided template
7. Scaffold Next.js frontend with theme + shared components
8. Build landing page
9. Build dashboard page
10. Build public agent profile page
11. Build Liquidity Coming Soon tab
12. End-to-end integration test and demo run
```

---

## 8. Success Metrics

- At least 3 test AI agents registered in the ERC-8004 Identity Registry on
  Creditcoin testnet with seeded reputation data covering all three credit tiers.
- `AzCredCreditLine.sol` assigns correct credit tiers for all score ranges,
  verified by unit tests.
- Agent owner completes a full draw → repay cycle via the frontend without errors.
- The public `/agent/[agentId]` page correctly renders reputation signals and
  credit history for any registered agent.
- All contract functions have unit test coverage.
- Frontend connects to Creditcoin EVM testnet and reflects live contract state.
- Visual theme is consistent across all pages, matching the provided template.
- The Coming Soon Liquidity tab renders without errors and accepts waitlist input.

---

## 9. Open Questions — Resolved

1. **Template provided.** The landing page template lives at
   `mnimal-animated-hero-template/`. It uses Next.js 15, Tailwind CSS v4,
   shadcn/ui (new-york style, neutral base), Framer Motion, and Geist fonts.
   Brand accent is orange (`#f97316` / `orange-500`). All design tokens are
   OKLCH CSS variables defined in `globals.css` via `@theme inline {}`.

2. **Deploy from scratch.** No existing ERC-8004 deployment on Creditcoin testnet.
   All three registry contracts (Identity, Reputation, Validation) will be
   implemented from the ERC-8004 spec and deployed by the AzCred team.

3. **Deployer funds manually.** The contract deployer sends testnet CTC to the
   `AzCredCreditLine` contract after deployment via the `fundPool()` function.

4. **Credit score computed on-chain.** For MVP simplicity and trustlessness, the
   weighted average is computed inside `AzCredCreditLine.sol` by reading
   directly from the Reputation Registry. No off-chain oracle needed.

5. **Credit limits assigned once.** The credit limit is computed and stored the
   first time `assignCredit(agentId)` is called. It does not recalculate on
   subsequent draws.

6. **Credit limit upgrade: request only for MVP.** A `requestCreditUpgrade(agentId)`
   function will be included in the contract that emits an event signalling the
   request. The re-scoring and approval mechanics will be built post-MVP.
