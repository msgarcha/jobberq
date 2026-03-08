import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Quotes from "./pages/Quotes";
import Invoices from "./pages/Invoices";
import Jobs from "./pages/Jobs";
import Schedule from "./pages/Schedule";
import Reports from "./pages/Reports";
import Services from "./pages/Services";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<Clients />} />
          <Route path="/clients/new" element={<Clients />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/quotes/new" element={<Quotes />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<Invoices />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/new" element={<Jobs />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/services" element={<Services />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
