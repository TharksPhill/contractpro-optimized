import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Calculator, 
  Calendar,
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { useCosts, CompanyCost, CompanyCostProjection } from "@/hooks/useCosts";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

interface CompanyCostForm {
  category: string;
  description: string;
  monthly_cost: number;
  cost_type: string;
  projection_start_date?: string;
  projection_end_date?: string;
  due_date?: string;
}

interface ProjectionForm {
  projected_cost: number;
  actual_cost: number;
  notes: string;
}

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const categoryLabels = {
  salaries: "Salários + Encargos",
  electricity: "Energia Elétrica", 
  rent: "Aluguel + IPTU",
  water: "Água",
  internet_phone: "Internet + Telefone",
  accounting: "Contabilidade",
  marketing: "Marketing",
  fuel: "Combustível",
  maintenance: "Manutenção",
  office_supplies: "Material Escritório",
  other: "Outros"
};

const EnhancedCompanyCosts = () => {
  const { 
    companyCosts, 
    costProjections,
    loading, 
    saveCompanyCost, 
    updateCompanyCost, 
    deleteCompanyCost,
    generateProjections,
    generateProjectionsWithDates,
    getCostsByPeriod,
    updateProjection,
    updateActualCost,
    fetchCostProjections,
    getMonthlyCostSummary
  } = useCosts();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<CompanyCost | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1,2,3,4,5,6,7,8,9,10,11,12]);
  const [editingProjection, setEditingProjection] = useState<CompanyCostProjection | null>(null);
  const [projectionDialogOpen, setProjectionDialogOpen] = useState(false);
  const [showMonthSelection, setShowMonthSelection] = useState(false);
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [usePeriodSelection, setUsePeriodSelection] = useState(false);
  const [selectedMonthForDetails, setSelectedMonthForDetails] = useState<number | null>(null);
  const [showCostDetails, setShowCostDetails] = useState(false);
  const [monthCosts, setMonthCosts] = useState<any[]>([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CompanyCostForm>({
    defaultValues: {
      category: "",
      description: "",
      monthly_cost: 0,
      cost_type: "fixed",
      projection_start_date: undefined,
      projection_end_date: undefined,
      due_date: undefined
    }
  });

  const { register: registerProjection, handleSubmit: handleSubmitProjection, reset: resetProjection, setValue: setProjectionValue } = useForm<ProjectionForm>();
  
  const { toast } = useToast();

  useEffect(() => {
    fetchCostProjections(selectedYear);
  }, [selectedYear]);

  const onSubmit = async (data: CompanyCostForm) => {
    try {
      let savedCost;
      const costData = {
        ...data,
        is_active: true
      };
      
      if (editingCost) {
        await updateCompanyCost(editingCost.id, costData);
        savedCost = editingCost;
      } else {
        savedCost = await saveCompanyCost(costData);
      }

      // Sempre gerar projeções após cadastrar/editar um custo
      if (savedCost) {
        const costId = editingCost?.id || savedCost.id;
        
        if (usePeriodSelection && data.projection_start_date && data.projection_end_date) {
          // Usar período customizado
          await generateProjectionsWithDates(costId, data.projection_start_date, data.projection_end_date);
        } else {
          // Usar seleção de meses para o ano atual
          const months = selectedMonths.length > 0 ? selectedMonths : [1,2,3,4,5,6,7,8,9,10,11,12];
          await generateProjections(costId, selectedYear, selectedYear, months);
        }
        
        // Recarregar projeções para o ano atual sendo visualizado
        await fetchCostProjections(selectedYear);
      }

      setIsDialogOpen(false);
      setEditingCost(null);
      reset();
      setSelectedMonths([1,2,3,4,5,6,7,8,9,10,11,12]); // Reset selected months
    } catch (error) {
      console.error("Erro ao salvar custo:", error);
    }
  };

  const onSubmitProjection = async (data: ProjectionForm) => {
    try {
      if (editingProjection) {
        // Atualizar valor projetado e observações
        await updateProjection(editingProjection.id, data.projected_cost, data.notes);
        
        // Atualizar valor real se fornecido
        if (data.actual_cost !== undefined && data.actual_cost !== null) {
          await updateActualCost(editingProjection.id, data.actual_cost);
        }
      }
      setProjectionDialogOpen(false);
      setEditingProjection(null);
      resetProjection();
    } catch (error) {
      console.error("Erro ao atualizar projeção:", error);
    }
  };

  const handleEdit = (cost: CompanyCost) => {
    setEditingCost(cost);
    setValue("category", cost.category);
    setValue("description", cost.description);
    setValue("monthly_cost", cost.monthly_cost);
    setValue("cost_type", cost.cost_type);
    setValue("projection_start_date", cost.projection_start_date || undefined);
    setValue("projection_end_date", cost.projection_end_date || undefined);
    setValue("due_date", cost.due_date || undefined);
    
    setIsDialogOpen(true);
  };

  const handleEditProjection = (projection: CompanyCostProjection) => {
    setEditingProjection(projection);
    setProjectionValue("projected_cost", projection.projected_cost);
    setProjectionValue("actual_cost", projection.actual_cost || 0);
    setProjectionValue("notes", projection.notes || "");
    setProjectionDialogOpen(true);
  };

  const handleGenerateProjections = async (costId: string) => {
    try {
      await generateProjections(costId, selectedYear, selectedYear, selectedMonths);
      await fetchCostProjections(selectedYear);
    } catch (error) {
      console.error("Erro ao gerar projeções:", error);
    }
  };

  const handleMonthToggle = (month: number) => {
    setSelectedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month].sort()
    );
  };

  // Nova função para gerar projeções por período
  const generateProjectionsForPeriod = async (costId: string, startDate: string, endDate: string) => {
    try {
      await generateProjectionsWithDates(costId, startDate, endDate);
      // Recarregar projeções
      await fetchCostProjections(selectedYear);
    } catch (error) {
      console.error("Erro ao gerar projeções por período:", error);
    }
  };

  // Função para mostrar detalhes dos custos de um mês específico
  const handleShowCostDetails = async (month: number) => {
    try {
      const costs = await getCostsByPeriod(selectedYear, month);
      setMonthCosts(costs);
      setSelectedMonthForDetails(month);
      setShowCostDetails(true);
    } catch (error) {
      console.error('Erro ao buscar custos do período:', error);
    }
  };

  const nonTaxCosts = companyCosts.filter(cost => cost.category !== 'tax');
  const activeCosts = nonTaxCosts.filter(cost => cost.is_active);
  const totalMonthlyCost = activeCosts.reduce((sum, cost) => sum + cost.monthly_cost, 0);

  // Calcular resumo mensal para o ano selecionado
  const monthlyBreakdown = Array.from({length: 12}, (_, i) => {
    const month = i + 1;
    const summary = getMonthlyCostSummary(selectedYear, month);
    return {
      month,
      monthName: monthNames[i],
      ...summary
    };
  });

  const yearlyProjected = monthlyBreakdown.reduce((sum, month) => sum + month.projected, 0);
  const yearlyActual = monthlyBreakdown.reduce((sum, month) => sum + month.actual, 0);

  // Calcular dados com base no modo de visualização
  const getCurrentPeriodData = () => {
    if (viewMode === 'yearly') {
      return {
        projected: yearlyProjected,
        actual: yearlyActual,
        variance: yearlyActual - yearlyProjected,
        periodLabel: `Ano ${selectedYear}`
      };
    } else {
      const monthData = getMonthlyCostSummary(selectedYear, selectedMonth);
      return {
        projected: monthData.projected,
        actual: monthData.actual,
        variance: monthData.variance,
        periodLabel: `${monthNames[selectedMonth - 1]} ${selectedYear}`
      };
    }
  };

  const periodData = getCurrentPeriodData();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando custos da empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Building className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custos da Empresa</h1>
            <p className="text-gray-600">Gerencie custos operacionais e suas projeções mensais</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro de visualização */}
          <Select value={viewMode} onValueChange={(value: 'monthly' | 'yearly') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>

          {/* Seletor de ano */}
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({length: 5}, (_, i) => {
                const year = new Date().getFullYear() + i - 2;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Seletor de mês (apenas no modo mensal) */}
          {viewMode === 'monthly' && (
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, index) => (
                  <SelectItem key={index} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Custo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCost ? "Editar Custo" : "Adicionar Custo"}
                </DialogTitle>
                <DialogDescription>
                  {editingCost ? "Edite os dados do custo" : "Cadastre um novo custo com projeções mensais"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select onValueChange={(value) => setValue("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="cost_type">Tipo de Custo</Label>
                    <Select onValueChange={(value: 'fixed' | 'variable') => setValue("cost_type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixo</SelectItem>
                        <SelectItem value="variable">Variável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    {...register("description", { required: "Descrição é obrigatória" })}
                    placeholder="Descreva o custo detalhadamente"
                    rows={2}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="monthly_cost">Valor Base Mensal (R$)</Label>
                  <Input
                    id="monthly_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("monthly_cost", { 
                      required: "Valor é obrigatório",
                      min: { value: 0, message: "Valor deve ser positivo" }
                    })}
                    placeholder="0,00"
                  />
                  {errors.monthly_cost && (
                    <p className="text-sm text-red-500 mt-1">{errors.monthly_cost.message}</p>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="generate_projections"
                      checked={showMonthSelection}
                      onCheckedChange={(checked) => {
                        setShowMonthSelection(checked);
                      }}
                    />
                    <Label htmlFor="generate_projections">Gerar projeções mensais</Label>
                  </div>
                </div>

                {showMonthSelection && (
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Switch
                          id="period_selection"
                          checked={usePeriodSelection}
                          onCheckedChange={setUsePeriodSelection}
                        />
                        <Label htmlFor="period_selection" className="text-sm font-medium">
                          Usar período personalizado (data início/fim)
                        </Label>
                      </div>
                    </div>
                    
                    {usePeriodSelection ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="projection_start_date" className="text-sm font-medium">Data de Início:</Label>
                          <Input
                            id="projection_start_date"
                            type="date"
                            {...register("projection_start_date", { required: usePeriodSelection })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="projection_end_date" className="text-sm font-medium">Data de Fim:</Label>
                          <Input
                            id="projection_end_date"
                            type="date"
                            {...register("projection_end_date", { required: usePeriodSelection })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Selecione os meses para projeção ({selectedYear}):</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {monthNames.map((month, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Checkbox
                                id={`month-${index}`}
                                checked={selectedMonths.includes(index + 1)}
                                onCheckedChange={() => handleMonthToggle(index + 1)}
                              />
                              <Label htmlFor={`month-${index}`} className="text-sm">{month}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="due_date">Data de Vencimento</Label>
                    <input
                      type="date"
                      id="due_date"
                      {...register("due_date")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">
                      Opcional: Data de vencimento recorrente deste custo (ex: todo dia 15)
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    setShowMonthSelection(false);
                    setUsePeriodSelection(false);
                    setSelectedMonths([1,2,3,4,5,6,7,8,9,10,11,12]);
                    setEditingCost(null);
                    reset();
                  }}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingCost ? "Atualizar" : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Custo Base Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalMonthlyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {activeCosts.length} custos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Projetado - {periodData.periodLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {periodData.projected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {viewMode === 'yearly' ? 'Total anual projetado' : 'Total mensal projetado'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Real - {periodData.periodLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {periodData.actual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {viewMode === 'yearly' ? 'Total anual realizado' : 'Total mensal realizado'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Variação - {periodData.periodLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${periodData.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {periodData.variance >= 0 ? '+' : ''}
              R$ {periodData.variance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Real vs Projetado
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="costs" className="w-full">
        <TabsList>
          <TabsTrigger value="costs">Custos Cadastrados</TabsTrigger>
          <TabsTrigger value="projections">Projeções Mensais {selectedYear}</TabsTrigger>
        </TabsList>

        <TabsContent value="costs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Custos</CardTitle>
              <CardDescription>
                Gerencie todos os custos da empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nonTaxCosts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor Mensal</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nonTaxCosts.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell>
                          {categoryLabels[cost.category as keyof typeof categoryLabels] || cost.category}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate">{cost.description}</p>
                        </TableCell>
                        <TableCell className="font-bold">
                          R$ {cost.monthly_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{cost.cost_type}</span>
                        </TableCell>
                        <TableCell>
                          {cost.due_date ? (
                            <span className="text-sm text-gray-600">
                              Todo dia {new Date(cost.due_date + 'T00:00:00').getDate()}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cost.is_active ? "default" : "secondary"}>
                            {cost.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                generateProjectionsWithDates(
                                  cost.id,
                                  `${selectedYear}-01-01`,
                                  `${selectedYear + 2}-12-31`,
                                  true // Só atualizar meses futuros
                                );
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Gerar Projeções Futuras
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(cost)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteCompanyCost(cost.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum custo cadastrado</h3>
                  <p className="text-gray-500 mb-4">Comece adicionando o primeiro custo da sua empresa</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Custo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Projeções Mensais - {selectedYear}</CardTitle>
              <CardDescription>
                Visualize e edite as projeções de custos mês a mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {monthlyBreakdown.map((month) => (
                  <Card key={month.month} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span>{month.monthName}</span>
                        <Calendar className="h-4 w-4" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Projetado:</span>
                          <span className="font-bold text-blue-600">
                            R$ {month.projected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {month.hasActualData && (
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-500">Real:</span>
                            <span className="font-bold text-green-600">
                              R$ {month.actual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Variação:</span>
                          <span className={`font-bold ${month.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {month.variance >= 0 ? '+' : ''}
                            R$ {month.variance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                       </div>
                        <div className="space-y-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              // Buscar a primeira projeção deste mês para editar
                              const monthProjections = costProjections.filter(p => 
                                p.year === selectedYear && p.month === month.month
                              );
                              if (monthProjections.length > 0) {
                                handleEditProjection(monthProjections[0]);
                              } else {
                                // Se não há projeções para este mês, criar uma fictícia para edição
                                const dummyProjection = {
                                  id: `dummy-${selectedYear}-${month.month}`,
                                  user_id: '',
                                  company_cost_id: '',
                                  year: selectedYear,
                                  month: month.month,
                                  projected_cost: month.projected,
                                  actual_cost: month.actual,
                                  notes: '',
                                  created_at: '',
                                  updated_at: '',
                                  is_edited: false
                                };
                                handleEditProjection(dummyProjection);
                              }
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Projeção
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => handleShowCostDetails(month.month)}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Ver Custos
                          </Button>
                        </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para editar projeção */}
      <Dialog open={projectionDialogOpen} onOpenChange={setProjectionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Projeção</DialogTitle>
            <DialogDescription>
              Ajuste o valor projetado e adicione observações
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitProjection(onSubmitProjection)} className="space-y-4">
            <div>
              <Label htmlFor="projected_cost">Valor Projetado (R$)</Label>
              <Input
                id="projected_cost"
                type="number"
                step="0.01"
                min="0"
                {...registerProjection("projected_cost", { required: true })}
              />
            </div>

            <div>
              <Label htmlFor="actual_cost">Valor Real (R$)</Label>
              <Input
                id="actual_cost"
                type="number"
                step="0.01"
                min="0"
                {...registerProjection("actual_cost")}
                placeholder="Deixe vazio se ainda não realizado"
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...registerProjection("notes")}
                placeholder="Adicione observações sobre esta projeção..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setProjectionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para mostrar custos específicos do mês */}
      <Dialog open={showCostDetails} onOpenChange={setShowCostDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Custos Definidos - {selectedMonthForDetails ? monthNames[selectedMonthForDetails - 1] : ''} {selectedYear}
            </DialogTitle>
            <DialogDescription>
              Custos que estão ativos neste período específico
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {monthCosts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Custo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthCosts.map((cost, index) => (
                    <TableRow key={cost.cost_id || index}>
                      <TableCell className="font-medium">
                        {cost.cost_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[cost.category as keyof typeof categoryLabels] || cost.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-gray-600 truncate">
                          {cost.cost_description}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        R$ {Number(cost.monthly_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                             onClick={() => {
                               // Buscar o custo completo pelo ID para editar
                               const costToEdit = companyCosts.find(c => c.id === cost.cost_id);
                               if (costToEdit) {
                                 handleEdit(costToEdit);
                                 setShowCostDetails(false);
                               }
                             }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (cost.cost_id && window.confirm('Tem certeza que deseja excluir este custo?')) {
                                 try {
                                   await deleteCompanyCost(cost.cost_id);
                                   // Recarregar dados
                                   await fetchCostProjections(selectedYear);
                                   await handleShowCostDetails(selectedMonthForDetails!);
                                   toast({
                                     title: "Custo excluído",
                                     description: "O custo foi removido com sucesso.",
                                   });
                                 } catch (error) {
                                   console.error('Erro ao excluir custo:', error);
                                   toast({
                                     title: "Erro",
                                     description: "Não foi possível excluir o custo.",
                                     variant: "destructive",
                                   });
                                 }
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum custo específico encontrado
                </h3>
                <p className="text-gray-500">
                  Este mês não possui custos com períodos específicos definidos
                </p>
              </div>
            )}
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Total do período:</span>
                <span className="font-bold text-lg text-green-600">
                  R$ {monthCosts.reduce((sum, cost) => sum + Number(cost.monthly_cost), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowCostDetails(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedCompanyCosts;