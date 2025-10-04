import { farmerRegistryAbi } from "@/abis/farmerRegistry";
import { lendingPoolAbi } from "@/abis/lendingPool";
import { pledgeManagerAbi } from "@/abis/pledgeManager";
import { Pool } from "@/types";
import { ApiResponse } from "@/types/api";
import { Contracts, publicClient } from "@/utils/constants";
import { add } from "date-fns";
import { zeroAddress } from "viem";

export class PoolsService {
  private async loadPool(address: string, account?: string): Promise<Pool> {
    let currency: "USDC" | "EURC" | "NGNC";
    let fiat: string;
    let decimals: number;

    switch (address) {
      case Contracts.USDCPool:
        currency = "USDC";
        fiat = Contracts.USDC;
        decimals = 6;
        break;
      case Contracts.EURCPool:
        currency = "EURC";
        fiat = Contracts.EURC;
        decimals = 6;
        break;
      default:
        currency = "NGNC";
        fiat = Contracts.NGNC;
        decimals = 2;
    }

    try {
      const [totalLiquidity, totalBorrowed, borrowAPY] = await Promise.all([
        publicClient.readContract({
          abi: lendingPoolAbi,
          address: address as `0x${string}`,
          functionName: "totalSupplied",
          authorizationList: undefined,
        }) as Promise<bigint>,
        publicClient.readContract({
          abi: lendingPoolAbi,
          address: address as `0x${string}`,
          functionName: "totalBorrowed",
          authorizationList: undefined,
        }) as Promise<bigint>,
        publicClient.readContract({
          abi: lendingPoolAbi,
          address: address as `0x${string}`,
          functionName: "borrowRateBp",
          authorizationList: undefined,
        }) as Promise<bigint>,
      ]);

      const utilizationRate =
        totalLiquidity <= 0n
          ? 0
          : Number((totalBorrowed * 100n) / totalLiquidity);

      const supplyAPY = BigInt((Number(borrowAPY) * utilizationRate) / 100);

      const [lp, [principal], outstanding, ltvBps, pledgeManager] =
        account == zeroAddress
          ? [0n, [0n, 0n], 0n, 0n, undefined]
          : await Promise.all([
              publicClient.readContract({
                abi: lendingPoolAbi,
                address: address as `0x${string}`,
                functionName: "balanceOf",
                args: [account as `0x${string}`],
                authorizationList: undefined,
              }) as Promise<bigint>,
              publicClient.readContract({
                abi: lendingPoolAbi,
                address: address as `0x${string}`,
                functionName: "farmerPositions",
                args: [account as `0x${string}`],
                authorizationList: undefined,
              }) as Promise<readonly [bigint, bigint]>,
              publicClient.readContract({
                abi: lendingPoolAbi,
                address: address as `0x${string}`,
                functionName: "outstanding",
                args: [account as `0x${string}`],
                authorizationList: undefined,
              }) as Promise<bigint>,
              publicClient.readContract({
                abi: lendingPoolAbi,
                address: address as `0x${string}`,
                functionName: "ltvBps",
                args: [account as `0x${string}`],
                authorizationList: undefined,
              }) as Promise<bigint>,
              publicClient.readContract({
                abi: farmerRegistryAbi,
                address: Contracts.FarmerRegistry as `0x${string}`,
                functionName: "farmerToManager",
                args: [account as `0x${string}`],
                authorizationList: undefined,
              }) as Promise<string>,
            ]);

      const [totalPledge, active] =
        pledgeManager == zeroAddress
          ? [0n, false]
          : await Promise.all([
              publicClient.readContract({
                abi: pledgeManagerAbi,
                address: pledgeManager as `0x${string}`,
                functionName: "totalSupply",
                authorizationList: undefined,
              }) as Promise<bigint>,
              publicClient.readContract({
                abi: pledgeManagerAbi,
                address: pledgeManager as `0x${string}`,
                functionName: "active",
                authorizationList: undefined,
              }) as Promise<boolean>,
            ]);

      const withdrawable =
        lp === 0n
          ? 0n
          : ((await publicClient.readContract({
              abi: lendingPoolAbi,
              address: address as `0x${string}`,
              functionName: "withdrawable",
              args: [account as `0x${string}`],
              authorizationList: undefined,
            })) as bigint);

      return {
        address,
        fiat,
        currency,
        decimals,
        totalLiquidity,
        totalBorrowed,
        supplyAPY,
        borrowAPY,
        utilizationRate,
        lp,
        withdrawable,
        borrow: principal,
        outstanding,
        ltvBps,
        totalPledge,
        active,
      };
    } catch (error) {
      console.log(error);

      return {
        address,
        currency,
        fiat,
        decimals,
        totalLiquidity: 0n,
        totalBorrowed: 0n,
        supplyAPY: 0n,
        borrowAPY: 0n,
        utilizationRate: 0,
        lp: 0n,
        withdrawable: 0n,
        borrow: 0n,
        outstanding: 0n,
        ltvBps: 0n,
        totalPledge: 0n,
        active: false,
      };
    }
  }

  async getPools(account: string): Promise<ApiResponse<Pool[]>> {
    try {
      const pools = [
        Contracts.NGNCPool,
        Contracts.USDCPool,
        Contracts.EURCPool,
      ].map((address) => this.loadPool(address, account));

      return {
        data: await Promise.all(pools),
        success: true,
        message: "Pools retrieved successfully",
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: "Failed to retrieve pools",
      };
    }
  }

  async getPoolByAddress(
    address: string,
    account: string
  ): Promise<ApiResponse<Pool>> {
    try {
      return {
        data: await this.loadPool(address, account),
        success: true,
        message: "Pool retrieved successfully",
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        message: "Failed to retrieve pool",
      };
    }
  }

  generatePoolChartData(
    supplyAPY: number,
    days: number = 30
  ): { day: number; apy: number }[] {
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      apy: supplyAPY + Math.sin(i * 0.02) * 2 + Math.random() * 1,
    }));
  }
}

export const poolsService = new PoolsService();

export default poolsService;
