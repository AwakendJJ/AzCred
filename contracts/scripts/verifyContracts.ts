/**
 * verifyContracts.ts — submits source-code verification for all four
 * deployed contracts to the Creditcoin Testnet Blockscout explorer.
 *
 * Usage:  npm run verify:contracts
 *
 * Requires:
 *   - contracts/deployments/testnet.json populated (run deploy first)
 *   - hardhat.config.ts has etherscan.customChains entry for creditcoin_testnet
 */
import hre from "hardhat"
import { readDeployments, separator } from "./helpers"

async function verifyOne(
  name: string,
  address: string,
  constructorArguments: unknown[] = []
) {
  console.log(`\nVerifying ${name} at ${address} …`)
  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments,
    })
    console.log(`  ✓ ${name} verified`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("Already Verified") || msg.includes("already verified")) {
      console.log(`  ✓ ${name} already verified`)
    } else {
      console.error(`  ✗ ${name} verification failed: ${msg}`)
    }
  }
}

async function main() {
  separator("AzCred Contract Verification — Creditcoin Testnet")

  const deployments = readDeployments()
  const {
    IdentityRegistry: ir,
    ReputationRegistry: rr,
    ValidationRegistry: vr,
    AzCredCreditLine: cl,
  } = deployments.contracts

  if (!ir?.address || !rr?.address || !vr?.address || !cl?.address) {
    throw new Error(
      "One or more addresses missing in deployments/testnet.json. Run deploy first."
    )
  }

  // IdentityRegistry — no constructor args
  await verifyOne("IdentityRegistry", ir.address, [])

  // ReputationRegistry — no constructor args
  await verifyOne("ReputationRegistry", rr.address, [])

  // ValidationRegistry — no constructor args
  await verifyOne("ValidationRegistry", vr.address, [])

  // AzCredCreditLine — constructor(address _identityRegistry, address _reputationRegistry)
  await verifyOne("AzCredCreditLine", cl.address, [ir.address, rr.address])

  separator("Verification Submitted")
  console.log("Check results on Blockscout:")
  console.log(`  IdentityRegistry   : https://creditcoin-testnet.blockscout.com/address/${ir.address}`)
  console.log(`  ReputationRegistry : https://creditcoin-testnet.blockscout.com/address/${rr.address}`)
  console.log(`  ValidationRegistry : https://creditcoin-testnet.blockscout.com/address/${vr.address}`)
  console.log(`  AzCredCreditLine   : https://creditcoin-testnet.blockscout.com/address/${cl.address}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
