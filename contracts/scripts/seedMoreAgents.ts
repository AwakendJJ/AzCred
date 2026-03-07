/**
 * seedMoreAgents.ts — registers 4 additional test agents beyond the initial 3.
 *
 * Agents 4–7 cover varied scoring profiles and tiers:
 *
 *  Agent 4 — "Delta"  (Tier 3, score ~72)
 *    successRate: 78, uptime: 68, starred: 68
 *    weighted: 78×0.40 + 68×0.35 + 68×0.25 = 31.2 + 23.8 + 17.0 = 72.0
 *
 *  Agent 5 — "Echo"   (Tier 3, score ~96)
 *    successRate: 97, uptime: 98, starred: 92
 *    weighted: 97×0.40 + 98×0.35 + 92×0.25 = 38.8 + 34.3 + 23.0 = 96.1
 *
 *  Agent 6 — "Flux"   (Tier 1, score ~8)
 *    successRate: 8, uptime: 10, starred: 5
 *    weighted: 8×0.40 + 10×0.35 + 5×0.25 = 3.2 + 3.5 + 1.25 = 7.95
 *
 *  Agent 7 — "Ghost"  (Tier 2, score ~50)
 *    successRate: 50, uptime: 52, starred: 48
 *    weighted: 50×0.40 + 52×0.35 + 48×0.25 = 20 + 18.2 + 12.0 = 50.2
 *
 * Usage: npm run seed:more
 */
import { ethers } from "hardhat"
import { getDeployer, readDeployments, separator } from "./helpers"
import { IdentityRegistry, ReputationRegistry } from "../typechain-types"

const MORE_AGENTS = [
  {
    name: "Delta",
    description: "Tier 3 agent — strong performer across all metrics",
    signals: { successRate: 78, uptime: 68, starred: 68 },
    expectedTier: 3,
    expectedLimit: "1000",
  },
  {
    name: "Echo",
    description: "Tier 3 agent — near-perfect reputation, elite credit profile",
    signals: { successRate: 97, uptime: 98, starred: 92 },
    expectedTier: 3,
    expectedLimit: "1000",
  },
  {
    name: "Flux",
    description: "Tier 1 agent — early-stage with minimal track record",
    signals: { successRate: 8, uptime: 10, starred: 5 },
    expectedTier: 1,
    expectedLimit: "100",
  },
  {
    name: "Ghost",
    description: "Tier 2 agent — steady mid-range performer",
    signals: { successRate: 50, uptime: 52, starred: 48 },
    expectedTier: 2,
    expectedLimit: "500",
  },
]

async function main() {
  separator("Seeding Additional Agents (4–7)")
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

  // Create a throwaway feedback wallet (agent owner cannot self-rate)
  const feedbackWallet = ethers.Wallet.createRandom().connect(ethers.provider)
  console.log(`Feedback signer     : ${feedbackWallet.address} (random, ephemeral)`)
  const fundTx = await deployer.sendTransaction({
    to: feedbackWallet.address,
    value: ethers.parseEther("1"),
  })
  await fundTx.wait()
  console.log(`  Funded feedback signer with 1 tCTC ✓\n`)

  for (const agent of MORE_AGENTS) {
    separator(`Registering Agent: ${agent.name}`)

    const agentURI = JSON.stringify({
      type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
      name: agent.name,
      description: agent.description,
      active: true,
    })

    const registerTx = await identityRegistry.connect(deployer)["register(string)"](agentURI)
    const receipt = await registerTx.wait()

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

    const signals: Array<[string, number]> = [
      ["successRate", agent.signals.successRate],
      ["uptime", agent.signals.uptime],
      ["starred", agent.signals.starred],
    ]

    for (const [tag, value] of signals) {
      const feedbackTx = await reputationRegistry.connect(feedbackWallet).giveFeedback(
        agentId,
        value,
        0,
        tag,
        "",
        "",
        "",
        ethers.ZeroHash
      )
      await feedbackTx.wait()
      console.log(`  Submitted ${tag}: ${value}`)
    }

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

  separator("Done")
  console.log("  4 additional agents registered (Delta, Echo, Flux, Ghost).")
  console.log("  Total agents on-chain: 7. Refresh the dashboard to see them.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
