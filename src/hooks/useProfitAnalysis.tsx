import { useState, useEffect, useMemo } from "react";
import { useContracts } from "./useContracts";
import { useCosts } from "./useCosts";
import { useCostPlans } from "./useCostPlans";
import { useContractRevenue } from "./useContractRevenue";
import { useContractAdjustments } from "./useContractAdjustments";

export interface ContractRevenue {
  contractId: string;
  contractNumber: string;
  monthlyRevenue: number;
  annualRevenue: number;
  planType: string;
  status: string;
  startDate: Date | null;
  renewalDate: Date | null;
  contractor: any;
  employeeCount: number;
  cnpjCount: number;
}

export interface ProfitMetrics {
  totalRevenue: number;
  totalMonthlyRevenue: number;
  totalAnnualRevenue: number;
  totalEmployeeCosts: number;
  totalCompanyCosts: number;
  totalOperationalCosts: number;
  companyFractionCosts: number;
  companyFractionPercentage: number;
  estimatedTaxes: number;
  actualTaxes: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  netProfitMargin: number;
  averageContractValue: number;
  revenuePerEmployee: number;
  costRatio: number;
  taxRatio: number;
  currentPeriod: string;
}

export interface ContractProfitDetail {
  contractId: string;
  contractNumber: string;
  monthlyRevenue: number;
  annualRevenue: number;
  allocatedCosts: number;
  allocatedTaxes: number;
  allocatedCompanyFraction: number;
  grossProfit: number;
  netProfitAfterTaxes: number;
  profitMargin: number;
  netProfitMargin: number;
  contractor?: any;
  status?: string;
  employeeCount: number;
  cnpjCount: number;
  exemptionMonthsRemaining?: number;
  isInExemptionPeriod?: boolean;
}

