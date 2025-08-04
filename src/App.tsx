import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";

import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import EmployeeCosts from "@/components/EmployeeCosts";
import EnhancedCompanyCosts from "@/components/EnhancedCompanyCosts";
import TaxManagementPage from "@/pages/TaxManagement";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/employee-costs"
            element={
              <RequireAuth>
                <EmployeeCosts />
              </RequireAuth>
            }
          />
          <Route
            path="/company-costs"
            element={
              <RequireAuth>
                <EnhancedCompanyCosts />
              </RequireAuth>
            }
          />
          <Route path="/tax-management" element={<TaxManagementPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}

export default App;
