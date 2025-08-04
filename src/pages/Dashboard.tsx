import { useState } from "react";
import { ContractProvider } from "@/context/ContractContext";
import ContractForm from "@/components/ContractForm";
import ContractPreview from "@/components/ContractPreview";
import CompanyProfile from "@/components/CompanyProfile";
import ContractsList from "@/components/ContractsList";
import Statistics from "@/components/Statistics";
import SystemSettings from "@/components/SystemSettings";
import ChatManagement from "@/pages/ChatManagement";
import NotificationsManagement from "@/pages/NotificationsManagement";
import AdminManagement from "@/pages/AdminManagement";
import WelcomeGreeting from "@/components/WelcomeGreeting";
import QuickActionsCards from "@/components/QuickActionsCards";
import DashboardStats from "@/components/DashboardStats";
import DashboardCharts from "@/components/DashboardCharts";
import BrazilMap from "@/components/BrazilMap";
import RegionalAnalysis from "@/components/RegionalAnalysis";
import GeographicStatistics from "@/components/GeographicStatistics";
import Billing from "@/components/Billing";
import BankSlipManagement from "@/components/BankSlipManagement";
import DocuSignApiConfig from "@/components/DocuSignApiConfig";
import ContractRenewals from "@/components/ContractRenewals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { Separator } from "@/components/ui/separator";
import PageActions from "@/components/PageActions";
import PlansManagement from "@/components/PlansManagement";
import ProductRegistration from "@/components/ProductRegistration";
import ProductProfitAnalysis from "@/components/ProductProfitAnalysis";
import RejectionReview from "@/components/RejectionReview";
import { useContracts } from "@/hooks/useContracts";
import EmployeeCosts from "@/components/EmployeeCosts";
import EnhancedCompanyCosts from "@/components/EnhancedCompanyCosts";
import Prolabore from "@/components/Prolabore";
import ProfitAnalysis from "@/components/ProfitAnalysis";
import AdvancedProfitAnalysis from "@/components/AdvancedProfitAnalysis";
import CostPlanManagement from "@/components/CostPlanManagement";
import { useIsMobile } from "@/hooks/use-mobile";
import { Trash2 } from "lucide-react";

