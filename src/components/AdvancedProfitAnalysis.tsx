import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DollarSign, Target, Filter, FileText, Percent, Activity, Receipt, ChevronLeft, ChevronRight, Calendar, Gift, Building, TrendingUp, Calculator, AlertTriangle, CreditCard, AlertCircle, User, Plus } from "lucide-react";
import { useProfitAnalysis } from "@/hooks/useProfitAnalysis";
import { useBankSlipConfigurations } from "@/hooks/useBankSlipConfigurations";
import { useContracts } from "@/hooks/useContracts";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";
import ContractAdjustmentModal from "./ContractAdjustmentModal";
import { ContractValueVariationColumn } from "./ContractValueVariationColumn";
import ContractAnalysisFilters from "./ContractAnalysisFilters";
import { AttentionIcon } from "./AttentionIcon";
import ContractsPagination from "./ContractsPagination";
import PeriodSelectionModal from "./PeriodSelectionModal";
import ContractorDetailsModal from "./ContractorDetailsModal";

const AdvancedProfitAnalysis = () => {
  const {
    profitMetrics,
    contractProfitDetails,
    loading,
    analysisDate,
    navigateMonth,
    setAnalysisMonth
  } = useProfitAnalysis();
  const {
    contractCosts: bankSlipCosts
  } = useBankSlipConfigurations();
  const {
    contracts
  } = useContracts();
  const {
    getEffectiveValueForContract
  } = useContractAdjustments();
  const [filterPlanType, setFilterPlanType] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [viewMode, setViewMode] = useState("monthly_average"); // "monthly_average" ou "actual_billing"

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados para o modal de reajuste
  const [selectedContractForAdjustment, setSelectedContractForAdjustment] = useState<any>(null);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);

  // Estado para contratos filtrados pelos filtros de análise
  const [analysisFilteredContracts, setAnalysisFilteredContracts] = useState<any[]>([]);

  // Estado para o modal de seleção de período
  const [periodModalOpen, setPeriodModalOpen] = useState(false);

  // Estados para o modal de detalhes do contratante
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);
  const [contractorDetailsModalOpen, setContractorDetailsModalOpen] = useState(false);

  console.log("🔍 Métricas de lucro:", profitMetrics);
  console.log("🔍 Detalhes dos contratos:", contractProfitDetails);
  console.log("🔍 Custos de boleto:", bankSlipCosts);

  // Função para obter o nome do contratante
  const getContractorName = (contractId: string): string => {
    const contractData = contracts?.find(c => c.id === contractId);
    if (contractData?.contractors && contractData.contractors.length > 0) {
      return contractData.contractors[0].name || 'Contratante não informado';
    }
    return 'Contratante não informado';
  };

  // Função para abrir o modal de detalhes do contratante
  const handleOpenContractorDetails = (contractId: string) => {
    setSelectedContractorId(contractId);
    setContractorDetailsModalOpen(true);
  };

  // Função ATUALIZADA para verificar se um contrato está próximo ao vencimento em QUALQUER ANO
  const isContractNearRenewal = (contractId: string): {
    isNear: boolean;
    daysUntilRenewal: number;
    urgency: 'high' | 'medium' | 'low' | null;
  } => {
    const contractData = contracts?.find(c => c.id === contractId);
    if (!contractData || contractData.status !== "Ativo" || !contractData.renewal_date) {
      return {
        isNear: false,
        daysUntilRenewal: 0,
        urgency: null
      };
    }
    let renewalDate: Date | null = null;
    if (contractData.renewal_date.includes('-')) {
      renewalDate = new Date(contractData.renewal_date);
    } else if (contractData.renewal_date.includes('/')) {
      const parts = contractData.renewal_date.split('/');
      if (parts.length === 3) {
        renewalDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
    if (!renewalDate || isNaN(renewalDate.getTime())) {
      return {
        isNear: false,
        daysUntilRenewal: 0,
        urgency: null
      };
    }
    const analysisYear = analysisDate.getFullYear();
    const analysisMonth = analysisDate.getMonth(); // 0-based (0 = janeiro)
    const renewalMonth = renewalDate.getMonth(); // 0-based (0 = janeiro)
    const renewalDay = renewalDate.getDate();

    // NOVA LÓGICA: Calcular a data de renovação para o ano sendo analisado
    let targetRenewalYear = analysisYear;

    // Se o mês de renovação já passou no ano atual, considerar o próximo ano
    if (analysisMonth > renewalMonth || analysisMonth === renewalMonth && analysisDate.getDate() > renewalDay) {
      targetRenewalYear = analysisYear + 1;
    }

    // Criar a data de renovação para o ano alvo
    const targetRenewalDate = new Date(targetRenewalYear, renewalMonth, renewalDay);

    // Calcular o mês anterior ao mês de renovação do ano alvo
    let previousMonth = renewalMonth - 1;
    let previousYear = targetRenewalYear;
    if (previousMonth < 0) {
      previousMonth = 11; // dezembro
      previousYear = targetRenewalYear - 1;
    }

    // Verificar se estamos analisando exatamente o mês anterior ao mês de renovação
    const isInPreviousMonth = analysisYear === previousYear && analysisMonth === previousMonth;
    if (!isInPreviousMonth) {
      return {
        isNear: false,
        daysUntilRenewal: 0,
        urgency: null
      };
    }

    // Se estamos no mês anterior, calcular os dias até o vencimento
    const now = new Date(analysisYear, analysisMonth, analysisDate.getDate());
    const daysUntilRenewal = Math.ceil((targetRenewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`📅 VERIFICAÇÃO DE RENOVAÇÃO ANUAL:`, {
      contrato: contractData.contract_number,
      mesAnalise: `${analysisYear}-${(analysisMonth + 1).toString().padStart(2, '0')}`,
      mesRenovacaoOriginal: `${renewalDate.getFullYear()}-${(renewalMonth + 1).toString().padStart(2, '0')}`,
      anoAlvoRenovacao: targetRenewalYear,
      mesAnteriorRenovacao: `${previousYear}-${(previousMonth + 1).toString().padStart(2, '0')}`,
      estaNoMesAnterior: isInPreviousMonth,
      diasAteVencimento: daysUntilRenewal
    });

    // Determinar urgência baseada nos dias restantes
    let urgency: 'high' | 'medium' | 'low';
    if (daysUntilRenewal <= 7) {
      urgency = 'high';
    } else if (daysUntilRenewal <= 15) {
      urgency = 'medium';
    } else {
      urgency = 'low';
    }
    return {
      isNear: true,
      daysUntilRenewal,
      urgency
    };
  };

  // Função para abrir o modal de reajuste
  const handleOpenAdjustmentModal = (contractId: string) => {
    const contractData = contracts?.find(c => c.id === contractId);
    if (contractData) {
      setSelectedContractForAdjustment(contractData);
      setAdjustmentModalOpen(true);
    }
  };

  // Função para formatar valores monetários com apenas 2 casas decimais
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para calcular o faturamento baseado no modo de visualização
  const getActualMonthlyRevenue = (contract: any): number => {
    const contractData = contracts?.find(c => c.id === contract.contractId);
    if (!contractData) return 0;
    const originalBaseValue = parseFloat(contractData.monthly_value?.replace(/[^\d,.-]/g, '').replace(',', '.') || '0');

    // Aplicar reajustes baseados na data de análise
    const adjustedBaseValue = getEffectiveValueForContract(contract.contractId, originalBaseValue, analysisDate);
    console.log(`💰 Calculando receita para contrato ${contract.contractNumber}:`, {
      valorOriginal: originalBaseValue,
      valorReajustado: adjustedBaseValue,
      dataAnalise: analysisDate.toISOString().split('T')[0],
      diferenca: adjustedBaseValue - originalBaseValue,
      modoVisualizacao: viewMode
    });
    if (viewMode === "monthly_average") {
      // Para média mensal, calcular o valor proporcional baseado no tipo de plano
      const planType = contractData.plan_type?.toLowerCase() || 'mensal';
      switch (planType) {
        case 'anual':
          // Para contratos anuais, dividir por 12 meses
          return adjustedBaseValue / 12;
        case 'semestral':
          // Para contratos semestrais, dividir por 6 meses
          return adjustedBaseValue / 6;
        case 'mensal':
        default:
          // Para contratos mensais, usar o valor completo
          return adjustedBaseValue;
      }
    }

    // Para faturamento real, aplicar a lógica de período de teste e ciclo de cobrança
    const planType = contractData.plan_type || 'mensal';
    const trialDays = parseInt(contractData.trial_days || '30');
    const contractStartDate = contractData.start_date ? new Date(contractData.start_date) : null;
    if (!contractStartDate) {
      // Se não tem data de início, usar o valor reajustado
      return adjustedBaseValue;
    }

    // Calcular quando o cliente começa a ser cobrado (após período de teste)
    const billingStartDate = new Date(contractStartDate);
    billingStartDate.setDate(billingStartDate.getDate() + trialDays);

    // Verificar se o cliente está sendo cobrado no mês da análise
    const analysisYear = analysisDate.getFullYear();
    const analysisMonth = analysisDate.getMonth();
    const billingYear = billingStartDate.getFullYear();
    const billingMonth = billingStartDate.getMonth();
    const isBeingBilled = analysisYear > billingYear || analysisYear === billingYear && analysisMonth >= billingMonth;
    if (!isBeingBilled) {
      // Cliente em período de teste - receita zero
      console.log(`🆓 Contrato ${contract.contractNumber} EM PERÍODO DE TESTE no faturamento real`);
      return 0;
    }

    // Cliente está sendo cobrado - calcular receita real baseada no tipo de plano
    let actualRevenue = 0;
    if (planType === 'anual') {
      // Para plano anual, só fatura no mês de vencimento (baseado na data de início da cobrança)
      const billingMonth = billingStartDate.getMonth();

      // Verificar se é o mês de cobrança anual
      if (analysisMonth === billingMonth) {
        actualRevenue = adjustedBaseValue; // Usar valor reajustado
      } else {
        actualRevenue = 0; // Outros meses não há faturamento
      }
    } else if (planType === 'semestral') {
      // Para plano semestral, fatura a cada 6 meses (baseado na data de início da cobrança)
      const monthsSinceBilling = (analysisYear - billingYear) * 12 + (analysisMonth - billingMonth);
      if (monthsSinceBilling >= 0 && monthsSinceBilling % 6 === 0) {
        actualRevenue = adjustedBaseValue; // Usar valor reajustado
      } else {
        actualRevenue = 0; // Outros meses não há faturamento
      }
    } else {
      // Para plano mensal, fatura todo mês
      actualRevenue = adjustedBaseValue; // Usar valor reajustado
    }
    console.log(`💰 Faturamento real calculado para contrato ${contract.contractNumber}:`, {
      valor_base_original: originalBaseValue,
      valor_base_reajustado: adjustedBaseValue,
      tipo_plano: planType,
      esta_cobrando: isBeingBilled,
      receita_real: actualRevenue,
      mes_analise: `${analysisYear}-${(analysisMonth + 1).toString().padStart(2, '0')}`
    });
    return actualRevenue;
  };

  // Função para calcular o valor do boleto baseado no tipo de plano e período
  const getBankSlipValueForPeriod = (contractId: string): number => {
    const bankSlipCost = bankSlipCosts?.find(cost => cost.contract_id === contractId);
    if (!bankSlipCost) return 0;

    // Encontrar o contrato correspondente nos dados reais
    const contractData = contracts?.find(c => c.id === contractId);
    if (!contractData) return 0;
    const currentDate = analysisDate;
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-based (0 = janeiro)

    // Obter data de início do contrato dos dados reais
    let contractStartDate: Date;
    try {
      // Tentar diferentes formatos de data
      if (contractData.start_date?.includes('/')) {
        // Formato DD/MM/YYYY
        const [day, month, year] = contractData.start_date.split('/');
        contractStartDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (contractData.start_date?.includes('-')) {
        // Formato YYYY-MM-DD
        contractStartDate = new Date(contractData.start_date);
      } else {
        // Fallback: usar data de criação do contrato
        contractStartDate = new Date(contractData.created_at);
      }
    } catch {
      // Se falhar, usar data de criação
      contractStartDate = new Date(contractData.created_at);
    }
    const contractStartYear = contractStartDate.getFullYear();
    const contractStartMonth = contractStartDate.getMonth();

    // Calcular meses desde o início do contrato
    const monthsSinceStart = (currentYear - contractStartYear) * 12 + (currentMonth - contractStartMonth);

    // Obter período de teste em dias
    const trialDays = parseInt(contractData.trial_days || '30');
    const trialMonths = Math.ceil(trialDays / 30); // Converter dias em meses aproximados

    console.log(`📅 Calculando boleto para contrato ${contractData.contract_number}:`, {
      mesAtual: currentMonth + 1,
      anoAtual: currentYear,
      dataInicioContrato: contractStartDate.toLocaleDateString('pt-BR'),
      mesesDesdeInicio: monthsSinceStart,
      diasTeste: trialDays,
      mesesTeste: trialMonths,
      valorBoleto: bankSlipCost.monthly_cost,
      tipoPlano: contractData.plan_type || 'mensal'
    });

    // Se ainda está no período de teste, não cobra boleto
    if (monthsSinceStart < trialMonths) {
      console.log(`🆓 Contrato ${contractData.contract_number} ainda em período de teste`);
      return 0;
    }

    // Determinar o tipo de plano dos dados reais
    const planType = contractData.plan_type || 'mensal';

    // Calcular meses desde o fim do período de teste
    const monthsSinceTrialEnd = monthsSinceStart - trialMonths;

    // Lógica baseada no tipo de plano
    switch (planType.toLowerCase()) {
      case 'mensal':
        // Para plano mensal: cobra após período de teste, todo mês
        if (monthsSinceTrialEnd >= 0) {
          console.log(`💰 Contrato mensal ${contractData.contract_number}: cobrando boleto`);
          return bankSlipCost.monthly_cost;
        }
        break;
      case 'semestral':
        // Para plano semestral: cobra após período de teste, depois a cada 6 meses
        if (monthsSinceTrialEnd >= 0 && monthsSinceTrialEnd % 6 === 0) {
          console.log(`💰 Contrato semestral ${contractData.contract_number}: cobrando boleto`);
          return bankSlipCost.monthly_cost;
        }
        break;
      case 'anual':
        // Para plano anual: cobra após período de teste, depois a cada 12 meses
        if (monthsSinceTrialEnd >= 0 && monthsSinceTrialEnd % 12 === 0) {
          console.log(`💰 Contrato anual ${contractData.contract_number}: cobrando boleto`);
          return bankSlipCost.monthly_cost;
        }
        break;
      default:
        // Default para mensal se não especificado
        if (monthsSinceTrialEnd >= 0) {
          return bankSlipCost.monthly_cost;
        }
    }
    console.log(`🚫 Contrato ${contractData.contract_number}: sem cobrança de boleto neste período`);
    return 0;
  };

  // Apply filters and recalculate based on view mode
  const filteredContracts = useMemo(() => {
    // Primeiro, recalcular os contratos baseado no modo de visualização
    const recalculatedContracts = contractProfitDetails.map(contract => {
      const actualRevenue = getActualMonthlyRevenue(contract);
      const contractData = contracts?.find(c => c.id === contract.contractId);
      const planType = contractData?.plan_type?.toLowerCase() || 'mensal';

      // Calcular valor do boleto para este período
      const bankSlipValue = getBankSlipValueForPeriod(contract.contractId);

      // Para o modo de faturamento real, custos operacionais são SEMPRE mensais e recorrentes
      let recalculatedContract;
      if (viewMode === "actual_billing") {
        // NOVA LÓGICA: No faturamento real, custos operacionais são sempre mensais
        // Apenas receita, impostos e fração da empresa são ajustados
        const revenueRatio = actualRevenue / (contract.monthlyRevenue || 1);
        const proportionalTaxes = contract.allocatedTaxes * revenueRatio;
        const proportionalCompanyFraction = contract.allocatedCompanyFraction * revenueRatio;

        // CUSTOS OPERACIONAIS SEMPRE MENSAIS (não proporcionais)
        const monthlyOperationalCosts = contract.allocatedCosts - contract.allocatedCompanyFraction;

        // Calcular lucros considerando custos mensais recorrentes
        const grossProfit = actualRevenue - monthlyOperationalCosts - proportionalCompanyFraction;
        const netProfitAfterTaxes = grossProfit - proportionalTaxes - bankSlipValue;
        console.log(`💰 FATURAMENTO REAL - Contrato ${contract.contractNumber} (${planType}):`, {
          receitaReal: actualRevenue,
          custoOperacionalMensal: monthlyOperationalCosts,
          fracaoEmpresa: proportionalCompanyFraction,
          impostos: proportionalTaxes,
          boleto: bankSlipValue,
          lucroLiquido: netProfitAfterTaxes,
          deficitMensal: actualRevenue === 0 && monthlyOperationalCosts > 0
        });
        recalculatedContract = {
          ...contract,
          monthlyRevenue: actualRevenue,
          allocatedCosts: monthlyOperationalCosts + proportionalCompanyFraction,
          monthlyOperationalCosts: monthlyOperationalCosts,
          // Destacar custo operacional mensal
          allocatedTaxes: proportionalTaxes,
          allocatedCompanyFraction: proportionalCompanyFraction,
          bankSlipValue: bankSlipValue,
          grossProfit: grossProfit,
          netProfitAfterTaxes: netProfitAfterTaxes,
          profitMargin: actualRevenue > 0 ? grossProfit / actualRevenue * 100 : grossProfit < 0 ? -100 : 0,
          netProfitMargin: actualRevenue > 0 ? netProfitAfterTaxes / actualRevenue * 100 : netProfitAfterTaxes < 0 ? -100 : 0,
          isDeficitMonth: actualRevenue === 0 && monthlyOperationalCosts + proportionalCompanyFraction + bankSlipValue > 0,
          planType: planType
        };
      } else {
        // Modo média mensal: usar valor ajustado como base
        console.log(`🔧 CORREÇÃO MÉDIA MENSAL - Contrato ${contract.contractNumber}:`, {
          valorOriginalContrato: contract.monthlyRevenue,
          valorAjustadoCalculado: actualRevenue,
          diferenca: actualRevenue - contract.monthlyRevenue
        });

        // Para média mensal, usar o valor ajustado como 100% da receita
        const grossProfit = actualRevenue - contract.allocatedCosts;
        const netProfitAfterTaxes = actualRevenue - contract.allocatedCosts - contract.allocatedTaxes - bankSlipValue;
        recalculatedContract = {
          ...contract,
          monthlyRevenue: actualRevenue,
          allocatedCosts: contract.allocatedCosts,
          // Manter custos originais
          monthlyOperationalCosts: contract.allocatedCosts - contract.allocatedCompanyFraction,
          allocatedTaxes: contract.allocatedTaxes,
          // Manter impostos originais  
          allocatedCompanyFraction: contract.allocatedCompanyFraction,
          // Manter fração original
          bankSlipValue: bankSlipValue,
          grossProfit: grossProfit,
          netProfitAfterTaxes: netProfitAfterTaxes,
          profitMargin: actualRevenue > 0 ? grossProfit / actualRevenue * 100 : 0,
          netProfitMargin: actualRevenue > 0 ? netProfitAfterTaxes / actualRevenue * 100 : 0,
          isDeficitMonth: false,
          planType: planType
        };
      }
      return recalculatedContract;
    });

    // Aplicar filtros
    let filtered = recalculatedContracts;
    if (filterPlanType && filterPlanType !== "all") {
      filtered = filtered.filter(contract => contract.planType === filterPlanType.toLowerCase());
    }
    if (minValue) {
      const min = parseFloat(minValue);
      filtered = filtered.filter(contract => contract.monthlyRevenue >= min);
    }
    if (maxValue) {
      const max = parseFloat(maxValue);
      filtered = filtered.filter(contract => contract.monthlyRevenue <= max);
    }
    return filtered;
  }, [contractProfitDetails, viewMode, filterPlanType, minValue, maxValue, contracts, analysisDate, getEffectiveValueForContract]);

  // Função para lidar com mudanças nos filtros de análise
  const handleAnalysisFiltersChange = (newFilteredContracts: any[]) => {
    setAnalysisFilteredContracts(newFilteredContracts);
  };

  // Usar contratos filtrados pela análise se disponíveis, senão usar filtros padrão
  const finalFilteredContracts = analysisFilteredContracts.length > 0 ? analysisFilteredContracts : filteredContracts;

  // Lógica de paginação
  const totalContracts = finalFilteredContracts.length;
  const totalPages = Math.ceil(totalContracts / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContracts = finalFilteredContracts.slice(startIndex, endIndex);

  // Função para alterar página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Função para alterar itens por página
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Resetar para primeira página
  };

  // Calculate aggregated metrics from filtered contracts
  const filteredMetrics = useMemo(() => {
    const contractsToCalculate = finalFilteredContracts;
    const totalRevenue = contractsToCalculate.reduce((sum, contract) => sum + contract.monthlyRevenue, 0);
    const totalCosts = contractsToCalculate.reduce((sum, contract) => sum + contract.allocatedCosts, 0);
    const totalTaxes = contractsToCalculate.reduce((sum, contract) => sum + contract.allocatedTaxes, 0);
    const totalCompanyFraction = contractsToCalculate.reduce((sum, contract) => sum + contract.allocatedCompanyFraction, 0);
    const totalBankSlips = contractsToCalculate.reduce((sum, contract) => sum + (contract.bankSlipValue || 0), 0);
    const totalProfit = contractsToCalculate.reduce((sum, contract) => sum + contract.grossProfit, 0);
    const totalNetProfit = contractsToCalculate.reduce((sum, contract) => sum + contract.netProfitAfterTaxes, 0);
    const avgMargin = contractsToCalculate.length > 0 ? contractsToCalculate.reduce((sum, contract) => sum + contract.profitMargin, 0) / contractsToCalculate.length : 0;
    const avgNetMargin = contractsToCalculate.length > 0 ? contractsToCalculate.reduce((sum, contract) => sum + contract.netProfitMargin, 0) / contractsToCalculate.length : 0;
    const deficitContracts = contractsToCalculate.filter(contract => contract.isDeficitMonth).length;
    return {
      totalRevenue,
      totalCosts,
      totalTaxes,
      totalCompanyFraction,
      totalBankSlips,
      totalProfit,
      totalNetProfit,
      avgMargin,
      avgNetMargin,
      contractCount: contractsToCalculate.length,
      deficitContracts
    };
  }, [finalFilteredContracts]);
  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    }).replace(/^\w/, c => c.toUpperCase());
  };
  if (loading) {
    return <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando análise avançada...</p>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Análise de Custo Profissional</h1>
            <p className="text-gray-600">Análise completa baseada em {filteredMetrics.contractCount} contratos ativos</p>
          </div>
        </div>
      </div>

      {/* Controles de Navegação Temporal */}
      

      {/* Seletor de Modo de Visualização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Modo de Análise de Custo
          </CardTitle>
          <CardDescription>
            Escolha como os valores devem ser calculados e apresentados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Card className={`cursor-pointer transition-all ${viewMode === "monthly_average" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"}`} onClick={() => setViewMode("monthly_average")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Média Mensal</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Converte todos os contratos (mensais, semestrais e anuais) proporcionalmente para média mensal
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${viewMode === "monthly_average" ? "bg-blue-500" : "border-2 border-gray-300"}`} />
                </div>
              </CardContent>
            </Card>
            
            <Card className={`cursor-pointer transition-all ${viewMode === "actual_billing" ? "ring-2 ring-green-500 bg-green-50" : "hover:bg-gray-50"}`} onClick={() => setViewMode("actual_billing")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Faturamento Real do Mês</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Mostra receita real faturada vs custos mensais recorrentes, evidenciando déficits em contratos anuais/semestrais
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${viewMode === "actual_billing" ? "bg-green-500" : "border-2 border-gray-300"}`} />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {viewMode === "actual_billing" && <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">Importante - Modo Faturamento Real</h4>
                  <p className="text-sm text-amber-700">
                    Neste modo, os <strong>custos operacionais são sempre mensais e recorrentes</strong>, independente do ciclo de faturamento. 
                    Contratos anuais/semestrais apresentarão déficit nos meses sem faturamento, pois a empresa continua 
                    arcando com custos operacionais mensalmente.
                  </p>
                  {filteredMetrics.deficitContracts > 0 && <p className="text-sm text-amber-700 mt-2">
                      <strong>{filteredMetrics.deficitContracts} contrato(s)</strong> em déficit mensal neste período.
                    </p>}
                </div>
              </div>
            </div>}
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="plan-type-filter">Tipo de Plano</Label>
          <Select value={filterPlanType} onValueChange={setFilterPlanType}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os planos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="semestral">Semestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="min-value">Valor Mínimo</Label>
          <Input
            id="min-value"
            type="number"
            placeholder="R$ 0,00"
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="max-value">Valor Máximo</Label>
          <Input
            id="max-value"
            type="number"
            placeholder="R$ 999.999,99"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
          />
        </div>
      </div>

      {/* Cards Principais - Agora com 6 cards incluindo Custo de Boletos */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-blue-900">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Receita Total
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1 text-blue-900">
              R$ {formatCurrency(filteredMetrics.totalRevenue)}
            </div>
            <div className="text-sm font-semibold text-blue-700 mb-1">
              100,00%
            </div>
            <p className="text-xs opacity-75 text-blue-900">
              {filteredMetrics.contractCount} contratos
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-orange-900">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Custo Licenças
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1 text-orange-900">
              R$ {formatCurrency(filteredMetrics.totalCosts - filteredMetrics.totalCompanyFraction)}
            </div>
            <div className="text-sm font-semibold text-orange-700 mb-1">
              {filteredMetrics.totalRevenue > 0 ? ((filteredMetrics.totalCosts - filteredMetrics.totalCompanyFraction) / filteredMetrics.totalRevenue * 100).toFixed(2) : "0,00"}%
            </div>
            <p className="text-xs opacity-75 text-orange-900">
              {viewMode === "actual_billing" ? "Custos mensais recorrentes" : "Custos específicos"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-purple-900">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Rateio Custos Fixos
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1 text-purple-900">
              R$ {formatCurrency(filteredMetrics.totalCompanyFraction)}
            </div>
            <div className="text-sm font-semibold text-purple-700 mb-1">
              {filteredMetrics.totalRevenue > 0 ? (filteredMetrics.totalCompanyFraction / filteredMetrics.totalRevenue * 100).toFixed(2) : "0,00"}%
            </div>
            <p className="text-xs opacity-75 text-purple-900">
              Distribuição proporcional
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-indigo-900">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Custo de Boletos
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1 text-indigo-900">
              R$ {formatCurrency(filteredMetrics.totalBankSlips)}
            </div>
            <div className="text-sm font-semibold text-indigo-700 mb-1">
              {filteredMetrics.totalRevenue > 0 ? (filteredMetrics.totalBankSlips / filteredMetrics.totalRevenue * 100).toFixed(2) : "0,00"}%
            </div>
            <p className="text-xs opacity-75 text-indigo-900">
              Taxas bancárias
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-red-900">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Total Impostos
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1 text-red-900">
              R$ {formatCurrency(filteredMetrics.totalTaxes)}
            </div>
            <div className="text-sm font-semibold text-red-700 mb-1">
              {filteredMetrics.totalRevenue > 0 ? (filteredMetrics.totalTaxes / filteredMetrics.totalRevenue * 100).toFixed(2) : "0,00"}%
            </div>
            <p className="text-xs opacity-75 text-red-900">
              Total de impostos
            </p>
          </CardContent>
        </Card>
        
        <Card className={`bg-gradient-to-br ${filteredMetrics.totalNetProfit >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium flex items-center justify-between ${filteredMetrics.totalNetProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Lucro Líquido Total
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold mb-1 ${filteredMetrics.totalNetProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              R$ {formatCurrency(filteredMetrics.totalNetProfit)}
            </div>
            <div className={`text-sm font-semibold mb-1 ${filteredMetrics.totalNetProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {filteredMetrics.totalRevenue > 0 ? (filteredMetrics.totalNetProfit / filteredMetrics.totalRevenue * 100).toFixed(2) : "0,00"}%
            </div>
            <p className={`text-xs opacity-75 ${filteredMetrics.totalNetProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              Lucro após impostos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de Análise de Contratos */}
      <ContractAnalysisFilters contracts={filteredContracts} analysisDate={analysisDate} onFiltersChange={handleAnalysisFiltersChange} />

      {/* Lista de Contratos - Atualizada com paginação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Análise por Contrato</span>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">{formatMonthYear(analysisDate)}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPeriodModalOpen(true)} className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período
            </Button>
          </CardTitle>
          <CardDescription>
            {viewMode === "monthly_average" ? `Faturamento médio mensal (com valores reajustados aplicados), custo, fração da empresa (distribuição proporcional), impostos, valor do boleto e margem de cada contrato para ${formatMonthYear(analysisDate)}` : `Faturamento real efetivamente cobrado (com valores reajustados aplicados) vs custos operacionais mensais recorrentes para ${formatMonthYear(analysisDate)}. Contratos anuais/semestrais em déficit nos meses sem faturamento.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedContracts.length > 0 ? <>
              <Table>
                <TableHeader>
                 <TableRow>
                   <TableHead>Contratante</TableHead>
                   <TableHead>Variação do Valor</TableHead>
                   <TableHead>⚠️ Renovação</TableHead>
                   <TableHead>Faturamento Mensal</TableHead>
                   <TableHead>Custo Licença</TableHead>
                   <TableHead>Rateio de Custos Fixos</TableHead>
                   <TableHead>Imposto</TableHead>
                   <TableHead>Valor Boleto</TableHead>
                   <TableHead>Lucro Bruto</TableHead>
                   <TableHead>Lucro Líquido</TableHead>
                   <TableHead>Margem Bruta</TableHead>
                   <TableHead>Margem Líquida</TableHead>
                   <TableHead>Isenção Pagamento Licença</TableHead>
                   <TableHead>Status Contrato</TableHead>
                 </TableRow>
               </TableHeader>
              <TableBody>
                {paginatedContracts.map(contract => {
                return <TableRow key={contract.contractId} className={contract.isDeficitMonth ? "bg-red-50" : ""}>
                      <TableCell>
                        <div className="flex items-center group">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="flex-1">
                            <div className="font-medium">{getContractorName(contract.contractId)}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Contrato: {contract.contractNumber}
                            </div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {contract.planType}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 h-6 w-6"
                            onClick={() => handleOpenContractorDetails(contract.contractId)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                       </TableCell>
                       <TableCell>
                         <ContractValueVariationColumn contractId={contract.contractId} analysisDate={analysisDate} />
                       </TableCell>
                       <TableCell>
                         {(() => {
                      const renewalInfo = isContractNearRenewal(contract.contractId);
                      if (!renewalInfo.isNear) {
                        return <span className="text-gray-400 text-xs">-</span>;
                      }
                      const getUrgencyStyles = (urgency: 'high' | 'medium' | 'low') => {
                        switch (urgency) {
                          case 'high':
                            return {
                              bgColor: 'bg-red-100',
                              textColor: 'text-red-800',
                              borderColor: 'border-red-200',
                              icon: <AlertTriangle className="h-3 w-3" />
                            };
                          case 'medium':
                            return {
                              bgColor: 'bg-orange-100',
                              textColor: 'text-orange-800',
                              borderColor: 'border-orange-200',
                              icon: <AlertCircle className="h-3 w-3" />
                            };
                          case 'low':
                            return {
                              bgColor: 'bg-yellow-100',
                              textColor: 'text-yellow-800',
                              borderColor: 'border-yellow-200',
                              icon: <Calendar className="h-3 w-3" />
                            };
                          default:
                            return {
                              bgColor: 'bg-gray-100',
                              textColor: 'text-gray-800',
                              borderColor: 'border-gray-200',
                              icon: <Calendar className="h-3 w-3" />
                            };
                        }
                      };
                      const styles = getUrgencyStyles(renewalInfo.urgency!);
                      return <Button variant="ghost" size="sm" className={`${styles.bgColor} ${styles.textColor} ${styles.borderColor} flex items-center gap-1 text-xs font-medium h-auto p-2 border cursor-pointer hover:opacity-80`} onClick={() => handleOpenAdjustmentModal(contract.contractId)}>
                               {styles.icon}
                               {renewalInfo.daysUntilRenewal} dia{renewalInfo.daysUntilRenewal !== 1 ? 's' : ''}
                             </Button>;
                    })()}
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           R$ {formatCurrency(contract.monthlyRevenue)}
                           {contract.isDeficitMonth && <Badge variant="secondary" className="text-xs text-red-700">
                               Sem faturamento
                             </Badge>}
                         </div>
                       </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-orange-600">
                            R$ {formatCurrency(contract.monthlyOperationalCosts)}
                          </span>
                          {viewMode === "actual_billing" && <div className="text-xs text-gray-500">
                              (Mensal recorrente)
                            </div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-purple-600">
                          R$ {formatCurrency(contract.allocatedCompanyFraction)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600">
                          R$ {formatCurrency(contract.allocatedTaxes)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`${(contract.bankSlipValue || 0) > 0 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                          R$ {formatCurrency(contract.bankSlipValue || 0)}
                          {(contract.bankSlipValue || 0) === 0 && <div className="text-xs text-gray-500">
                              {contract.isInExemptionPeriod ? 'Período teste' : 'Sem cobrança'}
                            </div>}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={contract.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          R$ {formatCurrency(contract.grossProfit)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className={contract.netProfitAfterTaxes >= 0 ? 'text-green-600' : 'text-red-600'}>
                            R$ {formatCurrency(contract.netProfitAfterTaxes)}
                          </span>
                          {contract.isDeficitMonth && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Percent className="h-3 w-3 text-gray-400 mr-1" />
                          <span className={contract.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {contract.profitMargin.toFixed(2)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Percent className="h-3 w-3 text-gray-400 mr-1" />
                          <span className={contract.netProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {contract.netProfitMargin.toFixed(2)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contract.isInExemptionPeriod ? <div className="flex items-center">
                            <Gift className="h-3 w-3 text-green-500 mr-1" />
                            <Badge variant="secondary" className="text-green-700">
                              {contract.exemptionMonthsRemaining} meses restantes
                            </Badge>
                          </div> : <Badge variant="outline">
                            Período normal
                          </Badge>}
                      </TableCell>
                      <TableCell>
                        {contract.isDeficitMonth ? <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Déficit Mensal
                          </Badge> : <Badge variant={contract.netProfitAfterTaxes >= 0 ? "default" : "destructive"}>
                            {contract.netProfitAfterTaxes >= 0 ? "Lucrativo" : "Deficitário"}
                          </Badge>}
                      </TableCell>
                    </TableRow>;
              })}
              </TableBody>
              </Table>
              
              {/* Paginação */}
              <ContractsPagination currentPage={currentPage} totalPages={totalPages} itemsPerPage={itemsPerPage} totalItems={totalContracts} onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange} />
            </> : <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
              <p className="text-gray-500">Ajuste os filtros para ver os contratos</p>
            </div>}
        </CardContent>
      </Card>

      {/* Modal de Reajuste de Contrato */}
      <ContractAdjustmentModal contract={selectedContractForAdjustment} open={adjustmentModalOpen} onOpenChange={setAdjustmentModalOpen} />

      {/* Modal de Seleção de Período */}
      <PeriodSelectionModal analysisDate={analysisDate} onNavigateMonth={navigateMonth} onSetAnalysisMonth={setAnalysisMonth} isOpen={periodModalOpen} onClose={() => setPeriodModalOpen(false)} />

      {/* Modal de Detalhes do Contratante */}
      <ContractorDetailsModal contractId={selectedContractorId || ""} open={contractorDetailsModalOpen} onOpenChange={setContractorDetailsModalOpen} />
    </div>;
};
export default AdvancedProfitAnalysis;
