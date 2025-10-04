import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sprout, Mail, User, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { farmerRegistryAbi } from "@/abis/farmerRegistry";
import { Contracts, thorClient } from "@/utils/constants";
import { useFarmers } from "@/hooks/useFarmers";
import { toast } from "sonner";
import farmersService from "@/services/farmersService";
import { zeroAddress } from "viem";
import {
  useDAppKitWallet,
  useSendTransaction,
  useTransactionModal,
} from "@vechain/vechain-kit";
import { ABIContract, Address, Clause } from "@vechain/sdk-core";

interface FarmerAuthProps {
  mode: "login" | "register";
}

export default function FarmerAuth({ mode }: FarmerAuthProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<string | undefined>(undefined);
  const [farmSize, setFarmSize] = useState<string | undefined>(undefined);
  const [cropType, setCropType] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [pool, setPool] = useState<string | undefined>(undefined);
  const { account } = useDAppKitWallet();
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
  const { createFarmer } = useFarmers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      return toast.error("Connect your wallet");
    }

    if (mode === "register") {
      try {
        setIsLoading(true);

        openTransactionModal();

        await sendTransaction([
          Clause.callFunction(
            Address.of(Contracts.FarmerRegistry),
            ABIContract.ofAbi(farmerRegistryAbi).getFunction("registerFarmer"),
            [
              JSON.stringify({
                name,
                email,
                location,
                farmSize,
                cropType,
                description,
              }),
              pool,
            ]
          ),
        ]);

        const farmerRegistry = thorClient.contracts.load(
          Contracts.FarmerRegistry,
          farmerRegistryAbi
        );

        const pledgeManager = (
          await farmerRegistry.read.farmerToManager(account)
        )[0] as string;

        await createFarmer(account, pledgeManager, {
          name,
          email,
          location,
          farmSize,
          cropType,
          description,
          preferredPool: pool,
        });

        navigate("/farmer/dashboard");
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        setIsLoading(true);

        const farmer = await farmersService.getFarmerByAddress(account);

        if (farmer.success) {
          navigate("/farmer/dashboard");
        } else {
          return toast.error("Account not found.");
        }

        const farmerRegistry = thorClient.contracts.load(
          Contracts.FarmerRegistry,
          farmerRegistryAbi
        );

        const pledgeManager = (
          await farmerRegistry.read.farmerToManager(account)
        )[0] as string;

        if (pledgeManager == zeroAddress) {
          return toast.error("Farmer not found in registry.");
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Sprout className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold">VeFarmers</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {mode === "login"
              ? "Welcome Back, Farmer!"
              : "Join VeFarmers as a Farmer"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "login"
              ? "Sign in to manage your farm and connect with pledgers"
              : "Start your journey with community-backed micro-lending"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "login" ? "Sign In" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Enter your credentials to access your farmer dashboard"
                : "Fill in your details to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Sarah Okafor"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Farm Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="Kaduna State, Nigeria"
                        className="pl-10"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="farmSize">Farm Size</Label>
                      <Select onValueChange={(value) => setFarmSize(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-2 hectares">
                            1-2 hectares
                          </SelectItem>
                          <SelectItem value="3-5 hectares">
                            3-5 hectares
                          </SelectItem>
                          <SelectItem value="6-10 hectares">
                            6-10 hectares
                          </SelectItem>
                          <SelectItem value="10+ hectares">
                            10+ hectares
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cropType">Primary Crop</Label>
                      <Select onValueChange={(value) => setCropType(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select crop" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Maize">Maize</SelectItem>
                          <SelectItem value="Rice">Rice</SelectItem>
                          <SelectItem value="Cassava">Cassava</SelectItem>
                          <SelectItem value="Yam">Yam</SelectItem>
                          <SelectItem value="Beans">Beans</SelectItem>
                          <SelectItem value="Soybean">Soybean</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredPool">
                      Preferred Lending Pool
                    </Label>
                    <Select onValueChange={(value: string) => setPool(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency pool" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Contracts.USDCPool}>
                          USDC (Circle USD)
                        </SelectItem>
                        <SelectItem value={Contracts.EURCPool}>
                          EURC (Circle EUR)
                        </SelectItem>
                        <SelectItem value={Contracts.NGNCPool}>
                          NGNC (Circle NGN)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose the currency pool you'd like to borrow from
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">About Your Farm</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell us about your farming experience and goals..."
                      className="min-h-[80px]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="farmer@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? "Processing..."
                  : mode === "login"
                    ? "Sign In"
                    : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === "login"
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold"
                  onClick={() =>
                    navigate(
                      mode === "login" ? "/farmer/register" : "/farmer/login"
                    )
                  }
                >
                  {mode === "login" ? "Register here" : "Sign in"}
                </Button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Button variant="ghost" onClick={() => navigate("/")}>
                ← Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
