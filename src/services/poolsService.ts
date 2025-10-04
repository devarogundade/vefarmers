/* eslint-disable @typescript-eslint/no-explicit-any */
import { farmerRegistryAbi } from "@/abis/farmerRegistry";
import { lendingPoolAbi } from "@/abis/lendingPool";
import { pledgeManagerAbi } from "@/abis/pledgeManager";
import { Pool } from "@/types";
import { ApiResponse } from "@/types/api";
import { Contracts, thorClient } from "@/utils/constants";
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

    const lendingPool = thorClient.contracts.load(address, lendingPoolAbi);
    const farmerRegistry = thorClient.contracts.load(
      Contracts.FarmerRegistry,
      farmerRegistryAbi
    );

    try {
      const [totalLiquidity, totalBorrowed, borrowAPY] = await Promise.all([
        lendingPool.read.totalSupplied() as unknown as Promise<bigint>,
        lendingPool.read.totalBorrowed() as unknown as Promise<bigint>,
        lendingPool.read.borrowRateBp() as unknown as Promise<bigint>,
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
              lendingPool.read.balanceOf(account) as unknown as Promise<bigint>,
              lendingPool.read.farmerPositions(account) as unknown as Promise<
                bigint[]
              >,
              lendingPool.read.outstanding(
                account
              ) as unknown as Promise<bigint>,
              lendingPool.read.ltvBps(account) as unknown as Promise<bigint>,
              farmerRegistry.read.farmerToManager(
                account
              ) as unknown as Promise<string>,
            ]);

      const pledgeManagerContract = thorClient.contracts.load(
        pledgeManager,
        pledgeManagerAbi
      );

      const [totalPledge, active] =
        pledgeManager == zeroAddress
          ? [0n, false]
          : await Promise.all([
              pledgeManagerContract.read.totalSupply() as unknown as Promise<bigint>,
              pledgeManagerContract.read.active() as unknown as Promise<boolean>,
            ]);

      const withdrawable =
        lp === 0n
          ? 0n
          : ((await lendingPool.read.withdrawable(
              account
            )) as unknown as bigint);

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
