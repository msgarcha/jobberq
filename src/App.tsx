import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { SuperAdminRoute } from "@/components/SuperAdminRoute";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import ClientForm from "./pages/ClientForm";
import Quotes from "./pages/Quotes";
import QuoteForm from "./pages/QuoteForm";
import QuoteDetail from "./pages/QuoteDetail";
import Invoices from "./pages/Invoices";
import InvoiceForm from "./pages/InvoiceForm";
import InvoiceDetail from "./pages/InvoiceDetail";
import InvoicePrint from "./pages/InvoicePrint";
import Jobs from "./pages/Jobs";
import JobForm from "./pages/JobForm";
import JobDetail from "./pages/JobDetail";
import Pipeline from "./pages/Pipeline";
import Projects from "./pages/Projects";
import Schedule from "./pages/Schedule";
import Reports from "./pages/Reports";
import Services from "./pages/Services";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import QuotePrint from "./pages/QuotePrint";
import Onboarding from "./pages/Onboarding";
import AcceptInvite from "./pages/AcceptInvite";
import Reviews from "./pages/Reviews";
import ReviewForm from "./pages/ReviewForm";
import ImportData from "./pages/ImportData";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";
import PublicInvoicePay from "./pages/PublicInvoicePay";
import PublicQuoteView from "./pages/PublicQuoteView";
import Unsubscribe from "./pages/Unsubscribe";
import ConnectDashboard from "./pages/ConnectDashboard";
import ConnectSuccess from "./pages/ConnectSuccess";
import HowItWorks from "./pages/HowItWorks";
import Features from "./pages/Features";
import PricingForms from "./pages/PricingForms";
import PricingFormBuilder from "./pages/PricingFormBuilder";
import PublicPricingForm from "./pages/PublicPricingForm";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Dpa from "./pages/Dpa";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/features" element={<Features />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/dpa" element={<Dpa />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/review/:token" element={<ReviewForm />} />
            <Route path="/r/:token" element={<ReviewForm />} />
            <Route path="/pay/:invoiceId" element={<PublicInvoicePay />} />
            <Route path="/quote/view/:quoteId" element={<PublicQuoteView />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/book/:slug" element={<PublicPricingForm />} />

            {/* Onboarding (auth required, no company_settings check) */}
            <Route path="/onboarding" element={<ProtectedRoute skipOnboardingCheck><Onboarding /></ProtectedRoute>} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/clients/new" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
            <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
            <Route path="/clients/:id/edit" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
            <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
            <Route path="/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
            <Route path="/quotes/new" element={<ProtectedRoute><QuoteForm /></ProtectedRoute>} />
            <Route path="/quotes/:id" element={<ProtectedRoute><QuoteDetail /></ProtectedRoute>} />
            <Route path="/quotes/:id/edit" element={<ProtectedRoute><QuoteForm /></ProtectedRoute>} />
            <Route path="/quotes/:id/print" element={<ProtectedRoute><QuotePrint /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/invoices/new" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
            <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
            <Route path="/invoices/:id/edit" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
            <Route path="/invoices/:id/print" element={<ProtectedRoute><InvoicePrint /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/jobs/new" element={<ProtectedRoute><JobForm /></ProtectedRoute>} />
            <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
            <Route path="/jobs/:id/edit" element={<ProtectedRoute><JobForm /></ProtectedRoute>} />
            <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
            <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
            <Route path="/import" element={<ProtectedRoute><ImportData /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowExpired><Settings /></ProtectedRoute>} />
            <Route path="/settings/pricing-forms" element={<ProtectedRoute><PricingForms /></ProtectedRoute>} />
            <Route path="/settings/pricing-forms/:id" element={<ProtectedRoute><PricingFormBuilder /></ProtectedRoute>} />
            <Route path="/connect" element={<ProtectedRoute><ConnectDashboard /></ProtectedRoute>} />
            <Route path="/connect/success" element={<ProtectedRoute><ConnectSuccess /></ProtectedRoute>} />
            <Route path="/connect/storefront" element={<ProtectedRoute><ConnectDashboard /></ProtectedRoute>} />
            <Route path="/super-admin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
