import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MissionProvider } from "./contexts/MissionContext";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import AuthLayout from "./components/auth/AuthLayout";
import GoogleAuthLogin from "./components/auth/GoogleAuthLogin";
import GoogleAuthCallback from "./components/auth/GoogleAuthCallback";
import AuthLoadingScreen from "./components/auth/AuthLoadingScreen";
import AuthDashboard from "./components/auth/AuthDashboard";
import AuthErrorDisplay from "./components/auth/AuthErrorDisplay";
import Index from "./pages/Index";
import Missions from "./pages/Missions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <MissionProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Main App Routes */}
              <Route path="/" element={<Layout><Index /></Layout>} />
              <Route path="/missions" element={<Layout><Missions /></Layout>} />
              
              {/* Authentication Routes */}
              <Route path="/auth" element={<AuthLayout />}>
                <Route path="login" element={<GoogleAuthLogin />} />
                <Route path="loading" element={<AuthLoadingScreen />} />
                <Route path="dashboard" element={<AuthDashboard />} />
                <Route path="error" element={<AuthErrorDisplay />} />
                <Route path="callback" element={<GoogleAuthCallback />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </MissionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
