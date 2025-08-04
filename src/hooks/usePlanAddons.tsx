
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PlanAddon, PlanAddonFromDB } from "@/types/plan-addons";
import { useAuth } from "@/hooks/useAuth";

export const usePlanAddons = () => {
  const [planAddons, setPlanAddons] = useState<PlanAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Ordem fixa dos adicionais para manter consistência
  const ADDON_ORDER = [
    'Funcionários Extras',
    'CNPJs Extras', 
    'Reconhecimento Facial',
    'Notificações Premium'
  ];

  const convertDbDataToPlanAddon = (dbData: PlanAddonFromDB[]): PlanAddon[] => {
    console.log('=== CONVERTENDO DADOS DO DB ===');
    console.log('Dados recebidos do DB:', dbData);
    
    const converted = dbData.map(item => {
      const converted: PlanAddon = {
        ...item,
        pricing_type: (item.pricing_type === 'per_unit' || item.pricing_type === 'package') 
          ? item.pricing_type as 'per_unit' | 'package'
          : 'per_unit',
        package_ranges: Array.isArray(item.package_ranges) 
          ? item.package_ranges 
          : (typeof item.package_ranges === 'string' 
            ? JSON.parse(item.package_ranges) 
            : [])
      };
      console.log(`Convertido ${item.name}:`, converted);
      console.log(`Preço de ${item.name}:`, converted.price_per_unit);
      return converted;
    });
    
    // Ordenar os adicionais de acordo com a ordem fixa definida
    const orderedAddons = converted.sort((a, b) => {
      const indexA = ADDON_ORDER.indexOf(a.name);
      const indexB = ADDON_ORDER.indexOf(b.name);
      
      // Se ambos estão na lista de ordem, usar a ordem definida
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // Se apenas um está na lista, colocar o que está na lista primeiro
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // Se nenhum está na lista, manter ordem alfabética
      return a.name.localeCompare(b.name);
    });
    
    console.log('Dados convertidos e ordenados:', orderedAddons);
    console.log('==============================');
    return orderedAddons;
  };

  const createDefaultPlanAddons = async () => {
    if (!user?.id) {
      console.log('Usuário não logado, não é possível criar addons');
      return [];
    }

    console.log('=== CRIANDO ADDONS PADRÃO ===');

    const defaultAddons = [
      {
        name: 'Funcionários Extras',
        description: 'Funcionários adicionais além do limite do plano (por cada 100 funcionários)',
        price_per_unit: 149.00,
        unit_type: 'cada 100 funcionários',
        is_active: true,
        user_id: user.id,
        pricing_type: 'per_unit'
      },
      {
        name: 'CNPJs Extras',
        description: 'CNPJs adicionais além do limite do plano',
        price_per_unit: 33.00,
        unit_type: 'CNPJ',
        is_active: true,
        user_id: user.id,
        pricing_type: 'per_unit'
      },
      {
        name: 'Reconhecimento Facial',
        description: 'Funcionalidade de reconhecimento facial por funcionário',
        price_per_unit: 1.19,
        unit_type: 'funcionário',
        is_active: true,
        user_id: user.id,
        pricing_type: 'per_unit'
      },
      {
        name: 'Notificações Premium',
        description: 'Sistema de notificações premium por funcionário',
        price_per_unit: 5.00,
        unit_type: 'funcionário',
        is_active: true,
        user_id: user.id,
        pricing_type: 'per_unit'
      }
    ];

    try {
      // Buscar todos os addons existentes
      const { data: existingAddons, error: checkError } = await supabase
        .from('plan_addons')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (checkError) {
        console.error('Erro ao verificar addons existentes:', checkError);
        return [];
      }

      console.log('Addons existentes encontrados:', existingAddons);

      if (existingAddons && existingAddons.length > 0) {
        return convertDbDataToPlanAddon(existingAddons);
      } else {
        // Se não existem addons, criar os padrão
        const { data, error } = await supabase
          .from('plan_addons')
          .insert(defaultAddons)
          .select()
          .order('name'); // Adicionar ordenação na consulta

        if (error) {
          console.error('Erro ao criar addons padrão:', error);
          toast({
            title: "Erro",
            description: "Erro ao criar adicionais de planos padrão: " + error.message,
            variant: "destructive",
          });
          return [];
        }

        console.log('Addons padrão criados com sucesso:', data);
        const converted = convertDbDataToPlanAddon(data || []);
        console.log('Addons convertidos após criação:', converted);
        
        toast({
          title: "Sucesso",
          description: "Adicionais de planos criados com sucesso",
        });
        
        return converted;
      }
    } catch (error) {
      console.error('Erro ao criar addons padrão:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar adicionais de planos",
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchPlanAddons = async () => {
    if (!user?.id) {
      console.log('Usuário não logado, definindo loading como false');
      setLoading(false);
      return;
    }
    
    try {
      console.log('=== BUSCANDO PLAN ADDONS ===');
      console.log('Buscando plan addons para usuário:', user.id);
      
      // Buscar ou criar addons padrão se necessário
      const defaultAddonsData = await createDefaultPlanAddons();
      setPlanAddons(defaultAddonsData);
    } catch (error) {
      console.error('Erro inesperado ao carregar plan addons:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar adicionais de planos",
        variant: "destructive",
      });
      
      setPlanAddons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== useEffect EXECUTADO ===');
    console.log('user?.id:', user?.id);
    if (user?.id) {
      fetchPlanAddons();
    } else {
      console.log('Usuário não está definido ainda, aguardando...');
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    console.log('=== ESTADO planAddons MUDOU ===');
    console.log('Novo estado planAddons:', planAddons);
    console.log('Quantidade de addons:', planAddons.length);
    planAddons.forEach((addon, index) => {
      console.log(`Addon ${index + 1}:`, {
        name: addon.name,
        price_per_unit: addon.price_per_unit,
        tipo: typeof addon.price_per_unit,
        unit_type: addon.unit_type
      });
    });
    console.log('===============================');
  }, [planAddons]);

  useEffect(() => {
    console.log('=== USUÁRIO MUDOU ===');
    console.log('Novo usuário:', user);
    console.log('==================');
  }, [user]);

  return {
    planAddons,
    loading,
    refreshPlanAddons: fetchPlanAddons
  };
};
