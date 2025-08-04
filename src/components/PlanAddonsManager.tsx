import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Save, Users, Building, Eye, Bell, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlanAddons } from "@/hooks/usePlanAddons";
import { PlanAddon, PlanAddonFormData, PackageRange } from "@/types/plan-addons";

const PlanAddonsManager: React.FC = () => {
  const { planAddons, loading, refreshPlanAddons } = usePlanAddons();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<PlanAddon | null>(null);
  const [deletingAddonId, setDeletingAddonId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<PlanAddonFormData>({
    name: "",
    description: "",
    price_per_unit: 0,
    unit_type: "employee",
    is_active: true,
    pricing_type: "per_unit",
    package_ranges: [],
    package_increment: undefined
  });

  function getAddonIcon(unitType: string) {
    switch(unitType) {
      case 'employee':
        return <Users className="w-4 h-4" />;
      case 'cnpj':
        return <Building className="w-4 h-4" />;
      case 'face_recognition':
        return <Eye className="w-4 h-4" />;
      case 'notification':
        return <Bell className="w-4 h-4" />;
      default:
        return <Plus className="w-4 h-4" />;
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price_per_unit: 0,
      unit_type: "employee",
      is_active: true,
      pricing_type: "per_unit",
      package_ranges: [],
      package_increment: undefined
    });
    setEditingAddon(null);
  };

  const addPackageRange = () => {
    const newRange: PackageRange = { min: 1, max: 10, price: 0 };
    setFormData({
      ...formData,
      package_ranges: [...(formData.package_ranges || []), newRange]
    });
  };

  const updatePackageRange = (index: number, field: keyof PackageRange, value: number) => {
    const updatedRanges = [...(formData.package_ranges || [])];
    updatedRanges[index] = { ...updatedRanges[index], [field]: value };
    setFormData({ ...formData, package_ranges: updatedRanges });
  };

  const removePackageRange = (index: number) => {
    const updatedRanges = formData.package_ranges?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, package_ranges: updatedRanges });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      let result;
      if (editingAddon) {
        result = await supabase
          .from('plan_addons')
          .update({
            name: formData.name,
            description: formData.description,
            price_per_unit: formData.price_per_unit,
            unit_type: formData.unit_type,
            is_active: formData.is_active,
            pricing_type: formData.pricing_type,
            package_ranges: JSON.parse(JSON.stringify(formData.package_ranges)),
            package_increment: formData.package_increment,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAddon.id)
          .select();
      } else {
        result = await supabase
          .from('plan_addons')
          .insert({
            name: formData.name,
            description: formData.description,
            price_per_unit: formData.price_per_unit,
            unit_type: formData.unit_type,
            is_active: formData.is_active,
            pricing_type: formData.pricing_type,
            package_ranges: JSON.parse(JSON.stringify(formData.package_ranges)),
            package_increment: formData.package_increment,
            user_id: user?.id
          })
          .select();
      }

      if (result.error) throw result.error;
      
      toast({
        title: "Sucesso!",
        description: editingAddon ? "Adicional atualizado com sucesso" : "Adicional criado com sucesso",
      });
      
      refreshPlanAddons();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar adicional:', error);
      toast({
        title: "Erro",
        description: `Erro ao ${editingAddon ? 'atualizar' : 'criar'} adicional`,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (addon: PlanAddon) => {
    setEditingAddon(addon);
    setFormData({
      name: addon.name,
      description: addon.description,
      price_per_unit: addon.price_per_unit,
      unit_type: addon.unit_type,
      is_active: addon.is_active,
      pricing_type: addon.pricing_type || 'per_unit',
      package_ranges: addon.package_ranges || [],
      package_increment: addon.package_increment
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDeleteAddon = async (addon: PlanAddon) => {
    try {
      setDeletingAddonId(addon.id);

      const { error } = await supabase
        .from('plan_addons')
        .delete()
        .eq('id', addon.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Adicional excluído com sucesso",
      });

      refreshPlanAddons();
    } catch (error) {
      console.error('Erro ao excluir adicional:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir adicional",
        variant: "destructive",
      });
    } finally {
      setDeletingAddonId(null);
    }
  };

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const getUnitTypeLabel = (unitType: string) => {
    switch(unitType) {
      case 'employee':
        return 'funcionário';
      case 'cnpj':
        return 'CNPJ';
      case 'face_recognition':
        return 'funcionário';
      case 'notification':
        return 'funcionário';
      default:
        return 'unidade';
    }
  };

  const getPricingDescription = (addon: PlanAddon) => {
    if (addon.pricing_type === 'package') {
      if (addon.package_ranges && addon.package_ranges.length > 0) {
        return `Preços por pacote (${addon.package_ranges.length} faixas)`;
      }
      if (addon.package_increment) {
        return `A cada ${addon.package_increment} ${getUnitTypeLabel(addon.unit_type)}s`;
      }
    }
    return `${formatPrice(addon.price_per_unit)} por ${getUnitTypeLabel(addon.unit_type)}`;
  };

  if (loading) {
    return <div>Carregando adicionais de planos...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Gerenciar Adicionais de Plano</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Adicional
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddon ? "Editar Adicional" : "Criar Novo Adicional"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Adicional</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Funcionário Extra"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Adiciona um funcionário extra ao plano"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="unit_type">Tipo de Unidade</Label>
                <Select value={formData.unit_type} onValueChange={(value) => setFormData({ ...formData, unit_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Funcionário</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="face_recognition">Reconhecimento Facial</SelectItem>
                    <SelectItem value="notification">Notificação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pricing_type">Tipo de Precificação</Label>
                <Select value={formData.pricing_type} onValueChange={(value: 'per_unit' | 'package') => setFormData({ ...formData, pricing_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_unit">Por Unidade</SelectItem>
                    <SelectItem value="package">Por Pacote</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.pricing_type === 'per_unit' && (
                <div>
                  <Label htmlFor="price_per_unit">Preço por Unidade</Label>
                  <Input
                    id="price_per_unit"
                    type="number"
                    step="0.01"
                    value={formData.price_per_unit}
                    onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    required
                  />
                </div>
              )}

              {formData.pricing_type === 'package' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Faixas de Pacotes</Label>
                    <Button type="button" onClick={addPackageRange} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Faixa
                    </Button>
                  </div>

                  {formData.package_ranges?.map((range, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <div className="flex-1">
                        <Label className="text-xs">Min</Label>
                        <Input
                          type="number"
                          value={range.min}
                          onChange={(e) => updatePackageRange(index, 'min', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Max</Label>
                        <Input
                          type="number"
                          value={range.max}
                          onChange={(e) => updatePackageRange(index, 'max', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Preço</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={range.price}
                          onChange={(e) => updatePackageRange(index, 'price', parseFloat(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePackageRange(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  <div>
                    <Label htmlFor="package_increment">Incremento de Pacote</Label>
                    <Input
                      id="package_increment"
                      type="number"
                      value={formData.package_increment || ''}
                      onChange={(e) => setFormData({ ...formData, package_increment: parseInt(e.target.value) || undefined })}
                      placeholder="Ex: 100 (para incrementos a cada 100 unidades)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Usado para pacotes incrementais (ex: a cada 100 funcionários)
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  {editingAddon ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {planAddons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum adicional encontrado. Crie seu primeiro adicional!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {planAddons.map((addon) => (
                <div 
                  key={addon.id} 
                  className={`border rounded-lg p-4 ${addon.is_active ? 'bg-white' : 'bg-gray-50 opacity-70'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700">
                          {getAddonIcon(addon.unit_type)}
                        </span>
                        <h3 className="font-semibold text-lg">{addon.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${addon.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {addon.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                          {addon.pricing_type === 'package' ? 'Pacote' : 'Por Unidade'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{addon.description}</p>
                      <p className="mt-2 font-medium text-blue-600">
                        {getPricingDescription(addon)}
                      </p>
                      {addon.pricing_type === 'package' && addon.package_ranges && addon.package_ranges.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          <p className="font-medium mb-1">Faixas de preço:</p>
                          {addon.package_ranges.map((range, index) => (
                            <p key={index}>
                              {range.min}-{range.max} {getUnitTypeLabel(addon.unit_type)}s: {formatPrice(range.price)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(addon)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAddon(addon)}
                        disabled={deletingAddonId === addon.id}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanAddonsManager;
