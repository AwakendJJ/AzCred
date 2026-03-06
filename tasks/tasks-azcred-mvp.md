# AzCred MVP — Implementation Task List

> Reference PRD: `tasks/prd-azcred-mvp.md`
> Target network: Creditcoin EVM Testnet
> Stack: Solidity (Hardhat/Foundry) · Next.js · Tailwind · wagmi v2 · viem · RainbowKit

---

## Phase 0 — Project Setup

- [ ] **TASK-001** Initialize monorepo structure with two workspaces:
  - `contracts/` — Hardhat or Foundry project
  - `frontend/` — Next.js app
  - Root `package.json` with workspace scripts

- [ ] **TASK-002** Set up `contracts/` workspace:
  - Initialize Hardhat project with TypeScript
  - Install dependencies: `@openzeppelin/contracts`, `hardhat`, `@nomicfoundation/hardhat-toolbox`, `dotenv`
  - Configure `hardhat.config.ts` with Creditcoin EVM testnet RPC and chain ID
  - Add `.env.example` with required vars: `PRIVATE_KEY`, `CREDITCOIN_TESTNET_RPC`

- [ ] **TASK-003** Set up `frontend/` workspace:
  - Initialize Next.js project with App Router and TypeScript
  - Install Tailwind CSS and configure `tailwind.config.ts`
  - Install shadcn/ui and initialize it
  - Install wagmi v2, viem, RainbowKit
  - Configure RainbowKit with Creditcoin EVM testnet chain definition

- [ ] **TASK-004** Set up shared config:
  - Create `contracts/deployments/` folder for storing deployed contract addresses
  - Create `frontend/lib/contracts.ts` to import deployed addresses and ABIs
  - Add a root `README.md` with project overview and setup instructions

---

## Phase 1 — ERC-8004 Registry Contracts

> Deploy the three ERC-8004 registries as dependencies. Since ERC-8004 is a draft
> standard, implement the contracts from the spec and deploy them ourselves.

- [ ] **TASK-005** Implement `IdentityRegistry.sol`:
  - Extends ERC-721 with URIStorage extension (OpenZeppelin)
  - `register(string agentURI)` — mints a new agentId, emits `Registered` event
  - `register()` — mints without URI, URI set later
  - `setAgentURI(uint256 agentId, string newURI)` — owner/operator only
  - `getMetadata` / `setMetadata` for optional on-chain key-value metadata
  - `setAgentWallet` / `getAgentWallet` / `unsetAgentWallet` with EIP-712
    signature verification
  - Emits: `Registered`, `URIUpdated`, `MetadataSet`

- [ ] **TASK-006** Implement `ReputationRegistry.sol`:
  - `initialize(address identityRegistry)` — sets the Identity Registry address
  - `giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1,
    string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)`
  - `revokeFeedback(uint256 agentId, uint64 feedbackIndex)`
  - `appendResponse(uint256 agentId, address clientAddress, uint64 feedbackIndex,
    string responseURI, bytes32 responseHash)`
  - `getSummary`, `readFeedback`, `readAllFeedback`, `getClients`, `getLastIndex`
  - Emits: `NewFeedback`, `FeedbackRevoked`, `ResponseAppended`
  - Store `successRate`, `uptime`, `starred` signals as tagged feedback entries
    with tag1 values: `"successRate"`, `"uptime"`, `"starred"`

- [ ] **TASK-007** Implement `ValidationRegistry.sol`:
  - `initialize(address identityRegistry)`
  - `validationRequest(address validatorAddress, uint256 agentId, string requestURI,
    bytes32 requestHash)` — owner/operator only
  - `validationResponse(bytes32 requestHash, uint8 response, string responseURI,
    bytes32 responseHash, string tag)` — validator only
  - `getValidationStatus`, `getSummary`, `getAgentValidations`,
    `getValidatorRequests`
  - Emits: `ValidationRequest`, `ValidationResponse`

- [ ] **TASK-008** Write deploy script `scripts/deployRegistries.ts`:
  - Deploy IdentityRegistry
  - Deploy ReputationRegistry with IdentityRegistry address
  - Deploy ValidationRegistry with IdentityRegistry address
  - Save all three deployed addresses to `contracts/deployments/testnet.json`

- [ ] **TASK-009** Write seed script `scripts/seedTestAgents.ts`:
  - Register 3 test agents in IdentityRegistry with distinct names and metadata
  - Submit reputation feedback for each agent covering all 3 credit tiers:
    - Agent A: scores placing it in Tier 1 (score 0–33, limit 100 CTC)
    - Agent B: scores placing it in Tier 2 (score 34–66, limit 500 CTC)
    - Agent C: scores placing it in Tier 3 (score 67–100, limit 1,000 CTC)
  - Log agentIds and resulting scores to console

- [ ] **TASK-010** Deploy registries to Creditcoin testnet and run seed script.
  Verify on-chain state using a read script before proceeding.

---

## Phase 2 — AzCredCreditLine Contract

