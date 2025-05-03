import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AuthRoute from "@/components/AuthRoute";
import Collections from "./pages/Collections";
import Schedules from "./pages/Schedules";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Navbar from "@/components/Navbar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <AuthRoute>
                <Navbar />
                <Index />
              </AuthRoute>
            } />
            <Route path="/collections" element={
              <AuthRoute>
                <Navbar />
                <Collections />
              </AuthRoute>
            } />
            <Route path="/schedules" element={
              <AuthRoute>
                <Navbar />
                <Schedules />
              </AuthRoute>
            } />
            <Route path="/history" element={
              <AuthRoute>
                <Navbar />
                <History />
              </AuthRoute>
            } />
            <Route path="/profile" element={
              <AuthRoute>
                <Navbar />
                <Profile />
              </AuthRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
