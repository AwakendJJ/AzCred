/**
 * deployAzCred.ts — deploys AzCredCreditLine and funds the pool.
 * Requires IdentityRegistry and ReputationRegistry to already be deployed.
 *
 * Usage: npm run deploy:azcred
 */
import { ethers } from "hardhat"
import { getDeployer, readDeployments, saveDeployments, separator } from "./helpers"

async function main() {
  separator("Deploying AzCredCreditLine")
  const deployer = await getDeployer()
  const deployments = readDeployments()

  const identityAddr = deployments.contracts.IdentityRegistry.address
  const reputationAddr = deployments.contracts.ReputationRegistry.address

  if (!identityAddr || !reputationAddr) {
    throw new Error(
      "Registry addresses not found. Run 'npm run deploy:registries' first."
    )
  }

  console.log(`Using IdentityRegistry   : ${identityAddr}`)
  console.log(`Using ReputationRegistry : ${reputationAddr}\n`)

  const AzCredCreditLine = await ethers.getContractFactory("AzCredCreditLine")
  const azCredCreditLine = await AzCredCreditLine.connect(deployer).deploy(
    identityAddr,
    reputationAddr
  )
  await azCredCreditLine.waitForDeployment()
  const creditLineAddress = await azCredCreditLine.getAddress()
  console.log(`  AzCredCreditLine → ${creditLineAddress}`)

  // Fund pool with 3000 tCTC (covers 3 × Tier 3 agents)
  console.log("  Funding credit pool with 3000 tCTC...")
  const fundTx = await azCredCreditLine.fundPool({
    value: ethers.parseEther("3000"),
  })
  await fundTx.wait()
  const balance = await ethers.provider.getBalance(creditLineAddress)
  console.log(`  Pool funded → ${ethers.formatEther(balance)} tCTC ✓`)

  deployments.contracts.AzCredCreditLine = {
    address: creditLineAddress,
    txHash: azCredCreditLine.deploymentTransaction()?.hash ?? "",
  }
  saveDeployments(deployments)

  separator("AzCredCreditLine Deployed")
  console.log(`  Address  : ${creditLineAddress}`)
  console.log(`  Pool     : ${ethers.formatEther(balance)} tCTC`)
  console.log(`\n  Next: copy address to frontend/.env.local`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
