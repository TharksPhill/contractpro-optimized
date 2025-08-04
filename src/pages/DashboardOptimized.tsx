import React, { useState, Suspense, lazy, memo } from "react";
import { ContractProvider } from "@/context/ContractContext";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { Separator } from "@/components/ui/separator";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageActions from "@/components/PageActions";
import { useContracts } from "@/hooks/useContracts";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy load components for better performance
const AppSidebarModular = lazy(() => import("@/components/AppSidebarModular"));
const ContractForm = lazy(() => import("@/components/ContractForm"));
const ContractPreview = lazy(() => import("@/components/ContractPreview"));
const CompanyProfile = lazy(() => import("@/components/CompanyProfile"));
const ContractsList = lazy(() => import("@/components/ContractsList"));
const Statistics = lazy(() => import("@/components/Statistics"));
const SystemSettings = lazy(() => import("@/components/SystemSettings"));
const WelcomeGreeting = lazy(() => import("@/components/WelcomeGreeting"));
const QuickActionsCards = lazy(() => import("@/components/QuickActionsCards"));
const DashboardStats = lazy(() => import("@/components/DashboardStats"));
const DashboardCharts = lazy(() => import("@/components/DashboardCharts"));
const BrazilMap = lazy(() => import("@/components/BrazilMap"));
const RegionalAnalysis = lazy(() => import("@/components/RegionalAnalysis"));
const GeographicStatistics = lazy(() => import("@/components/GeographicStatistics"));
const Billing = lazy(() => import("@/components/Billing"));
const BankSlipManagement = lazy(() => import("@/components/BankSlipManagement"));
const ContractRenewals = lazy(() => import("@/components/ContractRenewals"));
const PlansManagement = lazy(() => import("@/components/PlansManagement"));
const ProductRegistration = lazy(() => import("@/components/ProductRegistration"));
const ProductProfitAnalysis = lazy(() => import("@/components/ProductProfitAnalysis"));
const RejectionReview = lazy(() => import("@/components/RejectionReview"));
const EmployeeCosts = lazy(() => import("@/components/EmployeeCosts"));
const EnhancedCompanyCosts = lazy(() => import("@/components/EnhancedCompanyCosts"));
const Prolabore = lazy(() => import("@/components/Prolabore"));
const ProfitAnalysis = lazy(() => import("@/components/ProfitAnalysis"));
const AdvancedProfitAnalysis = lazy(() => import("@/components/AdvancedProfitAnalysis"));
const CostPlanManagement = lazy(() => import("@/components/CostPlanManagement"));
const ChatManagement = lazy(() => import("@/pages/ChatManagement"));
const NotificationsManagement = lazy(() => import("@/pages/NotificationsManagement"));
const AdminManagement = lazy(() => import("@/pages/AdminManagement"));

// Loading component
const ComponentLoader = memo(() => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
));

const DashboardOptimized = memo(() => {
  const [activeView, setActiveView] = useState<string>("dashboard");
  const [editingContract, setEditingContract] = useState<any>(null);
  const { contracts, deleteContract } = useContracts();
  const isMobile = useIsMobile();

  const handleNewContract = () => {
    setEditingContract(null);
    setActiveView("create");
  };

  const handleEditContract = (contract: any) => {
    setEditingContract(contract);
    setActiveView("create");
  };

  const handleDeleteContract = async (id: string) => {
    await deleteContract(id);
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const renderMainContent = () => {
    const viewComponents: Record<string, React.ComponentType<any>> = {
      dashboard: () => (
        <div className="space-y-6">
          <Suspense fallback={<ComponentLoader />}>
            <WelcomeGreeting />
          </Suspense>
          <Suspense fallback={<ComponentLoader />}>
            <QuickActionsCards onNewContract={handleNewContract} />
          </Suspense>
          <Suspense fallback={<ComponentLoader />}>
            <DashboardStats />
          </Suspense>
          <Suspense fallback={<ComponentLoader />}>
            <DashboardCharts />
          </Suspense>
        </div>
      ),
      create: () => (
        <Suspense fallback={<ComponentLoader />}>
          <ContractForm 
            editingContract={editingContract} 
            onClose={() => setActiveView("contracts")} 
          />
        </Suspense>
      ),
      contracts: () => (
        <Suspense fallback={<ComponentLoader />}>
          <ContractsList
            onEditContract={handleEditContract}
            onDeleteContract={handleDeleteContract}
          />
        </Suspense>
      ),
      preview: () => (
        <Suspense fallback={<ComponentLoader />}>
          <ContractPreview />
        </Suspense>
      ),
      profile: () => (
        <Suspense fallback={<ComponentLoader />}>
          <CompanyProfile />
        </Suspense>
      ),
      statistics: () => (
        <Suspense fallback={<ComponentLoader />}>
          <Statistics />
        </Suspense>
      ),
      'system-settings': () => (
        <Suspense fallback={<ComponentLoader />}>
          <SystemSettings />
        </Suspense>
      )
    };

    const ViewComponent = viewComponents[activeView];
    return ViewComponent ? <ViewComponent /> : <div>Página não encontrada</div>;
  };

  return (
    <ProtectedRoute>
      <ContractProvider>
        <SidebarProvider>
          <div className="flex h-screen w-full">
            <Suspense fallback={<div className="w-80 bg-blue-800 animate-pulse" />}>
              <AppSidebarModular
                activeView={activeView}
                onViewChange={handleViewChange}
                onNewContract={handleNewContract}
              />
            </Suspense>
            
            <SidebarInset className="flex-1 flex flex-col">
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
                {isMobile && (
                  <>
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                  </>
                )}
                
                <div className="flex-1" />
                
                <div className="flex items-center gap-2">
                  <Suspense fallback={<div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />}>
                    <NotificationBell />
                  </Suspense>
                  <Suspense fallback={<div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />}>
                    <UserProfileDropdown />
                  </Suspense>
                </div>
              </header>

              <main className="flex-1 overflow-auto p-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                  <Suspense fallback={<ComponentLoader />}>
                    <PageActions activeView={activeView} />
                  </Suspense>
                  
                  <div className="mt-6">
                    {renderMainContent()}
                  </div>
                </div>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </ContractProvider>
    </ProtectedRoute>
  );
});

DashboardOptimized.displayName = "DashboardOptimized";

export default DashboardOptimized;