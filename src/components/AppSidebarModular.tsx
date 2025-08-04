import React, { useState, useMemo, memo, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3, Bell, FileText, Home, Package, Settings, Shield, DollarSign,
  Globe, Map, ShoppingCart, Menu
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useContracts } from "@/hooks/useContracts";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";

const SidebarHeader = lazy(() => import("./sidebar/SidebarHeader"));
const SidebarMenu = lazy(() => import("./sidebar/SidebarMenu"));
const SidebarMenuItem = lazy(() => import("./sidebar/SidebarMenuItem"));
const SidebarStats = lazy(() => import("./sidebar/SidebarStats"));

interface AppSidebarModularProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onNewContract: () => void;
}

const AppSidebarModular = memo(({ activeView, onViewChange, onNewContract }: AppSidebarModularProps) => {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(["contracts"]));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toggleSidebar, state } = useSidebar();
  const { contracts } = useContracts();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";

  const stats = useMemo(() => {
    if (!contracts) return {
      mapStats: { totalStates: 0, totalCities: 0, totalContracts: 0 },
      billingStats: { totalRevenue: 0, activeContracts: 0 },
      signatureStats: { pendingSignatures: 0, totalSignatures: 0 },
      trialStats: { trialContracts: 0, expiringSoon: 0 },
      renewalStats: { renewalsNeeded: 0, expiringSoon: 0 }
    };
    
    const statesSet = new Set<string>();
    const citiesSet = new Set<string>();
    let totalContracts = 0;
    const activeContracts = contracts.filter(c => c.status !== "Inativo");
    const totalRevenue = activeContracts.reduce((sum, contract) => 
      sum + (parseFloat(contract.monthly_value || '0') * 12), 0);

    let pendingSignatures = 0;
    let totalSignatures = 0;
    let trialContracts = 0;
    let renewalsNeeded = 0;

    const now = new Date();
    
    contracts.forEach(contract => {
      if (contract.contractors) {
        contract.contractors.forEach((contractor: any) => {
          if (contractor.state) statesSet.add(contractor.state);
          if (contractor.city) citiesSet.add(contractor.city);
          totalContracts++;
        });
      }

      if (contract.signed_contracts && contract.signed_contracts.length > 0) {
        totalSignatures += contract.signed_contracts.length;
      } else {
        pendingSignatures++;
      }

      if (contract.status === "Período de Teste") {
        trialContracts++;
      }

      if (contract.renewal_date && contract.status === "Ativo") {
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        let renewalDate: Date | null = null;
        
        if (contract.renewal_date.includes('-')) {
          renewalDate = new Date(contract.renewal_date);
        } else if (contract.renewal_date.includes('/')) {
          const parts = contract.renewal_date.split('/');
          if (parts.length === 3) {
            renewalDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }

        if (renewalDate && !isNaN(renewalDate.getTime()) && 
            renewalDate <= thirtyDaysFromNow && renewalDate >= now) {
          renewalsNeeded++;
        }
      }
    });

    return {
      mapStats: { totalStates: statesSet.size, totalCities: citiesSet.size, totalContracts },
      billingStats: { totalRevenue, activeContracts: activeContracts.length },
      signatureStats: { pendingSignatures, totalSignatures },
      trialStats: { trialContracts, expiringSoon: 0 },
      renewalStats: { renewalsNeeded, expiringSoon: 0 }
    };
  }, [contracts]);

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => {
      const newExpanded = new Set<string>();
      if (!prev.has(menuKey)) {
        newExpanded.add(menuKey);
      }
      return newExpanded;
    });
  };

  const handleNavigation = (view: string) => {
    if (isMobile) setMobileOpen(false);
    
    const routeViews = {
      'dashboard': '/dashboard',
      'contract-signatures': '/contract-signatures', 
      'quote-generator': '/quote-generator',
      'tax-management': '/tax-management'
    };
    
    if (view in routeViews) {
      const targetRoute = routeViews[view as keyof typeof routeViews];
      if (view === 'dashboard') {
        onViewChange('dashboard');
        navigate(targetRoute, { replace: false });
      } else {
        navigate(targetRoute);
      }
    } else {
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard');
        setTimeout(() => onViewChange(view), 100);
      } else {
        onViewChange(view);
      }
    }
  };

  const isActive = (view: string) => {
    const routeViews = {
      'dashboard': '/dashboard',
      'contract-signatures': '/contract-signatures',
      'quote-generator': '/quote-generator',
      'tax-management': '/tax-management'
    };
    
    if (view in routeViews) {
      const targetRoute = routeViews[view as keyof typeof routeViews];
      return location.pathname === targetRoute || (view === 'dashboard' && location.pathname === '/');
    }
    
    return activeView === view;
  };

  const SidebarContentComponent = () => (
    <div className={`bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 border-r border-blue-600 h-full min-h-screen flex flex-col overflow-y-auto transition-all duration-300 relative ${
      isCollapsed && !isMobile ? 'w-16' : 'w-80'
    }`}>
      <Suspense fallback={<div className="h-20 bg-blue-700 animate-pulse" />}>
        <SidebarHeader 
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          onDashboardClick={() => handleNavigation("dashboard")}
          onToggleSidebar={toggleSidebar}
        />
      </Suspense>

      <div className="bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 p-3 flex-1 flex flex-col">
        {(!isCollapsed || isMobile) && (
          <div className="px-2 py-2">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-3">Menu Principal</p>
          </div>
        )}
        
        <div className="px-1 flex-1">
          <div className="space-y-1 p-2">
            <Button
              variant="ghost"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 w-full text-left justify-start bg-transparent ${
                isCollapsed ? 'px-2' : ''
              } ${
                isActive("dashboard") ? "text-white" : "text-white hover:text-blue-100 hover:bg-transparent"
              }`}
              onClick={() => handleNavigation("dashboard")}
              title={isCollapsed && !isMobile ? "Dashboard" : undefined}
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              {(!isCollapsed || isMobile) && <span>Dashboard</span>}
            </Button>

            <Suspense fallback={<div className="h-12 bg-blue-800/20 rounded animate-pulse" />}>
              <SidebarMenu
                icon={FileText}
                label="Contratos"
                isExpanded={expandedMenus.has("contracts")}
                hasActiveChild={isActive("contracts") || isActive("create")}
                onToggle={() => toggleMenu("contracts")}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
              >
                <div className="space-y-1 p-2 ml-2">
                  <SidebarMenuItem
                    label="Listar Contratos"
                    isActive={isActive("contracts")}
                    onClick={() => handleNavigation("contracts")}
                  />
                  <SidebarMenuItem
                    label="Criar Contrato"
                    isActive={isActive("create")}
                    onClick={onNewContract}
                  />
                  <SidebarMenuItem
                    label="Assinaturas"
                    isActive={isActive("contract-signatures")}
                    onClick={() => handleNavigation("contract-signatures")}
                    badge={stats.signatureStats.pendingSignatures > 0 ? (
                      <div className="bg-orange-500/20 text-orange-100 text-xs px-2 py-0.5 rounded">
                        {stats.signatureStats.pendingSignatures}
                      </div>
                    ) : undefined}
                  />
                </div>
              </SidebarMenu>
            </Suspense>

            <Suspense fallback={<div className="h-12 bg-blue-800/20 rounded animate-pulse" />}>
              <SidebarMenu
                icon={DollarSign}
                label="Financeiro"
                isExpanded={expandedMenus.has("financial")}
                hasActiveChild={isActive("billing") || isActive("tax-management")}
                onToggle={() => toggleMenu("financial")}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
              >
                <div className="space-y-1 p-2 ml-2">
                  <SidebarMenuItem
                    label="Faturamento"
                    isActive={isActive("billing")}
                    onClick={() => handleNavigation("billing")}
                    badge={
                      <div className="bg-green-500/20 text-green-100 text-xs px-2 py-0.5 rounded">
                        {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          notation: 'compact'
                        }).format(stats.billingStats.totalRevenue)}
                      </div>
                    }
                  />
                  <SidebarMenuItem
                    label="Gestão de Impostos"
                    isActive={isActive("tax-management")}
                    onClick={() => handleNavigation("tax-management")}
                  />
                </div>
              </SidebarMenu>
            </Suspense>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-b from-blue-800 to-blue-900 border-t border-blue-600 flex-shrink-0">
        <div className="p-4 text-center">
          {(!isCollapsed || isMobile) ? (
            <p className="text-xs text-blue-200">
              &copy; {new Date().getFullYear()} - Todos os direitos reservados
            </p>
          ) : (
            <div className="flex justify-center">
              <span className="text-xs text-blue-200 transform -rotate-90 whitespace-nowrap">
                &copy; {new Date().getFullYear()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <SidebarContentComponent />
        </SheetContent>
      </Sheet>
    );
  }

  return <SidebarContentComponent />;
});

AppSidebarModular.displayName = "AppSidebarModular";

export default AppSidebarModular;