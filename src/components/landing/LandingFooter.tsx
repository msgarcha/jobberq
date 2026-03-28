export default function LandingFooter() {
  return (
    <footer className="border-t border-border/50 py-12 px-4 sm:px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs font-display">QL</div>
              <span className="font-bold font-display">ServicePro</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The all-in-one platform for service businesses. Clients, quotes, invoices, scheduling, and payments.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 font-display">Product</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-foreground transition-colors">Features</button></li>
              <li><button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-foreground transition-colors">Pricing</button></li>
              <li><button onClick={() => document.getElementById("industries")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-foreground transition-colors">Industries</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 font-display">Industries</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>Landscaping</li>
              <li>Plumbing</li>
              <li>Electrical</li>
              <li>Cleaning</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 font-display">Company</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>About</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Contact</li>
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
