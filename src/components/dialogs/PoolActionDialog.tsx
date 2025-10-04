/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  DropletsIcon,
} from "lucide-react";
import { Bank, BankAccount, Pool } from "@/types";
import { toast } from "sonner";
import Paystack from "@paystack/inline-js";
import { formatUnits, parseSignature, parseUnits } from "viem";
import { lendingPoolAbi } from "@/abis/lendingPool";
import { MAX_BPS_POW, thorClient, Symbols } from "@/utils/constants";
import { doc, updateDoc, getFirestore, increment } from "firebase/firestore";
import timelineService from "@/services/timelineService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { buildBorrowPermitParams } from "@/utils/permit";
import {
  useDAppKitWallet,
  useGetErc20Balance,
  useSendTransaction,
  useSignTypedData,
  useTransactionModal,
  useWallet,
} from "@vechain/vechain-kit";
import { ABIContract, Address, Clause } from "@vechain/sdk-core";
import { apiClient } from "@/lib/api";

interface PoolActionDialogProps {
  pool: Pool;
  action: "supply" | "borrow" | "withdraw" | "repay";
  children: React.ReactNode;
  onClose: () => void;
}

export default function PoolActionDialog({
  pool,
  action,
  children,
  onClose,
}: PoolActionDialogProps) {
  const [amount, setAmount] = useState("");
  const [borrowable, setBorrowable] = useState(0);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | undefined>(
    undefined
  );
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState<number | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingWithBank, setIsProcessingWithBank] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { account } = useDAppKitWallet();
  const { open: openTransactionModal } = useTransactionModal();
  const { data: fiatBalance, refetch: refetchFiatBalance } = useGetErc20Balance(
    pool.fiat,
    account
  );
  const {
    sendTransaction,
    isTransactionPending,
    status,
    error: transactionError,
    txReceipt,
  } = useSendTransaction({
    signerAccountAddress: account,
    onTxConfirmed: () => {
      toast.success("Successful");
    },
    onTxFailedOrCancelled: (error) => {
      toast.success("Failed or cancelled");
    },
  });
  const { signTypedData } = useSignTypedData();
  const { connection } = useWallet();

  useEffect(() => {
    if (isTransactionPending) {
      toast.loading("Transaction pending.", { id: "isTransactionPending" });
    } else {
      toast.dismiss("isTransactionPending");
    }
  }, [isTransactionPending]);

  const actionConfig = {
    supply: {
      title: `Supply ${pool.currency}`,
      description: `Add liquidity to the ${pool.currency} pool and earn interest`,
      buttonText: "Supply",
      buttonText2: "Supply with Bank",
      icon: DollarSign,
      color: "text-green-600",
    },
    borrow: {
      title: `Borrow ${pool.currency}`,
      description: `Borrow ${pool.currency} against your VET collateral`,
      buttonText: "Borrow",
      buttonText2: "Borrow to Bank",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    withdraw: {
      title: `Withdraw ${pool.currency}`,
      description: `Remove your supplied ${pool.currency} from the pool`,
      buttonText: "Withdraw",
      icon: Wallet,
      buttonText2: "Withdraw to Bank",
      color: "text-orange-600",
    },
    repay: {
      title: `Repay ${pool.currency}`,
      description: `Repay your borrowed ${pool.currency}`,
      buttonText: "Repay",
      buttonText2: "Repay with Bank",
      icon: AlertTriangle,
      color: "text-red-600",
    },
  };

  const config = actionConfig[action];
  const IconComponent = config.icon;

  const approve = async () => {
    openTransactionModal();

    await sendTransaction([
      Clause.callFunction(
        Address.of(pool.address),
        ABIContract.ofAbi(lendingPoolAbi).getFunction("approve"),
        [pool.address, parseUnits(amount, pool.decimals)]
      ),
    ]);
  };

  const handlePaystack = async () => {
    if (!email) {
      return toast.warning("Email is required for bank.");
    }

    setIsProcessingWithBank(true);
    setIsOpen(false);

    const popup = new Paystack();
    popup.newTransaction({
      key: import.meta.env.VITE_PAYSTACK_PK_KEY,
      email,
      amount: Number(parseUnits(amount, pool.decimals)),
      currency: pool.currency,
      metadata: {
        pool: pool.address,
        fiat: pool.fiat,
        behalfOf: account,
      },
      onSuccess: async (transaction) => {
        setIsOpen(true);

        if (transaction.status == "success") {
          if (action === "supply") {
            toast.loading("Supplying...", { id: "paystack" });

            const a = await apiClient.post("/supply-on-behalf", {
              reference: transaction.reference,
              provider: "paystack",
            });

            await timelineService.createTimelinePost(account, {
              content: `You supplied ${Symbols[pool.address]}${amount} from bank.`,
              type: "activity",
            });
          } else {
            toast.loading("Repaying...", { id: "paystack" });

            const a = await apiClient.post("/repay-on-behalf", {
              reference: transaction.reference,
              provider: "paystack",
            });

            const db = getFirestore();

            await timelineService.createTimelinePost(account, {
              content: `You repaid ${Symbols[pool.address]}${amount} from bank.`,
              type: "activity",
            });

            await updateDoc(doc(db, "farmers", account), {
              totalRepaid: increment(Number(amount)),
            });
          }
          toast.success(`Successful!`, { id: "paystack" });
        } else {
          toast("Failed");
        }

        setAmount("");
        setEmail("");
        setIsOpen(false);
        setIsProcessingWithBank(false);
        onClose();
      },
      onCancel: () => {
        setIsOpen(true);
        toast("Cancelled");
        setIsProcessingWithBank(false);
      },
      onError: (error) => {
        setIsOpen(true);
        toast(error.message);
        setIsProcessingWithBank(false);
      },
    });
  };

  const mint = async () => {
    try {
      const response = await apiClient.post("/mint", {
        fiat: pool.fiat,
        account,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        refetchFiatBalance();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast(error?.message);
    }
  };

  const borrowWithPermit = async () => {
    try {
      setIsProcessing(true);

      const lendingPool = thorClient.contracts.load(
        pool.address,
        lendingPoolAbi
      );

      const nonce = (await lendingPool.read.nonces(account))[0] as bigint;

      const nextNonce = Number(nonce) + 1;
      const deadline = Math.ceil(Date.now() / 1_000) + 3_600;

      const params = buildBorrowPermitParams(
        Number(connection.chainId),
        pool.address,
        "LendingPool",
        "1",
        account,
        parseUnits(amount, pool.decimals),
        nextNonce,
        deadline
      ) as any;

      const signature = await signTypedData(params);
      const { v, r, s } = parseSignature(signature as `0x${string}`);

      const a = await apiClient.post("/borrow-with-permit", {
        v,
        r,
        s,
        deadline,
      });

      const db = getFirestore();
      await updateDoc(doc(db, "farmers", account), {
        totalBorrowed: increment(Number(amount)),
      });

      await timelineService.createTimelinePost(account, {
        content: `You borrowed ${Symbols[pool.address]}${amount} to bank.`,
        type: "activity",
      });

      toast.success("Successful", { id: "borrowWithPermit" });

      onClose();
    } catch (error) {
      toast(error?.message);
    } finally {
      setIsProcessing(false);
      setIsOpen(false);
      setAmount("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    openTransactionModal();

    if (action === "withdraw") {
      try {
        setIsProcessing(true);

        await sendTransaction([
          Clause.callFunction(
            Address.of(pool.address),
            ABIContract.ofAbi(lendingPoolAbi).getFunction("withdraw"),
            [parseUnits(amount, pool.decimals)]
          ),
        ]);

        await timelineService.createTimelinePost(account, {
          content: `You withdraw ${Symbols[pool.address]}${amount} .`,
          type: "activity",
        });

        onClose();
      } catch (error) {
        toast(error?.message);
      } finally {
        setIsProcessing(false);
        setIsOpen(false);
        setAmount("");
      }
    } else if (action === "supply") {
      try {
        setIsProcessing(true);

        await approve();

        await sendTransaction([
          Clause.callFunction(
            Address.of(pool.address),
            ABIContract.ofAbi(lendingPoolAbi).getFunction("supply"),
            [parseUnits(amount, pool.decimals), account]
          ),
        ]);

        await timelineService.createTimelinePost(account, {
          content: `You supplied ${Symbols[pool.address]}${amount} .`,
          type: "activity",
        });

        onClose();
      } catch (error) {
        toast(error?.message);
      } finally {
        setIsProcessing(false);
        setIsOpen(false);
        setAmount("");
      }
    } else if (action === "borrow") {
      try {
        setIsProcessing(true);

        await sendTransaction([
          Clause.callFunction(
            Address.of(pool.address),
            ABIContract.ofAbi(lendingPoolAbi).getFunction("borrow"),
            [parseUnits(amount, pool.decimals)]
          ),
        ]);
        const db = getFirestore();
        await updateDoc(doc(db, "farmers", account), {
          totalBorrowed: increment(Number(amount)),
        });

        await timelineService.createTimelinePost(account, {
          content: `You borrowed ${Symbols[pool.address]}${amount} .`,
          type: "activity",
        });

        onClose();
      } catch (error) {
        toast(error?.message);
      } finally {
        setIsProcessing(false);
        setIsOpen(false);
        setAmount("");
      }
    } else if (action === "repay") {
      try {
        setIsProcessing(true);

        await approve();

        await sendTransaction([
          Clause.callFunction(
            Address.of(pool.address),
            ABIContract.ofAbi(lendingPoolAbi).getFunction("repay"),
            [parseUnits(amount, pool.decimals), account]
          ),
        ]);

        const db = getFirestore();
        await updateDoc(doc(db, "farmers", account), {
          totalRepaid: increment(Number(amount)),
        });

        await timelineService.createTimelinePost(account, {
          content: `You repaid ${Symbols[pool.address]}${amount}`,
          type: "activity",
        });

        onClose();
      } catch (error) {
        toast(error?.message);
      } finally {
        setIsProcessing(false);
        setIsOpen(false);
        setAmount("");
      }
    }
  };

  const calculateInterest = () => {
    if (!amount) return "0";
    const rate = action === "supply" ? pool.supplyAPY : pool.borrowAPY;
    return (
      (parseFloat(amount) * Number(formatUnits(rate, MAX_BPS_POW))) /
      100
    ).toFixed(2);
  };

  const getBorrowable = useCallback(async () => {
    if (!isOpen) return;
    try {
      const lendingPool = thorClient.contracts.load(
        pool.address,
        lendingPoolAbi
      );

      const result = (
        await lendingPool.read.withdrawable(account)
      )[0] as bigint;

      setBorrowable(
        Number(formatUnits(result, pool.decimals)) -
          Number(formatUnits(pool.outstanding, pool.decimals))
      );
    } catch (error) {
      console.log(error);
    }
  }, [account, pool, isOpen]);

  const getBanks = useCallback(async () => {
    if (!isOpen) return;
    try {
      const response = await fetch(
        `https://api.paystack.co/bank?currency=${pool.currency}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_PAYSTACK_SK_KEY}`,
          },
        }
      );

      const banks = await response.json();

      setBanks(banks?.data ?? []);
    } catch (error) {
      console.log(error);
    }
  }, [pool, isOpen]);

  const resolveAccount = useCallback(async () => {
    if (!bankCode || accountNumber.length != 10) {
      return setBankAccount(undefined);
    }

    try {
      const response = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_PAYSTACK_SK_KEY}`,
          },
        }
      );

      const account = await response.json();

      if (!account.status && account?.message) {
        toast.error(account.message);
      }

      setBankAccount(account?.data);
    } catch (error) {
      console.log(error);
      setBankAccount(undefined);
    }
  }, [bankCode, accountNumber]);

  useEffect(() => {
    getBorrowable();
  }, [getBorrowable]);

  useEffect(() => {
    getBanks();
  }, [getBanks]);

  useEffect(() => {
    resolveAccount();
  }, [resolveAccount]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className={`w-5 h-5 ${config.color}`} />
            {config.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pool Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Pool Currency</span>
              <Badge variant="secondary">{pool.currency}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>{action === "supply" ? "Supply APY" : "Borrow APY"}</span>
              <span className="font-semibold text-green-600">
                {action === "supply"
                  ? Number(formatUnits(pool.supplyAPY, MAX_BPS_POW))
                  : Number(formatUnits(pool.borrowAPY, MAX_BPS_POW))}
                %
              </span>
            </div>
            {action === "borrow" ||
              (action === "withdraw" && (
                <div className="flex justify-between text-sm">
                  <span>Available Liquidity</span>
                  <span className="font-semibold">
                    {Number(
                      formatUnits(
                        pool.totalLiquidity - pool.totalBorrowed,
                        pool.decimals
                      )
                    ).toLocaleString()}{" "}
                    {Symbols[pool.address]}
                  </span>
                </div>
              ))}
            {(action === "supply" || action === "withdraw") && (
              <div className="flex justify-between text-sm">
                <span>Withdrawble</span>
                <span className="font-semibold">
                  {Number(
                    formatUnits(pool.withdrawable, pool.decimals)
                  ).toLocaleString()}{" "}
                  {Symbols[pool.address]}
                </span>
              </div>
            )}
            {(action === "borrow" || action === "repay") && (
              <div className="flex justify-between text-sm">
                <span>Outstanding</span>
                <span className="font-semibold">
                  {Number(
                    formatUnits(pool.outstanding, pool.decimals)
                  ).toLocaleString()}{" "}
                  {Symbols[pool.address]}
                </span>
              </div>
            )}
            {action === "borrow" && (
              <div className="flex justify-between text-sm">
                <span>Max Borrowable</span>
                <span className="font-semibold">
                  {borrowable.toLocaleString()} {Symbols[pool.address]}
                </span>
              </div>
            )}
            {action === "supply" && (
              <div className="flex justify-between text-sm">
                <span>Wallet Balance</span>
                <span className="font-semibold">{fiatBalance?.formatted}</span>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({Symbols[pool.address]})</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Transaction Summary */}
          {amount && (action === "borrow" || action === "supply") && (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Amount</span>
                  <span className="font-semibold">
                    {amount} {Symbols[pool.address]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {action === "supply" ? "Annual Interest" : "Annual Cost"}
                  </span>
                  <span
                    className={`font-semibold ${action === "supply" ? "text-green-600" : "text-red-600"}`}
                  >
                    {calculateInterest()} {Symbols[pool.address]}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-1">
            <Button
              type="submit"
              className="w-full"
              disabled={isProcessing || isProcessingWithBank || !amount}
            >
              {isProcessing ? "Processing..." : `${config.buttonText} `}
            </Button>
            {(action === "supply" || action === "repay") && (
              <Button onClick={mint} type="button" variant="outline">
                <DropletsIcon />
                Mint free {pool.currency}
              </Button>
            )}
          </div>

          <Separator />

          {/* Email Input */}
          {config.buttonText2 &&
            (action === "supply" || action === "repay") && (
              <Input
                id="email"
                type="email"
                placeholder="sarah@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}

          {/* Bank Input */}
          {config.buttonText2 &&
            (action === "borrow" || action === "withdraw") && (
              <div className="space-y-2">
                <Select
                  onValueChange={(value) => {
                    setBankCode(Number(value));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks?.map((bank) => {
                      return (
                        <SelectItem value={bank.code}>{bank.name}</SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    type="number"
                    placeholder="0001234567"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>

                {bankAccount && (
                  <p className="text-sm">{bankAccount.account_name}</p>
                )}
              </div>
            )}

          {config.buttonText2 && (
            <Button
              type="button"
              onClick={handlePaystack}
              className="w-full bg-gray-800"
              disabled={isProcessing || isProcessingWithBank || !amount}
            >
              {isProcessingWithBank
                ? "Processing..."
                : `${config.buttonText2} `}
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
