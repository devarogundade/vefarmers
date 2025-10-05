import { ThorClient } from "@vechain/sdk-network";

export const thorClient = ThorClient.at("https://testnet.vechain.org");

export const Contracts = {
  USDC: "0x3339f3530e1274ade87a009680fbac7fe66e0472",
  EURC: "0xe891f3357da9096d24e84f2f437c0aa2edbff643",
  NGNC: "0x1a7d8f0958c8816e8b211265a2e1a626e4e70ed2",
  Orcale: "0xe4d5260c6fd0c1e768da5e26fcd59f7baaee2d4d",
  RewardsProvider: "0x79147230ddc158dc885359bc6ab0b0e06e09cbe7",
  FarmerRegistry: "0x06ac55144899ee7cac5a39323a28718a112a9ef0",
  VeFarmersFactory: "0xc01c4119f24415521eb4d7b775be10b24aa56603",
  USDCPool: "0x697E328B12C968E1CcDc7260962AD42eD543bC39",
  EURCPool: "0x74C6d7Ca386B1b25481341Fb867Fa349316C59df",
  NGNCPool: "0xC6367F172293e3cCAA2DDB0ccf91AEcf32B88dfc",
};

export const Symbols: Record<string, string> = {};

Symbols[Contracts.USDCPool] = "$";
Symbols[Contracts.EURCPool] = "£";
Symbols[Contracts.NGNCPool] = "₦";

export const MAX_BPS = 10_000;
export const MAX_BPS_POW = 2;
