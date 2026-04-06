import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthGuard from "./components/AuthGuard";
import { AuthProvider } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";

// Eager-load lightweight pages
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy-load heavy pages
const Index = lazy(() => import("./pages/Index"));
const ScriptEditor = lazy(() => import("./pages/ScriptEditor"));
const Profile = lazy(() => import("./pages/Profile"));
const CallSheet = lazy(() => import("./pages/CallSheet"));
const SceneBreakdown = lazy(() => import("./pages/SceneBreakdown"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Careers = lazy(() => import("./pages/Careers"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-background">
    <Loader2 className="animate-spin text-primary" size={32} />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/login" element={<Login />} />

                  {/* Protected Routes */}
                  <Route path="/dashboard" element={<AuthGuard><Index /></AuthGuard>} />
                  <Route path="/editor" element={<AuthGuard><ScriptEditor /></AuthGuard>} />
                  <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
                  <Route path="/call-sheet" element={<AuthGuard><CallSheet /></AuthGuard>} />
                  <Route path="/breakdown" element={<AuthGuard><SceneBreakdown /></AuthGuard>} />

                  <Route path="/about-us" element={<AboutUs />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/admin" element={<AuthGuard><Admin /></AuthGuard>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