export const useProfitAnalysis = () => {
  const { contracts, loading: contractsLoading } = useContracts();
  const { 
    employeeCosts, 
    companyCosts, 
    profitAnalyses,
    loading: costsLoading 
  } = useCosts();
  const { 
    costPlans, 
    contractConfigurations, 
    calculateContractProfit,
    getProjectedTotalRevenue,
    getProjectedOperationalCosts,
    loading: costPlansLoading 
  } = useCostPlans();

  const [loading, setLoading] = useState(true);
  const [analysisDate, setAnalysisDate] = useState(new Date());
  const [companyFractionPercentage, setCompanyFractionPercentage] = useState(8);

  // Usar o novo hook para cálculo correto de receitas
  const { contractRevenues: calculatedRevenues } = useContractRevenue(contracts || [], analysisDate);

  // Converter para o formato esperado pelo sistema existente
  const contractRevenues = useMemo((): ContractRevenue[] => {
    return calculatedRevenues.map(revenue => ({
      contractId: revenue.contractId,
      contractNumber: revenue.contractNumber,
      monthlyRevenue: revenue.monthlyRevenue,
      annualRevenue: revenue.annualRevenue,
      planType: revenue.planType,
      status: revenue.status,
      startDate: revenue.startDate,
      renewalDate: revenue.renewalDate,
      contractor: revenue.contractor,
      employeeCount: revenue.employeeCount,
      cnpjCount: revenue.cnpjCount
    }));
  }, [calculatedRevenues]);

  // Função para calcular meses entre duas datas
  const getMonthsDifference = (startDate: Date, currentDate: Date): number => {
    const start = new Date(startDate);
    const current = new Date(currentDate);
    return (current.getFullYear() - start.getFullYear()) * 12 + 
           (current.getMonth() - start.getMonth());
  };

  // Função para calcular quando o cliente começa a ser cobrado (após período de teste)
  const getClientBillingStartDate = (contractStartDate: Date, trialDays: number): Date => {
    const billingStart = new Date(contractStartDate);
    billingStart.setDate(billingStart.getDate() + trialDays);
    return billingStart;
  };

  // Função CORRIGIDA para verificar se estamos no período de isenção do fornecedor
  // A isenção de custo operacional deve começar desde o início do teste gratuito
  const isInSupplierExemptionPeriod = (contractStartDate: Date, trialDays: number, supplierExemptionMonths: number, analysisDate: Date): boolean => {
    // A isenção começa desde o início do contrato (não desde o início da cobrança)
    const exemptionStartDate = new Date(contractStartDate);
    const monthsSinceContractStart = getMonthsDifference(exemptionStartDate, analysisDate);
    
    // CORREÇÃO: A isenção deve começar do mês atual se estivermos no mês de início
    // Calcular se estamos ainda no período de isenção considerando que:
    // - Se o contrato começou em julho, a isenção é julho, agosto, setembro (3 meses)
    // - Se analisamos outubro, já não estamos em isenção
    const isInExemption = monthsSinceContractStart < supplierExemptionMonths;
    
    console.log(`🔍 Verificação de isenção operacional:`, {
      contrato_inicio: contractStartDate.toISOString().slice(0, 10),
      mes_analise: analysisDate.toISOString().slice(0, 7),
      meses_desde_inicio: monthsSinceContractStart,
      meses_isencao_total: supplierExemptionMonths,
      esta_em_isencao: isInExemption,
      calculo: `Mês ${monthsSinceContractStart + 1} de ${supplierExemptionMonths} meses de isenção`
    });
    
    return isInExemption;
  };

  // Helper function to find the best matching cost plan for a contract
  const findBestCostPlan = (employeeCount: number, cnpjCount: number) => {
    if (!costPlans || costPlans.length === 0) return null;

    console.log(`🔍 Procurando plano de custo para ${employeeCount} funcionários e ${cnpjCount} CNPJs`);

    const sortedPlans = [...costPlans]
      .filter(plan => plan.is_active)
      .sort((a, b) => a.max_employees - b.max_employees);

    for (const plan of sortedPlans) {
      if (employeeCount <= plan.max_employees && cnpjCount <= plan.max_cnpjs) {
        console.log(`✅ Plano encontrado: ${plan.name} (até ${plan.max_employees} funcionários, ${plan.max_cnpjs} CNPJs, custo base: R$ ${plan.base_license_cost})`);
        return plan;
      }
    }

    const largestPlan = sortedPlans[sortedPlans.length - 1];
    if (largestPlan) {
      console.log(`⚠️ Usando plano maior disponível: ${largestPlan.name} para ${employeeCount} funcionários e ${cnpjCount} CNPJs`);
      return largestPlan;
    }

    console.log(`❌ Nenhum plano de custo encontrado para ${employeeCount} funcionários e ${cnpjCount} CNPJs`);
    return null;
  };

  // Calculate tax percentage based on company configurations
  const taxPercentage = useMemo(() => {
    const taxCosts = companyCosts.filter(cost => cost.is_active && cost.category === 'tax');
    
    const totalTaxPercentage = taxCosts.reduce((sum, cost) => {
      const percentageMatch = cost.description.match(/\((\d+(?:\.\d+)?)%\)/);
      if (percentageMatch) {
        return sum + parseFloat(percentageMatch[1]);
      }
      return sum;
    }, 0);
    
    console.log(`💰 PORCENTAGEM DE IMPOSTOS CONFIGURADA para ${analysisDate.toISOString().slice(0, 7)}:`, {
      impostos_ativos: taxCosts.length,
      porcentagem_total: totalTaxPercentage,
      detalhes_impostos: taxCosts.map(cost => ({
        descricao: cost.description,
        porcentagem_extraida: cost.description.match(/\((\d+(?:\.\d+)?)%\)/) ? parseFloat(cost.description.match(/\((\d+(?:\.\d+)?)%\)/)[1]) : 0
      }))
    });

    return totalTaxPercentage;
  }, [companyCosts, analysisDate]);

  // Calculate main metrics including company fraction with projections
  const profitMetrics = useMemo((): ProfitMetrics => {
    const actualTotalRevenue = contractRevenues.reduce((sum, revenue) => sum + revenue.monthlyRevenue, 0);
    const totalAnnualRevenue = contractRevenues.reduce((sum, revenue) => sum + revenue.annualRevenue, 0);

    const projectedTotalRevenue = getProjectedTotalRevenue ? getProjectedTotalRevenue() : 0;
    const projectedOperationalCosts = getProjectedOperationalCosts ? getProjectedOperationalCosts() : 0;
    
    const revenueForFractionCalculation = projectedTotalRevenue > 0 ? projectedTotalRevenue : actualTotalRevenue;
    const operationalCostsForCalculation = projectedOperationalCosts > 0 ? projectedOperationalCosts : 0;

    console.log(`💰 USANDO RECEITAS CORRIGIDAS para ${analysisDate.toISOString().slice(0, 7)}:`, {
      faturamento_real_corrigido: actualTotalRevenue,
      faturamento_projetado: projectedTotalRevenue,
      custos_operacionais_projetados: projectedOperationalCosts,
      usando_projecao: projectedTotalRevenue > 0
    });

    const totalEmployeeCosts = employeeCosts
      .filter(cost => cost.is_active)
      .reduce((sum, cost) => sum + cost.total_cost, 0);

    const totalCompanyCosts = companyCosts
      .filter(cost => cost.is_active && cost.category !== 'tax')
      .reduce((sum, cost) => sum + cost.monthly_cost, 0);

    const companyFractionCosts = contractRevenues.reduce((sum, revenue) => {
      if (revenueForFractionCalculation === 0) return sum;
      const contractProportion = revenue.monthlyRevenue / revenueForFractionCalculation;
      const contractFraction = totalCompanyCosts * contractProportion;
      return sum + contractFraction;
    }, 0);

    const totalOperationalCosts = operationalCostsForCalculation > 0 ? operationalCostsForCalculation : 
      costPlans.length > 0 ? contractRevenues.reduce((sum, revenue) => {
        if (revenue.monthlyRevenue === 0) {
          console.log(`🆓 Contrato ${revenue.contractNumber} em período de teste - sem custos operacionais`);
          return sum;
        }

        const config = contractConfigurations.find(c => c.contract_id === revenue.contractId);
        
        if (config) {
          const costPlan = costPlans.find(p => p.id === config.cost_plan_id);
          if (costPlan && revenue.startDate) {
            const calculation = calculateContractProfit(
              revenue.monthlyRevenue, 
              costPlan, 
              config, 
              0, 
              0, 
              revenue.contractId
            );
            console.log(`💸 Custo para contrato ${revenue.contractNumber}:`, calculation.totalCosts);
            return sum + calculation.totalCosts;
          }
        }
        
        return sum;
      }, 0) : 0;

    const actualTaxes = (actualTotalRevenue * taxPercentage) / 100;
    const estimatedTaxes = actualTotalRevenue * 0.175;
    const totalMonthlyCosts = totalEmployeeCosts + totalCompanyCosts + totalOperationalCosts + companyFractionCosts;
    const totalCostsWithTaxes = totalMonthlyCosts + actualTaxes;
    const grossProfit = actualTotalRevenue - totalMonthlyCosts;
    const netProfit = actualTotalRevenue - totalCostsWithTaxes;
    const profitMargin = actualTotalRevenue > 0 ? (grossProfit / actualTotalRevenue) * 100 : 0;
    const netProfitMargin = actualTotalRevenue > 0 ? (netProfit / actualTotalRevenue) * 100 : 0;
    const taxRatio = actualTotalRevenue > 0 ? (actualTaxes / actualTotalRevenue) * 100 : 0;
    const averageContractValue = contractRevenues.length > 0 ? actualTotalRevenue / contractRevenues.length : 0;
    const activeEmployees = employeeCosts.filter(cost => cost.is_active).length;
    const revenuePerEmployee = activeEmployees > 0 ? actualTotalRevenue / activeEmployees : 0;
    const costRatio = actualTotalRevenue > 0 ? (totalCostsWithTaxes / actualTotalRevenue) * 100 : 0;

    return {
      totalRevenue: actualTotalRevenue,
      totalMonthlyRevenue: actualTotalRevenue,
      totalAnnualRevenue,
      totalEmployeeCosts,
      totalCompanyCosts,
      totalOperationalCosts,
      companyFractionCosts,
      companyFractionPercentage,
      estimatedTaxes,
      actualTaxes,
      grossProfit,
      netProfit,
      profitMargin,
      netProfitMargin,
      averageContractValue,
      revenuePerEmployee,
      costRatio,
      taxRatio,
      currentPeriod: analysisDate.toISOString().slice(0, 7)
    };
  }, [contractRevenues, employeeCosts, companyCosts, profitAnalyses, costPlans, contractConfigurations, calculateContractProfit, taxPercentage, analysisDate, companyFractionPercentage, getProjectedTotalRevenue, getProjectedOperationalCosts]);

  // Calculate profit details per contract including company fraction allocation with projections
  const contractProfitDetails = useMemo((): ContractProfitDetail[] => {
    if (!contractRevenues || !profitMetrics) return [];

    const projectedTotalRevenue = getProjectedTotalRevenue();
    const revenueForFractionCalculation = projectedTotalRevenue > 0 ? projectedTotalRevenue : profitMetrics.totalRevenue;

    return contractRevenues.map(contract => {
      const allocatedTaxes = (contract.monthlyRevenue * taxPercentage) / 100;
      
      const allocatedCompanyFraction = revenueForFractionCalculation > 0 
        ? (contract.monthlyRevenue / revenueForFractionCalculation) * profitMetrics.totalCompanyCosts 
        : 0;

      const config = contractConfigurations.find(c => c.contract_id === contract.contractId);
      const trialDays = parseInt(contract.contractor?.trial_days || '30');
      
      if (config) {
        const costPlan = costPlans.find(p => p.id === config.cost_plan_id);
        
        if (costPlan && contract.startDate) {
          const supplierExemptionMonths = (costPlan as any).exemption_months || 3;
          
          // CORREÇÃO: Usar a data de início do contrato para calcular a isenção
          const monthsSinceContractStart = getMonthsDifference(contract.startDate, analysisDate);
          const isInExemption = isInSupplierExemptionPeriod(
            contract.startDate, 
            trialDays, 
            supplierExemptionMonths, 
            analysisDate
          );
          // CORREÇÃO: Calcular meses restantes corretamente
          // Se está no mês 0 (primeiro mês), restam exemptionMonths - 1 meses
          // Se está no mês 1 (segundo mês), restam exemptionMonths - 2 meses
          const exemptionMonthsRemaining = Math.max(0, supplierExemptionMonths - monthsSinceContractStart - 1);
          
          let allocatedCosts = 0;
          let grossProfit = contract.monthlyRevenue;
          let profitMargin = contract.monthlyRevenue > 0 ? 100 : 0;
          
          // Se não está em período de isenção, calcular custos operacionais
          if (!isInExemption) {
            const calculation = calculateContractProfit(contract.monthlyRevenue, costPlan, config);
            allocatedCosts = calculation.totalCosts;
            grossProfit = calculation.grossProfit;
            profitMargin = calculation.profitMargin;
            
            console.log(`💸 Contrato ${contract.contractNumber} COM custos operacionais:`, {
              receita: contract.monthlyRevenue,
              custos_operacionais: allocatedCosts,
              lucro_bruto: grossProfit
            });
          } else {
            console.log(`🆓 Contrato ${contract.contractNumber} EM ISENÇÃO operacional:`, {
              receita: contract.monthlyRevenue,
              meses_restantes_isencao: exemptionMonthsRemaining
            });
          }
          
          const totalAllocatedCosts = allocatedCosts + allocatedCompanyFraction;
          const adjustedGrossProfit = contract.monthlyRevenue - totalAllocatedCosts;
          const netProfitAfterTaxes = adjustedGrossProfit - allocatedTaxes;
          const adjustedProfitMargin = contract.monthlyRevenue > 0 ? (adjustedGrossProfit / contract.monthlyRevenue) * 100 : 0;
          const netProfitMargin = contract.monthlyRevenue > 0 ? (netProfitAfterTaxes / contract.monthlyRevenue) * 100 : 0;
          
          return {
            contractId: contract.contractId,
            contractNumber: contract.contractNumber,
            monthlyRevenue: contract.monthlyRevenue,
            annualRevenue: contract.annualRevenue,
            allocatedCosts: totalAllocatedCosts,
            allocatedTaxes,
            allocatedCompanyFraction,
            grossProfit: adjustedGrossProfit,
            netProfitAfterTaxes,
            profitMargin: adjustedProfitMargin,
            netProfitMargin,
            contractor: contract.contractor,
            status: contract.status,
            employeeCount: contract.employeeCount,
            cnpjCount: contract.cnpjCount,
            exemptionMonthsRemaining,
            isInExemptionPeriod: isInExemption
          };
        }
      }

      const bestPlan = findBestCostPlan(contract.employeeCount, contract.cnpjCount);
      
      if (bestPlan && contract.startDate) {
        const supplierExemptionMonths = (bestPlan as any).exemption_months || 3;
        const monthsSinceContractStart = getMonthsDifference(contract.startDate, analysisDate);
        const isInExemption = isInSupplierExemptionPeriod(
          contract.startDate, 
          trialDays, 
          supplierExemptionMonths, 
          analysisDate
        );
        // CORREÇÃO: Calcular meses restantes corretamente
        const exemptionMonthsRemaining = Math.max(0, supplierExemptionMonths - monthsSinceContractStart - 1);
        
        let allocatedCosts = 0;
        let grossProfit = contract.monthlyRevenue;
        let profitMargin = contract.monthlyRevenue > 0 ? 100 : 0;
        
        if (!isInExemption && contract.monthlyRevenue > 0) {
          const tempConfig = {
            id: '',
            user_id: '',
            contract_id: contract.contractId,
            cost_plan_id: bestPlan.id,
            tax_percentage: 0,
            labor_cost_percentage: 0,
            fixed_cost_percentage: 0,
            client_trial_period_days: 0,
            created_at: '',
            updated_at: ''
          };
          
          const calculation = calculateContractProfit(contract.monthlyRevenue, bestPlan, tempConfig);
          allocatedCosts = calculation.totalCosts;
          grossProfit = calculation.grossProfit;
          profitMargin = calculation.profitMargin;
        }
        
        const totalAllocatedCosts = allocatedCosts + allocatedCompanyFraction;
        const adjustedGrossProfit = contract.monthlyRevenue - totalAllocatedCosts;
        const netProfitAfterTaxes = adjustedGrossProfit - allocatedTaxes;
        const adjustedProfitMargin = contract.monthlyRevenue > 0 ? (adjustedGrossProfit / contract.monthlyRevenue) * 100 : 0;
        const netProfitMargin = contract.monthlyRevenue > 0 ? (netProfitAfterTaxes / contract.monthlyRevenue) * 100 : 0;
        
        return {
          contractId: contract.contractId,
          contractNumber: contract.contractNumber,
          monthlyRevenue: contract.monthlyRevenue,
          annualRevenue: contract.annualRevenue,
          allocatedCosts: totalAllocatedCosts,
          allocatedTaxes,
          allocatedCompanyFraction,
          grossProfit,
          netProfitAfterTaxes,
          profitMargin,
          netProfitMargin,
          contractor: contract.contractor,
          status: contract.status,
          employeeCount: contract.employeeCount,
          cnpjCount: contract.cnpjCount,
          exemptionMonthsRemaining,
          isInExemptionPeriod: isInExemption
        };
      }

      // Fallback to proportional allocation
      console.log(`⚠️ Usando alocação proporcional para contrato ${contract.contractNumber} (sem plano de custo adequado)`);

      const totalRevenue = revenueForFractionCalculation;
      const contractProportion = totalRevenue > 0 ? contract.monthlyRevenue / totalRevenue : 0;
      
      const allocatedEmployeeCosts = profitMetrics.totalEmployeeCosts * contractProportion;
      const allocatedCompanyCosts = profitMetrics.totalCompanyCosts * contractProportion;
      const allocatedOperationalCosts = profitMetrics.totalOperationalCosts * contractProportion;
      
      const totalAllocatedCosts = allocatedEmployeeCosts + allocatedCompanyCosts + allocatedOperationalCosts + allocatedCompanyFraction;
      const grossProfit = contract.monthlyRevenue - totalAllocatedCosts;
      const netProfitAfterTaxes = grossProfit - allocatedTaxes;
      const profitMargin = contract.monthlyRevenue > 0 ? (grossProfit / contract.monthlyRevenue) * 100 : 0;
      const netProfitMargin = contract.monthlyRevenue > 0 ? (netProfitAfterTaxes / contract.monthlyRevenue) * 100 : 0;

      return {
        contractId: contract.contractId,
        contractNumber: contract.contractNumber,
        monthlyRevenue: contract.monthlyRevenue,
        annualRevenue: contract.annualRevenue,
        allocatedCosts: totalAllocatedCosts,
        allocatedTaxes,
        allocatedCompanyFraction,
        grossProfit,
        netProfitAfterTaxes,
        profitMargin,
        netProfitMargin,
        contractor: contract.contractor,
        status: contract.status,
        employeeCount: contract.employeeCount,
        cnpjCount: contract.cnpjCount,
        exemptionMonthsRemaining: 0,
        isInExemptionPeriod: false
      };
    });
  }, [contractRevenues, profitAnalyses, profitMetrics, costPlans, contractConfigurations, calculateContractProfit, taxPercentage, analysisDate, getProjectedTotalRevenue]);

  useEffect(() => {
    setLoading(contractsLoading || costsLoading || costPlansLoading);
  }, [contractsLoading, costsLoading, costPlansLoading]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setAnalysisDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const setAnalysisMonth = (year: number, month: number) => {
    setAnalysisDate(new Date(year, month, 1));
  };

  const updateCompanyFractionPercentage = (percentage: number) => {
    setCompanyFractionPercentage(percentage);
  };

  return {
    contractRevenues,
    profitMetrics,
    contractProfitDetails,
    activeContractsCount: contractRevenues.length,
    loading,
    analysisDate,
    navigateMonth,
    setAnalysisMonth,
    companyFractionPercentage,
    updateCompanyFractionPercentage
  };
};
