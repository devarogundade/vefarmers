import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import dotenv from "dotenv";

dotenv.config();

// Check if we have a valid private key
const hasPrivateKey =
  process.env.VECHAIN_PRIVATE_KEY &&
  process.env.VECHAIN_PRIVATE_KEY.length === 66; // 0x + 64 hex chars

// Only set accounts if we have a valid key
const accounts = hasPrivateKey ? [process.env.VECHAIN_PRIVATE_KEY] : undefined;

module.exports = {
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
    },
  },
  networks: {
    vechain_testnet: {
      type: "http",
      url: "https://testnet.vechain.org",
      ...(accounts && { accounts }),
      gas: "auto",
      gasPrice: "auto",
      timeout: 20000,
    },
    vechain_testnet_delegated: {
      type: "http",
      url: "https://testnet.vechain.org",
      ...(accounts && { accounts }),
      enableDelegation: true,
      gasPayer: {
        gasPayerServiceUrl: "https://sponsor-testnet.vechain.energy/by/269",
      },
    },
    vechain_mainnet: {
      type: "http",
      url: "https://mainnet.vechain.org",
      ...(accounts && { accounts }),
      gas: "auto",
      gasPrice: "auto",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
