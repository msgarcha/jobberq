import { useState, useEffect } from "react";
import { ArrowLeft, Bell, Plus, Search, Users, FileText, Receipt, Briefcase, Settings, KeyRound, LogOut, ChevronRight, CheckCheck, Eye, CheckCircle2, DollarSign, Sparkles } from "lucide-react";
import QuickLinqLogo from "@/components/QuickLinqLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { AssistantSheet } from "@/components/ai/AssistantSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatRelativeTime } from "@/hooks/useInvoices";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, type Notification } from "@/hooks/useNotifications";

const TYPE_ICON: Record<string, typeof Eye> = {
  quote_viewed: Eye,
  invoice_viewed: Eye,
  quote_approved: CheckCircle2,
  deposit_paid: DollarSign,
  invoice_paid: DollarSign,
};

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [linqOpen, setLinqOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

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
  const unreadCount = (notifications ?? []).filter((n) => !n.read_at).length;

  const handleNotificationClick = (n: Notification) => {
    if (!n.read_at) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  const NotificationDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-lg h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-status-danger text-[10px] font-semibold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-[calc(100vw-1.5rem)] max-w-80 max-h-[70vh] overflow-y-auto">
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={(e) => { e.preventDefault(); markAllRead.mutate(); }}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        {!notifications?.length ? (
          <div className="px-3 py-6 text-center">
            <Bell className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 12).map((n) => {
            const Icon = TYPE_ICON[n.type as string] ?? Bell;
            return (
              <DropdownMenuItem
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`flex items-start gap-3 py-3 cursor-pointer ${!n.read_at ? "bg-primary/5" : ""}`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground truncate">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelativeTime(n.created_at)}</p>
                </div>
                {!n.read_at && <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
              </DropdownMenuItem>
            );
          })
        )}
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
    const titleMap: Record<string, string> = {
      "/clients": "Clients",
      "/quotes": "Quotes",
      "/invoices": "Invoices",
      "/jobs": "Jobs",
      "/pipeline": "Pipeline",
      "/projects": "Projects",
      "/reviews": "Reputation Shield",
      "/schedule": "Schedule",
      "/reports": "Reports",
      "/services": "Services",
      "/settings": "Settings",
      "/import": "Import Data",
    };
    const path = location.pathname;
    const isHome = path === "/";
    let title = "";
    if (!isHome) {
      const match = Object.keys(titleMap).find((p) => path === p || path.startsWith(p + "/"));
      title = match ? titleMap[match] : "";
    }

    return (
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b safe-area-top">
        <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center px-3">
          {/* Left zone */}
          <div className="flex items-center justify-start min-w-0">
            {isHome ? (
              <QuickLinqLogo size={26} type="full" variant="dark" />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 -ml-1"
                onClick={() => navigate(-1)}
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Center title */}
          <div className="flex items-center justify-center min-w-0 px-2">
            {!isHome && title && (
              <h1 className="text-base font-display font-semibold truncate">{title}</h1>
            )}
          </div>

          {/* Right zone — Linq lives in the floating launcher (bottom-right) */}
          <div className="flex items-center justify-end gap-1">
            <NotificationDropdown />
            <AvatarDropdown />
          </div>
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
