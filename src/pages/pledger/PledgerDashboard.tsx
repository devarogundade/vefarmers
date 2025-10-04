import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  DollarSign,
  Users,
  ArrowUpRight,
  Plus,
  Eye,
  ArrowDownLeft,
} from "lucide-react";
import PledgeActionDialog from "@/components/dialogs/PledgeActionDialog";
import { usePledges } from "@/hooks/usePledges";
import { Link } from "react-router-dom";
import { useTimeline } from "@/hooks/useTimeline";
import { formatDistanceToNow } from "date-fns";
import {
  useAccountBalance,
  useDAppKitWallet,
  useSendTransaction,
  useTransactionModal,
} from "@vechain/vechain-kit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { thorClient } from "@/utils/constants";
import { pledgeManagerAbi } from "@/abis/pledgeManager";
import { formatEther } from "viem";
import { toast } from "sonner";
import { ABIContract, Address, Clause } from "@vechain/sdk-core";

interface Harvest {
  name: string;
  amount: number;
}

export default function PledgerDashboard() {
  const { account } = useDAppKitWallet();
  const { data: balance } = useAccountBalance(account);
  const { pledges, loading, refetch } = usePledges({ pledgerAddress: account });
  const { posts } = useTimeline({ address: account, type: "activity" });
  const [harvestable, setHarvestable] = useState<Record<string, Harvest>>({});
  const { open: openTransactionModal } = useTransactionModal();
  const { sendTransaction } = useSendTransaction({
    signerAccountAddress: account,
    onTxConfirmed: () => {
      getHarvestable();
      toast.success("Transaction confirmed", { id: "harvest" });
    },
    onTxFailedOrCancelled: (error) => {
      toast.error(typeof error == "string" ? error : error?.message);
    },
  });

  const getHarvestable = useCallback(async () => {
    for (const pledge of pledges) {
      const contract = thorClient.contracts.load(
        pledge.farmer.pledgeManager,
        pledgeManagerAbi
      );

      const harvestable = (
        await contract.read.harvestable(account)
      )[0] as bigint;

      setHarvestable((prev) => {
        prev[pledge.farmer.pledgeManager] = {
          name: pledge.farmer.name,
          amount: Number(formatEther(harvestable)),
        };

        return prev;
      });
    }
  }, [account, pledges]);

  useEffect(() => {
    getHarvestable();
  }, [getHarvestable]);

  const dashboardStats = useMemo(
    () => [
      {
        title: "Total Pledged",
        value: `${pledges?.reduce((a, p) => a + (p?.amount || 0), 0)?.toLocaleString() || 0} VET`,
        change: "Supporting rural farmers",
        icon: Heart,
        color: "text-primary",
      },
      {
        title: "Active Pledges",
        value: pledges?.length || 0,
        change: "Currently backing farmers",
        icon: Users,
        color: "text-primary",
      },
      {
        title: "Available to Pledge",
        value: `${Number(balance?.balance || 0n).toLocaleString()} VET`,
        change: "Right in your wallet",
        icon: DollarSign,
        color: "text-success",
      },
    ],
    [balance, pledges]
  );

  const harvestRewards = async (address: string) => {
    openTransactionModal();

    toast.loading("Harvesting..", { id: "harvest" });

    await sendTransaction([
      Clause.callFunction(
        Address.of(address),
        ABIContract.ofAbi(pledgeManagerAbi).getFunction("harvest"),
        []
      ),
    ]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Pledger Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track your pledges and support farmers in their journey.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to={"/pledger/farmers"}>
            <Button variant="outline" className="gap-2">
              <Eye className="w-4 h-4" />
              Browse Farmers
            </Button>
          </Link>
          <Link to={"/pledger/farmers"}>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Pledge
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {dashboardStats.map((stat, index) => (
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
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Pledges */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Pledges</CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading
              ? // Loading skeleton
                Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-3 bg-muted rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                ))
              : pledges.map((pledge) => (
                  <div
                    key={pledge.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={"/images/avatar.png"} />
                        <AvatarFallback>
                          {pledge.farmer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{pledge.farmer.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {pledge.farmer.cropType}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {(pledge?.amount || 0).toLocaleString()}{" "}
                        {pledge.currency}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PledgeActionDialog
                        farmer={pledge.farmer}
                        action="withdraw"
                        currentPledge={Number(pledge.amount || 0)}
                        onClose={() => {
                          refetch();
                        }}
                      >
                        <Button variant="ghost" size="sm">
                          <ArrowDownLeft className="w-4 h-4" />
                        </Button>
                      </PledgeActionDialog>
                      <PledgeActionDialog
                        farmer={pledge.farmer}
                        action="increase"
                        currentPledge={Number(pledge.amount || 0)}
                        onClose={() => {
                          refetch();
                        }}
                      >
                        <Button variant="ghost" size="sm">
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      </PledgeActionDialog>
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(harvestable).map((pledgeManager) => {
              const harvest = harvestable[pledgeManager];

              return (
                <div className="flex  items-center justify-between h-14">
                  <div className="space-y-1">
                    <p className="text-sm">{harvest.name} </p>
                    <p className="text-xs">
                      {harvest.amount.toLocaleString()} B3tr
                    </p>
                  </div>
                  <Button onClick={() => harvestRewards(pledgeManager)}>
                    Harvest
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
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
      </div>
    </div>
  );
}