- [ ] **TASK-011** Implement `AzCredCreditLine.sol`:

  **Storage:**
  - Mapping: `agentId → creditLimit`
  - Mapping: `agentId → outstandingBalance`
  - Reference to deployed IdentityRegistry and ReputationRegistry addresses

  **Credit score computation (internal):**
  - `_getReputationSignal(uint256 agentId, string tag)` — reads the latest
    non-revoked feedback value for a given tag from ReputationRegistry
  - `_computeScore(uint256 agentId) returns (uint8)` — weighted average:
    successRate × 0.40 + uptime × 0.35 + starred × 0.25
  - `_getCreditLimit(uint8 score) returns (uint256)` — tier mapping:
    0–33 → 100 CTC, 34–66 → 500 CTC, 67–100 → 1,000 CTC

  **External functions:**
  - `assignCredit(uint256 agentId)` — verifies agent exists in IdentityRegistry,
    computes score on-chain from Reputation Registry, sets credit limit once.
    Reverts if credit already assigned. Emits `CreditAssigned`.
  - `drawCredit(uint256 agentId, uint256 amount)` — caller must be agentId owner,
    checks outstanding + amount ≤ limit, transfers CTC to caller, updates balance.
    Emits `CreditDrawn`.
  - `repayCredit(uint256 agentId)` — payable, accepts CTC, reduces outstanding
    balance. Emits `CreditRepaid`.
  - `requestCreditUpgrade(uint256 agentId)` — caller must be agentId owner,
    emits `CreditUpgradeRequested` event. No score recalculation in MVP —
    upgrade mechanics handled post-MVP.
  - `getCreditProfile(uint256 agentId) returns (uint256 limit, uint256 outstanding,
    uint256 available, uint8 score)` — view function

  **Admin:**
  - `fundPool()` — payable, owner only, adds CTC to contract reserve
  - `withdrawPool(uint256 amount)` — owner only, emergency withdrawal

  **Events:**
  - `CreditAssigned(uint256 indexed agentId, uint256 creditLimit, uint8 score)`
  - `CreditDrawn(uint256 indexed agentId, uint256 amount, uint256 outstandingBalance)`
  - `CreditRepaid(uint256 indexed agentId, uint256 amount, uint256 outstandingBalance)`
  - `CreditUpgradeRequested(uint256 indexed agentId, address indexed owner)`

- [ ] **TASK-012** Write unit tests `test/AzCredCreditLine.test.ts` using Hardhat + Ethers.js v6:
  - Test `assignCredit` for all 3 tiers with mocked reputation data
  - Test `drawCredit`: success, over-limit revert, wrong-owner revert
  - Test `repayCredit`: partial repay, full repay
  - Test `getCreditProfile` returns correct values at each lifecycle stage
  - Test events are emitted with correct parameters

- [ ] **TASK-013** Write deploy script `scripts/deployAzCred.ts`:
  - Deploy `AzCredCreditLine.sol` with IdentityRegistry and ReputationRegistry
    addresses as constructor args
  - Fund the contract pool with testnet CTC
  - Save deployed address to `contracts/deployments/testnet.json`
  - Run `assignCredit` for each of the 3 seeded test agents

- [ ] **TASK-014** Deploy AzCredCreditLine to Creditcoin testnet, run all unit
  tests against the live deployment, and verify credit profiles for seeded agents.

---

## Phase 3 — Frontend

### 3.1 Design System Setup

- [ ] **TASK-015** Set up the AzCred design system from the provided template
  (`mnimal-animated-hero-template/`):
  - Copy `app/globals.css` into the AzCred frontend as the base CSS file
    (contains all OKLCH CSS variable tokens and `@theme inline {}` block)
  - Copy `components.json` (shadcn new-york style, neutral base, CSS variables)
  - Copy custom components into `components/`:
    `shimmer-button.tsx`, `line-shadow-text.tsx`, `theme-provider.tsx`
  - Copy all shadcn/ui base components from `components/ui/` into AzCred frontend
  - Copy `hooks/use-toast.ts` and `lib/utils.ts`
  - Add brand orange as a named token in `globals.css`:
    `--accent-brand: oklch(0.703 0.213 47.604);` (orange-500 in OKLCH)
  - Install required packages from template: `motion`, `tw-animate-css`,
    `next-themes`, `lucide-react`, `class-variance-authority`
  - Configure `next/font/google` for Geist and Geist Mono in `app/layout.tsx`
  - Verify dark mode uses class strategy in the theme provider

- [ ] **TASK-016** Build shared layout components:
  - `components/layout/Navbar.tsx` — logo, Dashboard link, Liquidity tab with
    "Coming Soon" badge, Connect Wallet button (RainbowKit)
  - `components/layout/Footer.tsx` — protocol name, links, tagline
  - `app/layout.tsx` — root layout wrapping all pages with Navbar + Footer,
    wagmi/RainbowKit providers

- [ ] **TASK-017** Build shared UI components:
  - `components/ui/AgentCard.tsx` — card showing agent info, credit tier badge,
    signals, draw/repay inputs
  - `components/ui/CreditTierBadge.tsx` — color-coded tier label (Tier 1/2/3)
  - `components/ui/ReputationSignals.tsx` — displays successRate, uptime, starred
  - `components/ui/TransactionButton.tsx` — button with pending/confirmed/failed
    states and toast notification integration
  - `components/ui/StatCard.tsx` — reusable labeled stat display (limit,
    outstanding, available)

