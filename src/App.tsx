import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = lazy(() => import("@/pages/DashboardOptimized"));
const Auth = lazy(() => import("@/pages/Auth"));
const EmployeeCosts = lazy(() => import("@/components/EmployeeCosts"));
const EnhancedCompanyCosts = lazy(() => import("@/components/EnhancedCompanyCosts"));
const TaxManagementPage = lazy(() => import("@/pages/TaxManagement"));

const queryClient = new QueryClient();

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
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
        </Suspense>
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
