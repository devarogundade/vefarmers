import { useState, useEffect } from "react";
import { Farmer } from "../types";
import { farmersService } from "../services/farmersService";
import { FarmerFilters, CreateFarmerRequest } from "../types/api";

interface UseFarmersState {
  farmers: Farmer[];
  loading: boolean;
  error: string | null;
}

interface UseFarmersReturn extends UseFarmersState {
  refetch: () => Promise<void>;
  createFarmer: (
    address: string,
    pledgeManager: string,
    farmerData: CreateFarmerRequest
  ) => Promise<Farmer | null>;
}

export function useFarmers(filters?: FarmerFilters): UseFarmersReturn {
  const [state, setState] = useState<UseFarmersState>({
    farmers: [],
    loading: true,
    error: null,
  });

  const fetchFarmers = async () => {
    try {
      const response = await farmersService.getFarmers(filters);

      if (response.success) {
        setState((prev) => ({
          ...prev,
          farmers: response.data,
          loading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: response.message || "Failed to fetch farmers",
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

  const createFarmer = async (
    address: string,
    pledgeManager: string,
    farmerData: CreateFarmerRequest
  ): Promise<Farmer | null> => {
    try {
      const response = await farmersService.createFarmer(
        address,
        pledgeManager,
        farmerData
      );

      if (response.success) {
        return response.data;
      } else {
        setState((prev) => ({
          ...prev,
          error: response.message || "Failed to create farmer",
        }));
        return null;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create farmer";
      setState((prev) => ({ ...prev, error: errorMessage }));
      return null;
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  return {
    ...state,
    refetch: fetchFarmers,
    createFarmer,
  };
}

interface UseFarmerState {
  farmer: Farmer | null;
  loading: boolean;
  error: string | null;
}

interface UseFarmerReturn extends UseFarmerState {
  refetch: () => Promise<void>;
}

export function useFarmer(address: string): UseFarmerReturn {
  const [state, setState] = useState<UseFarmerState>({
    farmer: null,
    loading: true,
    error: null,
  });

  const fetchFarmer = async () => {
    if (!address) return;

    try {
      const response = await farmersService.getFarmerByAddress(address);

      if (response.success) {
        setState((prev) => ({
          ...prev,
          farmer: response.data,
          loading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: response.message || "Failed to fetch farmer",
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
    fetchFarmer();
  }, []);

  return {
    ...state,
    refetch: fetchFarmer,
  };
}
