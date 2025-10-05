import hre from 'hardhat';

const RATE = 100_800_000n;
const PROVIDER = '';

async function main() {
  const provider = await hre.ethers.getContractAt("RewardsProvider", PROVIDER);
  await provider.setRate(RATE);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});