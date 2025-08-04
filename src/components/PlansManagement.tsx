import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, DollarSign, Settings, Calculator, Building2, FileText, Car } from "lucide-react";
import { usePlans } from "@/hooks/usePlans";
import { Plan, PlanFormData } from "@/types/plans";
import { useToast } from "@/hooks/use-toast";
import PlanAddonsManager from "./PlanAddonsManager";
import QuoteGenerator from "./QuoteGenerator";
import TechnicalVisitSettingsModal from "./TechnicalVisitSettingsModal";

const PlansManagement = () => {
  const { plans, loading, createPlan, updatePlan, deletePlan } = usePlans();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [activeTab, setActiveTab] = useState("plans");
  const [isQuoteGeneratorOpen, setIsQuoteGeneratorOpen] = useState(false);
  const [isTechnicalVisitModalOpen, setIsTechnicalVisitModalOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    employee_range: "",
    monthly_price: 0,
    semestral_price: 0,
    annual_price: 0,
    allowed_cnpjs: 1,
    is_active: true
  });

  const calculatePrices = (monthlyPrice: number) => {
    const semestralPrice = monthlyPrice * 6;
    const annualPrice = monthlyPrice * 12;
    
    setFormData(prev => ({
      ...prev,
      semestral_price: semestralPrice,
      annual_price: annualPrice
    }));
  };

  const suggestCNPJs = (employeeRange: string) => {
    const range = employeeRange.toLowerCase();
    let suggestedCNPJs = 1;
    
    if (range.includes('21-50') || range.includes('21') && range.includes('50')) {
      suggestedCNPJs = 2;
    } else if (range.includes('51-100') || range.includes('51') && range.includes('100')) {
      suggestedCNPJs = 3;
    } else if (range.includes('101-200') || range.includes('101') && range.includes('200')) {
      suggestedCNPJs = 4;
    } else if (range.includes('201') || parseInt(range.split('-')[0]) > 200) {
      suggestedCNPJs = 5;
    }
    
    setFormData(prev => ({ ...prev, allowed_cnpjs: suggestedCNPJs }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      employee_range: "",
      monthly_price: 0,
      semestral_price: 0,
      annual_price: 0,
      allowed_cnpjs: 1,
      is_active: true
    });
    setEditingPlan(null);
  };

  const handleMonthlyPriceChange = (value: string) => {
    const monthlyPrice = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, monthly_price: monthlyPrice }));
    calculatePrices(monthlyPrice);
  };

  const handleEmployeeRangeChange = (value: string) => {
    setFormData(prev => ({ ...prev, employee_range: value }));
    suggestCNPJs(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.employee_range || formData.allowed_cnpjs < 1) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, formData);
      } else {
        await createPlan(formData);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
    }
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      employee_range: plan.employee_range,
      monthly_price: plan.monthly_price,
      semestral_price: plan.semestral_price,
      annual_price: plan.annual_price,
      allowed_cnpjs: plan.allowed_cnpjs || 1,
      is_active: plan.is_active
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (plan: Plan) => {
    if (confirm(`Tem certeza que deseja remover o plano "${plan.name}"?`)) {
      await deletePlan(plan.id);
    }
  };

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  if (loading) {
    return <div>Carregando planos...</div>;
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Gerenciamento de Planos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="plans">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Planos
                </TabsTrigger>
                <TabsTrigger value="addons">
                  <Settings className="w-4 h-4 mr-2" />
                  Adicionais
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex space-x-2">
              <Button 
                onClick={() => {
                  console.log('🔧 Clicou no botão Visita Técnica');
                  console.log('🔧 Estado atual isTechnicalVisitModalOpen:', isTechnicalVisitModalOpen);
                  setIsTechnicalVisitModalOpen(true);
                  console.log('🔧 Definiu isTechnicalVisitModalOpen para true');
                }}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Car className="w-4 h-4 mr-2" />
                Visita Técnica
              </Button>
              <Button 
                onClick={() => setIsQuoteGeneratorOpen(true)}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Gerar Orçamento
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} className="w-full">
            <TabsContent value="plans" className="mt-0">
              <div className="flex justify-end mb-4">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openCreateDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Plano
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingPlan ? "Editar Plano" : "Criar Novo Plano"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome do Plano</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Plano Básico"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="employee_range">Faixa de Funcionários</Label>
                        <Input
                          id="employee_range"
                          value={formData.employee_range}
                          onChange={(e) => handleEmployeeRangeChange(e.target.value)}
                          placeholder="Ex: 1-5"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="allowed_cnpjs" className="flex items-center gap-2">
                          CNPJs Permitidos
                          <Building2 className="w-4 h-4 text-blue-500" />
                        </Label>
                        <Input
                          id="allowed_cnpjs"
                          type="number"
                          min="1"
                          value={formData.allowed_cnpjs}
                          onChange={(e) => setFormData({ ...formData, allowed_cnpjs: parseInt(e.target.value) || 1 })}
                          placeholder="1"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Quantidade de CNPJs que podem ser gerenciados neste plano
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="monthly_price" className="flex items-center gap-2">
                          Preço Mensal
                          <Calculator className="w-4 h-4 text-blue-500" />
                        </Label>
                        <Input
                          id="monthly_price"
                          type="number"
                          step="0.01"
                          value={formData.monthly_price}
                          onChange={(e) => handleMonthlyPriceChange(e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="semestral_price" className="flex items-center gap-2 text-gray-600">
                          Preço Semestral 
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Calculado automaticamente</span>
                        </Label>
                        <Input
                          id="semestral_price"
                          type="number"
                          step="0.01"
                          value={formData.semestral_price}
                          readOnly
                          className="bg-gray-50 cursor-not-allowed"
                          placeholder="Será calculado automaticamente"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Calculado como: Preço Mensal × 6
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="annual_price" className="flex items-center gap-2 text-gray-600">
                          Preço Anual
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Calculado automaticamente</span>
                        </Label>
                        <Input
                          id="annual_price"
                          type="number"
                          step="0.01"
                          value={formData.annual_price}
                          readOnly
                          className="bg-gray-50 cursor-not-allowed"
                          placeholder="Será calculado automaticamente"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Calculado como: Preço Mensal × 12
                        </p>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {editingPlan ? "Salvar" : "Criar"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-4">
                {plans.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum plano encontrado. Crie seu primeiro plano!
                  </div>
                ) : (
                  plans.map((plan) => (
                    <div key={plan.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{plan.name}</h3>
                            <Badge variant="outline">{plan.employee_range} funcionários</Badge>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {plan.allowed_cnpjs || 1} CNPJ{(plan.allowed_cnpjs || 1) > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Mensal:</span>
                              <p className="font-medium text-green-600">{formatPrice(plan.monthly_price)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Semestral:</span>
                              <p className="font-medium text-blue-600">{formatPrice(plan.semestral_price)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Anual:</span>
                              <p className="font-medium text-purple-600">{formatPrice(plan.annual_price)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(plan)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(plan)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="addons" className="mt-0">
              <PlanAddonsManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <QuoteGenerator 
        isOpen={isQuoteGeneratorOpen} 
        onClose={() => setIsQuoteGeneratorOpen(false)} 
      />
      
      {console.log('🔧 Renderizando TechnicalVisitSettingsModal com isOpen:', isTechnicalVisitModalOpen)}
      <TechnicalVisitSettingsModal 
        isOpen={isTechnicalVisitModalOpen}
        onClose={() => setIsTechnicalVisitModalOpen(false)}
      />
    </>
  );
};

export default PlansManagement;
