
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MissionProvider } from "./contexts/MissionContext";
import { AuthProvider } from "./contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { setGlobalToast } from "./utils/errorHandler";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Missions from "./pages/Missions";
import MissionDetail from "./pages/MissionDetail";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import { KnowledgeBase } from "./pages/KnowledgeBase";
import { KnowledgeBaseDetail } from "./pages/KnowledgeBaseDetail";
import CodeAgent from "./pages/CodeAgent";
import AgentDetail from "./pages/AgentDetail";
import { useEffect } from "react";

const queryClient = new QueryClient();

const AppInner = () => {
  const { toast } = useToast();
  
  useEffect(() => {
    // Set up global error handling
    setGlobalToast(toast);
  }, [toast]);
  
  return (
    <AuthProvider>
      <MissionProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<Layout><Index /></Layout>} />
            <Route path="/missions" element={<Layout><Missions /></Layout>} />
            <Route path="/missions/:id" element={<MissionDetail />} />
            <Route path="/knowledge-base" element={<Layout><KnowledgeBase /></Layout>} />
            <Route path="/knowledge-base/:id" element={<Layout><KnowledgeBaseDetail /></Layout>} />
            <Route path="/code" element={<Layout><CodeAgent /></Layout>} />
            <Route path="/code/agent/:agentId" element={<Layout><AgentDetail /></Layout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </BrowserRouter>
      </MissionProvider>
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppInner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
