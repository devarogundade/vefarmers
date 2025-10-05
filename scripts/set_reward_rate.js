import hre from 'hardhat';

const RATE = 100_800n;
const PROVIDER = '0x79147230ddc158dc885359bc6ab0b0e06e09cbe7';

async function main() {
  const provider = await hre.ethers.getContractAt("RewardsProvider", PROVIDER);
  await provider.setRate(RATE);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});