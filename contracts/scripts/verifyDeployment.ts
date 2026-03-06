/**
 * verifyDeployment.ts — reads on-chain state and confirms all contracts
 * are correctly deployed and linked. Run after deployment and seeding.
 *
 * Usage: npm run verify
 */
import { ethers } from "hardhat"
import { readDeployments, separator } from "./helpers"
import { IdentityRegistry, ReputationRegistry, ValidationRegistry } from "../typechain-types"

async function main() {
  separator("Verifying Deployment State")
  const deployments = readDeployments()
  const { IdentityRegistry: ir, ReputationRegistry: rr, ValidationRegistry: vr } =
    deployments.contracts

  if (!ir.address || !rr.address || !vr.address) {
    throw new Error("Missing deployment addresses. Run deploy first.")
  }

  // ------------------------------------------------------------------
  // IdentityRegistry
  // ------------------------------------------------------------------
  const identityRegistry = (await ethers.getContractAt(
    "IdentityRegistry",
    ir.address
  )) as unknown as IdentityRegistry

  const totalAgents = await identityRegistry.totalSupply()
  console.log(`\nIdentityRegistry   : ${ir.address}`)
  console.log(`  Total agents     : ${totalAgents}`)
  console.log(`  Supports ERC-721 : ${await identityRegistry.supportsInterface("0x80ac58cd")}`)

  // ------------------------------------------------------------------
  // ReputationRegistry
  // ------------------------------------------------------------------
  const reputationRegistry = (await ethers.getContractAt(
    "ReputationRegistry",
    rr.address
  )) as unknown as ReputationRegistry

  const linkedIdentity = await reputationRegistry.getIdentityRegistry()
  console.log(`\nReputationRegistry : ${rr.address}`)
  console.log(`  IdentityRegistry : ${linkedIdentity}`)
  console.log(`  Link correct     : ${linkedIdentity.toLowerCase() === ir.address.toLowerCase()}`)

  // ------------------------------------------------------------------
  // ValidationRegistry
  // ------------------------------------------------------------------
  const validationRegistry = (await ethers.getContractAt(
    "ValidationRegistry",
    vr.address
  )) as unknown as ValidationRegistry

  const linkedIdentityVal = await validationRegistry.getIdentityRegistry()
  console.log(`\nValidationRegistry : ${vr.address}`)
  console.log(`  IdentityRegistry : ${linkedIdentityVal}`)
  console.log(`  Link correct     : ${linkedIdentityVal.toLowerCase() === ir.address.toLowerCase()}`)

  // ------------------------------------------------------------------
  // Agent signal readback (if agents exist)
  // ------------------------------------------------------------------
  if (totalAgents > 0n) {
    separator("Agent Signal Read-back")
    for (let i = 1n; i <= totalAgents; i++) {
      const owner = await identityRegistry.ownerOf(i)
      const uri = await identityRegistry.tokenURI(i)
      const [ssVal, , ssFound] = await reputationRegistry.getLatestSignal(i, "successRate")
      const [upVal, , upFound] = await reputationRegistry.getLatestSignal(i, "uptime")
      const [stVal, , stFound] = await reputationRegistry.getLatestSignal(i, "starred")

      const score = ssFound && upFound && stFound
        ? (Number(ssVal) * 40 + Number(upVal) * 35 + Number(stVal) * 25) / 100
        : null

      let agentName = `agentId ${i}`
      try {
        const parsed = JSON.parse(uri)
        agentName = parsed.name ?? agentName
      } catch {}

      console.log(`\n  ${agentName} (agentId ${i})`)
      console.log(`    owner       : ${owner}`)
      console.log(`    successRate : ${ssFound ? ssVal : "not set"}`)
      console.log(`    uptime      : ${upFound ? upVal : "not set"}`)
      console.log(`    starred     : ${stFound ? stVal : "not set"}`)
      console.log(`    score       : ${score !== null ? score.toFixed(2) : "incomplete"}`)
    }
  }

  separator("Verification Complete")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