const Dashboard = () => {
  const [activeView, setActiveView] = useState<string>("dashboard");
  const [editingContract, setEditingContract] = useState<any>(null);
  const { contracts, deleteContract } = useContracts();
  const isMobile = useIsMobile();

  const handleEditContract = (contract: any) => {
    setEditingContract(contract);
    setActiveView("create");
  };

  const handleNewContract = () => {
    setEditingContract(null);
    setActiveView("create");
  };

  const handleContractSaved = () => {
    setEditingContract(null);
    setActiveView("dashboard");
  };

  const handleActionClick = (action: string) => {
    switch (action) {
      case "create-contract":
        handleNewContract();
        break;
      case "view-contracts":
        setActiveView("contracts");
        break;
      case "statistics":
        setActiveView("statistics");
        break;
      case "plans-management":
        setActiveView("plans-management");
        break;
      case "chat-management":
        setActiveView("chat-management");
        break;
      case "admin-management":
        setActiveView("admin-management");
        break;
      case "profile":
        setActiveView("profile");
        break;
      case "notifications":
        setActiveView("notifications");
        break;
      case "settings":
        setActiveView("system-settings");
        break;
      case "brazil-map":
        setActiveView("brazil-map");
        break;
      default:
        break;
    }
  };

  const shouldShowPageActions = () => {
    console.log('🔍 Verificando se deve mostrar PageActions para view:', activeView);
    const viewsWithActions = ["create", "profile", "system-settings"];
    const shouldShow = viewsWithActions.includes(activeView);
    console.log('🎯 Resultado shouldShowPageActions:', shouldShow);
    return shouldShow;
  };

  const handleCancelAction = () => {
    console.log('🔄 handleCancelAction executado');
    setActiveView("dashboard");
    setEditingContract(null);
  };

  const handleSaveAction = () => {
    console.log('💾 handleSaveAction executado para view:', activeView);
    
    switch (activeView) {
      case "create":
        console.log('📝 Tentando salvar contrato...');
        break;
      case "profile":
        console.log('👤 Tentando salvar perfil...');
        break;
      case "system-settings":
        console.log('⚙️ Tentando salvar configurações...');
        break;
      default:
        console.log('❓ Nenhuma ação de salvar definida para esta view');
        break;
    }
  };

  const getPageTitle = () => {
    switch (activeView) {
      case "dashboard":
        return "";
      case "contracts":
        return "Meus Contratos";
      case "create":
        return editingContract ? "Editar Contrato" : "Criar Novo Contrato";
      case "trial-contracts":
        return "Contratos em Período de Teste";
      case "contract-renewals":
        return "Renovações de Contratos";
      case "plans-management":
        return "Gerenciamento de Planos";
      case "chat-management":
        return "Chat Inteligente";
      case "rejection-review":
        return "Revisão de Rejeições";
      case "brazil-map":
        return "Mapa de Contratos do Brasil";
      case "regional-analysis":
        return "Análise Regional de Contratos";
      case "geographic-statistics":
        return "Estatísticas Geográficas";
      case "billing":
        return "Faturamento";
      case "bank-slip-management":
        return "Valor do Boleto";
      case "employee-costs":
        return "Custos de Funcionários";
      case "company-costs":
        return "Custos da Empresa";
      case "prolabore":
        return "Pró-labore";
      case "cost-plan-management":
        return "Gestão de Planos de Custo";
      case "product-registration":
        return "Cadastro de Produtos";
      case "product-profit-analysis":
        return "Análise de Lucros de Produtos (DRE)";
      case "profit-analysis":
        return "Análise de Lucros";
      case "notifications":
        return "Notificações";
      case "statistics":
        return "Estatísticas";
      case "admin-management":
        return "Administradores";
      case "system-settings":
        return "Configurações do Sistema";
      case "profile":
        return "Perfil da Empresa";
      case "docusign-config":
        return "Configuração DocuSign";
      default:
        return "";
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "docusign-config":
        return (
          <div className="space-y-4 p-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-blue-900">Configuração da Integração DocuSign</CardTitle>
                <CardDescription>Configure suas credenciais de API para habilitar a assinatura digital</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <DocuSignApiConfig 
                  onConfigured={(config) => {
                    console.log('DocuSign configurado:', config);
                    setActiveView("dashboard");
                  }} 
                />
              </CardContent>
            </Card>
          </div>
        );

      case "dashboard":
        return (
          <div className="space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <WelcomeGreeting />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                Ações Rápidas
              </h2>
              <QuickActionsCards onActionClick={handleActionClick} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                Estatísticas Gerais
              </h2>
              <DashboardStats />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                Visão Geral
              </h2>
              <DashboardCharts />
            </div>
          </div>
        );

      case "contracts":
        return (
          <div className="space-y-6 p-6">
            <ContractsList onEditContract={handleEditContract} />
          </div>
        );

      case "trial-contracts":
        return (
          <div className="space-y-6 p-6">
            <TrialContractsList onEditContract={handleEditContract} onDeleteContract={deleteContract} />
          </div>
        );

      case "contract-renewals":
        return (
          <div className="space-y-6 p-6">
            <ContractRenewals />
          </div>
        );
      
      case "create":
        return (
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <CardTitle className="text-blue-900">
                    {editingContract ? "Editar Contrato" : "Criar Novo Contrato"}
                  </CardTitle>
                  <CardDescription>
                    {editingContract ? "Edite os dados do contrato" : "Preencha os dados para gerar um novo contrato"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ContractForm 
                    editingContract={editingContract}
                    onContractSaved={handleContractSaved}
                  />
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="text-green-900">Pré-visualização</CardTitle>
                  <CardDescription>
                    Como o contrato ficará ao ser impresso
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4 h-[600px] overflow-auto border-t bg-white">
                    <ContractPreview />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      case "plans-management":
        return (
          <div className="space-y-4 p-6">
            <PlansManagement />
          </div>
        );

      case "chat-management":
        return (
          <div className="space-y-4 p-6">
            <ChatManagement />
          </div>
        );

      case "rejection-review":
        return (
          <div className="space-y-4 p-6">
            <RejectionReview />
          </div>
        );

      case "brazil-map":
        return (
          <div className="space-y-4 p-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                <CardTitle className="text-emerald-900 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                    <path d="M2 12h20"/>
                  </svg>
                  Mapa de Contratos do Brasil
                </CardTitle>
                <CardDescription>
                  Visualize a distribuição geográfica dos seus contratos em todo o território nacional
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <BrazilMap contracts={contracts || []} />
              </CardContent>
            </Card>
          </div>
        );

      case "regional-analysis":
        return (
          <div className="space-y-4 p-6">
            <RegionalAnalysis />
          </div>
        );

      case "geographic-statistics":
        return (
          <div className="space-y-4 p-6">
            <GeographicStatistics />
          </div>
        );

      case "billing":
        return (
          <div className="space-y-4 p-6">
            <Billing />
          </div>
        );

      case "bank-slip-management":
        return (
          <div className="space-y-4 p-6">
            <BankSlipManagement />
          </div>
        );

      case "employee-costs":
        return (
          <div className="space-y-4 p-6">
            <EmployeeCosts />
          </div>
        );

      case "company-costs":
        return (
          <div className="space-y-4 p-6">
            <EnhancedCompanyCosts />
          </div>
        );

      case "prolabore":
        return (
          <div className="space-y-4 p-6">
            <Prolabore />
          </div>
        );

      case "cost-plan-management":
        return (
          <div className="space-y-4 p-6">
            <CostPlanManagement />
          </div>
        );

      case "profit-analysis":
        return (
          <div className="space-y-4 p-6">
            <AdvancedProfitAnalysis />
          </div>
        );

      case "product-registration":
        return (
          <div className="space-y-4 p-6">
            <ProductRegistration />
          </div>
        );

      case "product-profit-analysis":
        return (
          <div className="space-y-4 p-6">
            <ProductProfitAnalysis />
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-4 p-6">
            <NotificationsManagement />
          </div>
        );
      
      case "statistics":
        return (
          <div className="space-y-4 p-6">
            <Statistics />
          </div>
        );

      case "admin-management":
        return (
          <div className="space-y-4 p-6">
            <AdminManagement />
          </div>
        );

      case "system-settings":
        return (
          <div className="space-y-4 p-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
                <CardTitle className="text-orange-900">Configurações do Sistema</CardTitle>
                <CardDescription>Configure as preferências gerais e avançadas do sistema</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <SystemSettings />
              </CardContent>
            </Card>
          </div>
        );
      
      case "profile":
        return (
          <div className="space-y-4 p-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="text-purple-900">Perfil da Empresa</CardTitle>
                <CardDescription>Configure as informações da sua empresa e administrador</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <CompanyProfile />
              </CardContent>
            </Card>
          </div>
        );
      
      default:
        return (
          <div className="space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <WelcomeGreeting />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                Ações Rápidas
              </h2>
              <QuickActionsCards onActionClick={handleActionClick} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                Estatísticas Gerais
              </h2>
              <DashboardStats />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                Visão Geral
              </h2>
              <DashboardCharts />
            </div>
          </div>
        );
    }
  };

  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="min-h-screen flex w-full bg-slate-50">
          {!isMobile && (
            <AppSidebar 
              activeView={activeView} 
              onViewChange={setActiveView}
              onNewContract={handleNewContract}
            />
          )}
          
          <SidebarInset className="flex-1">
            <header className={`flex h-16 shrink-0 items-center gap-2 px-6 border-b bg-white shadow-sm ${isMobile ? 'pl-16' : ''}`}>
              {!isMobile && activeView !== "dashboard" && (
                <>
                  <SidebarTrigger className="-ml-1 hover:bg-slate-100 transition-colors" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                </>
              )}
              <h1 className="text-xl font-semibold text-slate-800 flex-1">{getPageTitle()}</h1>
              <div className="flex items-center space-x-2">
                <NotificationBell onViewAll={() => setActiveView("notifications")} />
                <UserProfileDropdown />
              </div>
            </header>
            
            <main className="flex-1 bg-slate-50 relative">
              <ContractProvider editingContract={editingContract}>
                {renderContent()}
              </ContractProvider>
            </main>
          </SidebarInset>

          {isMobile && (
            <AppSidebar 
              activeView={activeView} 
              onViewChange={setActiveView}
              onNewContract={handleNewContract}
            />
          )}
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

const TrialContractsList = ({ 
  onEditContract, 
  onDeleteContract 
}: { 
  onEditContract: (contract: any) => void;
  onDeleteContract: (contractId: string) => void;
}) => {
  const { contracts } = useContracts();

  const contractsWithTrial = contracts?.filter(contract => {
    const trialDays = parseInt(contract.trial_days || '0');
    return trialDays > 0;
  }) || [];

  const trialContracts = contractsWithTrial.map(contract => {
    const trialDays = parseInt(contract.trial_days || '0');
    
    let startDate: Date | null = null;
    if (contract.start_date) {
      if (contract.start_date.includes('-')) {
        startDate = new Date(contract.start_date);
      } else if (contract.start_date.includes('/')) {
        const parts = contract.start_date.split('/');
        if (parts.length === 3) {
          startDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
    }

    let endDate: Date | null = null;
    let daysRemaining = 0;
    let isExpired = false;

    if (startDate && !isNaN(startDate.getTime())) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + trialDays);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDateOnly = new Date(startDate);
      startDateOnly.setHours(0, 0, 0, 0);
      
      const endDateOnly = new Date(endDate);
      endDateOnly.setHours(0, 0, 0, 0);
      
      if (startDateOnly > today) {
        daysRemaining = trialDays;
        isExpired = false;
      }
      else if (today >= startDateOnly && today <= endDateOnly) {
        const daysPassed = Math.floor((today.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24));
        daysRemaining = Math.max(0, trialDays - daysPassed);
        isExpired = daysRemaining <= 0;
      }
      else {
        daysRemaining = 0;
        isExpired = true;
      }
    }

    const contractor = contract.contractors?.[0];

    return {
      ...contract,
      contractor,
      startDate,
      endDate,
      daysRemaining,
      isExpired,
      trialDays
    };
  });

  const activeTrialContracts = trialContracts.filter(contract => !contract.isExpired);
  const expiredContracts = trialContracts.filter(contract => contract.isExpired);
  const expiringSoon = trialContracts.filter(contract => contract.daysRemaining > 0 && contract.daysRemaining <= 7);

  const handleDeleteContract = async (contractId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.')) {
      await onDeleteContract(contractId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-800 text-sm font-medium">Total em Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{activeTrialContracts.length}</div>
            <p className="text-xs text-orange-700 mt-1">Contratos ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 text-sm font-medium">Expirando em Breve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{expiringSoon.length}</div>
            <p className="text-xs text-red-700 mt-1">Próximos 7 dias</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-800 text-sm font-medium">Expirado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{expiredContracts.length}</div>
            <p className="text-xs text-gray-700 mt-1">Contratos expirados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Contratos em Período de Teste
          </CardTitle>
          <CardDescription>
            Lista completa de contratos com período de teste configurado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trialContracts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato com período de teste</h3>
              <p className="text-gray-500">Não há contratos configurados com período de teste no momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trialContracts.map((contract) => {
                return (
                  <div
                    key={contract.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      contract.isExpired
                        ? 'border-gray-300 bg-gray-50'
                        : contract.daysRemaining <= 7
                        ? 'border-red-200 bg-red-50'
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => onEditContract(contract)}>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">
                            Contrato #{contract.contract_number}
                          </h3>
                          {contract.isExpired ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              ⏰ Expirado
                            </span>
                          ) : contract.daysRemaining <= 7 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ⚠️ {contract.daysRemaining} dia{contract.daysRemaining !== 1 ? 's' : ''} restante{contract.daysRemaining !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ {contract.daysRemaining} dia{contract.daysRemaining !== 1 ? 's' : ''} restante{contract.daysRemaining !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">
                              <span className="font-medium">Contratante:</span> {contract.contractor?.name || 'Não informado'}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Valor:</span> R$ {contract.monthly_value}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">
                              <span className="font-medium">Início do teste:</span> {contract.startDate ? contract.startDate.toLocaleDateString('pt-BR') : 'Data inválida'}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Fim do teste:</span> {contract.endDate ? contract.endDate.toLocaleDateString('pt-BR') : 'Data inválida'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          Período total: {contract.trialDays} dias | Status: {contract.status}
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteContract(contract.id);
                        }}
                        className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        title="Excluir contrato"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
