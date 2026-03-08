import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  Receipt,
  Calendar,
  BarChart3,
  Settings,
  Wrench,
  LogOut,
  Kanban,
  FolderOpen,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Quotes", url: "/quotes", icon: FileText },
  { title: "Jobs", url: "/jobs", icon: Briefcase },
  { title: "Pipeline", url: "/pipeline", icon: Kanban },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Invoices", url: "/invoices", icon: Receipt },
  { title: "Schedule", url: "/schedule", icon: Calendar },
];

const secondaryNav = [
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Services", url: "/services", icon: Wrench },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground font-display font-bold text-sm">
            SP
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-lg text-sidebar-accent-foreground tracking-tight">
              ServicePro
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/60 transition-colors rounded-lg"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2.5 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest">Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/60 transition-colors rounded-lg"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2.5 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-sidebar-primary text-xs font-semibold">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{displayName}</p>
              <button
                onClick={signOut}
                className="flex items-center gap-1 text-[10px] text-sidebar-foreground/60 hover:text-sidebar-primary transition-colors"
              >
                <LogOut className="h-2.5 w-2.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
