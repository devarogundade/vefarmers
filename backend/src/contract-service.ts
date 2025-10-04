import { lendingPoolAbi } from "./abis/lendingPool";
import { fiatAbi } from "./abis/fiat";
import {
  ProviderInternalBaseWallet,
  ProviderInternalWalletAccount,
  ThorClient,
  TransactionReceipt,
  VeChainProvider,
  VeChainSigner,
} from "@vechain/sdk-network";
import { Hex } from "@vechain/sdk-core";
import dotenv from "dotenv";
dotenv.config();

const NETWORK_URL = "https://testnet.vechain.org";

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY!;
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS!;

console.log(ADMIN_PRIVATE_KEY);

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
): Promise<{
  success: boolean;
  txId?: string;
  receipt?: TransactionReceipt | null;
  error?: string;
} | null> {
  try {
    console.log(`Calling mint ${amount} to ${to} on ${fiat}.`);

    const contract = thorClient.contracts.load(fiat, fiatAbi, signer);
    const txResult = await contract.transact.mint(to, amount);

    const receipt = await txResult.wait();

    if (receipt && !receipt.reverted) {
      console.log("Transaction successful:", txResult.id);
      return {
        success: true,
        txId: txResult.id,
        receipt,
      };
    } else {
      console.error("Transaction reverted:", receipt);
      return {
        success: false,
        txId: txResult.id,
        error: "Transaction was reverted",
      };
    }
  } catch (error) {
    console.error("Error calling mint:", error);
    return {
      success: false,
    };
  }
}

async function approve(
  fiat: string,
  amount: string,
  spender: string
): Promise<{
  success: boolean;
  txId?: string;
  receipt?: TransactionReceipt | null;
  error?: string;
} | null> {
  try {
    console.log(`Calling approve ${amount} spender ${spender} on ${fiat}.`);

    const contract = thorClient.contracts.load(fiat, fiatAbi, signer);
    const txResult = await contract.transact.approve(spender, amount);

    const receipt = await txResult.wait();

    if (receipt && !receipt.reverted) {
      console.log("Transaction successful:", txResult.id);
      return {
        success: true,
        txId: txResult.id,
        receipt,
      };
    } else {
      console.error("Transaction reverted:", receipt);
      return {
        success: false,
        txId: txResult.id,
        error: "Transaction was reverted",
      };
    }
  } catch (error) {
    console.error("Error calling approve:", error);
    return {
      success: false,
    };
  }
}

async function supply(
  pool: string,
  amount: string,
  behalfOf: string
): Promise<{
  success: boolean;
  txId?: string;
  receipt?: TransactionReceipt | null;
  error?: string;
} | null> {
  try {
    console.log(`Calling supply ${amount} behalf of ${behalfOf} on ${pool}.`);

    const contract = thorClient.contracts.load(pool, lendingPoolAbi, signer);
    const txResult = await contract.transact.supply(amount, behalfOf);

    const receipt = await txResult.wait();

    if (receipt && !receipt.reverted) {
      console.log("Transaction successful:", txResult.id);
      return {
        success: true,
        txId: txResult.id,
        receipt,
      };
    } else {
      console.error("Transaction reverted:", receipt);
      return {
        success: false,
        txId: txResult.id,
        error: "Transaction was reverted",
      };
    }
  } catch (error) {
    console.error("Error calling supply:", error);
    return {
      success: false,
    };
  }
}

async function repay(
  pool: string,
  amount: string,
  behalfOf: string
): Promise<{
  success: boolean;
  txId?: string;
  receipt?: TransactionReceipt | null;
  error?: string;
} | null> {
  try {
    console.log(`Calling repay ${amount} behalf of ${behalfOf} on ${pool}.`);

    const contract = thorClient.contracts.load(pool, lendingPoolAbi, signer);
    const txResult = await contract.transact.repay(amount, behalfOf);

    const receipt = await txResult.wait();

    if (receipt && !receipt.reverted) {
      console.log("Transaction successful:", txResult.id);
      return {
        success: true,
        txId: txResult.id,
        receipt,
      };
    } else {
      console.error("Transaction reverted:", receipt);
      return {
        success: false,
        txId: txResult.id,
        error: "Transaction was reverted",
      };
    }
  } catch (error) {
    console.error("Error calling repay:", error);
    return {
      success: false,
    };
  }
}

export { adminAddress, mint, approve, supply, repay };
