import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Login } from "./pages/login";
import { AdminDashboard } from "./pages/admin/dashboard";
import { UsersManagement } from "./pages/admin/users";
import { MobileHome } from "./pages/mobile/home";
import { MobileProjectDetail } from "./pages/mobile/project-detail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, requiredType }: { children: React.ReactNode, requiredType?: "admin" | "implantador" }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log("[PROTECTED ROUTE] Checking access:", { 
      path: location.pathname, 
      user: user?.email, 
      tipo: user?.tipo, 
      required: requiredType,
      loading 
    });
  }, [user, loading, location.pathname, requiredType]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-wine-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-medium-gray">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("[PROTECTED ROUTE] No user, redirecting to login");
    return <Navigate to="/" replace />;
  }

  if (requiredType && user.tipo !== requiredType) {
    console.log("[PROTECTED ROUTE] Wrong user type, redirecting:", { userType: user.tipo, required: requiredType });
    if (user.tipo === "admin") {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/mobile" replace />;
    }
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute requiredType="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredType="admin">
              <UsersManagement />
            </ProtectedRoute>
          } />
          <Route path="/mobile" element={
            <ProtectedRoute requiredType="implantador">
              <MobileHome />
            </ProtectedRoute>
          } />
          <Route path="/mobile/project/:id" element={
            <ProtectedRoute requiredType="implantador">
              <MobileProjectDetail />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
