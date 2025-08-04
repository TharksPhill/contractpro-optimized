import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTechnicalVisitServices, TechnicalVisitService } from "@/hooks/useTechnicalVisitServices";
import { useCosts } from "@/hooks/useCosts";
import { Plus, Settings, Trash2, Edit, Clock, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";

interface ServiceFormData {
  name: string;
  description: string;
  pricing_type: 'hourly' | 'fixed';
  fixed_price: string;
  estimated_hours: string;
}

interface TechnicalVisitServiceModalProps {
  children?: React.ReactNode;
}

const TechnicalVisitServiceModal = ({ children }: TechnicalVisitServiceModalProps) => {
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState<TechnicalVisitService | null>(null);
  const { services, createService, updateService, deleteService } = useTechnicalVisitServices();
  const { employeeCosts } = useCosts();
  
  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<ServiceFormData>({
    defaultValues: {
      name: '',
      description: '',
      pricing_type: 'hourly',
      fixed_price: '',
      estimated_hours: ''
    }
  });

  const pricingType = watch('pricing_type');

  useEffect(() => {
    if (editingService) {
      setValue('name', editingService.name);
      setValue('description', editingService.description || '');
      setValue('pricing_type', editingService.pricing_type);
      setValue('fixed_price', editingService.fixed_price?.toString() || '');
      setValue('estimated_hours', editingService.estimated_hours?.toString() || '');
    } else {
      reset();
    }
  }, [editingService, setValue, reset]);

  const onSubmit = async (data: ServiceFormData) => {
    try {
      const serviceData = {
        name: data.name,
        description: data.description || undefined,
        pricing_type: data.pricing_type,
        fixed_price: data.pricing_type === 'fixed' ? parseFloat(data.fixed_price) || undefined : undefined,
        estimated_hours: data.pricing_type === 'hourly' ? parseFloat(data.estimated_hours) || undefined : undefined,
      };

      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, ...serviceData });
      } else {
        await createService.mutateAsync(serviceData);
      }
      
      reset();
      setEditingService(null);
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
    }
  };

  const handleEdit = (service: TechnicalVisitService) => {
    setEditingService(service);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este serviço?')) {
      await deleteService.mutateAsync(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateHourlyRate = () => {
    const activeEmployee = employeeCosts.find(emp => emp.is_active) || employeeCosts[0];
    if (!activeEmployee) return 0;
    
    const monthlyHours = 220;
    const totalMonthlyCost = activeEmployee.salary + (activeEmployee.benefits || 0) + (activeEmployee.taxes || 0);
    return totalMonthlyCost / monthlyHours;
  };

  const hourlyRate = calculateHourlyRate();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Gerenciar Serviços
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Gerenciar Serviços de Visita Técnica
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5" />
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Serviço *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Nome é obrigatório' })}
                    placeholder="Ex: Instalação, Treinamento, Configuração..."
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Descrição detalhada do serviço..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="pricing_type">Tipo de Precificação *</Label>
                  <Select 
                    value={pricingType} 
                    onValueChange={(value: 'hourly' | 'fixed') => setValue('pricing_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Por Hora (Baseado no salário do funcionário)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="fixed">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Valor Fixo</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {pricingType === 'hourly' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Valor por hora baseado no funcionário ativo:</strong> {formatCurrency(hourlyRate)}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="estimated_hours">Horas Estimadas *</Label>
                      <Input
                        id="estimated_hours"
                        type="number"
                        step="0.5"
                        {...register('estimated_hours', { 
                          required: pricingType === 'hourly' ? 'Horas estimadas são obrigatórias' : false 
                        })}
                        placeholder="Ex: 2.5"
                      />
                      {errors.estimated_hours && (
                        <p className="text-sm text-red-600 mt-1">{errors.estimated_hours.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {pricingType === 'fixed' && (
                  <div>
                    <Label htmlFor="fixed_price">Valor Fixo (R$) *</Label>
                    <Input
                      id="fixed_price"
                      type="number"
                      step="0.01"
                      {...register('fixed_price', { 
                        required: pricingType === 'fixed' ? 'Valor fixo é obrigatório' : false 
                      })}
                      placeholder="Ex: 150.00"
                    />
                    {errors.fixed_price && (
                      <p className="text-sm text-red-600 mt-1">{errors.fixed_price.message}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingService ? 'Atualizar' : 'Criar'} Serviço
                  </Button>
                  {editingService && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setEditingService(null);
                        reset();
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Lista de serviços */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Serviços Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum serviço cadastrado ainda.</p>
                  <p className="text-sm">Crie seu primeiro serviço usando o formulário ao lado.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <div key={service.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{service.name}</h4>
                            <Badge variant={service.pricing_type === 'hourly' ? 'default' : 'secondary'}>
                              {service.pricing_type === 'hourly' ? (
                                <Clock className="w-3 h-3 mr-1" />
                              ) : (
                                <DollarSign className="w-3 h-3 mr-1" />
                              )}
                              {service.pricing_type === 'hourly' ? 'Por hora' : 'Fixo'}
                            </Badge>
                          </div>
                          
                          {service.description && (
                            <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                          )}
                          
                          <div className="text-sm">
                            {service.pricing_type === 'hourly' ? (
                              <div className="text-blue-600">
                                <span className="font-medium">{service.estimated_hours}h</span> × {formatCurrency(hourlyRate)} = {formatCurrency((service.estimated_hours || 0) * hourlyRate)}
                              </div>
                            ) : (
                              <div className="text-green-600 font-medium">
                                {formatCurrency(service.fixed_price || 0)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1 ml-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(service)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TechnicalVisitServiceModal;