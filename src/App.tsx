
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
import HomePage from "./pages/HomePage";
import MissionDetail from "./pages/MissionDetail";
import NewMission from "./pages/NewMission";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import UseCases from "./pages/UseCases";
import {
  LanguageHomePage,
  LanguageHistoryPage,
  PracticeCreatePage,
  PracticePreviewPage,
  PracticeSessionPage,
  PracticeSummaryPage,
} from "./pages/language";
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
            <Route path="/" element={<HomePage />} />
            <Route path="/chat" element={<NewMission />} />
            <Route path="/missions/:id" element={<MissionDetail />} />
            <Route path="/use-cases" element={<Layout><UseCases /></Layout>} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/language" element={<LanguageHomePage />} />
            <Route path="/language/practice/new" element={<PracticeCreatePage />} />
            <Route path="/language/practice/:scriptId" element={<PracticePreviewPage />} />
            <Route path="/language/practice/:scriptId/session" element={<PracticeSessionPage />} />
            <Route path="/language/practice/:scriptId/summary" element={<PracticeSummaryPage />} />
            <Route path="/language/practice" element={<Navigate to="/language/practice/new" replace />} />
            <Route path="/language/history" element={<LanguageHistoryPage />} />
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
