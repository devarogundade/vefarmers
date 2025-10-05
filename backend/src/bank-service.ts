const paystackTransfer = async (
  accountName: string,
  accountNumber: string,
  bankCode: number,
  amount: string,
  currency: string,
  txId: string
): Promise<boolean> => {
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

    if (!recipientCode) return false;

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
  } catch (error) {
    console.log(error);
    return false;
  }
};

export { paystackTransfer };
