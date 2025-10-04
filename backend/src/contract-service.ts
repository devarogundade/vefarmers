/* eslint-disable @typescript-eslint/no-explicit-any */
import { lendingPoolAbi } from "./abis/lendingPool";
import { fiatAbi } from "./abis/fiat";
import { ThorClient, TransactionReceipt } from "@vechain/sdk-network";
import {
  ABIContract,
  Address,
  Clause,
  string,
  Transaction,
  TransactionBody,
} from "@vechain/sdk-core";

const NETWORK_URL = "https://testnet.vechain.org/";

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY!;
const GAS_PAYER_PRIVATE_KEY = process.env.GAS_PAYER_PRIVATE_KEY!;

const adminKey = Hex.of(ADMIN_PRIVATE_KEY).bytes;
const gasPayerKey = Hex.of(GAS_PAYER_PRIVATE_KEY).bytes;

const adminAddress = "";

const thor = ThorClient.at(NETWORK_URL);

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

    // Get the latest block
    const bestBlock = await thor.blocks.getBestBlockCompressed();
    if (!bestBlock) return null;

    // Build transaction
    const txBody: TransactionBody = {
      chainTag: Number(bestBlock.id.slice(-2)),
      blockRef: bestBlock.id.slice(0, 18),
      expiration: 32,
      clauses: [
        Clause.callFunction(
          Address.of(fiat),
          ABIContract.ofAbi(fiatAbi).getFunction("mint"),
          [amount, to]
        ),
      ],
      gasPriceCoef: 0,
      gas: 200_000,
      dependsOn: null,
      nonce: Date.now().toString(),
    };

    console.log("Transaction body:", txBody);

    // Sign and send transaction
    const signedTx = Transaction.of(txBody).signAsSenderAndGasPayer(
      adminKey,
      gasPayerKey
    );

    const txResult = await thor.transactions.sendTransaction(signedTx);

    console.log("Transaction sent:", txResult.id);

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
  } catch (error: any) {
    console.error("Error calling supply:", error);
    return {
      success: false,
      error: error?.message,
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

    // Get the latest block
    const bestBlock = await thor.blocks.getBestBlockCompressed();
    if (!bestBlock) return null;

    // Build transaction
    const txBody: TransactionBody = {
      chainTag: Number(bestBlock.id.slice(-2)),
      blockRef: bestBlock.id.slice(0, 18),
      expiration: 32,
      clauses: [
        Clause.callFunction(
          Address.of(fiat),
          ABIContract.ofAbi(fiatAbi).getFunction("approve"),
          [spender, amount]
        ),
      ],
      gasPriceCoef: 0,
      gas: 200_000,
      dependsOn: null,
      nonce: Date.now().toString(),
    };

    console.log("Transaction body:", txBody);

    // Sign and send transaction
    const signedTx = Transaction.of(txBody).signAsSenderAndGasPayer(
      adminKey,
      gasPayerKey
    );

    const txResult = await thor.transactions.sendTransaction(signedTx);

    console.log("Transaction sent:", txResult.id);

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
  } catch (error: any) {
    console.error("Error calling supply:", error);
    return {
      success: false,
      error: error?.message,
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

    const adminKey = Hex.of(ADMIN_PRIVATE_KEY).bytes;
    const gasPayerKey = Hex.of(GAS_PAYER_PRIVATE_KEY).bytes;

    // Get the latest block
    const bestBlock = await thor.blocks.getBestBlockCompressed();
    if (!bestBlock) return null;

    // Build transaction
    const txBody: TransactionBody = {
      chainTag: Number(bestBlock.id.slice(-2)),
      blockRef: bestBlock.id.slice(0, 18),
      expiration: 32,
      clauses: [
        Clause.callFunction(
          Address.of(pool),
          ABIContract.ofAbi(lendingPoolAbi).getFunction("supply"),
          [amount, behalfOf]
        ),
      ],
      gasPriceCoef: 0,
      gas: 200_000,
      dependsOn: null,
      nonce: Date.now().toString(),
    };

    console.log("Transaction body:", txBody);

    // Sign and send transaction
    const signedTx = Transaction.of(txBody).signAsSenderAndGasPayer(
      adminKey,
      gasPayerKey
    );

    const txResult = await thor.transactions.sendTransaction(signedTx);

    console.log("Transaction sent:", txResult.id);

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
  } catch (error: any) {
    console.error("Error calling supply:", error);
    return {
      success: false,
      error: error?.message,
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

    const adminKey = Hex.of(ADMIN_PRIVATE_KEY).bytes;
    const gasPayerKey = Hex.of(GAS_PAYER_PRIVATE_KEY).bytes;

    // Get the latest block
    const bestBlock = await thor.blocks.getBestBlockCompressed();
    if (!bestBlock) return null;

    // Build transaction
    const txBody: TransactionBody = {
      chainTag: Number(bestBlock.id.slice(-2)),
      blockRef: bestBlock.id.slice(0, 18),
      expiration: 32,
      clauses: [
        Clause.callFunction(
          Address.of(pool),
          ABIContract.ofAbi(lendingPoolAbi).getFunction("repay"),
          [amount, behalfOf]
        ),
      ],
      gasPriceCoef: 0,
      gas: 200_000,
      dependsOn: null,
      nonce: Date.now().toString(),
    };

    console.log("Transaction body:", txBody);

    // Sign and send transaction
    const signedTx = Transaction.of(txBody).signAsSenderAndGasPayer(
      adminKey,
      gasPayerKey
    );

    const txResult = await thor.transactions.sendTransaction(signedTx);

    console.log("Transaction sent:", txResult.id);

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
  } catch (error: any) {
    console.error("Error calling supply:", error);
    return {
      success: false,
      error: error?.message,
    };
  }
}

export { adminAddress, mint, approve, supply, repay };
