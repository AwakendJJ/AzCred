import { expect } from "chai"
import { ethers } from "hardhat"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import {
  IdentityRegistry,
  ReputationRegistry,
  ValidationRegistry,
  AzCredCreditLine,
} from "../typechain-types"

describe("AzCredCreditLine", () => {
  let owner: HardhatEthersSigner
  let agentOwner: HardhatEthersSigner
  let stranger: HardhatEthersSigner
  let feedbackProvider: HardhatEthersSigner

  let identityRegistry: IdentityRegistry
  let reputationRegistry: ReputationRegistry
  let validationRegistry: ValidationRegistry
  let creditLine: AzCredCreditLine

  const TIER1_LIMIT = ethers.parseEther("100")
  const TIER2_LIMIT = ethers.parseEther("500")
  const TIER3_LIMIT = ethers.parseEther("1000")
  const POOL_FUND = ethers.parseEther("5000")

  // Helper: register an agent and return its agentId
  async function registerAgent(signer: HardhatEthersSigner): Promise<bigint> {
    const tx = await identityRegistry
      .connect(signer)
      ["register(string)"]("ipfs://test")
    const receipt = await tx.wait()
    const event = receipt?.logs
      .map((log) => {
        try {
          return identityRegistry.interface.parseLog(log)
        } catch {
          return null
        }
      })
      .find((e) => e?.name === "Registered")
    return event!.args.agentId as bigint
  }

  // Helper: set all three signals for an agent
  async function setSignals(
    agentId: bigint,
    successRate: number,
    uptime: number,
    starred: number
  ) {
    for (const [tag, val] of [
      ["successRate", successRate],
      ["uptime", uptime],
      ["starred", starred],
    ] as [string, number][]) {
      await reputationRegistry
        .connect(feedbackProvider)
        .giveFeedback(agentId, val, 0, tag, "", "", "", ethers.ZeroHash)
    }
  }

  beforeEach(async () => {
    ;[owner, agentOwner, stranger, feedbackProvider] = await ethers.getSigners()

    // Deploy registries
    const IdentityRegistryFactory = await ethers.getContractFactory("IdentityRegistry")
    identityRegistry = (await IdentityRegistryFactory.deploy()) as unknown as IdentityRegistry

    const ReputationRegistryFactory = await ethers.getContractFactory("ReputationRegistry")
    reputationRegistry = (await ReputationRegistryFactory.deploy()) as unknown as ReputationRegistry
    await reputationRegistry.initialize(await identityRegistry.getAddress())

    const ValidationRegistryFactory = await ethers.getContractFactory("ValidationRegistry")
    validationRegistry = (await ValidationRegistryFactory.deploy()) as unknown as ValidationRegistry
    await validationRegistry.initialize(await identityRegistry.getAddress())

    // Deploy AzCredCreditLine
    const CreditLineFactory = await ethers.getContractFactory("AzCredCreditLine")
    creditLine = (await CreditLineFactory.deploy(
      await identityRegistry.getAddress(),
      await reputationRegistry.getAddress()
    )) as unknown as AzCredCreditLine

    // Fund pool
    await creditLine.connect(owner).fundPool({ value: POOL_FUND })
  })

  // -------------------------------------------------------------------------
  // assignCredit
  // -------------------------------------------------------------------------
  describe("assignCredit", () => {
    it("assigns Tier 1 limit for score 0–33", async () => {
      const agentId = await registerAgent(agentOwner)
      // score = 20×0.40 + 30×0.35 + 25×0.25 = 24.75 → Tier 1
      await setSignals(agentId, 20, 30, 25)

      await creditLine.assignCredit(agentId)

      const profile = await creditLine.getCreditProfile(agentId)
      expect(profile.limit).to.equal(TIER1_LIMIT)
      expect(profile.score).to.be.lte(33)
    })

    it("assigns Tier 2 limit for score 34–66", async () => {
      const agentId = await registerAgent(agentOwner)
      // score = 55×0.40 + 60×0.35 + 45×0.25 = 54.25 → Tier 2
      await setSignals(agentId, 55, 60, 45)

      await creditLine.assignCredit(agentId)

      const profile = await creditLine.getCreditProfile(agentId)
      expect(profile.limit).to.equal(TIER2_LIMIT)
      expect(profile.score).to.be.gt(33)
      expect(profile.score).to.be.lte(66)
    })

    it("assigns Tier 3 limit for score 67–100", async () => {
      const agentId = await registerAgent(agentOwner)
      // score = 89×0.40 + 97×0.35 + 82×0.25 = 90.05 → Tier 3
      await setSignals(agentId, 89, 97, 82)

      await creditLine.assignCredit(agentId)

      const profile = await creditLine.getCreditProfile(agentId)
      expect(profile.limit).to.equal(TIER3_LIMIT)
      expect(profile.score).to.be.gt(66)
    })

    it("assigns score 0 and Tier 1 when no signals exist", async () => {
      const agentId = await registerAgent(agentOwner)
      await creditLine.assignCredit(agentId)

      const profile = await creditLine.getCreditProfile(agentId)
      expect(profile.score).to.equal(0)
      expect(profile.limit).to.equal(TIER1_LIMIT)
    })

    it("reverts if agent does not exist", async () => {
      await expect(creditLine.assignCredit(999n)).to.be.revertedWithCustomError(
        creditLine,
        "AgentNotRegistered"
      )
    })

    it("reverts if credit is already assigned", async () => {
      const agentId = await registerAgent(agentOwner)
      await setSignals(agentId, 50, 50, 50)
      await creditLine.assignCredit(agentId)
      await expect(creditLine.assignCredit(agentId)).to.be.revertedWithCustomError(
        creditLine,
        "CreditAlreadyAssigned"
      )
    })

    it("emits CreditAssigned event with correct args", async () => {
      const agentId = await registerAgent(agentOwner)
      await setSignals(agentId, 89, 97, 82)
      await expect(creditLine.assignCredit(agentId))
        .to.emit(creditLine, "CreditAssigned")
        .withArgs(agentId, TIER3_LIMIT, (score: number) => score > 66)
    })
  })

  // -------------------------------------------------------------------------
  // drawCredit
  // -------------------------------------------------------------------------
  describe("drawCredit", () => {
    let agentId: bigint

    beforeEach(async () => {
      agentId = await registerAgent(agentOwner)
      await setSignals(agentId, 89, 97, 82)
      await creditLine.assignCredit(agentId)
    })

    it("allows agent owner to draw within limit", async () => {
      const amount = ethers.parseEther("100")
      const balanceBefore = await ethers.provider.getBalance(agentOwner.address)

      const tx = await creditLine.connect(agentOwner).drawCredit(agentId, amount)
      const receipt = await tx.wait()
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice

      const balanceAfter = await ethers.provider.getBalance(agentOwner.address)
      expect(balanceAfter).to.be.closeTo(balanceBefore + amount - gasUsed, ethers.parseEther("0.01"))

      const profile = await creditLine.getCreditProfile(agentId)
      expect(profile.outstanding).to.equal(amount)
      expect(profile.available).to.equal(TIER3_LIMIT - amount)
    })

    it("reverts if draw exceeds available credit", async () => {
      await expect(
        creditLine.connect(agentOwner).drawCredit(agentId, ethers.parseEther("1001"))
      ).to.be.revertedWithCustomError(creditLine, "InsufficientAvailableCredit")
    })

    it("reverts if caller is not agent owner", async () => {
      await expect(
        creditLine.connect(stranger).drawCredit(agentId, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(creditLine, "NotAgentOwner")
    })

    it("reverts if credit not yet assigned", async () => {
      const newAgentId = await registerAgent(agentOwner)
      await expect(
        creditLine.connect(agentOwner).drawCredit(newAgentId, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(creditLine, "CreditNotAssigned")
    })

    it("emits CreditDrawn event", async () => {
      const amount = ethers.parseEther("200")
      await expect(creditLine.connect(agentOwner).drawCredit(agentId, amount))
        .to.emit(creditLine, "CreditDrawn")
        .withArgs(agentId, amount, amount)
    })

    it("allows multiple draws up to the limit", async () => {
      await creditLine.connect(agentOwner).drawCredit(agentId, ethers.parseEther("500"))
      await creditLine.connect(agentOwner).drawCredit(agentId, ethers.parseEther("500"))

      const profile = await creditLine.getCreditProfile(agentId)
      expect(profile.outstanding).to.equal(TIER3_LIMIT)
      expect(profile.available).to.equal(0n)
    })
  })

  // -------------------------------------------------------------------------
  // repayCredit
  // -------------------------------------------------------------------------
  describe("repayCredit", () => {
    let agentId: bigint

    beforeEach(async () => {
      agentId = await registerAgent(agentOwner)
      await setSignals(agentId, 89, 97, 82)
      await creditLine.assignCredit(agentId)
      await creditLine.connect(agentOwner).drawCredit(agentId, ethers.parseEther("500"))
    })

    it("allows partial repayment", async () => {
      const repayAmount = ethers.parseEther("200")
      await creditLine.connect(agentOwner).repayCredit(agentId, { value: repayAmount })

      const profile = await creditLine.getCreditProfile(agentId)
      expect(profile.outstanding).to.equal(ethers.parseEther("300"))
      expect(profile.available).to.equal(ethers.parseEther("700"))
    })

    it("allows full repayment", async () => {
      await creditLine.connect(agentOwner).repayCredit(agentId, {
        value: ethers.parseEther("500"),
      })

      const profile = await creditLine.getCreditProfile(agentId)
      expect(profile.outstanding).to.equal(0n)
      expect(profile.available).to.equal(TIER3_LIMIT)
    })

    it("reverts if repayment exceeds outstanding balance", async () => {
      await expect(
        creditLine.connect(agentOwner).repayCredit(agentId, {
          value: ethers.parseEther("501"),
        })
      ).to.be.revertedWithCustomError(creditLine, "RepaymentExceedsOutstanding")
    })

    it("reverts if no outstanding balance", async () => {
      // First fully repay
      await creditLine
        .connect(agentOwner)
        .repayCredit(agentId, { value: ethers.parseEther("500") })

      await expect(
        creditLine.connect(agentOwner).repayCredit(agentId, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(creditLine, "NoOutstandingBalance")
    })

    it("reverts if zero value sent", async () => {
      await expect(
        creditLine.connect(agentOwner).repayCredit(agentId, { value: 0n })
      ).to.be.revertedWithCustomError(creditLine, "InsufficientRepayment")
    })

    it("emits CreditRepaid event", async () => {
      const repayAmount = ethers.parseEther("500")
      await expect(
        creditLine.connect(agentOwner).repayCredit(agentId, { value: repayAmount })
      )
        .to.emit(creditLine, "CreditRepaid")
        .withArgs(agentId, repayAmount, 0n)
    })
  })

  // -------------------------------------------------------------------------
  // getCreditProfile
  // -------------------------------------------------------------------------
  describe("getCreditProfile", () => {
    it("returns zeros for unassigned agent", async () => {
      const agentId = await registerAgent(agentOwner)
      const profile = await creditLine.getCreditProfile(agentId)
      expect(profile.limit).to.equal(0n)
      expect(profile.outstanding).to.equal(0n)
      expect(profile.available).to.equal(0n)
      expect(profile.score).to.equal(0)
    })

    it("reflects draw and repay lifecycle correctly", async () => {
      const agentId = await registerAgent(agentOwner)
      await setSignals(agentId, 55, 60, 45)
      await creditLine.assignCredit(agentId)

      await creditLine.connect(agentOwner).drawCredit(agentId, ethers.parseEther("200"))
      let profile = await creditLine.getCreditProfile(agentId)
      expect(profile.outstanding).to.equal(ethers.parseEther("200"))
      expect(profile.available).to.equal(ethers.parseEther("300"))

      await creditLine
        .connect(agentOwner)
        .repayCredit(agentId, { value: ethers.parseEther("100") })
      profile = await creditLine.getCreditProfile(agentId)
      expect(profile.outstanding).to.equal(ethers.parseEther("100"))
      expect(profile.available).to.equal(ethers.parseEther("400"))
    })
  })

  // -------------------------------------------------------------------------
  // requestCreditUpgrade
  // -------------------------------------------------------------------------
  describe("requestCreditUpgrade", () => {
    it("emits CreditUpgradeRequested from agent owner", async () => {
      const agentId = await registerAgent(agentOwner)
      await setSignals(agentId, 50, 50, 50)
      await creditLine.assignCredit(agentId)

      await expect(creditLine.connect(agentOwner).requestCreditUpgrade(agentId))
        .to.emit(creditLine, "CreditUpgradeRequested")
        .withArgs(agentId, agentOwner.address)
    })

    it("reverts if credit not assigned", async () => {
      const agentId = await registerAgent(agentOwner)
      await expect(
        creditLine.connect(agentOwner).requestCreditUpgrade(agentId)
      ).to.be.revertedWithCustomError(creditLine, "CreditNotAssigned")
    })

    it("reverts if caller is not agent owner", async () => {
      const agentId = await registerAgent(agentOwner)
      await setSignals(agentId, 50, 50, 50)
      await creditLine.assignCredit(agentId)

      await expect(
        creditLine.connect(stranger).requestCreditUpgrade(agentId)
      ).to.be.revertedWithCustomError(creditLine, "NotAgentOwner")
    })
  })

  // -------------------------------------------------------------------------
  // Admin: fundPool / withdrawPool
  // -------------------------------------------------------------------------
  describe("Admin", () => {
    it("owner can fund pool and balance increases", async () => {
      const before = await creditLine.poolBalance()
      await creditLine.connect(owner).fundPool({ value: ethers.parseEther("100") })
      const after = await creditLine.poolBalance()
      expect(after).to.equal(before + ethers.parseEther("100"))
    })

    it("non-owner cannot fund pool", async () => {
      await expect(
        creditLine.connect(stranger).fundPool({ value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(creditLine, "OwnableUnauthorizedAccount")
    })

    it("owner can withdraw from pool", async () => {
      const withdrawAmount = ethers.parseEther("100")
      const ownerBefore = await ethers.provider.getBalance(owner.address)

      const tx = await creditLine.connect(owner).withdrawPool(withdrawAmount)
      const receipt = await tx.wait()
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice

      const ownerAfter = await ethers.provider.getBalance(owner.address)
      expect(ownerAfter).to.be.closeTo(
        ownerBefore + withdrawAmount - gasUsed,
        ethers.parseEther("0.01")
      )
    })

    it("non-owner cannot withdraw from pool", async () => {
      await expect(
        creditLine.connect(stranger).withdrawPool(ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(creditLine, "OwnableUnauthorizedAccount")
    })
  })
})
