import hre from 'hardhat';

const RATE = 100_800_000_000n;
const PROVIDER = '0x1cf73d9fb397e3ce4a9f5dc6a94d05e9ffea69fa';

async function main() {
  const provider = await hre.ethers.getContractAt("RewardsProvider", PROVIDER);
  await provider.setRate(RATE);

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});