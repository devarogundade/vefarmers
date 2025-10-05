"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAddress = void 0;
exports.mint = mint;
exports.burn = burn;
exports.approve = approve;
exports.supply = supply;
exports.repay = repay;
const lendingPool_1 = require("./abis/lendingPool");
const fiat_1 = require("./abis/fiat");
const sdk_network_1 = require("@vechain/sdk-network");
const sdk_core_1 = require("@vechain/sdk-core");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const NETWORK_URL = "https://testnet.vechain.org";
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;
const adminAddress = ADMIN_ADDRESS;
exports.adminAddress = adminAddress;
const deployerAccount = {
    privateKey: sdk_core_1.Hex.of(ADMIN_PRIVATE_KEY).bytes,
    address: ADMIN_ADDRESS,
};
const thorClient = sdk_network_1.ThorClient.at(NETWORK_URL);
const provider = new sdk_network_1.VeChainProvider(thorClient, new sdk_network_1.ProviderInternalBaseWallet([deployerAccount]));
async function mint(fiat, amount, to) {
    try {
        const signer = (await provider.getSigner(deployerAccount.address));
        const contract = thorClient.contracts.load(fiat, fiat_1.fiatAbi, signer);
        const txResult = await contract.transact.mint(to, amount);
        const receipt = await txResult.wait();
        if (receipt && !receipt.reverted) {
            return {
                success: true,
                txId: txResult.id,
                message: "Token minted",
            };
        }
        else {
            return {
                success: false,
                txId: txResult.id,
                message: "Transaction was reverted",
            };
        }
    }
    catch (error) {
        console.log(error);
        return {
            success: false,
            message: "Something went wrong",
        };
    }
}
async function burn(fiat, amount, to) {
    try {
        const signer = (await provider.getSigner(deployerAccount.address));
        const contract = thorClient.contracts.load(fiat, fiat_1.fiatAbi, signer);
        const txResult = await contract.transact.burn(to, amount);
        const receipt = await txResult.wait();
        if (receipt && !receipt.reverted) {
            return {
                success: true,
                txId: txResult.id,
                message: "Token burned",
            };
        }
        else {
            return {
                success: false,
                txId: txResult.id,
                message: "Transaction was reverted",
            };
        }
    }
    catch (error) {
        console.log(error);
        return {
            success: false,
            message: "Something went wrong",
        };
    }
}
async function approve(fiat, amount, spender) {
    try {
        const signer = (await provider.getSigner(deployerAccount.address));
        const contract = thorClient.contracts.load(fiat, fiat_1.fiatAbi, signer);
        const txResult = await contract.transact.approve(spender, amount);
        const receipt = await txResult.wait();
        if (receipt && !receipt.reverted) {
            return {
                success: true,
                txId: txResult.id,
                message: "Token approved.",
            };
        }
        else {
            return {
                success: false,
                txId: txResult.id,
                message: "Transaction was reverted",
            };
        }
    }
    catch (error) {
        return {
            success: false,
            message: "Something went wrong",
        };
    }
}
async function supply(pool, amount, behalfOf) {
    try {
        const signer = (await provider.getSigner(deployerAccount.address));
        const contract = thorClient.contracts.load(pool, lendingPool_1.lendingPoolAbi, signer);
        const txResult = await contract.transact.supply(amount, behalfOf);
        const receipt = await txResult.wait();
        if (receipt && !receipt.reverted) {
            return {
                success: true,
                txId: txResult.id,
                message: "Supply completed",
            };
        }
        else {
            return {
                success: false,
                txId: txResult.id,
                message: "Transaction was reverted",
            };
        }
    }
    catch (error) {
        return {
            success: false,
            message: "Something went wrong",
        };
    }
}
async function repay(pool, amount, behalfOf) {
    try {
        const signer = (await provider.getSigner(deployerAccount.address));
        const contract = thorClient.contracts.load(pool, lendingPool_1.lendingPoolAbi, signer);
        const txResult = await contract.transact.repay(amount, behalfOf);
        const receipt = await txResult.wait();
        if (receipt && !receipt.reverted) {
            return {
                success: true,
                txId: txResult.id,
                message: "Repayment completed.",
            };
        }
        else {
            return {
                success: false,
                txId: txResult.id,
                message: "Transaction was reverted",
            };
        }
    }
    catch (error) {
        return {
            success: false,
            message: "Something went wrong",
        };
    }
}