### 3.2 Landing Page

- [ ] **TASK-018** Build `app/page.tsx` — Landing page:
  - Reuse the animated SVG background (36 thread paths + orange glow dots +
    radial gradient pulses) from the template's `page.tsx` directly
  - Hero section: AzCred headline using `<LineShadowText>`, subheadline,
    `<ShimmerButton>` "Launch App" CTA (orange-500)
  - How it works: 3-step explainer (Register Agent → Get Scored → Borrow CTC)
    with icons and short descriptions
  - Protocol roadmap section:
    - Phase 1: MVP — Agent Credit Lines (current, highlighted)
    - Phase 2: Liquidity Pools — Capital providers earn yield
    - Phase 3: Agent-to-Agent Credit — Agents lend to agents
  - Responsive layout (left-aligned hero, max-w-6xl, matching template spacing)

### 3.3 Dashboard Page

- [ ] **TASK-019** Build `app/dashboard/page.tsx` — Agent owner dashboard:
  - Guard: if wallet not connected, show "Connect Wallet" prompt
  - On connect: query IdentityRegistry for all `agentId`s owned by the connected
    address using `tokensOfOwner` or Transfer event filter
  - For each agentId, call `AzCredCreditLine.getCreditProfile(agentId)` to get
    limit, outstanding, available, score
  - Render one `AgentCard` per agent

- [ ] **TASK-020** Implement Draw Credit flow in `AgentCard`:
  - Input field for CTC amount
  - On submit: call `drawCredit(agentId, amount)` via wagmi `useWriteContract`
  - Show pending toast → confirmed toast → update balance on success
  - Show error toast on revert with reason

- [ ] **TASK-021** Implement Repay Credit flow in `AgentCard`:
  - Input field for CTC repayment amount
  - On submit: call `repayCredit(agentId)` as payable with CTC value via wagmi
  - Show pending → confirmed → balance update flow
  - Show error state on failure

### 3.4 Public Agent Profile Page

- [ ] **TASK-022** Build `app/agent/[agentId]/page.tsx` — Public credit profile:
  - Fetch agent metadata from IdentityRegistry: name, owner, agentURI
  - Fetch reputation signals from ReputationRegistry for the agentId
  - Fetch credit profile from AzCredCreditLine
  - Display credit score breakdown showing each signal's contribution
  - Display transaction history by filtering `CreditDrawn` and `CreditRepaid`
    events from AzCredCreditLine contract logs

### 3.5 Liquidity Coming Soon Tab

- [ ] **TASK-023** Build `app/liquidity/page.tsx` — Coming Soon teaser:
  - Lock banner: "Liquidity Pools — Coming Soon"
  - Feature preview section: what LPs will be able to do
    - Deposit CTC into the AzCred pool
    - Earn yield from agent credit interest
    - View real-time pool utilization and APY
  - Roadmap card: MVP → Liquidity Pools → Agent-to-Agent Credit
  - Waitlist section: email or wallet address input + "Notify Me" button
    (stores locally or to a simple API route for MVP)

---

## Phase 4 — Integration & Demo Validation

- [ ] **TASK-024** Wire frontend to deployed testnet contracts:
  - Populate `frontend/lib/contracts.ts` with all contract addresses and ABIs
    from `contracts/deployments/testnet.json`
  - Confirm all wagmi hooks resolve correctly against testnet

- [ ] **TASK-025** End-to-end demo run (manual test script):
  - Connect wallet (agent owner address) → verify dashboard shows 3 test agents
  - Verify Tier 1 / Tier 2 / Tier 3 agents each show correct limits
  - Draw 50 CTC on Tier 2 agent → confirm balance updates in UI
  - Navigate to public profile for Tier 2 agent → confirm transaction appears
    in history
  - Repay 50 CTC → confirm balance resets
  - Navigate to `/liquidity` → confirm Coming Soon page renders correctly
  - Verify visual theme is consistent across all pages

- [ ] **TASK-026** Write `README.md` files:
  - Root `README.md`: project overview, architecture diagram, quick start
  - `contracts/README.md`: contract descriptions, deploy and test commands
  - `frontend/README.md`: frontend setup, env vars, dev server command

- [ ] **TASK-027** Record demo walkthrough:
  - Landing page → Connect wallet → Dashboard → Draw → Public Profile →
    Repay → Liquidity Coming Soon tab
  - Suitable for investor/community demo presentation

---

## Task Summary

| Phase | Tasks       | Description                              |
|-------|-------------|------------------------------------------|
| 0     | 001–004     | Project and tooling setup                |
| 1     | 005–010     | ERC-8004 registry contracts + seed data  |
| 2     | 011–014     | AzCredCreditLine contract + tests        |
| 3     | 015–023     | Frontend: design system + all pages      |
| 4     | 024–027     | Integration, demo validation, docs       |

**Total tasks: 27**
