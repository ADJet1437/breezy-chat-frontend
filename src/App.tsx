
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MissionProvider } from "./contexts/MissionContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { setGlobalToast } from "./utils/errorHandler";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Missions from "./pages/Missions";
import MissionDetail from "./pages/MissionDetail";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import CodeAgent from "./pages/CodeAgent";
import CodeAgentChat from "./pages/CodeAgentChat";
import AgentDetail from "./pages/AgentDetail";
import Home from "./pages/Home";
import { useEffect } from "react";

const queryClient = new QueryClient();

const AppInner = () => {
  const { toast } = useToast();
  
  useEffect(() => {
    // Set up global error handling
    setGlobalToast(toast);
  }, [toast]);
  
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <MissionProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<Layout><Index /></Layout>} />
            <Route path="/missions" element={<Layout><Missions /></Layout>} />
            <Route path="/missions/:id" element={<MissionDetail />} />
            <Route path="/code" element={<Layout><CodeAgent /></Layout>} />
            <Route path="/code/projects" element={<Layout><CodeAgent /></Layout>} />
            <Route path="/code/agent/:agentId" element={<Layout><AgentDetail /></Layout>} />
            <Route path="/home" element={<Home />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
          </MissionProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
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
