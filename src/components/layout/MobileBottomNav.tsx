import { useState, useEffect, useCallback } from "react";
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
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const closeAll = useCallback(() => {
    setFabOpen(false);
    setMoreOpen(false);
  }, []);

  // Close overlays on route change
  useEffect(() => {
    closeAll();
  }, [location.pathname, closeAll]);

  const handleTab = (tab: typeof tabs[0]) => {
    if (tab.label === "fab") {
      setMoreOpen(false);
      setFabOpen((p) => !p);
    } else if (tab.path === "__more") {
      setFabOpen(false);
      setMoreOpen((p) => !p);
    } else {
      closeAll();
      navigate(tab.path);
    }
  };

  return (
    <>
      {/* FAB Overlay */}
      {fabOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setFabOpen(false)}>
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm animate-fade-in" />
          <div className="relative z-10 w-full max-w-sm px-6 pb-28 space-y-3" onClick={(e) => e.stopPropagation()}>
            {fabActions.map((action, i) => (
              <button
                key={action.label}
                onClick={() => {
                  setFabOpen(false);
                  navigate(action.path);
                }}
                className="flex items-center gap-3 w-full rounded-2xl bg-card px-5 py-4 shadow-warm-lg text-foreground font-medium text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  animation: `fab-stagger 0.25s ease-out ${i * 60}ms both`,
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <action.icon className="h-5 w-5" />
                </div>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* More Overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative z-10 w-full bg-card rounded-t-3xl shadow-warm-lg pb-24 pt-4 px-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
            <div className="grid grid-cols-4 gap-2">
              {moreItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setMoreOpen(false);
                    navigate(item.path);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-colors",
                    isActive(item.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  setMoreOpen(false);
                  signOut();
                }}
                className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-[11px] font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {tabs.map((tab) => {
            if (tab.label === "fab") {
              return (
                <button
                  key="fab"
                  onClick={() => handleTab(tab)}
                  className={cn(
                    "relative -mt-6 flex h-14 w-14 items-center justify-center rounded-full shadow-warm-lg transition-all active:scale-95",
                    fabOpen
                      ? "bg-destructive text-destructive-foreground rotate-45"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {fabOpen ? <X className="h-6 w-6 -rotate-45" /> : <Plus className="h-6 w-6" />}
                </button>
              );
            }

            const active = tab.path === "__more" ? moreOpen : isActive(tab.path);
            return (
              <button
                key={tab.label}
                onClick={() => handleTab(tab)}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 min-w-[56px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
