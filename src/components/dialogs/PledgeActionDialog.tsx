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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Plus, Minus, AlertTriangle, Info } from "lucide-react";
import { Farmer } from "@/types";
import { toast } from "sonner";
import { pledgeManagerAbi } from "@/abis/pledgeManager";
import pledgesService from "@/services/pledgesService";
import { thorClient } from "@/utils/constants";
import {
  useDAppKitWallet,
  useSendTransaction,
  useTransactionModal,
} from "@vechain/vechain-kit";
import { ABIContract, Address, Clause, VET } from "@vechain/sdk-core";

interface PledgeActionDialogProps {
  farmer: Partial<Farmer>;
  action: "increase" | "withdraw";
  currentPledge?: number;
  children: React.ReactNode;
  onClose: () => void;
}

export default function PledgeActionDialog({
  farmer,
  action,
  currentPledge = 0,
  children,
  onClose,
}: PledgeActionDialogProps) {
  const [amount, setAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(true);
  const { account } = useDAppKitWallet();
  const { open: openTransactionModal } = useTransactionModal();
  const {
    sendTransaction: sendPledgeTransaction,
    isTransactionPending: isPledgeTransactionPending,
  } = useSendTransaction({
    signerAccountAddress: account,
    onTxConfirmed: () => {
      if (amount) {
        pledgesService.createPledge(account, {
          farmerAddress: farmer.address,
          amount: Number(amount),
          currency: "VET",
        });

        setAmount("");
        setIsOpen(false);
        onClose();
      }
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
      if (amount) {
        pledgesService.decreasePledge(account, {
          farmerAddress: farmer.address,
          amount: Number(amount),
          currency: "VET",
        });

        setAmount("");
        setIsOpen(false);
        onClose();
      }
    },
    onTxFailedOrCancelled: (error) => {
      toast.error(typeof error == "string" ? error : error?.message);
    },
  });

  const getPledgeStatus = useCallback(async () => {
    const pledgeManagerContract = thorClient.contracts.load(
      farmer.pledgeManager,
      pledgeManagerAbi
    );

    const result = (await pledgeManagerContract.read.active())[0] as boolean;

    setActive(result);
  }, [farmer]);

  useEffect(() => {
    getPledgeStatus();
  }, [getPledgeStatus]);

  const actionConfig = {
    pledge: {
      title: `Pledge VET to ${farmer.name}`,
      description: "Support this farmer with VET collateral for their loans",
      buttonText: "Create Pledge",
      icon: Heart,
      color: "text-primary",
    },
    increase: {
      title: `Increase Pledge to ${farmer.name}`,
      description: "Add more VET to your existing pledge",
      buttonText: "Increase Pledge",
      icon: Plus,
      color: "text-green-600",
    },
    withdraw: {
      title: `Withdraw Pledge from ${farmer.name}`,
      description: "Remove VET from your pledge (only when not locked)",
      buttonText: "Withdraw",
      icon: Minus,
      color: "text-orange-600",
    },
  };

  const config = actionConfig[action];
  const IconComponent = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (action === "increase") {
      try {
        openTransactionModal();

        sendPledgeTransaction([
          Clause.callFunction(
            Address.of(farmer.pledgeManager),
            ABIContract.ofAbi(pledgeManagerAbi).getFunction("pledge"),
            [account],
            VET.of(amount)
          ),
        ]);
      } catch (error) {
        toast.error(error?.message);
      }
    } else if (action === "withdraw") {
      try {
        openTransactionModal();

        sendWithdrawTransaction([
          Clause.callFunction(
            Address.of(farmer.pledgeManager),
            ABIContract.ofAbi(pledgeManagerAbi).getFunction("withdraw"),
            [VET.of(amount).wei]
          ),
        ]);
      } catch (error) {
        toast.error(error?.message);
      }
    }
  };

  const getNewTotal = () => {
    if (!amount) return currentPledge;
    const amountNum = parseFloat(amount);
    if (action === "withdraw") {
      return Math.max(0, currentPledge - amountNum);
    }
    return currentPledge + amountNum;
  };

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
          {/* Farmer Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={"/images/avatar.png"} />
                <AvatarFallback>
                  {farmer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{farmer.name}</h3>
                  {farmer.verified && (
                    <Badge variant="secondary" className="text-xs">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {farmer.location}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{farmer.cropType}</span>
                  <span>•</span>
                  <span>{farmer.farmSize}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Pledge Info */}
          {currentPledge > 0 && (
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium">Current Pledge</span>
              <Badge variant="outline" className="text-blue-700">
                {currentPledge.toLocaleString()} VET
              </Badge>
            </div>
          )}

          {action === "withdraw" && active && (
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
              <span className="text-sm font-medium">Active Pledge</span>
              <Badge variant="outline" className="text-red-700">
                Cannot Withdraw
              </Badge>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              {action === "withdraw" ? "Withdraw Amount" : "Pledge Amount"}{" "}
              (VET)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              max={action === "withdraw" ? currentPledge : undefined}
            />

            {action === "withdraw" && (
              <p className="text-xs text-muted-foreground">
                Maximum withdraw: {currentPledge.toLocaleString()} VET
              </p>
            )}
          </div>

          {/* Transaction Summary */}
          {amount && (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Transaction Amount</span>
                  <span className="font-semibold">{amount} VET</span>
                </div>
                <div className="flex justify-between">
                  <span>New Total Pledge</span>
                  <span className="font-semibold text-primary">
                    {getNewTotal().toLocaleString()} VET
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Warning for withdrawal */}
          {action === "withdraw" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-semibold mb-1">Withdrawal Terms</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Only available when not securing active loans</li>
                    <li>• May have a waiting period for processing</li>
                    <li>• Partial withdrawals allowed</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Info for pledging */}
          {action !== "withdraw" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Pledge Benefits</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Help farmers access better loan terms</li>
                    <li>• Possible rewards from grateful farmers</li>
                    <li>• Support sustainable agriculture</li>
                    <li>• Withdrawable between loan cycles</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              isPledgeTransactionPending ||
              isWithdrawTransactionPending ||
              !amount ||
              (action === "withdraw" && active)
            }
          >
            {isPledgeTransactionPending || isWithdrawTransactionPending
              ? "Processing..."
              : `${config.buttonText} ${amount || "0"} VET`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
