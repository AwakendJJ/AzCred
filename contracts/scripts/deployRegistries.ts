import { ethers } from "hardhat"
import { getDeployer, readDeployments, saveDeployments, separator } from "./helpers"

async function main() {
  separator("Deploying ERC-8004 Registries")
  const deployer = await getDeployer()
  const deployments = readDeployments()

  // ------------------------------------------------------------------
  // 1. IdentityRegistry
  // ------------------------------------------------------------------
  console.log("Deploying IdentityRegistry...")
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry")
  const identityRegistry = await IdentityRegistry.connect(deployer).deploy()
  await identityRegistry.waitForDeployment()

  const identityAddress = await identityRegistry.getAddress()
  const identityTx = identityRegistry.deploymentTransaction()?.hash ?? ""
  console.log(`  IdentityRegistry  → ${identityAddress}`)

  // ------------------------------------------------------------------
  // 2. ReputationRegistry
  // ------------------------------------------------------------------
  console.log("Deploying ReputationRegistry...")
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry")
  const reputationRegistry = await ReputationRegistry.connect(deployer).deploy()
  await reputationRegistry.waitForDeployment()

  const reputationAddress = await reputationRegistry.getAddress()
  const reputationTx = reputationRegistry.deploymentTransaction()?.hash ?? ""
  console.log(`  ReputationRegistry → ${reputationAddress}`)

  console.log("  Initializing ReputationRegistry with IdentityRegistry...")
  const initRepTx = await reputationRegistry.initialize(identityAddress)
  await initRepTx.wait()
  console.log("  ReputationRegistry initialized ✓")

  // ------------------------------------------------------------------
  // 3. ValidationRegistry
  // ------------------------------------------------------------------
  console.log("Deploying ValidationRegistry...")
  const ValidationRegistry = await ethers.getContractFactory("ValidationRegistry")
  const validationRegistry = await ValidationRegistry.connect(deployer).deploy()
  await validationRegistry.waitForDeployment()

  const validationAddress = await validationRegistry.getAddress()
  const validationTx = validationRegistry.deploymentTransaction()?.hash ?? ""
  console.log(`  ValidationRegistry → ${validationAddress}`)

  console.log("  Initializing ValidationRegistry with IdentityRegistry...")
  const initValTx = await validationRegistry.initialize(identityAddress)
  await initValTx.wait()
  console.log("  ValidationRegistry initialized ✓")

  // ------------------------------------------------------------------
  // Save deployments
  // ------------------------------------------------------------------
  separator("Saving Deployment Addresses")
  deployments.deployedAt = new Date().toISOString()
  deployments.contracts.IdentityRegistry = { address: identityAddress, txHash: identityTx }
  deployments.contracts.ReputationRegistry = { address: reputationAddress, txHash: reputationTx }
  deployments.contracts.ValidationRegistry = { address: validationAddress, txHash: validationTx }
  saveDeployments(deployments)

  separator("Registries Deployed Successfully")
  console.log(`  IdentityRegistry   : ${identityAddress}`)
  console.log(`  ReputationRegistry : ${reputationAddress}`)
  console.log(`  ValidationRegistry : ${validationAddress}`)
  console.log(`\n  Next: run 'npm run deploy:azcred' to deploy AzCredCreditLine`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
