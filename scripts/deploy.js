import hre from 'hardhat';
import { config } from "dotenv";

config();

const APP_ID = process.env.VEBETTERDAO_APP_ID;
const RATE = 100_800_000_000n;
const X2EARN_REWARDS_POOL = process.env.X2EARN_REWARDS_POOL;

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with:", deployer.address);

  // --- Deploy Fiat tokens ---
  const Fiat = await ethers.getContractFactory("Fiat");

  const usdc = await Fiat.deploy("Circle USD", "USDC", 6);
  await usdc.waitForDeployment();

  console.log("USDC:", await usdc.getAddress());

  const eurc = await Fiat.deploy("Circle EUR", "EURC", 6);
  await eurc.waitForDeployment();

  console.log("EURC:", await eurc.getAddress());

  const ngnc = await Fiat.deploy("Circle NGN", "NGNC", 2);
  await ngnc.waitForDeployment();

  console.log("NGNC:", await ngnc.getAddress());

  // --- Deploy Oracle ---
  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();

  console.log("Oracle deployed at:", await oracle.getAddress());

  // --- Initialize oracle ---
  await oracle.setfiatPerVet(await usdc.getAddress(), 1_900_000);
  await oracle.setfiatPerVet(await eurc.getAddress(), 1_500_000);
  await oracle.setfiatPerVet(await ngnc.getAddress(), 1_700_000);

  // --- Deploy rewards provider ---
  const RewardsProvider = await ethers.getContractFactory("RewardsProvider");

  const provider = await RewardsProvider.deploy(
    APP_ID,
    RATE,
    X2EARN_REWARDS_POOL
  );
  await provider.waitForDeployment();

  console.log("Rewards provider:", await provider.getAddress());

  // --- Deploy Farmer's Registry ---
  const FarmerRegistry = await ethers.getContractFactory("FarmerRegistry");
  const farmerRegistry = await FarmerRegistry.deploy(
    await provider.getAddress()
  );
  await farmerRegistry.waitForDeployment();

  console.log("FarmerRegistry deployed at:", await farmerRegistry.getAddress());

  // --- Deploy VeFarmersFactory ---
  const VeFarmersFactory = await ethers.getContractFactory("VeFarmersFactory");
  const veFarmersFactory = await VeFarmersFactory.deploy(
    deployer.address,
    await oracle.getAddress(),
    await farmerRegistry.getAddress()
  );
  await veFarmersFactory.waitForDeployment();

  console.log(
    "VeFarmersFactory deployed at:",
    await veFarmersFactory.getAddress()
  );

  // --- Create pools ---
  await veFarmersFactory.createPool(await usdc.getAddress());
  await veFarmersFactory.createPool(await eurc.getAddress());
  await veFarmersFactory.createPool(await ngnc.getAddress());

  console.log(
    "USDC pool:",
    await veFarmersFactory.fiatToPool(await usdc.getAddress())
  );
  console.log(
    "EURC pool:",
    await veFarmersFactory.fiatToPool(await eurc.getAddress())
  );
  console.log(
    "NGNC pool:",
    await veFarmersFactory.fiatToPool(await ngnc.getAddress())
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


// USDC: 0x3339f3530e1274ade87a009680fbac7fe66e0472;
// EURC: 0xe891f3357da9096d24e84f2f437c0aa2edbff643;
// NGNC: 0x1a7d8f0958c8816e8b211265a2e1a626e4e70ed2
// Oracle deployed at: 0xe4d5260c6fd0c1e768da5e26fcd59f7baaee2d4d
// Rewards provider: 0x79147230ddc158dc885359bc6ab0b0e06e09cbe7
// FarmerRegistry deployed at: 0x06ac55144899ee7cac5a39323a28718a112a9ef0
// VeFarmersFactory deployed at: 0xc01c4119f24415521eb4d7b775be10b24aa56603
// USDC pool: 0x697E328B12C968E1CcDc7260962AD42eD543bC39
// EURC pool: 0x74C6d7Ca386B1b25481341Fb867Fa349316C59df
// NGNC pool: 0xC6367F172293e3cCAA2DDB0ccf91AEcf32B88dfc;