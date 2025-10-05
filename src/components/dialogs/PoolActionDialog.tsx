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
import { Bank, BankAccount, Farmer, Pool } from "@/types";
import { toast } from "sonner";
import Paystack from "@paystack/inline-js";
import { formatUnits, parseSignature, parseUnits } from "viem";
import { lendingPoolAbi } from "@/abis/lendingPool";
import { MAX_BPS_POW, thorClient, Symbols, Contracts } from "@/utils/constants";
import { doc, updateDoc, getFirestore, getDoc } from "firebase/firestore";
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
  // TransactionToast,
  useDAppKitWallet,
  useGetErc20Balance,
  useSendTransaction,
  useSignTypedData,
  useTransactionModal,
  useWallet,
} from "@vechain/vechain-kit";
import { ABIContract, Address, Clause } from "@vechain/sdk-core";
import { apiClient } from "@/lib/api";
import { fiatAbi } from "@/abis/fiat";
import { ApiResponse } from "@/types/api";

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
  const [isProcessingWithBank, setIsProcessingWithBank] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { account } = useDAppKitWallet();
  const { open: openTransactionModal } = useTransactionModal();
  const { data: fiatBalance, refetch: refetchFiatBalance } = useGetErc20Balance(
    pool.fiat,
    account
  );
  const db = getFirestore();

  const {
    sendTransaction: sendSupplyTransaction,
    isTransactionPending: isSupplyTransactionPending,
  } = useSendTransaction({
    signerAccountAddress: account,
    onTxConfirmed: () => {
      timelineService.createTimelinePost(account, {
        content: `You supplied ${Symbols[pool.address]}${amount}.`,
        type: "activity",
      });

      toast.success("Transaction confirmed.", { id: action });
      onClose();
    },
    onTxFailedOrCancelled: (error) => {
      toast.error(typeof error == "string" ? error : error?.message);
    },
  });

  const {
    sendTransaction: sendWithdrawTransaction,
    isTransactionPending: isWithdrawTransactionPending,
  } = useSendTransaction({
    signerAccountAddress: account,
    onTxConfirmed: () => {
      timelineService.createTimelinePost(account, {
        content: `You withdraw ${Symbols[pool.address]}${amount} .`,
        type: "activity",
      });

      toast.success("Transaction confirmed.", { id: action });
      onClose();
    },
    onTxFailedOrCancelled: (error) => {
      toast.error(typeof error == "string" ? error : error?.message);
    },
  });

  const {
    sendTransaction: sendRepayTransaction,
    isTransactionPending: isRepayTransactionPending,
  } = useSendTransaction({
    signerAccountAddress: account,
    onTxConfirmed: async () => {
      const docSnap = await getDoc(doc(db, "farmers", account));
      if (docSnap.exists()) {
        const data = docSnap.data() as Farmer;
        updateDoc(doc(db, "farmers", account), {
          totalRepaid: data.totalRepaid + Number(amount),
        });
      }

      timelineService.createTimelinePost(account, {
        content: `You repaid ${Symbols[pool.address]}${amount}`,
        type: "activity",
      });

      toast.success("Transaction confirmed.", { id: action });
      onClose();
    },
    onTxFailedOrCancelled: (error) => {
      toast.error(typeof error == "string" ? error : error?.message);
    },
  });

  const {
    sendTransaction: sendBorrowTransaction,
    isTransactionPending: isBorrowTransactionPending,
  } = useSendTransaction({
    signerAccountAddress: account,
    onTxConfirmed: async () => {
      const docSnap = await getDoc(doc(db, "farmers", account));
      if (docSnap.exists()) {
        const data = docSnap.data() as Farmer;
        updateDoc(doc(db, "farmers", account), {
          totalBorrowed: data.totalBorrowed + Number(amount),
        });
      }

      timelineService.createTimelinePost(account, {
        content: `You borrowed ${Symbols[pool.address]}${amount} .`,
        type: "activity",
      });

      toast.success("Transaction confirmed.", { id: action });
      onClose();
    },
    onTxFailedOrCancelled: (error) => {
      toast.error(typeof error == "string" ? error : error?.message);
    },
  });

  const { signTypedData } = useSignTypedData();
  const { connection } = useWallet();

  const actionConfig = {
    supply: {
      title: `Supply ${pool.currency}`,
      description: `Add liquidity to the ${pool.currency} pool and earn interest`,
      buttonText: "Supply",
      buttonText2:
        pool.address == Contracts.NGNCPool ? "Supply with Bank" : undefined,
      icon: DollarSign,
      color: "text-green-600",
    },
    borrow: {
      title: `Borrow ${pool.currency}`,
      description: `Borrow ${pool.currency} against your VET collateral`,
      buttonText: "Borrow",
      buttonText2:
        pool.address == Contracts.NGNCPool ? "Borrow to Bank" : undefined,
      icon: TrendingUp,
      color: "text-blue-600",
    },
    withdraw: {
      title: `Withdraw ${pool.currency}`,
      description: `Remove your supplied ${pool.currency} from the pool`,
      buttonText: "Withdraw",
      icon: Wallet,
      buttonText2:
        pool.address == Contracts.NGNCPool ? "Withdraw to Bank" : undefined,
      color: "text-orange-600",
    },
    repay: {
      title: `Repay ${pool.currency}`,
      description: `Repay your borrowed ${pool.currency}`,
      buttonText: "Repay",
      buttonText2:
        pool.address == Contracts.NGNCPool ? "Repay with Bank" : undefined,
      icon: AlertTriangle,
      color: "text-red-600",
    },
  };

  const config = actionConfig[action];
  const IconComponent = config.icon;

  const approveClause = async (): Promise<Clause[]> => {
    const contract = thorClient.contracts.load(pool.fiat, fiatAbi);
    const allowance = (
      await contract.read.allowance(account, pool.address)
    )[0] as bigint;

    if (Number(formatUnits(allowance, pool.decimals)) >= Number(amount))
      return [];

    return [
      Clause.callFunction(
        Address.of(pool.fiat),
        ABIContract.ofAbi(fiatAbi).getFunction("approve"),
        [pool.address, parseUnits(amount, pool.decimals)]
      ),
    ];
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
      amount: Number(parseUnits(amount, 2)),
      currency: pool.currency.replace("C", ""),
      metadata: {
        pool: pool.address,
        fiat: pool.fiat,
        amount: Number(parseUnits(amount, 2)),
        behalfOf: account,
      },
      onSuccess: async (transaction) => {
        setIsOpen(true);

        if (transaction.status == "success") {
          if (action === "supply") {
            toast.loading("Supplying...", { id: "paystack" });

            const { data } = await apiClient.post("/supply-on-behalf", {
              reference: transaction.reference,
              provider: "paystack",
            });

            const response: ApiResponse<string> = data;

            if (response.success) {
              timelineService.createTimelinePost(account, {
                content: `You supplied ${Symbols[pool.address]}${amount} from bank.`,
                type: "activity",
              });

              toast.success(response.message, { id: "paystack" });
            } else {
              toast.error(response.message, { id: "paystack" });
            }
          } else {
            toast.loading("Repaying...", { id: "paystack" });

            const { data } = await apiClient.post("/repay-on-behalf", {
              reference: transaction.reference,
              provider: "paystack",
            });

            const response: ApiResponse<string> = data;

            if (response.success) {
              const docSnap = await getDoc(doc(db, "farmers", account));
              if (docSnap.exists()) {
                const data = docSnap.data() as Farmer;
                updateDoc(doc(db, "farmers", account), {
                  totalRepaid: data.totalRepaid + Number(amount),
                });
              }

              await timelineService.createTimelinePost(account, {
                content: `You repaid ${Symbols[pool.address]}${amount} from bank.`,
                type: "activity",
              });

              toast.success(response.message);
            } else {
              toast.error(response.message);
            }
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
      toast.loading("Minting", { id: "mint" });

      const { data } = await apiClient.post("/mint", {
        fiat: pool.fiat,
        account,
        amount: parseUnits("1000", pool.decimals).toString(),
      });

      const response: ApiResponse<string> = data;

      if (response.success) {
        refetchFiatBalance();

        toast.success(response.message, { id: "mint" });
      } else {
        toast.error(response.message, { id: "mint" });
      }
    } catch (error) {
      toast(error?.message);
    }
  };

  const borrowWithPermit = async () => {
    try {
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

      const { data } = await apiClient.post("/borrow-with-permit", {
        account,
        v: Number(v),
        r,
        s,
        deadline,
      });

      const response: ApiResponse<string> = data;

      if (response.success) {
        const docSnap = await getDoc(doc(db, "farmers", account));
        if (docSnap.exists()) {
          const data = docSnap.data() as Farmer;
          updateDoc(doc(db, "farmers", account), {
            totalBorrowed: data.totalBorrowed + Number(amount),
          });
        }

        timelineService.createTimelinePost(account, {
          content: `You borrowed ${Symbols[pool.address]}${amount} to bank.`,
          type: "activity",
        });

        toast.success(response.message, { id: "borrowWithPermit" });
        onClose();
      } else {
        toast.error(response.message, { id: "borrowWithPermit" });
      }
    } catch (error) {
      toast(error?.message);
      setIsOpen(false);
      setAmount("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    openTransactionModal();

    if (action === "withdraw") {
      try {
        toast.loading("Withdrawing..", { id: action });

        await sendWithdrawTransaction([
          Clause.callFunction(
            Address.of(pool.address),
            ABIContract.ofAbi(lendingPoolAbi).getFunction("withdraw"),
            [parseUnits(amount, pool.decimals)]
          ),
        ]);
      } catch (error) {
        toast(error?.message);
        setIsOpen(false);
        setAmount("");
      }
    } else if (action === "supply") {
      toast.loading("Supplying..", { id: action });

      try {
        await sendSupplyTransaction([
          ...(await approveClause()),
          Clause.callFunction(
            Address.of(pool.address),
            ABIContract.ofAbi(lendingPoolAbi).getFunction("supply"),
            [parseUnits(amount, pool.decimals), account]
          ),
        ]);
      } catch (error) {
        toast(error?.message);
        setIsOpen(false);
        setAmount("");
      }
    } else if (action === "borrow") {
      toast.loading("Borrowing..", { id: action });

      try {
        await sendBorrowTransaction([
          Clause.callFunction(
            Address.of(pool.address),
            ABIContract.ofAbi(lendingPoolAbi).getFunction("borrow"),
            [parseUnits(amount, pool.decimals)]
          ),
        ]);
      } catch (error) {
        toast(error?.message);
        setIsOpen(false);
        setAmount("");
      }
    } else if (action === "repay") {
      toast.loading("Repaying..", { id: action });

      try {
        await sendRepayTransaction([
          ...(await approveClause()),
          Clause.callFunction(
            Address.of(pool.address),
            ABIContract.ofAbi(lendingPoolAbi).getFunction("repay"),
            [parseUnits(amount, pool.decimals), account]
          ),
        ]);
      } catch (error) {
        toast(error?.message);
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

      setBanks(banks?.data || []);
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
            {(action === "supply" || action === "repay") && (
              <div className="flex justify-between text-sm">
                <span>Wallet Balance</span>
                <span className="font-semibold">
                  {formatUnits(
                    BigInt(fiatBalance?.original || 0),
                    pool.decimals
                  )}
                </span>
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
              disabled={
                isSupplyTransactionPending ||
                isWithdrawTransactionPending ||
                isBorrowTransactionPending ||
                isRepayTransactionPending ||
                isProcessingWithBank ||
                !amount
              }
            >
              {isSupplyTransactionPending ||
              isWithdrawTransactionPending ||
              isBorrowTransactionPending ||
              isRepayTransactionPending
                ? "Processing..."
                : `${config.buttonText} `}
            </Button>
            {(action === "supply" || action === "repay") && (
              <Button onClick={mint} type="button" variant="outline">
                <DropletsIcon />
                Mint free {pool.currency}
              </Button>
            )}
          </div>

          {config.buttonText2 && <Separator />}

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
              disabled={
                isSupplyTransactionPending ||
                isWithdrawTransactionPending ||
                isBorrowTransactionPending ||
                isRepayTransactionPending ||
                isProcessingWithBank ||
                !amount
              }
            >
              {isProcessingWithBank
                ? "Processing..."
                : `${config.buttonText2} `}
            </Button>
          )}
        </form>

        {/* <TransactionToast
                isOpen={isOpen}
                onClose={close}
                status={status}
                txReceipt={txReceipt}
                txError={error}
                onTryAgain={handleTryAgain}
                title= {''},
                description= {''}
            /> */}
      </DialogContent>
    </Dialog>
  );
}
