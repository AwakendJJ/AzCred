import * as fs from "fs"
import * as path from "path"
import { ethers } from "hardhat"

const DEPLOYMENTS_PATH = path.join(__dirname, "..", "deployments", "testnet.json")

export interface DeploymentRecord {
  network: string
  chainId: number
  deployedAt: string | null
  contracts: {
    IdentityRegistry: { address: string | null; txHash: string | null }
    ReputationRegistry: { address: string | null; txHash: string | null }
    ValidationRegistry: { address: string | null; txHash: string | null }
    AzCredCreditLine: { address: string | null; txHash: string | null }
  }
}

export function readDeployments(): DeploymentRecord {
  const raw = fs.readFileSync(DEPLOYMENTS_PATH, "utf8")
  return JSON.parse(raw) as DeploymentRecord
}

export function saveDeployments(data: DeploymentRecord): void {
  fs.writeFileSync(DEPLOYMENTS_PATH, JSON.stringify(data, null, 2), "utf8")
  console.log(`  Saved to deployments/testnet.json`)
}

export async function getDeployer() {
  const [deployer] = await ethers.getSigners()
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log(`\nDeployer : ${deployer.address}`)
  console.log(`Balance  : ${ethers.formatEther(balance)} tCTC\n`)
  return deployer
}

export function separator(label: string) {
  console.log(`\n${"─".repeat(50)}`)
  console.log(`  ${label}`)
  console.log("─".repeat(50))
}
