import { useState, useEffect } from "react";
import { Pool } from "@/types";
import { poolsService } from "@/services/poolsService";

interface UsePoolsState {
  pools: Pool[];
  loading: boolean;
  error: string | null;
}

interface UsePoolsReturn extends UsePoolsState {
  refetch: (account: string) => Promise<void>;
  generateChartData: (
    supplyApy: number,
    days?: number
  ) => { day: number; apy: number }[];
}

export function usePools(account: string): UsePoolsReturn {
  const [state, setState] = useState<UsePoolsState>({
    pools: [],
    loading: true,
    error: null,
  });

  const fetchPools = async (account: string) => {
    try {
      const response = await poolsService.getPools(account);

      if (response.success) {
        setState((prev) => ({
          ...prev,
          pools: response.data,
          loading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: response.message || "Failed to fetch pools",
          loading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        loading: false,
      }));
    }
  };

  const generateChartData = (supplyApy: number, days: number = 30) => {
    return poolsService.generatePoolChartData(supplyApy, days);
  };

  useEffect(() => {
    fetchPools(account);
  }, []);

  return {
    ...state,
    refetch: fetchPools,
    generateChartData,
  };
}

interface UsePoolState {
  pool: Pool | null;
  loading: boolean;
  error: string | null;
}

interface UsePoolReturn extends UsePoolState {
  refetch: () => Promise<void>;
}

export function usePool(address: string, account?: string): UsePoolReturn {
  const [state, setState] = useState<UsePoolState>({
    pool: null,
    loading: true,
    error: null,
  });

  const fetchPool = async () => {
    if (!address) return;

    try {
      const response = await poolsService.getPoolByAddress(address, account);

      if (response.success) {
        setState((prev) => ({
          ...prev,
          pool: response.data,
          loading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: response.message || "Failed to fetch pool",
          loading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        loading: false,
      }));
    }
  };

  useEffect(() => {
    fetchPool();
  }, []);

  return {
    ...state,
    refetch: fetchPool,
  };
}
