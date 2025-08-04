import React, { useState, useMemo, memo, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3, Bell, FileText, Home, Package, Settings, Shield, DollarSign,
  Globe, Map, ShoppingCart, Menu, User, Receipt, Clock, TrendingUp
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
    let trialExpiringSoon = 0;
    let renewalsNeeded = 0;
    let renewalsExpiringSoon = 0;

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
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
        
        if (contract.end_date) {
          const endDate = new Date(contract.end_date);
          if (endDate <= sevenDaysFromNow && endDate >= now) {
            trialExpiringSoon++;
          }
        }
      }

      if (contract.renewal_date && contract.status === "Ativo") {
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
          if (renewalDate <= sevenDaysFromNow) {
            renewalsExpiringSoon++;
          }
        }
      }
    });

    return {
      mapStats: { totalStates: statesSet.size, totalCities: citiesSet.size, totalContracts },
      billingStats: { totalRevenue, activeContracts: activeContracts.length },
      signatureStats: { pendingSignatures, totalSignatures },
      trialStats: { trialContracts, expiringSoon: trialExpiringSoon },
      renewalStats: { renewalsNeeded, expiringSoon: renewalsExpiringSoon }
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
                hasActiveChild={isActive("contracts") || isActive("create") || isActive("trial-contracts") || isActive("contract-signatures") || isActive("rejection-review") || isActive("contract-renewals")}
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
                    label="Renovações"
                    isActive={isActive("contract-renewals")}
                    onClick={() => handleNavigation("contract-renewals")}
                    badge={stats.renewalStats.renewalsNeeded > 0 ? (
                      <div className="flex gap-1">
                        <div className="bg-orange-500/20 text-orange-100 text-xs px-2 py-0.5 rounded">
                          {stats.renewalStats.renewalsNeeded}
                        </div>
                        {stats.renewalStats.expiringSoon > 0 && (
                          <div className="bg-red-500/20 text-red-100 text-xs px-1 py-0.5 rounded">
                            !
                          </div>
                        )}
                      </div>
                    ) : undefined}
                  />
                  <SidebarMenuItem
                    label="Período de Teste"
                    isActive={isActive("trial-contracts")}
                    onClick={() => handleNavigation("trial-contracts")}
                    badge={stats.trialStats.trialContracts > 0 ? (
                      <div className="flex gap-1">
                        <div className="bg-orange-500/20 text-orange-100 text-xs px-2 py-0.5 rounded">
                          {stats.trialStats.trialContracts}
                        </div>
                        {stats.trialStats.expiringSoon > 0 && (
                          <div className="bg-red-500/20 text-red-100 text-xs px-1 py-0.5 rounded">
                            !
                          </div>
                        )}
                      </div>
                    ) : undefined}
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
                  <SidebarMenuItem
                    label="Revisão de Rejeições"
                    isActive={isActive("rejection-review")}
                    onClick={() => handleNavigation("rejection-review")}
                  />
                </div>
              </SidebarMenu>
            </Suspense>

            <Suspense fallback={<div className="h-12 bg-blue-800/20 rounded animate-pulse" />}>
              <SidebarMenu
                icon={DollarSign}
                label="Financeiro"
                isExpanded={expandedMenus.has("financial")}
                hasActiveChild={isActive("billing") || isActive("employee-costs") || isActive("company-costs") || isActive("tax-management") || isActive("bank-slip-management") || isActive("prolabore") || isActive("cost-plan-management") || isActive("profit-analysis")}
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
                    label="Custos de Funcionários"
                    isActive={isActive("employee-costs")}
                    onClick={() => handleNavigation("employee-costs")}
                  />
                  <SidebarMenuItem
                    label="Custos da Empresa"
                    isActive={isActive("company-costs")}
                    onClick={() => handleNavigation("company-costs")}
                  />
                  <SidebarMenuItem
                    label="Gestão de Impostos"
                    isActive={isActive("tax-management")}
                    onClick={() => handleNavigation("tax-management")}
                    badge={<Receipt className="h-4 w-4 flex-shrink-0" />}
                  />
                  <SidebarMenuItem
                    label="Valor do Boleto"
                    isActive={isActive("bank-slip-management")}
                    onClick={() => handleNavigation("bank-slip-management")}
                    badge={<Receipt className="h-4 w-4 flex-shrink-0" />}
                  />
                  <SidebarMenuItem
                    label="Pró-labore"
                    isActive={isActive("prolabore")}
                    onClick={() => handleNavigation("prolabore")}
                  />
                  <SidebarMenuItem
                    label="Gestão de Planos de Custo"
                    isActive={isActive("cost-plan-management")}
                    onClick={() => handleNavigation("cost-plan-management")}
                  />
                  <SidebarMenuItem
                    label="Análise de Lucros"
                    isActive={isActive("profit-analysis")}
                    onClick={() => handleNavigation("profit-analysis")}
                  />
                </div>
              </SidebarMenu>
            </Suspense>

            <Suspense fallback={<div className="h-12 bg-blue-800/20 rounded animate-pulse" />}>
              <SidebarMenu
                icon={ShoppingCart}
                label="Gestão de Custos de Produtos"
                isExpanded={expandedMenus.has("products")}
                hasActiveChild={isActive("product-registration") || isActive("product-profit-analysis")}
                onToggle={() => toggleMenu("products")}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
              >
                <div className="space-y-1 p-2 ml-2">
                  <SidebarMenuItem
                    label="Cadastro de Produtos"
                    isActive={isActive("product-registration")}
                    onClick={() => handleNavigation("product-registration")}
                  />
                  <SidebarMenuItem
                    label="Análise de Lucros de Produtos (DRE)"
                    isActive={isActive("product-profit-analysis")}
                    onClick={() => handleNavigation("product-profit-analysis")}
                  />
                </div>
              </SidebarMenu>
            </Suspense>

            <Suspense fallback={<div className="h-12 bg-blue-800/20 rounded animate-pulse" />}>
              <SidebarMenu
                icon={Globe}
                label="Análises Geográficas"
                isExpanded={expandedMenus.has("geographic")}
                hasActiveChild={isActive("brazil-map") || isActive("regional-analysis") || isActive("geographic-statistics")}
                onToggle={() => toggleMenu("geographic")}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
              >
                <div className="space-y-1 p-2 ml-2">
                  <SidebarMenuItem
                    label="Mapa do Brasil"
                    isActive={isActive("brazil-map")}
                    onClick={() => handleNavigation("brazil-map")}
                    badge={
                      <div className="bg-emerald-500/20 text-emerald-100 text-xs px-2 py-0.5 rounded">
                        {stats.mapStats.totalContracts}
                      </div>
                    }
                  />
                  <SidebarMenuItem
                    label="Análise Regional"
                    isActive={isActive("regional-analysis")}
                    onClick={() => handleNavigation("regional-analysis")}
                    badge={
                      <div className="bg-purple-500/20 text-purple-100 text-xs px-2 py-0.5 rounded">
                        {stats.mapStats.totalStates}
                      </div>
                    }
                  />
                  <SidebarMenuItem
                    label="Estatísticas Geográficas"
                    isActive={isActive("geographic-statistics")}
                    onClick={() => handleNavigation("geographic-statistics")}
                    badge={
                      <div className="bg-green-500/20 text-green-100 text-xs px-2 py-0.5 rounded">
                        {stats.mapStats.totalCities}
                      </div>
                    }
                  />
                </div>
              </SidebarMenu>
            </Suspense>

            <Suspense fallback={<div className="h-12 bg-blue-800/20 rounded animate-pulse" />}>
              <SidebarMenu
                icon={Package}
                label="Gestão & Administração"
                isExpanded={expandedMenus.has("management")}
                hasActiveChild={isActive("plans-management") || isActive("admin-management") || isActive("statistics")}
                onToggle={() => toggleMenu("management")}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
              >
                <div className="space-y-1 p-2 ml-2">
                  <SidebarMenuItem
                    label="Gerenciar Planos"
                    isActive={isActive("plans-management")}
                    onClick={() => handleNavigation("plans-management")}
                  />
                  <SidebarMenuItem
                    label="Administradores"
                    isActive={isActive("admin-management")}
                    onClick={() => handleNavigation("admin-management")}
                  />
                  <SidebarMenuItem
                    label="Estatísticas"
                    isActive={isActive("statistics")}
                    onClick={() => handleNavigation("statistics")}
                  />
                </div>
              </SidebarMenu>
            </Suspense>

            <Suspense fallback={<div className="h-12 bg-blue-800/20 rounded animate-pulse" />}>
              <SidebarMenu
                icon={Bell}
                label="Comunicação & Suporte"
                isExpanded={expandedMenus.has("communication")}
                hasActiveChild={isActive("chat-management") || isActive("notifications")}
                onToggle={() => toggleMenu("communication")}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
              >
                <div className="space-y-1 p-2 ml-2">
                  <SidebarMenuItem
                    label="Chat Inteligente"
                    isActive={isActive("chat-management")}
                    onClick={() => handleNavigation("chat-management")}
                  />
                  <SidebarMenuItem
                    label="Notificações"
                    isActive={isActive("notifications")}
                    onClick={() => handleNavigation("notifications")}
                  />
                </div>
              </SidebarMenu>
            </Suspense>

            <Suspense fallback={<div className="h-12 bg-blue-800/20 rounded animate-pulse" />}>
              <SidebarMenu
                icon={Settings}
                label="Configurações"
                isExpanded={expandedMenus.has("settings")}
                hasActiveChild={isActive("profile") || isActive("system-settings")}
                onToggle={() => toggleMenu("settings")}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
              >
                <div className="space-y-1 p-2 ml-2">
                  <SidebarMenuItem
                    label="Perfil da Empresa"
                    isActive={isActive("profile")}
                    onClick={() => handleNavigation("profile")}
                  />
                  <SidebarMenuItem
                    label="Configurações do Sistema"
                    isActive={isActive("system-settings")}
                    onClick={() => handleNavigation("system-settings")}
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