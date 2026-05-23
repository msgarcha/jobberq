import { ReactNode } from "react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import Seo from "@/components/Seo";

interface Section {
  id: string;
  title: string;
}

interface LegalLayoutProps {
  title: string;
  description: string;
  path: string;
  lastUpdated: string;
  version: string;
  intro: ReactNode;
  sections: Section[];
  children: ReactNode;
}

export default function LegalLayout({
  title,
  description,
  path,
  lastUpdated,
  version,
  intro,
  sections,
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Seo title={`${title} — QuickLinq`} description={description} path={path} />
      <LandingNav />
      <main className="px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <header className="mb-8 sm:mb-12">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Legal</p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated} &middot; Version {version}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <a
                href={`${path}.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                View plain-HTML version
              </a>
            </p>
          </header>


          <div className="text-sm text-foreground/90 leading-relaxed mb-10">{intro}</div>

          {sections.length > 0 && (
            <nav
              aria-label="Contents"
              className="mb-12 rounded-lg border border-border/60 bg-muted/30 p-4 sm:p-5"
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Contents</p>
              <ol className="text-sm space-y-1.5 list-decimal list-inside marker:text-muted-foreground">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="hover:text-primary transition-colors">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <article className="prose prose-sm sm:prose-base max-w-none prose-headings:font-display prose-headings:tracking-tight prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-base sm:prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-p:leading-relaxed prose-p:text-foreground/90 prose-li:text-foreground/90 prose-a:text-primary prose-strong:text-foreground">
            {children}
          </article>

          <div className="mt-16 pt-8 border-t border-border/60 text-xs text-muted-foreground">
            <p className="mb-2">
              QuickLinq is a product operated by <strong className="text-foreground">Quiresoft Technologies Inc.</strong>.
            </p>
            <p>
              See also our{" "}
              <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link>,{" "}
              <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>, and{" "}
              <Link to="/dpa" className="underline hover:text-foreground">Data Processing Addendum</Link>.
            </p>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
