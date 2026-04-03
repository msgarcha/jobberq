import { useState, useEffect } from "react";
import { Bell, Plus, Search, Users, FileText, Receipt, Briefcase, Settings, KeyRound, LogOut, ChevronRight } from "lucide-react";
import QuickLinqLogo from "@/components/QuickLinqLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRecentActivity, formatRelativeTime } from "@/hooks/useInvoices";

export function TopBar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: activity } = useRecentActivity();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setMenuOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "U";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const hasActivity = !!activity?.length;

  const NotificationDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-lg h-9 w-9">
          <Bell className="h-4 w-4" />
          {hasActivity && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-status-danger" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-semibold">Recent Activity</p>
        </div>
        {!hasActivity ? (
          <div className="px-3 py-6 text-center">
            <Bell className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          activity.slice(0, 6).map((item) => {
            const Icon = item.type === "quote" ? FileText : Receipt;
            const path = item.type === "quote" ? `/quotes/${item.id}` : `/invoices/${item.id}`;
            return (
              <DropdownMenuItem
                key={`${item.type}-${item.id}`}
                onClick={() => navigate(path)}
                className="flex items-start gap-3 py-3 cursor-pointer"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.text}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelativeTime(item.time)}</p>
                </div>
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/invoices")} className="justify-center text-xs text-primary">
          View All Activity <ChevronRight className="h-3 w-3 ml-1" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const AvatarDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2.5">
          <Settings className="h-4 w-4 text-muted-foreground" />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/reset-password")} className="gap-2.5">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          Change Password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="gap-2.5 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isMobile) {
    return (
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-card/80 backdrop-blur-sm px-4 border-b">
        <QuickLinqLogo size={28} type="full" variant="dark" />
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <AvatarDropdown />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/80 backdrop-blur-sm px-4">
      <SidebarTrigger className="shrink-0" />

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search clients, quotes, invoices…"
          className="pl-10 h-9 bg-secondary/60 border-none rounded-lg focus:bg-card"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 rounded-lg shadow-warm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/clients/new")} className="gap-2.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              New Client
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/quotes/new")} className="gap-2.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
              New Quote
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/invoices/new")} className="gap-2.5">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              New Invoice
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/jobs/new")} className="gap-2.5">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              New Job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationDropdown />
        <AvatarDropdown />
      </div>
    </header>
  );
}
