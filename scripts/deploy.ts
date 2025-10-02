import { network } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

const APP_ID = process.env.VEBETTERDAO_APP_ID!;
const RATE = 10_800_000;
const X2EARN_REWARDS_POOL = "0x5F8f86B8D0Fa93cdaE20936d150175dF0205fB38";

async function main() {
  const { ethers } = await network.connect({
    network: "testnet",
  });

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with:", deployer.address);

  // --- Deploy Fiat tokens ---
  const Fiat = await ethers.getContractFactory("Fiat");

  const usdc = await Fiat.deploy("Circle USD", "USDC", 6);
  await usdc.waitForDeployment();

  console.log("USDC:", await usdc.getAddress());

  const eurc = await Fiat.deploy("Circle EUR", "EURC", 6);
  await eurc.waitForDeployment();

  console.log("EURC:", await eurc.getAddress());

  const ngnc = await Fiat.deploy("Circle Naira", "NGNC", 2);
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
