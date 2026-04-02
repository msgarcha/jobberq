import { useState, useEffect } from "react";
import { Bell, Plus, Search, Users, FileText, Receipt, Briefcase, Settings, KeyRound, LogOut } from "lucide-react";
import QuickLinqLogo from "@/components/QuickLinqLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
import { useToast } from "@/hooks/use-toast";

export function TopBar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const { toast } = useToast();

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

  const handleNotifications = () => {
    toast({ title: "Notifications", description: "Notifications coming soon!" });
  };

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
        <div className="flex items-center gap-2">
          <QuickLinqLogo size={28} variant="green" />
          <span className="font-display font-bold text-base tracking-tight">QuickLinq</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative rounded-lg h-9 w-9" onClick={handleNotifications}>
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-status-danger" />
          </Button>
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

        <Button variant="ghost" size="icon" className="relative rounded-lg" onClick={handleNotifications}>
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-status-danger" />
        </Button>

        <AvatarDropdown />
      </div>
    </header>
  );
}
