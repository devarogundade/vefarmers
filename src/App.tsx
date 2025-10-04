import {
  VeChainKitProvider,
  TransactionModalProvider,
} from "@vechain/vechain-kit";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import { AppLayout } from "./components/Layout/AppLayout";
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import FarmerTimeline from "./pages/farmer/FarmerTimeline";
import FarmerProfile from "./pages/farmer/FarmerProfile";
import FarmerAuth from "./pages/farmer/FarmerAuth";
import PledgerDashboard from "./pages/pledger/PledgerDashboard";
import FarmersDirectory from "./pages/pledger/FarmersDirectory";
import PledgePage from "./pages/pledger/PledgePage";
import NotFound from "./pages/NotFound";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

const App = () => (
  <VeChainKitProvider
    feeDelegation={{
      delegatorUrl: import.meta.env.VITE_DELEGATOR_URL!,
      delegateAllTransactions: false,
      b3trTransfers: {
        minAmountInEther: 1,
      },
    }}
    dappKit={{
      allowedWallets: ["veworld", "sync2", "wallet-connect"],
      walletConnectOptions: {
        projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
        metadata: {
          name: "VeFarmers",
          description: "VeChain Education Platform",
          url: window.location.origin,
          icons: [`${window.location.origin}/logo.png`],
        },
      },
      usePersistence: true,
      useFirstDetectedSource: false,
    }}
    loginMethods={[
      { method: "vechain", gridColumn: 4 },
      { method: "dappkit", gridColumn: 4 },
      { method: "ecosystem", gridColumn: 4 },
    ]}
    loginModalUI={{
      description:
        "Choose between social login through VeChain or by connecting your wallet.",
    }}
    network={{ type: "test" }}
    allowCustomTokens={true}
  >
    <TransactionModalProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/farmer/login" element={<FarmerAuth mode="login" />} />
            <Route
              path="/farmer/register"
              element={<FarmerAuth mode="register" />}
            />

            <Route path="/farmer" element={<AppLayout />}>
              <Route path="dashboard" element={<FarmerDashboard />} />
              <Route path="timeline" element={<FarmerTimeline />} />
              <Route path="profile" element={<FarmerProfile />} />
            </Route>

            <Route path="/pledger" element={<AppLayout />}>
              <Route path="dashboard" element={<PledgerDashboard />} />
              <Route path="farmers" element={<FarmersDirectory />} />
              <Route path="pledge/:farmerAddress" element={<PledgePage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TransactionModalProvider>
  </VeChainKitProvider>
);

export default App;
