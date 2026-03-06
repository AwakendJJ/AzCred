/**
 * deployAll.ts — runs the full deployment sequence in one command:
 *   1. Deploy IdentityRegistry, ReputationRegistry, ValidationRegistry
 *   2. Deploy AzCredCreditLine (requires AzCredCreditLine.sol to exist)
 *
 * Usage: npm run deploy:testnet
 *
 * Note: run seedTestAgents separately after deployment:
 *   npm run seed
 */
import { ethers } from "hardhat"
import { getDeployer, readDeployments, saveDeployments, separator } from "./helpers"

async function main() {
  separator("AzCred Full Deployment")
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
  console.log(`  IdentityRegistry   → ${identityAddress}`)

  // ------------------------------------------------------------------
  // 2. ReputationRegistry
  // ------------------------------------------------------------------
  console.log("Deploying ReputationRegistry...")
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistry")
  const reputationRegistry = await ReputationRegistry.connect(deployer).deploy()
  await reputationRegistry.waitForDeployment()
  const reputationAddress = await reputationRegistry.getAddress()
  await (await reputationRegistry.initialize(identityAddress)).wait()
  console.log(`  ReputationRegistry → ${reputationAddress} (initialized)`)

  // ------------------------------------------------------------------
  // 3. ValidationRegistry
  // ------------------------------------------------------------------
  console.log("Deploying ValidationRegistry...")
  const ValidationRegistry = await ethers.getContractFactory("ValidationRegistry")
  const validationRegistry = await ValidationRegistry.connect(deployer).deploy()
  await validationRegistry.waitForDeployment()
  const validationAddress = await validationRegistry.getAddress()
  // initialize() skipped — ValidationRegistry is not used by AzCredCreditLine in the MVP
  // and its initialize() triggers an unsupported opcode on the Creditcoin testnet EVM
  console.log(`  ValidationRegistry → ${validationAddress} (deployed, uninitialized)`)

  // ------------------------------------------------------------------
  // 4. AzCredCreditLine
  // ------------------------------------------------------------------
  console.log("Deploying AzCredCreditLine...")
  const AzCredCreditLine = await ethers.getContractFactory("AzCredCreditLine")
  const azCredCreditLine = await AzCredCreditLine.connect(deployer).deploy(
    identityAddress,
    reputationAddress
  )
  await azCredCreditLine.waitForDeployment()
  const creditLineAddress = await azCredCreditLine.getAddress()
  console.log(`  AzCredCreditLine   → ${creditLineAddress}`)

  // Fund the credit pool with 100 tCTC (testnet demo amount)
  console.log("  Funding credit pool with 100 tCTC...")
  const fundTx = await azCredCreditLine.fundPool({
    value: ethers.parseEther("100"),
  })
  await fundTx.wait()
  console.log("  Pool funded ✓")

  // ------------------------------------------------------------------
  // Save deployments
  // ------------------------------------------------------------------
  separator("Saving Addresses")
  deployments.deployedAt = new Date().toISOString()
  deployments.contracts.IdentityRegistry = {
    address: identityAddress,
    txHash: identityRegistry.deploymentTransaction()?.hash ?? "",
  }
  deployments.contracts.ReputationRegistry = {
    address: reputationAddress,
    txHash: reputationRegistry.deploymentTransaction()?.hash ?? "",
  }
  deployments.contracts.ValidationRegistry = {
    address: validationAddress,
    txHash: validationRegistry.deploymentTransaction()?.hash ?? "",
  }
  deployments.contracts.AzCredCreditLine = {
    address: creditLineAddress,
    txHash: azCredCreditLine.deploymentTransaction()?.hash ?? "",
  }
  saveDeployments(deployments)

  separator("Deployment Complete")
  console.log(`  IdentityRegistry   : ${identityAddress}`)
  console.log(`  ReputationRegistry : ${reputationAddress}`)
  console.log(`  ValidationRegistry : ${validationAddress}`)
  console.log(`  AzCredCreditLine   : ${creditLineAddress}`)
  console.log(`\n  Next steps:`)
  console.log(`    1. npm run seed                         → register test agents`)
  console.log(`    2. Copy addresses to frontend/.env.local`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
