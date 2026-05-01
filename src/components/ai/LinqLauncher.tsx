import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AssistantSheet } from "./AssistantSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * Global floating "Ask Linq" launcher.
 * Mounted once in DashboardLayout — visible on every authenticated page.
 * Sits above the mobile bottom nav (96px) and bottom-right on desktop.
 */
export function LinqLauncher() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      <button
        type="button"
        aria-label="Ask Linq AI assistant"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed z-40 right-4 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-warm-lg active:scale-95 transition-all hover:shadow-xl",
          isMobile
            ? "bottom-24 h-12 w-12 justify-center"
            : "bottom-6 px-4 h-12"
        )}
      >
        <Sparkles className="h-5 w-5" />
        {!isMobile && <span className="font-medium text-sm">Ask Linq</span>}
      </button>
      <AssistantSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
