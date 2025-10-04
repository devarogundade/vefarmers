import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  Plus,
  MessageSquare,
  Loader,
} from "lucide-react";
import { useFarmer } from "@/hooks/useFarmers";
import { usePool } from "@/hooks/usePools";
import { formatUnits, parseEther } from "viem";
import { MAX_BPS_POW, publicClient, Symbols } from "@/utils/constants";
import { useTimeline } from "@/hooks/useTimeline";
import { toast } from "sonner";
import { lendingPoolAbi } from "@/abis/lendingPool";
import { useState } from "react";
import PoolActionDialog from "@/components/dialogs/PoolActionDialog";
import { formatDistanceToNow } from "date-fns";
import {
  useDAppKitWallet,
  useSendTransaction,
  useTransactionModal,
} from "@vechain/vechain-kit";
import { ABIContract, Address, Clause } from "@vechain/sdk-core";

export default function FarmerDashboard() {
  const { account } = useDAppKitWallet();

  const {
    farmer,
    loading: loadingFarmer,
    refetch: refetchFarmer,
  } = useFarmer(account);
  const { pool, loading, refetch } = usePool(farmer?.preferredPool, account);
  const { posts } = useTimeline({ address: account, type: "activity" });

  const [activating, setActivating] = useState(false);
  const { open: openTransactionModal } = useTransactionModal();
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
  const stats = [
    {
      title: "Current Loan",
      value: loading
        ? "•••"
        : `${Symbols[farmer?.preferredPool]}${Number(formatUnits(pool?.borrow ?? 0n, 2)).toLocaleString()}`,
      change: `Since ${farmer?.createdAt}`,
      icon: DollarSign,
      color: "text-primary",
    },
    {
      title: "Total Repaid",
      value: loading
        ? "•••"
        : `${Symbols[farmer?.preferredPool]}${farmer?.totalRepaid?.toLocaleString()}`,
      change: `Since ${farmer?.createdAt}`,
      icon: CheckCircle,
      color: "text-success",
    },
    {
      title: "Pledge Status",
      value: loading ? "•••" : pool?.active ? "Active" : "Inactive",
      change: "",
      icon: Clock,
      color: "text-warning",
    },
    {
      title: "Total Pledges",
      value: loading
        ? "•••"
        : `${Number(formatUnits(pool?.totalPledge ?? 0n, 8)).toLocaleString()} VET`,
      change: "Can be use to secure loans",
      icon: TrendingUp,
      color: "text-primary",
    },
  ];

  const deactivate = async () => {
    try {
      setActivating(true);

      openTransactionModal();

      await sendTransaction([
        Clause.callFunction(
          Address.of(pool.address),
          ABIContract.ofAbi(lendingPoolAbi).getFunction("deactivatePledge"),
          []
        ),
      ]);

      refetch();
    } catch (error) {
      toast.error(error?.message);
    } finally {
      setActivating(false);
    }
  };

  const activate = async () => {
    try {
      setActivating(true);

      openTransactionModal();

      await sendTransaction([
        Clause.callFunction(
          Address.of(pool.address),
          ABIContract.ofAbi(lendingPoolAbi).getFunction("activatePledge"),
          []
        ),
      ]);

      refetch();
    } catch (error) {
      toast.error(error?.message);
    } finally {
      setActivating(false);
    }
  };

  if (loadingFarmer)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader className="animate-spin" />
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {farmer?.name}!</h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your farm today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            New Update
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Request Loan
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
              {stat.title === "Pledge Status" && (
                <>
                  {pool?.active ? (
                    <>
                      {pool.borrow > 0n && (
                        <p className="text-xs text-muted-foreground mt-1 mb-1">
                          Repay back all loan to deactivate.
                        </p>
                      )}

                      <Button
                        disabled={pool.borrow > 0n || activating}
                        onClick={deactivate}
                      >
                        Deactivate
                      </Button>
                    </>
                  ) : (
                    <Button disabled={activating} onClick={activate}>
                      Activate
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {posts.map((post) => {
              return (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">{post.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(post.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loan Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Loan Amount
                </span>
                <span className="font-semibold">
                  {Symbols[farmer?.preferredPool]}
                  {Number(formatUnits(pool?.borrow ?? 0n, 2)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Interest Rate
                </span>
                <span className="font-semibold">
                  {Number(
                    formatUnits(pool?.borrowAPY ?? 0n, MAX_BPS_POW)
                  ).toLocaleString()}
                  % APR
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  HealthFactor
                </span>
                <Badge variant="secondary">
                  {pool?.ltvBps > parseEther("1")
                    ? "Infinity"
                    : Number(
                        formatUnits(pool?.ltvBps ?? 0n, 0)
                      ).toLocaleString()}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Due</span>
                <span className="font-semibold text-lg">
                  {Symbols[farmer?.preferredPool]}
                  {Number(
                    formatUnits(pool?.outstanding ?? 0n, 2)
                  ).toLocaleString()}
                </span>
              </div>
              <div className="pt-4">
                {pool && (
                  <PoolActionDialog
                    pool={pool}
                    action="repay"
                    onClose={() => {
                      refetch();
                      refetchFarmer();
                    }}
                  >
                    <Button className="w-full">Make Payment</Button>
                  </PoolActionDialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
