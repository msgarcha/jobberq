import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import QuickLinqLogo from "@/components/QuickLinqLogo";
import { cn } from "@/lib/utils";

export default function LandingNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const goAnchor = (id: string) => {
    if (location.pathname === "/landing" || location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/landing#${id}`);
    }
  };

  const linkClass = "hover:text-foreground transition-colors";
  const activeClass = "text-foreground font-semibold";

  return (
    <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={() => navigate("/landing")} className="flex items-center" aria-label="QuickLinq home">
          <QuickLinqLogo size={28} type="full" variant="dark" />
        </button>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <NavLink to="/features" className={({ isActive }) => cn(linkClass, isActive && activeClass)}>All Features</NavLink>
          <button onClick={() => goAnchor("industries")} className={linkClass}>Industries</button>
          <button onClick={() => goAnchor("pricing")} className={linkClass}>Pricing</button>
          <NavLink to="/how-it-works" className={({ isActive }) => cn(linkClass, isActive && activeClass)}>How It Works</NavLink>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="hidden sm:inline-flex">
            Log In
          </Button>
          <Button size="sm" onClick={() => navigate("/login")} className="gap-1 hidden sm:inline-flex">
            Get Started <ArrowRight className="h-3.5 w-3.5" />
          </Button>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-1 text-base">
                <SheetClose asChild>
                  <NavLink to="/features" className="py-3 px-2 rounded-md hover:bg-muted">All Features</NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <button onClick={() => { setOpen(false); goAnchor("industries"); }} className="text-left py-3 px-2 rounded-md hover:bg-muted">Industries</button>
                </SheetClose>
                <SheetClose asChild>
                  <button onClick={() => { setOpen(false); goAnchor("pricing"); }} className="text-left py-3 px-2 rounded-md hover:bg-muted">Pricing</button>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/how-it-works" className="py-3 px-2 rounded-md hover:bg-muted">How It Works</NavLink>
                </SheetClose>
                <div className="mt-4 border-t border-border/50 pt-4 flex flex-col gap-2">
                  <Button variant="outline" onClick={() => { setOpen(false); navigate("/login"); }}>Log In</Button>
                  <Button onClick={() => { setOpen(false); navigate("/login"); }} className="gap-1">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
