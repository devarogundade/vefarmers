import { Pledge } from "@/types";
import { ApiResponse, PledgeRequest, PledgeFilters } from "@/types/api";
import { farmersService } from "./farmersService";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  getFirestore,
  where,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export class PledgesService {
  async getPledges(filters?: PledgeFilters): Promise<ApiResponse<Pledge[]>> {
    try {
      const db = getFirestore();
      const dbRef = collection(db, "pledges");
      let q = query(dbRef);

      if (filters?.pledgerAddress) {
        q = query(q, where("pledgerAddress", "==", filters?.pledgerAddress));
      }

      if (filters?.farmerAddress) {
        q = query(q, where("farmerAddress", "==", filters?.farmerAddress));
      }

      const querySnapshot = await getDocs(q);

      const pledges: Pledge[] = [];

      querySnapshot.forEach((doc) => {
        pledges.push(doc.data() as Pledge);
      });

      return {
        data: pledges,
        success: true,
        message: "Pledges retrieved successfully",
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: "Failed to retrieve pledges",
      };
    }
  }

  async createPledge(
    pledgerAddress: string,
    pledgeData: PledgeRequest
  ): Promise<ApiResponse<Pledge>> {
    try {
      const farmerResponse = await farmersService.getFarmerByAddress(
        pledgeData.farmerAddress
      );

      if (!farmerResponse.success || !farmerResponse.data) {
        return {
          data: {} as Pledge,
          success: false,
          message: "Farmer not found",
        };
      }

      const id = `${farmerResponse.data.address}-${pledgerAddress}`;

      const db = getFirestore();

      const docSnap = await getDoc(doc(db, "pledges", id));

      if (docSnap.exists()) {
        const data = docSnap.data() as Pledge;
        await updateDoc(doc(db, "pledges", id), {
          amount: data.amount + pledgeData.amount,
          farmer: {
            name: farmerResponse.data.name,
            address: farmerResponse.data.address,
            pledgeManager: farmerResponse.data.pledgeManager,
            preferredPool: farmerResponse.data.preferredPool,
            location: farmerResponse.data.location,
            farmSize: farmerResponse.data.farmSize,
            cropType: farmerResponse.data.cropType,
            verified: false,
          },
        });

        return {
          data: { ...data, amount: data.amount + pledgeData.amount },
          success: true,
          message: "Pledge updated successfully",
        };
      } else {
        const newPledge: Pledge = {
          id,
          pledgerAddress,
          farmerAddress: pledgeData.farmerAddress,
          farmer: {
            name: farmerResponse.data.name,
            address: farmerResponse.data.address,
            pledgeManager: farmerResponse.data.pledgeManager,
            preferredPool: farmerResponse.data.preferredPool,
            location: farmerResponse.data.location,
            farmSize: farmerResponse.data.farmSize,
            cropType: farmerResponse.data.cropType,
            verified: false,
          },
          amount: pledgeData.amount,
          currency: pledgeData.currency,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "pledges", newPledge.id), newPledge, {
          merge: true,
        });

        return {
          data: newPledge,
          success: true,
          message: "Pledge created successfully",
        };
      }
    } catch (error) {
      throw new Error("Failed to create pledge");
    }
  }

  async decreasePledge(
    pledgerAddress: string,
    pledgeData: PledgeRequest
  ): Promise<ApiResponse<Partial<Pledge>>> {
    try {
      const farmerResponse = await farmersService.getFarmerByAddress(
        pledgeData.farmerAddress
      );

      if (!farmerResponse.success || !farmerResponse.data) {
        return {
          data: {} as Pledge,
          success: false,
          message: "Farmer not found",
        };
      }

      const pledge: Partial<Pledge> = {
        id: `${farmerResponse.data.address}-${pledgerAddress}`,
      };

      const db = getFirestore();

      const docSnap = await getDoc(doc(db, "pledges", pledge.id));

      if (docSnap.exists()) {
        const data = docSnap.data() as Pledge;
        await updateDoc(doc(db, "pledges", pledge.id), {
          amount: data.amount - pledge.amount,
          farmer: {
            name: farmerResponse.data.name,
            address: farmerResponse.data.address,
            pledgeManager: farmerResponse.data.pledgeManager,
            preferredPool: farmerResponse.data.preferredPool,
            location: farmerResponse.data.location,
            farmSize: farmerResponse.data.farmSize,
            cropType: farmerResponse.data.cropType,
            verified: false,
          },
        });
      }

      return {
        data: pledge,
        success: true,
        message: "Pledge created successfully",
      };
    } catch (error) {
      throw new Error("Failed to create pledge");
    }
  }
}

export const pledgesService = new PledgesService();
export default pledgesService;
