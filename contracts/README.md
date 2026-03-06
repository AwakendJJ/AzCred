# AzCred Contracts

Solidity smart contracts for the AzCred protocol, deployed on Creditcoin EVM Testnet.

## Contracts

### ERC-8004 Registries (dependencies)

| Contract             | Description                                              |
|----------------------|----------------------------------------------------------|
| `IdentityRegistry`   | ERC-721 agent registration (assigns `agentId`)          |
| `ReputationRegistry` | On-chain feedback signals (successRate, uptime, starred) |
| `ValidationRegistry` | Verification hooks (read-only for MVP)                   |

### AzCred Protocol

| Contract            | Description                                              |
|---------------------|----------------------------------------------------------|
| `AzCredCreditLine`  | Credit scoring, assignment, draw, and repay              |

## Credit Scoring

`AzCredCreditLine` reads three reputation signals and computes a weighted score:

| Signal        | Tag in Registry | Weight |
|---------------|-----------------|--------|
| `successRate` | `"successRate"` | 40%    |
| `uptime`      | `"uptime"`      | 35%    |
| `starred`     | `"starred"`     | 25%    |

Score → Credit Limit mapping:

| Score Range | Credit Limit |
|-------------|--------------|
| 0 – 33      | 100 tCTC     |
| 34 – 66     | 500 tCTC     |
| 67 – 100    | 1,000 tCTC   |

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Fill in PRIVATE_KEY and CREDITCOIN_TESTNET_RPC
```

## Commands

```bash
# Compile all contracts
npm run compile

# Run unit tests (local Hardhat network)
npm run test

# Run tests with coverage report
npm run test:coverage

# Deploy ERC-8004 registries to testnet
npm run deploy:registries

# Deploy AzCredCreditLine to testnet
npm run deploy:azcred

# Deploy everything in one step
npm run deploy:testnet

# Seed test agents with reputation data
npm run seed

# Verify deployed state on testnet
npm run verify
```

## Deployments

After deployment, addresses are saved to `deployments/testnet.json`.
Copy these into `../frontend/.env.local` to wire up the frontend.

```json
{
  "contracts": {
    "IdentityRegistry": { "address": "0x..." },
    "ReputationRegistry": { "address": "0x..." },
    "ValidationRegistry": { "address": "0x..." },
    "AzCredCreditLine": { "address": "0x..." }
  }
}
```

## Environment Variables

| Variable                  | Description                              |
|---------------------------|------------------------------------------|
| `PRIVATE_KEY`             | Deployer wallet private key (no 0x)     |
| `CREDITCOIN_TESTNET_RPC`  | RPC URL (defaults to public endpoint)   |
| `REPORT_GAS`              | Set to `"true"` to log gas costs        |
