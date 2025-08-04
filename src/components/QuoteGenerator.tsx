import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, FileText, Plus, Minus, Building2, Users, DollarSign, Copy, Download, Percent, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePlans } from "@/hooks/usePlans";
import { usePlanAddons } from "@/hooks/usePlanAddons";
import { Plan } from "@/types/plans";
import { PlanAddon } from "@/types/plan-addons";
import { generateQuotePDF, generateQuoteText, QuoteData as QuoteDataType } from "@/utils/quotePdfGenerator";

interface QuoteGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedAddon {
  addon: PlanAddon;
  quantity: number;
}

interface DiscountData {
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
}

interface QuoteData {
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  clientPhone: string;
  selectedPlan: Plan | null;
  planPeriod: 'monthly' | 'semestral' | 'annual';
  selectedAddons: SelectedAddon[];
  systemName: string;
  systemDescription: string;
  validityDays: number;
  discount: DiscountData;
}

const QuoteGenerator: React.FC<QuoteGeneratorProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const { plans, loading: plansLoading } = usePlans();
  const { planAddons, loading: addonsLoading } = usePlanAddons();

  const [quoteData, setQuoteData] = useState<QuoteData>({
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    clientPhone: "",
    selectedPlan: null,
    planPeriod: 'monthly',
    selectedAddons: [],
    systemName: "RHiD + iDSecure",
    systemDescription: "Sistema completo de gestão de ponto eletrônico (RHiD) integrado com controle de acesso (iDSecure)",
    validityDays: 30,
    discount: {
      type: 'percentage',
      value: 0,
      description: ''
    }
  });

  // Log dos addons apenas quando mudam, sem forçar refresh
  useEffect(() => {
    if (planAddons.length > 0) {
      console.log('=== ADDONS CARREGADOS NO QUOTE GENERATOR ===');
      console.log('Total de addons:', planAddons.length);
      
      // Filtrar addons únicos por nome para evitar duplicatas
      const uniqueAddons = planAddons.filter((addon, index, self) => 
        index === self.findIndex(a => a.name === addon.name)
      );
      
      console.log('Addons únicos após filtro:', uniqueAddons.length);
      uniqueAddons.forEach((addon, index) => {
        console.log(`Addon ${index + 1}:`, {
          name: addon.name,
          price_per_unit: addon.price_per_unit,
          unit_type: addon.unit_type
        });
      });
      console.log('===========================================');
    }
  }, [planAddons]);

  const resetForm = () => {
    setQuoteData({
      clientName: "",
      clientEmail: "",
      clientCompany: "",
      clientPhone: "",
      selectedPlan: null,
      planPeriod: 'monthly',
      selectedAddons: [],
      systemName: "RHiD + iDSecure",
      systemDescription: "Sistema completo de gestão de ponto eletrônico (RHiD) integrado com controle de acesso (iDSecure)",
      validityDays: 30,
      discount: {
        type: 'percentage',
        value: 0,
        description: ''
      }
    });
  };

  const handlePlanSelect = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    setQuoteData(prev => ({ ...prev, selectedPlan: plan || null }));
  };

  const addAddon = (addon: PlanAddon) => {
    console.log('=== ADICIONANDO ADDON ===');
    console.log('Addon sendo adicionado:', {
      name: addon.name,
      price_per_unit: addon.price_per_unit,
      unit_type: addon.unit_type
    });
    
    setQuoteData(prev => ({
      ...prev,
      selectedAddons: [...prev.selectedAddons, { addon, quantity: 1 }]
    }));
  };

  const removeAddon = (index: number) => {
    setQuoteData(prev => ({
      ...prev,
      selectedAddons: prev.selectedAddons.filter((_, i) => i !== index)
    }));
  };

  const updateAddonQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    setQuoteData(prev => ({
      ...prev,
      selectedAddons: prev.selectedAddons.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    }));
  };

  const calculatePlanPrice = () => {
    if (!quoteData.selectedPlan) return 0;
    
    switch (quoteData.planPeriod) {
      case 'semestral':
        return quoteData.selectedPlan.semestral_price;
      case 'annual':
        return quoteData.selectedPlan.annual_price;
      default:
        return quoteData.selectedPlan.monthly_price;
    }
  };

  const calculateAddonsTotal = () => {
    const addonsTotal = quoteData.selectedAddons.reduce((total, { addon, quantity }) => {
      console.log(`Calculando addon ${addon.name}: ${addon.price_per_unit} x ${quantity} = ${addon.price_per_unit * quantity}`);
      return total + (addon.price_per_unit * quantity);
    }, 0);

    // Multiplicar addons pelo período selecionado
    const periodMultiplier = getPlanPeriodMultiplier();
    return addonsTotal * periodMultiplier;
  };

  const getSubtotal = () => {
    return calculatePlanPrice() + calculateAddonsTotal();
  };

  const calculateDiscount = () => {
    const subtotal = getSubtotal();
    if (quoteData.discount.value <= 0) return 0;

    if (quoteData.discount.type === 'percentage') {
      return subtotal * (quoteData.discount.value / 100);
    } else {
      return Math.min(quoteData.discount.value, subtotal);
    }
  };

  const getTotalValue = () => {
    return getSubtotal() - calculateDiscount();
  };

  const updateDiscount = (field: keyof DiscountData, value: any) => {
    setQuoteData(prev => ({
      ...prev,
      discount: {
        ...prev.discount,
        [field]: value
      }
    }));
  };

  const getPlanPeriodMultiplier = () => {
    switch (quoteData.planPeriod) {
      case 'semestral': return 6;
      case 'annual': return 12;
      default: return 1;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPeriodLabel = () => {
    switch (quoteData.planPeriod) {
      case 'semestral': return 'Semestral (6 meses)';
      case 'annual': return 'Anual (12 meses)';
      default: return 'Mensal';
    }
  };

  // Filtrar addons únicos por nome para evitar duplicatas na exibição
  const uniqueAddons = planAddons.filter((addon, index, self) => 
    index === self.findIndex(a => a.name === addon.name)
  );

  const availableAddons = uniqueAddons.filter(addon => 
    !quoteData.selectedAddons.find(selected => selected.addon.id === addon.id)
  );

  const copyToClipboard = () => {
    const quoteDataForExport: QuoteDataType = {
      ...quoteData,
      selectedAddons: quoteData.selectedAddons
    };
    
    const quoteText = generateQuoteText(quoteDataForExport);
    navigator.clipboard.writeText(quoteText);
    toast({
      title: "Sucesso!",
      description: "Orçamento copiado para a área de transferência",
    });
  };

  const downloadQuoteText = () => {
    const quoteDataForExport: QuoteDataType = {
      ...quoteData,
      selectedAddons: quoteData.selectedAddons
    };
    
    const quoteText = generateQuoteText(quoteDataForExport);
    const element = document.createElement("a");
    const file = new Blob([quoteText], {type: 'text/plain; charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `orcamento-${quoteData.clientName.replace(/\s/g, '_')}-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Sucesso!",
      description: "Orçamento em texto baixado com sucesso",
    });
  };

  const downloadQuotePDF = async () => {
    try {
      const quoteDataForExport: QuoteDataType = {
        ...quoteData,
        selectedAddons: quoteData.selectedAddons
      };
      
      await generateQuotePDF(quoteDataForExport);
      
      toast({
        title: "Sucesso!",
        description: "PDF do orçamento baixado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (plansLoading || addonsLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Gerador de Orçamento - RHiD & iDSecure
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-6">
            {/* Dados do Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Dados do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="clientName">Nome do Cliente *</Label>
                  <Input
                    id="clientName"
                    value={quoteData.clientName}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Nome do cliente"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientCompany">Empresa</Label>
                  <Input
                    id="clientCompany"
                    value={quoteData.clientCompany}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, clientCompany: e.target.value }))}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={quoteData.clientEmail}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, clientEmail: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">Telefone</Label>
                    <Input
                      id="clientPhone"
                      value={quoteData.clientPhone}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, clientPhone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Plano */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Seleção de Plano
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="plan">Plano</Label>
                  <Select onValueChange={handlePlanSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - {plan.employee_range} funcionários
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {quoteData.selectedPlan && (
                  <div>
                    <Label htmlFor="period">Período de Contratação</Label>
                    <Select value={quoteData.planPeriod} onValueChange={(value: 'monthly' | 'semestral' | 'annual') => 
                      setQuoteData(prev => ({ ...prev, planPeriod: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">
                          Mensal - {formatCurrency(quoteData.selectedPlan.monthly_price)}
                        </SelectItem>
                        <SelectItem value="semestral">
                          Semestral - {formatCurrency(quoteData.selectedPlan.semestral_price)}
                        </SelectItem>
                        <SelectItem value="annual">
                          Anual - {formatCurrency(quoteData.selectedPlan.annual_price)}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Desconto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Desconto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="discountType">Tipo de Desconto</Label>
                  <Select 
                    value={quoteData.discount.type} 
                    onValueChange={(value: 'percentage' | 'fixed') => updateDiscount('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="discountValue">
                    Valor do Desconto {quoteData.discount.type === 'percentage' ? '(%)' : '(R$)'}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    min="0"
                    max={quoteData.discount.type === 'percentage' ? "100" : undefined}
                    step={quoteData.discount.type === 'percentage' ? "0.1" : "0.01"}
                    value={quoteData.discount.value}
                    onChange={(e) => updateDiscount('value', parseFloat(e.target.value) || 0)}
                    placeholder={quoteData.discount.type === 'percentage' ? "0.0" : "0,00"}
                  />
                </div>
                
                <div>
                  <Label htmlFor="discountDescription">Descrição do Desconto (opcional)</Label>
                  <Input
                    id="discountDescription"
                    value={quoteData.discount.description}
                    onChange={(e) => updateDiscount('description', e.target.value)}
                    placeholder="Ex: Desconto promocional, Cliente fidelidade, etc."
                  />
                </div>

                {quoteData.discount.value > 0 && (
                  <div className="bg-green-50 p-3 rounded border">
                    <p className="text-sm font-medium text-green-800">
                      Desconto aplicado: {formatCurrency(calculateDiscount())}
                    </p>
                    {quoteData.discount.type === 'percentage' && (
                      <p className="text-xs text-green-600">
                        {quoteData.discount.value}% sobre {formatCurrency(getSubtotal())}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Adicionais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Adicionais Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableAddons.map((addon) => (
                    <div key={addon.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{addon.name}</p>
                        <p className="text-xs text-gray-500">{addon.description}</p>
                        <p className="text-xs font-medium text-green-600">
                          {formatCurrency(addon.price_per_unit)} por {addon.unit_type}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addAddon(addon)}
                        className="ml-2"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {availableAddons.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Todos os adicionais foram selecionados
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview do Orçamento */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Preview do Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Plano Selecionado */}
                {quoteData.selectedPlan && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Plano Selecionado</h4>
                    <div className="bg-blue-50 p-3 rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{quoteData.selectedPlan.name}</p>
                          <p className="text-sm text-gray-600">{quoteData.selectedPlan.employee_range} funcionários</p>
                          <p className="text-sm text-gray-600">{getPeriodLabel()}</p>
                        </div>
                        <Badge variant="secondary">
                          {formatCurrency(calculatePlanPrice())}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Adicionais Selecionados */}
                {quoteData.selectedAddons.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Adicionais</h4>
                    <div className="space-y-2">
                      {quoteData.selectedAddons.map((item, index) => {
                        const periodMultiplier = getPlanPeriodMultiplier();
                        const addonTotalPeriod = item.addon.price_per_unit * item.quantity * periodMultiplier;
                        
                        return (
                          <div key={index} className="bg-green-50 p-3 rounded border">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.addon.name}</p>
                                <p className="text-xs text-gray-600">{item.addon.description}</p>
                                <p className="text-xs text-gray-500">
                                  {item.quantity}x por {periodMultiplier === 1 ? 'mês' : periodMultiplier + ' meses'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateAddonQuantity(index, item.quantity - 1)}
                                  className="w-6 h-6 p-0"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateAddonQuantity(index, item.quantity + 1)}
                                  className="w-6 h-6 p-0"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Badge variant="secondary" className="ml-2">
                                  {formatCurrency(addonTotalPeriod)}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeAddon(index)}
                                  className="w-6 h-6 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Resumo Financeiro */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(getSubtotal())}</span>
                  </div>
                  
                  {quoteData.discount.value > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>
                        Desconto {quoteData.discount.description && `(${quoteData.discount.description})`}
                        {quoteData.discount.type === 'percentage' && ` ${quoteData.discount.value}%`}
                      </span>
                      <span>-{formatCurrency(calculateDiscount())}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Total */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded border">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Valor Total ({getPeriodLabel()})
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(getTotalValue())}
                    </span>
                  </div>
                  {quoteData.planPeriod !== 'monthly' && (
                    <p className="text-xs text-gray-600 mt-1">
                      Equivale a {formatCurrency(getTotalValue() / getPlanPeriodMultiplier())} por mês
                    </p>
                  )}
                  {quoteData.discount.value > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Economia de {formatCurrency(calculateDiscount())}
                    </p>
                  )}
                </div>

                {/* Ações Atualizadas */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={copyToClipboard}
                      disabled={!quoteData.clientName || !quoteData.selectedPlan}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                    <Button
                      onClick={downloadQuoteText}
                      disabled={!quoteData.clientName || !quoteData.selectedPlan}
                      variant="outline"
                      size="sm"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Texto
                    </Button>
                  </div>
                  <Button
                    onClick={downloadQuotePDF}
                    disabled={!quoteData.clientName || !quoteData.selectedPlan}
                    className="w-full"
                  >
                    <File className="w-4 h-4 mr-2" />
                    Baixar PDF Moderno
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteGenerator;
