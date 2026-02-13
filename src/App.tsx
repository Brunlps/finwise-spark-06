import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FinanceProvider } from "@/contexts/FinanceContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Extrato from "@/pages/Extrato";
import Importacao from "@/pages/Importacao";
import Configuracoes from "@/pages/Configuracoes";
import Relatorios from "@/pages/Relatorios";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
    <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
    <Route path="/extrato" element={<ProtectedRoute><AppLayout><Extrato /></AppLayout></ProtectedRoute>} />
    <Route path="/importacao" element={<ProtectedRoute><AppLayout><Importacao /></AppLayout></ProtectedRoute>} />
    <Route path="/configuracoes" element={<ProtectedRoute><AppLayout><Configuracoes /></AppLayout></ProtectedRoute>} />
    <Route path="/relatorios" element={<ProtectedRoute><AppLayout><Relatorios /></AppLayout></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <FinanceProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </FinanceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
