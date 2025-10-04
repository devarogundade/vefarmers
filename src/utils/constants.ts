import { ThorClient } from "@vechain/sdk-network";

export const thorClient = ThorClient.at("https://testnet.vechain.org");

export const Contracts = {
  USDC: "0xaed8433cdc26a99fca6fb3bf028b28f9595cc232",
  EURC: "0x368418b0656c5045caced6fd2a421621995a48e1",
  NGNC: "0xbdf21eb4d6ac03a3dcb40a91e61c847b5b819d0c",
  Orcale: "0x2116c3e3bcf58e5767a8188c31331f2f2a41b230",
  RewardsProvider: "0x1cf73d9fb397e3ce4a9f5dc6a94d05e9ffea69fa",
  FarmerRegistry: "0xe79471ece96ab0113643506d1a4d567f6d12ede8",
  VeFarmersFactory: "0xb7dd6cfbb1c4d3bc68ebbc19d86215ab2b787f23",
  USDCPool: "0x8e84aeCDF66BaF2d28B110B8091873Af9102b6Cb",
  EURCPool: "0x1408F6e8d7E34A1039d6970ce1d0E580Db13D065",
  NGNCPool: "0x46a310159B344D0ef2B3b3eF51CA2c1BC9eaC49B",
};

export const Symbols: Record<string, string> = {};

Symbols[Contracts.USDCPool] = "$";
Symbols[Contracts.EURCPool] = "£";
Symbols[Contracts.NGNCPool] = "₦";

export const MAX_BPS = 10_000;
export const MAX_BPS_POW = 2;
