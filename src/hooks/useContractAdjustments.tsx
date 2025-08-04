import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ContractAdjustment {
  id: string;
  contract_id: string;
  user_id: string;
  adjustment_type: 'value' | 'percentage';
  adjustment_value: number;
  renewal_date: string;
  previous_value: number;
  new_value: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  effective_date: string;
}

export interface CreateAdjustmentData {
  contract_id: string;
  adjustment_type: 'value' | 'percentage';
  adjustment_value: number;
  renewal_date: string;
  previous_value: number;
  new_value: number;
  notes?: string;
  effective_date: string;
}

export function useContractAdjustments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ["contract-adjustments"],
    queryFn: async () => {
      console.log("🔍 HOOK - Buscando ajustes do banco de dados...");
      
      const { data, error } = await supabase
        .from("contract_adjustments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ HOOK - Erro ao buscar ajustes:", error);
        throw error;
      }
      
      console.log("✅ HOOK - Ajustes carregados do banco:", {
        quantidade: data?.length || 0,
        ajustes: data?.map(adj => ({
          id: adj.id,
          contract_id: adj.contract_id,
          effective_date: adj.effective_date,
          new_value: adj.new_value,
          previous_value: adj.previous_value
        }))
      });
      
      return data as ContractAdjustment[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (adjustmentData: CreateAdjustmentData) => {
      console.log("🚀 HOOK - INICIANDO criação de ajuste:", adjustmentData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("❌ HOOK - Usuário não autenticado");
        throw new Error("User not authenticated");
      }

      console.log("👤 HOOK - Usuário autenticado:", user.id);

      const dataToInsert = {
        ...adjustmentData,
        user_id: user.id,
      };

      console.log("💾 HOOK - Dados que serão inseridos no banco:", dataToInsert);

      const { data, error } = await supabase
        .from("contract_adjustments")
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        console.error("❌ HOOK - Erro ao inserir no banco:", error);
        console.error("❌ HOOK - Detalhes do erro:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log("✅ HOOK - Ajuste SALVO NO BANCO com sucesso:", data);
      return data as ContractAdjustment;
    },
    onSuccess: (data) => {
      console.log("🎉 HOOK - Sucesso na criação, invalidando queries...");
      
      // Invalidar múltiplas queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["contract-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["profit-analysis"] });
      
      console.log("🔄 HOOK - Queries invalidadas, dados devem ser recarregados");
      
      toast({
        title: "✅ Reajuste aplicado",
        description: `Reajuste criado com sucesso. Novo valor: R$ ${data.new_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      });
    },
    onError: (error) => {
      console.error("❌ HOOK - Erro completo na criação:", error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao aplicar reajuste",
        description: `Não foi possível salvar o reajuste. Erro: ${error.message}`,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("🗑️ HOOK - Removendo ajuste:", id);
      
      const { error } = await supabase
        .from("contract_adjustments")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ HOOK - Erro ao remover ajuste:", error);
        throw error;
      }
      
      console.log("✅ HOOK - Ajuste removido com sucesso");
    },
    onSuccess: () => {
      console.log("🔄 HOOK - Removido com sucesso, invalidando queries...");
      
      queryClient.invalidateQueries({ queryKey: ["contract-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["profit-analysis"] });
      
      toast({
        title: "🗑️ Reajuste removido",
        description: "O reajuste foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error("❌ HOOK - Erro ao remover ajuste:", error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao remover reajuste",
        description: "Não foi possível remover o reajuste.",
      });
    },
  });

  const getAdjustmentsForContract = (contractId: string) => {
    const contractAdjustments = adjustments.filter(adj => adj.contract_id === contractId);
    
    console.log(`🔍 HOOK - Buscando ajustes para contrato ${contractId}:`, {
      totalAjustes: adjustments.length,
      ajustesDoContrato: contractAdjustments.length,
      ajustes: contractAdjustments.map(adj => ({
        id: adj.id,
        effective_date: adj.effective_date,
        new_value: adj.new_value
      }))
    });
    
    return contractAdjustments;
  };

  const getEffectiveValueForContract = (contractId: string, baseValue: number, asOfDate?: Date) => {
    const contractAdjustments = getAdjustmentsForContract(contractId);
    
    if (contractAdjustments.length === 0) {
      console.log(`📊 HOOK - Nenhum ajuste encontrado para contrato ${contractId}, usando valor base: ${baseValue}`);
      return baseValue;
    }

    // Se não especificou data, usar data atual
    const targetDate = asOfDate || new Date();
    
    console.log(`🔍 HOOK - CALCULANDO valor efetivo para contrato ${contractId}:`, {
      valorBase: baseValue,
      dataAlvo: targetDate.toISOString().split('T')[0],
      ajustesDisponiveis: contractAdjustments.length,
      ajustes: contractAdjustments.map(adj => ({
        id: adj.id,
        dataEfetiva: adj.effective_date,
        valorNovo: adj.new_value,
        valorAnterior: adj.previous_value,
        dataCriacao: adj.created_at
      }))
    });
    
    // Filtrar apenas ajustes efetivos até a data alvo
    const validAdjustments = contractAdjustments
      .filter(adj => {
        const effectiveDate = new Date(adj.effective_date);
        const isEffective = effectiveDate <= targetDate;
        console.log(`📅 HOOK - Verificando ajuste ${adj.id}:`, {
          dataEfetiva: adj.effective_date,
          dataAlvo: targetDate.toISOString().split('T')[0],
          estaEfetivo: isEffective,
          valorNovo: adj.new_value
        });
        return isEffective;
      })
      // Ordenar por data efetiva (mais antigo primeiro) e depois por data de criação (mais recente primeiro para desempate)
      .sort((a, b) => {
        const dateA = new Date(a.effective_date);
        const dateB = new Date(b.effective_date);
        if (dateA.getTime() === dateB.getTime()) {
          // Se mesma data efetiva, ordenar por data de criação (mais recente primeiro)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return dateA.getTime() - dateB.getTime();
      });

    console.log(`📅 HOOK - Ajustes válidos encontrados (ordenados):`, {
      quantidade: validAdjustments.length,
      ajustes: validAdjustments.map(adj => ({
        id: adj.id,
        dataEfetiva: adj.effective_date,
        dataCriacao: adj.created_at,
        valorNovo: adj.new_value,
        valorAnterior: adj.previous_value
      }))
    });

    // Se não há ajustes válidos, usar valor base
    if (validAdjustments.length === 0) {
      console.log(`⚠️ HOOK - Nenhum ajuste válido encontrado, usando valor base: ${baseValue}`);
      return baseValue;
    }

    // Remover duplicatas por data efetiva (manter apenas o mais recente de cada data)
    const uniqueAdjustments = validAdjustments.reduce((acc, current) => {
      const existingIndex = acc.findIndex(adj => adj.effective_date === current.effective_date);
      if (existingIndex >= 0) {
        // Se já existe um ajuste para esta data, manter o mais recente (já ordenado)
        return acc;
      } else {
        acc.push(current);
        return acc;
      }
    }, [] as ContractAdjustment[]);

    console.log(`🔄 HOOK - Ajustes únicos após remoção de duplicatas:`, {
      quantidade: uniqueAdjustments.length,
      ajustes: uniqueAdjustments.map(adj => ({
        id: adj.id,
        dataEfetiva: adj.effective_date,
        valorNovo: adj.new_value
      }))
    });

    // Aplicar ajustes sequencialmente, sempre usando o new_value do último ajuste válido
    let currentValue = baseValue;
    
    for (const adjustment of uniqueAdjustments) {
      const previousValue = currentValue;
      currentValue = adjustment.new_value; // Usar sempre o new_value
      
      console.log(`🔄 HOOK - Aplicando ajuste sequencial:`, {
        ajusteId: adjustment.id,
        valorAnterior: previousValue,
        valorNovo: currentValue,
        dataEfetiva: adjustment.effective_date
      });
    }

    console.log(`✅ HOOK - Valor final calculado:`, {
      valorInicial: baseValue,
      valorFinal: currentValue,
      ajustesAplicados: uniqueAdjustments.length,
      dataCalculada: targetDate.toISOString().split('T')[0]
    });

    return currentValue;
  };

  return {
    adjustments,
    isLoading,
    createAdjustment: createMutation.mutate,
    deleteAdjustment: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    getAdjustmentsForContract,
    getEffectiveValueForContract,
  };
}
