"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paystackTransfer = void 0;
const paystackTransfer = async (accountName, accountNumber, bankCode, amount, currency, txId) => {
    try {
        const response = await fetch("https://api.paystack.co/transferrecipient", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SK_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "nuban",
                name: accountName,
                account_number: accountNumber,
                bank_code: bankCode,
                currency: currency,
            }),
        });
        const recipient = await response.json();
        const recipientCode = recipient?.data?.recipient_code;
        if (!recipientCode)
            return false;
        const transferResponse = await fetch("https://api.paystack.co/transfer", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SK_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                source: "balance",
                amount,
                recipient: recipientCode,
                reference: txId,
                reason: "",
            }),
        });
        const transfer = await transferResponse.json();
        const transferCode = transfer?.data?.transfer_code;
        return Boolean(transferCode);
    }
    catch (error) {
        console.log(error);
        return false;
    }
};
exports.paystackTransfer = paystackTransfer;
