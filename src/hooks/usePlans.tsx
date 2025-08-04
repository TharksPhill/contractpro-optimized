
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plan } from "@/types/plans";
import { useAuth } from "@/hooks/useAuth";

export const usePlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const createDefaultPlans = async () => {
    if (!user?.id) return;

    const defaultPlans = [
      {
        name: '1-5 Funcionários',
        employee_range: '1-5',
        monthly_price: 299.90,
        semestral_price: 1499.50,
        annual_price: 2699.10,
        allowed_cnpjs: 1,
        is_active: true,
        user_id: user.id
      },
      {
        name: '6-10 Funcionários',
        employee_range: '6-10',
        monthly_price: 499.90,
        semestral_price: 2499.50,
        annual_price: 4499.10,
        allowed_cnpjs: 1,
        is_active: true,
        user_id: user.id
      },
      {
        name: '11-20 Funcionários',
        employee_range: '11-20',
        monthly_price: 799.90,
        semestral_price: 3999.50,
        annual_price: 7199.10,
        allowed_cnpjs: 1,
        is_active: true,
        user_id: user.id
      },
      {
        name: '21-50 Funcionários',
        employee_range: '21-50',
        monthly_price: 1299.90,
        semestral_price: 6499.50,
        annual_price: 11699.10,
        allowed_cnpjs: 2,
        is_active: true,
        user_id: user.id
      },
      {
        name: '51-100 Funcionários',
        employee_range: '51-100',
        monthly_price: 2499.90,
        semestral_price: 12499.50,
        annual_price: 22499.10,
        allowed_cnpjs: 3,
        is_active: true,
        user_id: user.id
      },
      {
        name: '101-200 Funcionários',
        employee_range: '101-200',
        monthly_price: 4999.90,
        semestral_price: 24999.50,
        annual_price: 44999.10,
        allowed_cnpjs: 4,
        is_active: true,
        user_id: user.id
      }
    ];

    try {
      const { data, error } = await supabase
        .from('plans')
        .insert(defaultPlans)
        .select();

      if (error) {
        console.error('Erro ao criar planos padrão:', error);
        return [];
      }

      console.log('Planos padrão criados com sucesso:', data);
      return data || [];
    } catch (error) {
      console.error('Erro ao criar planos padrão:', error);
      return [];
    }
  };

  const fetchPlans = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('Buscando planos para usuário:', user.id);
      
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('monthly_price', { ascending: true });

      if (error) {
        console.error('Erro ao buscar planos:', error);
        // Se der erro na busca, criar planos padrão
        const defaultPlansData = await createDefaultPlans();
        // Garantir que todos os planos tenham o campo allowed_cnpjs
        const plansWithAllowedCnpjs = defaultPlansData.map(plan => ({
          ...plan,
          allowed_cnpjs: plan.allowed_cnpjs || 1
        }));
        setPlans(plansWithAllowedCnpjs);
      } else if (!data || data.length === 0) {
        console.log('Nenhum plano encontrado, criando planos padrão...');
        // Se não encontrou planos, criar planos padrão
        const defaultPlansData = await createDefaultPlans();
        // Garantir que todos os planos tenham o campo allowed_cnpjs
        const plansWithAllowedCnpjs = defaultPlansData.map(plan => ({
          ...plan,
          allowed_cnpjs: plan.allowed_cnpjs || 1
        }));
        setPlans(plansWithAllowedCnpjs);
      } else {
        console.log('Planos encontrados:', data);
        // Garantir que todos os planos tenham o campo allowed_cnpjs
        const plansWithAllowedCnpjs = data.map(plan => ({
          ...plan,
          allowed_cnpjs: plan.allowed_cnpjs || 1
        }));
        setPlans(plansWithAllowedCnpjs);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos",
        variant: "destructive",
      });
      
      // Tentar criar planos padrão mesmo com erro
      const defaultPlansData = await createDefaultPlans();
      // Garantir que todos os planos tenham o campo allowed_cnpjs
      const plansWithAllowedCnpjs = defaultPlansData.map(plan => ({
        ...plan,
        allowed_cnpjs: plan.allowed_cnpjs || 1
      }));
      setPlans(plansWithAllowedCnpjs);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (planData: Omit<Plan, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('plans')
        .insert({
          name: planData.name,
          employee_range: planData.employee_range,
          monthly_price: planData.monthly_price,
          semestral_price: planData.semestral_price,
          annual_price: planData.annual_price,
          allowed_cnpjs: planData.allowed_cnpjs,
          is_active: planData.is_active,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Plano criado com sucesso",
      });

      fetchPlans();
      return data;
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar plano",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePlan = async (id: string, planData: Partial<Plan>) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({
          name: planData.name,
          employee_range: planData.employee_range,
          monthly_price: planData.monthly_price,
          semestral_price: planData.semestral_price,
          annual_price: planData.annual_price,
          allowed_cnpjs: planData.allowed_cnpjs,
          is_active: planData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Plano atualizado com sucesso",
      });

      fetchPlans();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano",
        variant: "destructive",
      });
      return null;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Plano removido com sucesso",
      });

      fetchPlans();
    } catch (error) {
      console.error('Erro ao remover plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover plano",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [user?.id]);

  return {
    plans,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    refreshPlans: fetchPlans
  };
};
