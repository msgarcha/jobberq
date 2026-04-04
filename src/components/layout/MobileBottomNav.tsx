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
} from "lucide-react";
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
  const { signOut } = useAuth();
  const [fabOpen, setFabOpen] = useState(false);
  const [fabClosing, setFabClosing] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const closingTimeout = useRef<ReturnType<typeof setTimeout>>();

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

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t safe-area-bottom">
        <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-1">
          {tabs.map((tab) => {
            if (tab.label === "fab") {
              return (
                <button
                  key="fab"
                  onClick={() => handleTab(tab)}
                  className={cn(
                    "relative -mt-7 flex h-[60px] w-[60px] items-center justify-center rounded-full shadow-warm-lg transition-all duration-200 active:scale-95",
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
                  "flex flex-col items-center gap-1 py-2 px-3 min-w-[60px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className="h-6 w-6" />
                <span className="text-[11px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
