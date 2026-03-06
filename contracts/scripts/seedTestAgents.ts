import { ethers } from "hardhat"
import { getDeployer, readDeployments, separator } from "./helpers"
import { IdentityRegistry, ReputationRegistry } from "../typechain-types"

/**
 * Seeds 3 test AI agents covering all three credit tiers:
 *
 *  Agent 1 — "Aria" (Tier 1, score ~25)
 *    successRate: 20, uptime: 30, starred: 25
 *    weighted: 20×0.40 + 30×0.35 + 25×0.25 = 8 + 10.5 + 6.25 = 24.75 → Tier 1 → 100 tCTC
 *
 *  Agent 2 — "Bolt" (Tier 2, score ~55)
 *    successRate: 55, uptime: 60, starred: 45
 *    weighted: 55×0.40 + 60×0.35 + 45×0.25 = 22 + 21 + 11.25 = 54.25 → Tier 2 → 500 tCTC
 *
 *  Agent 3 — "Cypher" (Tier 3, score ~82)
 *    successRate: 89, uptime: 97, starred: 82
 *    weighted: 89×0.40 + 97×0.35 + 82×0.25 = 35.6 + 33.95 + 20.5 = 90.05 → Tier 3 → 1000 tCTC
 */

const AGENTS = [
  {
    name: "Aria",
    description: "Tier 1 test agent — low reputation scores",
    signals: { successRate: 20, uptime: 30, starred: 25 },
    expectedTier: 1,
    expectedLimit: "100",
  },
  {
    name: "Bolt",
    description: "Tier 2 test agent — mid reputation scores",
    signals: { successRate: 55, uptime: 60, starred: 45 },
    expectedTier: 2,
    expectedLimit: "500",
  },
  {
    name: "Cypher",
    description: "Tier 3 test agent — high reputation scores",
    signals: { successRate: 89, uptime: 97, starred: 82 },
    expectedTier: 3,
    expectedLimit: "1000",
  },
]

async function main() {
  separator("Seeding Test Agents")
  const deployer = await getDeployer()
  const deployments = readDeployments()

  const identityAddr = deployments.contracts.IdentityRegistry.address
  const reputationAddr = deployments.contracts.ReputationRegistry.address

  if (!identityAddr || !reputationAddr) {
    throw new Error(
      "Registry addresses not found. Run 'npm run deploy:testnet' first."
    )
  }

  const identityRegistry = (await ethers.getContractAt(
    "IdentityRegistry",
    identityAddr
  )) as unknown as IdentityRegistry

  const reputationRegistry = (await ethers.getContractAt(
    "ReputationRegistry",
    reputationAddr
  )) as unknown as ReputationRegistry

  console.log(`Identity Registry   : ${identityAddr}`)
  console.log(`Reputation Registry : ${reputationAddr}\n`)

  // ── Feedback signer ──────────────────────────────────────────────────────
  // giveFeedback() blocks the agent owner from rating their own agent.
  // Since the deployer registers all agents (and therefore owns them), we
  // create a fresh throwaway wallet and fund it with a small amount of tCTC
  // to pay for gas when submitting feedback.
  const feedbackWallet = ethers.Wallet.createRandom().connect(ethers.provider)
  console.log(`Feedback signer     : ${feedbackWallet.address} (random, ephemeral)`)
  const fundTx = await deployer.sendTransaction({
    to: feedbackWallet.address,
    value: ethers.parseEther("1"), // 1 tCTC covers 9 feedback txs with plenty of margin
  })
  await fundTx.wait()
  console.log(`  Funded feedback signer with 1 tCTC ✓\n`)

  for (const agent of AGENTS) {
    separator(`Registering Agent: ${agent.name}`)

    // 1. Register agent in IdentityRegistry (deployer becomes the agent owner)
    const agentURI = JSON.stringify({
      type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
      name: agent.name,
      description: agent.description,
      active: true,
    })

    const registerTx = await identityRegistry.connect(deployer)["register(string)"](agentURI)
    const receipt = await registerTx.wait()

    // Parse agentId from Registered event
    const registeredEvent = receipt?.logs
      .map((log) => {
        try {
          return identityRegistry.interface.parseLog(log)
        } catch {
          return null
        }
      })
      .find((e) => e?.name === "Registered")

    if (!registeredEvent) throw new Error(`Registered event not found for ${agent.name}`)
    const agentId: bigint = registeredEvent.args.agentId
    console.log(`  Registered ${agent.name} → agentId: ${agentId}`)

    // 2. Submit reputation signals using the feedbackWallet (not the agent owner)
    const signals: Array<[string, number]> = [
      ["successRate", agent.signals.successRate],
      ["uptime", agent.signals.uptime],
      ["starred", agent.signals.starred],
    ]

    for (const [tag, value] of signals) {
      const feedbackTx = await reputationRegistry.connect(feedbackWallet).giveFeedback(
        agentId,
        value,           // int128 value (0-100 scale, 0 decimals)
        0,               // valueDecimals
        tag,             // tag1
        "",              // tag2
        "",              // endpoint
        "",              // feedbackURI
        ethers.ZeroHash  // feedbackHash
      )
      await feedbackTx.wait()
      console.log(`  Submitted ${tag}: ${value}`)
    }

    // 3. Verify signals are readable
    const [ssValue, , ssFound] = await reputationRegistry.getLatestSignal(agentId, "successRate")
    const [upValue, , upFound] = await reputationRegistry.getLatestSignal(agentId, "uptime")
    const [stValue, , stFound] = await reputationRegistry.getLatestSignal(agentId, "starred")

    if (!ssFound || !upFound || !stFound) {
      throw new Error(`Signal read-back failed for ${agent.name}`)
    }

    const score =
      (Number(ssValue) * 40 + Number(upValue) * 35 + Number(stValue) * 25) / 100

    console.log(`\n  Signals verified:`)
    console.log(`    successRate : ${ssValue}`)
    console.log(`    uptime      : ${upValue}`)
    console.log(`    starred     : ${stValue}`)
    console.log(`    Score       : ${score.toFixed(2)} → Tier ${agent.expectedTier} → ${agent.expectedLimit} tCTC limit`)
  }

  separator("Seeding Complete")
  console.log("  3 agents registered and seeded across all credit tiers.")
  console.log("  Next: copy addresses to frontend/.env.local and run npm run frontend:dev")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
