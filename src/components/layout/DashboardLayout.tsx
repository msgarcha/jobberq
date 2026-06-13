import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { LinqLauncher } from "@/components/ai/LinqLauncher";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="h-[100dvh] overflow-hidden flex w-full">
        {!isMobile && <AppSidebar />}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <TopBar />
          <main className={`flex-1 overflow-y-auto overflow-x-hidden app-scroll ${isMobile ? "px-4 pt-4 safe-area-pb-nav" : "p-6"}`}>
            {children}
          </main>
        </div>
        {isMobile && <MobileBottomNav />}
        <LinqLauncher />
      </div>
    </SidebarProvider>
  );
}
