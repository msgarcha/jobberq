import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Receipt,
  MoreHorizontal,
  Plus,
  X,
  FileText,
  Star,
  Calendar,
  BarChart3,
  Settings,
  Wrench,
  Kanban,
  FolderOpen,
  LogOut,
  Sparkles,
  Shield,
} from "lucide-react";
import { AssistantSheet } from "@/components/ai/AssistantSheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const tabs = [
  { label: "Home", icon: LayoutDashboard, path: "/" },
  { label: "Clients", icon: Users, path: "/clients" },
  { label: "fab", icon: Plus, path: "" },
  { label: "Jobs", icon: Briefcase, path: "/jobs" },
  { label: "More", icon: MoreHorizontal, path: "__more" },
];

const fabActions = [
  { label: "New Client", icon: Users, path: "/clients/new" },
  { label: "New Quote", icon: FileText, path: "/quotes/new" },
  { label: "New Invoice", icon: Receipt, path: "/invoices/new" },
  { label: "New Job", icon: Briefcase, path: "/jobs/new" },
];

const moreItems = [
  { label: "Quotes", icon: FileText, path: "/quotes" },
  { label: "Invoices", icon: Receipt, path: "/invoices" },
  { label: "Pipeline", icon: Kanban, path: "/pipeline" },
  { label: "Projects", icon: FolderOpen, path: "/projects" },
  { label: "Reviews", icon: Star, path: "/reviews" },
  { label: "Schedule", icon: Calendar, path: "/schedule" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Services", icon: Wrench, path: "/services" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, isSuperAdmin } = useAuth();
  const [fabOpen, setFabOpen] = useState(false);
  const [fabClosing, setFabClosing] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const closingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const [linqOpen, setLinqOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const closeFab = useCallback(() => {
    if (!fabOpen || fabClosing) return;
    setFabClosing(true);
    closingTimeout.current = setTimeout(() => {
      setFabOpen(false);
      setFabClosing(false);
    }, 250);
  }, [fabOpen, fabClosing]);

  const closeAll = useCallback(() => {
    setFabOpen(false);
    setFabClosing(false);
    setMoreOpen(false);
    if (closingTimeout.current) clearTimeout(closingTimeout.current);
  }, []);

  useEffect(() => {
    closeAll();
  }, [location.pathname, closeAll]);

  useEffect(() => {
    return () => {
      if (closingTimeout.current) clearTimeout(closingTimeout.current);
    };
  }, []);

  const handleTab = (tab: typeof tabs[0]) => {
    if (tab.label === "fab") {
      setMoreOpen(false);
      if (fabOpen) {
        closeFab();
      } else {
        setFabOpen(true);
        setFabClosing(false);
      }
    } else if (tab.path === "__more") {
      if (fabOpen) closeFab();
      setMoreOpen((p) => !p);
    } else {
      closeAll();
      navigate(tab.path);
    }
  };

  const showFabOverlay = fabOpen || fabClosing;

  return (
    <>
      {/* FAB Overlay */}
      {showFabOverlay && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={closeFab}>
          <div
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            style={{
              animation: fabClosing
                ? "backdrop-fade-out 0.25s ease-out forwards"
                : "fade-in 0.3s ease-out both",
            }}
          />
          <div className="relative z-10 w-full max-w-sm px-6 pb-32 space-y-3" onClick={(e) => e.stopPropagation()}>
            {fabActions.map((action, i) => {
              const reverseI = fabActions.length - 1 - i;
              return (
                <button
                  key={action.label}
                  onClick={() => {
                    closeAll();
                    navigate(action.path);
                  }}
                  className="flex items-center gap-3 w-full rounded-2xl bg-card px-5 py-4 shadow-warm-lg text-foreground font-medium text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    animation: fabClosing
                      ? `fab-stagger-out 0.2s ease-in ${reverseI * 40}ms both`
                      : `fab-stagger 0.25s ease-out ${i * 60}ms both`,
                  }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <action.icon className="h-5 w-5" />
                  </div>
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* More Overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative z-10 w-full bg-card rounded-t-3xl shadow-warm-lg pb-28 pt-4 px-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setMoreOpen(false);
                    navigate(item.path);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-colors",
                    isActive(item.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              ))}
              {isSuperAdmin && (
                <button
                  onClick={() => {
                    setMoreOpen(false);
                    navigate("/super-admin");
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-colors",
                    isActive("/super-admin") ? "bg-amber-500/10 text-amber-600" : "text-amber-600 hover:bg-amber-500/10"
                  )}
                >
                  <Shield className="h-6 w-6" />
                  <span className="text-xs font-medium">Super Admin</span>
                </button>
              )}
              <button
                onClick={() => {
                  setMoreOpen(false);
                  setLinqOpen(true);
                }}
                className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl text-primary hover:bg-primary/10 transition-colors"
              >
                <Sparkles className="h-6 w-6" />
                <span className="text-xs font-medium">Ask Linq</span>
              </button>
              <button
                onClick={() => {
                  setMoreOpen(false);
                  signOut();
                }}
                className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-6 w-6" />
                <span className="text-xs font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <AssistantSheet open={linqOpen} onOpenChange={setLinqOpen} />

      {/* Bottom Tab Bar */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 border-t border-border/70 bg-card/95 backdrop-blur-md safe-area-bottom",
        showFabOverlay ? "z-[60]" : "z-40"
      )}>
        <div className="mx-auto flex h-[68px] max-w-lg items-stretch justify-around px-1">
          {tabs.map((tab) => {
            if (tab.label === "fab") {
              return (
                <button
                  key="fab"
                  onClick={() => handleTab(tab)}
                  aria-label="Create"
                  className={cn(
                    "relative -mt-7 flex h-[60px] w-[60px] items-center justify-center self-center rounded-full shadow-warm-lg transition-all duration-200 active:scale-95",
                    fabOpen || fabClosing
                      ? "bg-destructive text-destructive-foreground rotate-45"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {fabOpen || fabClosing ? (
                    <X className="h-7 w-7 -rotate-45" />
                  ) : (
                    <Plus className="h-7 w-7" />
                  )}
                </button>
              );
            }

            const active = tab.path === "__more" ? moreOpen : isActive(tab.path);
            return (
              <button
                key={tab.label}
                onClick={() => handleTab(tab)}
                className={cn(
                  "relative flex min-w-[60px] flex-1 flex-col items-center justify-center gap-1 pt-2 pb-1 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {/* Active indicator */}
                <span
                  className={cn(
                    "absolute top-0 h-[3px] w-7 rounded-full bg-primary transition-opacity duration-200",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
                <tab.icon className={cn("h-[22px] w-[22px]", active && "stroke-[2.4]")} />
                <span className="text-[11px] font-medium leading-none">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
