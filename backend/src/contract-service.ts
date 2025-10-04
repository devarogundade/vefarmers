import { lendingPoolAbi } from "./abis/lendingPool";
import { fiatAbi } from "./abis/fiat";
import {
  ProviderInternalBaseWallet,
  ProviderInternalWalletAccount,
  ThorClient,
  VeChainProvider,
  VeChainSigner,
} from "@vechain/sdk-network";
import { Hex } from "@vechain/sdk-core";
import { ApiResponse } from "./types";
import dotenv from "dotenv";

dotenv.config();

const NETWORK_URL = "https://testnet.vechain.org";

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY!;
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS!;

const adminAddress = ADMIN_ADDRESS;

const deployerAccount: ProviderInternalWalletAccount = {
  privateKey: Hex.of(ADMIN_PRIVATE_KEY).bytes,
  address: ADMIN_ADDRESS,
};

const thorClient = ThorClient.at(NETWORK_URL);
const provider = new VeChainProvider(
  thorClient,
  new ProviderInternalBaseWallet([deployerAccount])
);
const signer = (await provider.getSigner(
  deployerAccount.address
)) as VeChainSigner;

async function mint(
  fiat: string,
  amount: string,
  to: string
): Promise<ApiResponse<string>> {
  try {
    const contract = thorClient.contracts.load(fiat, fiatAbi, signer);
    const txResult = await contract.transact.mint(to, amount);

    const receipt = await txResult.wait();

    if (receipt && !receipt.reverted) {
      return {
        success: true,
        txId: txResult.id,
        message: "Token minted",
      };
    } else {
      return {
        success: false,
        txId: txResult.id,
        message: "Transaction was reverted",
      };
    }
  } catch (error) {
    console.log(error);

    return {
      success: false,
      message: "Something went wrong",
    };
  }
}

async function burn(
  fiat: string,
  amount: string,
  to: string
): Promise<ApiResponse<string>> {
  try {
    const contract = thorClient.contracts.load(fiat, fiatAbi, signer);
    const txResult = await contract.transact.burn(to, amount);

    const receipt = await txResult.wait();

    if (receipt && !receipt.reverted) {
      return {
        success: true,
        txId: txResult.id,
        message: "Token burned",
      };
    } else {
      return {
        success: false,
        txId: txResult.id,
        message: "Transaction was reverted",
      };
    }
  } catch (error) {
    console.log(error);

    return {
      success: false,
      message: "Something went wrong",
    };
  }
}

async function approve(
  fiat: string,
  amount: string,
  spender: string
): Promise<ApiResponse<string>> {
  try {
    const contract = thorClient.contracts.load(fiat, fiatAbi, signer);
    const txResult = await contract.transact.approve(spender, amount);

    const receipt = await txResult.wait();

    if (receipt && !receipt.reverted) {
      return {
        success: true,
        txId: txResult.id,
        message: "Token approved.",
      };
    } else {
      return {
        success: false,
        txId: txResult.id,
        message: "Transaction was reverted",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Something went wrong",
    };
  }
}

async function supply(
  pool: string,
  amount: string,
  behalfOf: string
): Promise<ApiResponse<string>> {
  try {
    const contract = thorClient.contracts.load(pool, lendingPoolAbi, signer);
    const txResult = await contract.transact.supply(amount, behalfOf);

    const receipt = await txResult.wait();

    if (receipt && !receipt.reverted) {
      return {
        success: true,
        txId: txResult.id,
        message: "Supply completed",
      };
    } else {
      return {
        success: false,
        txId: txResult.id,
        message: "Transaction was reverted",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Something went wrong",
    };
  }
}

async function repay(
  pool: string,
  amount: string,
  behalfOf: string
): Promise<ApiResponse<string>> {
  try {
    const contract = thorClient.contracts.load(pool, lendingPoolAbi, signer);
    const txResult = await contract.transact.repay(amount, behalfOf);

    const receipt = await txResult.wait();

    if (receipt && !receipt.reverted) {
      return {
        success: true,
        txId: txResult.id,
        message: "Repayment completed.",
      };
    } else {
      return {
        success: false,
        txId: txResult.id,
        message: "Transaction was reverted",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Something went wrong",
    };
  }
}

export { adminAddress, mint, burn, approve, supply, repay };
