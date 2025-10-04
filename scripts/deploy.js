import hre from 'hardhat';
import { config } from "dotenv";

config();

const APP_ID = process.env.VEBETTERDAO_APP_ID;
const RATE = 10_800_000;
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


// USDC: 0xaed8433cdc26a99fca6fb3bf028b28f9595cc232;
// EURC: 0x368418b0656c5045caced6fd2a421621995a48e1;
// NGNC: 0xbdf21eb4d6ac03a3dcb40a91e61c847b5b819d0c
// Oracle deployed at: 0x2116c3e3bcf58e5767a8188c31331f2f2a41b230
// Rewards provider: 0x1cf73d9fb397e3ce4a9f5dc6a94d05e9ffea69fa
// FarmerRegistry deployed at: 0xe79471ece96ab0113643506d1a4d567f6d12ede8
// VeFarmersFactory deployed at: 0xb7dd6cfbb1c4d3bc68ebbc19d86215ab2b787f23
// USDC pool: 0x8e84aeCDF66BaF2d28B110B8091873Af9102b6Cb
// EURC pool: 0x1408F6e8d7E34A1039d6970ce1d0E580Db13D065
// NGNC pool: 0x46a310159B344D0ef2B3b3eF51CA2c1BC9eaC49B;