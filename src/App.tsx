import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import Index from "./pages/Index";
import Contracts from "./pages/Contracts";
import Customers from "./pages/Customers";
import Vehicles from "./pages/Vehicles";
import Reports from "./pages/Reports";
import Repairs from "./pages/Repairs";
import Expenses from "./pages/Expenses";
import Recette from "./pages/Recette";
import SignContract from "./pages/SignContract";
import NotFound from "./pages/NotFound";
import Factures from "./pages/Factures";
import Settings from "./pages/Settings";
import Cheques from "./pages/Cheques";
import Tresorerie from "./pages/Tresorerie";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider delayDuration={300}>
          <Routes>
            {/* Public route for contract signing */}
            <Route path="/sign/:token" element={<SignContract />} />
            
            {/* Protected routes with sidebar */}
            <Route path="/*" element={
              <SidebarProvider>
                <div className="min-h-screen flex w-full bg-background">
                  <AppSidebar />
                  <div className="flex-1 flex flex-col">
                    <TopHeader />
                    <main className="flex-1 p-3 sm:p-6">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/contracts" element={<Contracts />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/vehicles" element={<Vehicles />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/repairs" element={<Repairs />} />
                        <Route path="/recette" element={<Recette />} />
                        <Route path="/expenses" element={<Expenses />} />
                        <Route path="/factures" element={<Factures />} />
                        <Route path="/cheques" element={<Cheques />} />
                        <Route path="/tresorerie" element={<Tresorerie />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
                <Toaster />
                <Sonner />
              </SidebarProvider>
            } />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
