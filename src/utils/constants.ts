import { ThorClient } from "@vechain/sdk-network";

export const thorClient = ThorClient.at("https://testnet.vechain.org");

export const Contracts = {
  USDC: "0x2De3704dd711dD0dd2FE884c839CC4D4E7Dedc58",
  EURC: "0xF36184FeC60231A1224dE879374bF5069a1fcB0B",
  NGNC: "0xfb17e5e510a72885b8b7Ba30ce33B8CcDABa5dbE",
  Orcale: "0x2833729128769a516377989F60a2585F829Df840",
  FarmerRegistry: "0xC84BA071EE3372DfBc9023d2d292dc363937293C",
  USDCPool: "0x8D6883aAB2DC30dC515017401C66db0Db3fD93EF",
  EURCPool: "0xCF934d7D3cEda918ee5a581B96AeF09028065469",
  NGNCPool: "0x12B1639724058F953fA1f5b108402C83aA58d0fD",
};

export const Symbols: Record<string, string> = {};

Symbols[Contracts.USDCPool] = "$";
Symbols[Contracts.EURCPool] = "£";
Symbols[Contracts.NGNCPool] = "₦";

export const MAX_BPS = 10_000;
export const MAX_BPS_POW = 2;
