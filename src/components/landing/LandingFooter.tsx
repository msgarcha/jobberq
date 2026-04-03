import { useNavigate } from "react-router-dom";
import QuickLinqLogo from "@/components/QuickLinqLogo";

export default function LandingFooter() {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="border-t border-border/50 py-12 px-4 sm:px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 sm:col-span-1">
            <div className="mb-3">
              <QuickLinqLogo size={28} type="full" variant="dark" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Send Quotes. Win Jobs. Get Paid. The all-in-one platform for service businesses.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 font-display">Product</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><button onClick={() => scrollTo("features")} className="hover:text-foreground transition-colors">Features</button></li>
              <li><button onClick={() => scrollTo("pricing")} className="hover:text-foreground transition-colors">Pricing</button></li>
              <li><button onClick={() => navigate("/how-it-works")} className="hover:text-foreground transition-colors">How It Works</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 font-display">Industries</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><button onClick={() => scrollTo("industries")} className="hover:text-foreground transition-colors">Landscaping</button></li>
              <li><button onClick={() => scrollTo("industries")} className="hover:text-foreground transition-colors">Plumbing</button></li>
              <li><button onClick={() => scrollTo("industries")} className="hover:text-foreground transition-colors">Electrical</button></li>
              <li><button onClick={() => scrollTo("industries")} className="hover:text-foreground transition-colors">Cleaning</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 font-display">Company</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><button onClick={() => navigate("/how-it-works")} className="hover:text-foreground transition-colors">About</button></li>
              <li><button onClick={() => navigate("/landing")} className="hover:text-foreground transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => navigate("/landing")} className="hover:text-foreground transition-colors">Terms of Service</button></li>
              <li><a href="mailto:support@quicklinq.com" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/50 pt-6 text-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} QuickLinq. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
