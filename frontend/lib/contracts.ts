import { type Address } from "viem"

// ─── Deployed contract addresses ────────────────────────────────────────────
// These are populated after running `npm run contracts:deploy:testnet`
// and copying addresses from contracts/deployments/testnet.json
export const CONTRACT_ADDRESSES: Record<string, Address> = {
  identityRegistry:
    (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS as Address) ??
    "0x0000000000000000000000000000000000000000",
  reputationRegistry:
    (process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS as Address) ??
    "0x0000000000000000000000000000000000000000",
  validationRegistry:
    (process.env.NEXT_PUBLIC_VALIDATION_REGISTRY_ADDRESS as Address) ??
    "0x0000000000000000000000000000000000000000",
  azCredCreditLine:
    (process.env.NEXT_PUBLIC_AZCRED_CREDIT_LINE_ADDRESS as Address) ??
    "0x0000000000000000000000000000000000000000",
}

// ─── ABIs (minimal — only functions the frontend calls) ──────────────────────

export const IDENTITY_REGISTRY_ABI = [
  // totalSupply() → uint256
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  // tokenByIndex(uint256 index) → uint256
  { type: "function", name: "tokenByIndex", inputs: [{ name: "index", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  // ownerOf(uint256 tokenId) → address
  { type: "function", name: "ownerOf", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }], stateMutability: "view" },
  // tokenURI(uint256 tokenId) → string
  { type: "function", name: "tokenURI", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "string" }], stateMutability: "view" },
  // getMetadata(uint256 agentId) → (string agentType, string model, string endpoint, string version, string description)
  {
    type: "function",
    name: "getMetadata",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      { name: "agentType", type: "string" },
      { name: "model", type: "string" },
      { name: "endpoint", type: "string" },
      { name: "version", type: "string" },
      { name: "description", type: "string" },
    ],
    stateMutability: "view",
  },
  // balanceOf(address owner) → uint256
  { type: "function", name: "balanceOf", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  // tokenOfOwnerByIndex(address owner, uint256 index) → uint256
  { type: "function", name: "tokenOfOwnerByIndex", inputs: [{ name: "owner", type: "address" }, { name: "index", type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const

export const REPUTATION_REGISTRY_ABI = [
  // getLatestSignal(uint256 agentId, string tag1) → (int128 value, uint8 valueDecimals, bool found)
  {
    type: "function",
    name: "getLatestSignal",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "tag1", type: "string" },
    ],
    outputs: [
      { name: "value", type: "int128" },
      { name: "valueDecimals", type: "uint8" },
      { name: "found", type: "bool" },
    ],
    stateMutability: "view",
  },
] as const

export const AZCRED_CREDIT_LINE_ABI = [
  // assignCredit(uint256 agentId)
  {
    type: "function",
    name: "assignCredit",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // drawCredit(uint256 agentId, uint256 amount)
  {
    type: "function",
    name: "drawCredit",
    inputs: [{ name: "agentId", type: "uint256" }, { name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // repayCredit(uint256 agentId)  payable
  {
    type: "function",
    name: "repayCredit",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  // getCreditProfile(uint256 agentId) → (uint256 limit, uint256 outstanding, uint256 available, uint8 score)
  {
    type: "function",
    name: "getCreditProfile",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      { name: "limit", type: "uint256" },
      { name: "outstanding", type: "uint256" },
      { name: "available", type: "uint256" },
      { name: "score", type: "uint8" },
    ],
    stateMutability: "view",
  },
  // previewScore(uint256 agentId) → (uint8 score, uint256 limit)
  {
    type: "function",
    name: "previewScore",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      { name: "score", type: "uint8" },
      { name: "limit", type: "uint256" },
    ],
    stateMutability: "view",
  },
  // requestCreditUpgrade(uint256 agentId)
  {
    type: "function",
    name: "requestCreditUpgrade",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // poolBalance() → uint256
  {
    type: "function",
    name: "poolBalance",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  // annualInterestRateBps() → uint256
  {
    type: "function",
    name: "annualInterestRateBps",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  // interestAccrued(uint256 agentId) → uint256
  {
    type: "function",
    name: "interestAccrued",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  // totalOwed(uint256 agentId) → uint256  (principal + interest)
  {
    type: "function",
    name: "totalOwed",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  // drawTimestamp(uint256 agentId) → uint256
  {
    type: "function",
    name: "drawTimestamp",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  // ── Events (used by getLogs for history page) ───────────────────────────
  {
    type: "event",
    name: "CreditAssigned",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "creditLimit", type: "uint256", indexed: false },
      { name: "score", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CreditDrawn",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "outstandingBalance", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CreditRepaid",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "outstandingBalance", type: "uint256", indexed: false },
    ],
  },
] as const
