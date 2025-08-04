import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Settings, DollarSign } from "lucide-react";
import { useVehicleSettings, VehicleSettingsFormData } from "@/hooks/useVehicleSettings";

interface VehicleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VehicleSettingsModal = ({ isOpen, onClose }: VehicleSettingsModalProps) => {
  const { settings, loading, updateSettings } = useVehicleSettings();
  const [formData, setFormData] = useState<VehicleSettingsFormData>({
    brand: "Toyota",
    model: "Corolla",
    year: 2025,
    license_plate: "",
    vehicle_type: "Passeio",
    fuel_type: "Gasolina",
    purchase_value: 50000.00,
    current_estimated_value: 45000.00,
    annual_ipva: 1200.00,
    annual_insurance: 2000.00,
    annual_maintenance: 3000.00,
    fuel_consumption: 12.5,
    annual_mileage: 15000,
    depreciation_rate: 10,
    fuel_price: 5.50
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        brand: settings.brand,
        model: settings.model,
        year: settings.year,
        license_plate: settings.license_plate || "",
        vehicle_type: settings.vehicle_type,
        fuel_type: settings.fuel_type,
        purchase_value: settings.purchase_value,
        current_estimated_value: settings.current_estimated_value,
        annual_ipva: settings.annual_ipva,
        annual_insurance: settings.annual_insurance,
        annual_maintenance: settings.annual_maintenance,
        fuel_consumption: settings.fuel_consumption,
        annual_mileage: settings.annual_mileage,
        depreciation_rate: settings.depreciation_rate,
        fuel_price: settings.fuel_price
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            Configurações do Veículo
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                Dados Básicos
              </TabsTrigger>
              <TabsTrigger value="costs" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Custos Anuais
              </TabsTrigger>
              <TabsTrigger value="operational" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Operacional
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="brand">Marca *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Ex: Toyota"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="model">Modelo *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Ex: Corolla"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="year">Ano *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2025 })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="license_plate">Placa</Label>
                  <Input
                    id="license_plate"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    placeholder="ABC-1234"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicle_type">Tipo de Veículo</Label>
                  <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Passeio">Passeio</SelectItem>
                      <SelectItem value="Utilitário">Utilitário</SelectItem>
                      <SelectItem value="Van">Van</SelectItem>
                      <SelectItem value="Caminhão">Caminhão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fuel_type">Combustível</Label>
                  <Select value={formData.fuel_type} onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gasolina">Gasolina</SelectItem>
                      <SelectItem value="Etanol">Etanol</SelectItem>
                      <SelectItem value="Flex">Flex</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="GNV">GNV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchase_value">Valor de Compra (R$) *</Label>
                  <Input
                    id="purchase_value"
                    type="number"
                    step="0.01"
                    value={formData.purchase_value}
                    onChange={(e) => setFormData({ ...formData, purchase_value: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="current_estimated_value">Valor Atual Estimado (R$)</Label>
                  <Input
                    id="current_estimated_value"
                    type="number"
                    step="0.01"
                    value={formData.current_estimated_value}
                    onChange={(e) => setFormData({ ...formData, current_estimated_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="costs" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="annual_ipva">IPVA Anual (R$)</Label>
                  <Input
                    id="annual_ipva"
                    type="number"
                    step="0.01"
                    value={formData.annual_ipva}
                    onChange={(e) => setFormData({ ...formData, annual_ipva: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="annual_insurance">Seguro Anual (R$)</Label>
                  <Input
                    id="annual_insurance"
                    type="number"
                    step="0.01"
                    value={formData.annual_insurance}
                    onChange={(e) => setFormData({ ...formData, annual_insurance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="annual_maintenance">Manutenção Anual (R$)</Label>
                  <Input
                    id="annual_maintenance"
                    type="number"
                    step="0.01"
                    value={formData.annual_maintenance}
                    onChange={(e) => setFormData({ ...formData, annual_maintenance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="depreciation_rate">Taxa Depreciação (%)</Label>
                  <Input
                    id="depreciation_rate"
                    type="number"
                    step="0.01"
                    value={formData.depreciation_rate}
                    onChange={(e) => setFormData({ ...formData, depreciation_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="annual_mileage">Quilometragem Anual (km)</Label>
                  <Input
                    id="annual_mileage"
                    type="number"
                    value={formData.annual_mileage}
                    onChange={(e) => setFormData({ ...formData, annual_mileage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </TabsContent>
            
              <TabsContent value="operational" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fuel_consumption">Consumo (km/L)</Label>
                    <Input
                      id="fuel_consumption"
                      type="number"
                      step="0.1"
                      value={formData.fuel_consumption}
                      onChange={(e) => setFormData({ ...formData, fuel_consumption: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fuel_price">Preço do Combustível (R$/L)</Label>
                    <Input
                      id="fuel_price"
                      type="number"
                      step="0.01"
                      value={formData.fuel_price}
                      onChange={(e) => setFormData({ ...formData, fuel_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              Salvar Configurações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleSettingsModal;