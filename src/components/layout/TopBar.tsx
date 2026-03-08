import { Bell, Plus, Search, Users, FileText, Receipt, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function TopBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Keyboard shortcut: Ctrl/Cmd + N to open Create menu
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
        <DropdownMenu>
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

        <Button variant="ghost" size="icon" className="relative rounded-lg">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-status-danger" />
        </Button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          {initials}
        </div>
      </div>
    </header>
  );
}
