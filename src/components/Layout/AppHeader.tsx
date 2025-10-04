import { SidebarTrigger } from "../ui/sidebar";
import { WalletButton } from "@vechain/vechain-kit";

export function AppHeader() {
  return (
    <header className="sticky top-0 bg-white h-16 border-b border-border bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-semibold text-lg">VeFarmers</span>
        </div>
      </div>

      <WalletButton
        mobileVariant="iconAndDomain"
        desktopVariant="iconAndDomain"
      />
    </header>
  );
}
