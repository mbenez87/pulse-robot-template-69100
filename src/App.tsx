import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateDoc from "./pages/CreateDoc";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Documents from "./pages/Documents";
import DocumentDetail from "./pages/DocumentDetail";
import RegisterBilling from "./pages/RegisterBilling";
import Team from "./pages/Team";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ARIA from "./pages/ARIA";
import Search from "./pages/Search";
import Knowledge from "./pages/Knowledge";
import Platform from "./pages/Platform";
import Contracts from "./pages/Contracts";
import { AuthGate } from "./components/AuthGate";
import { AppLayout } from "./components/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthGate>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<AppLayout />}>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/platform" element={<Platform />} />
              <Route path="/aria" element={<ARIA />} />
              <Route path="/privacy" element={<div>Privacy Policy</div>} />
              <Route path="/terms" element={<div>Terms of Service</div>} />
              
              {/* Protected Routes - AuthGate handles protection */}
              <Route path="/documents" element={<Documents />} />
              <Route path="/search" element={<Search />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/dashboard" element={<Documents />} />
              <Route path="/documents/:id" element={<DocumentDetail />} />
              <Route path="/register" element={<RegisterBilling />} />
              <Route path="/team" element={<Team />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/create-doc" element={<CreateDoc />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthGate>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
