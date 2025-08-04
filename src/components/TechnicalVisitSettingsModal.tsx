
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, DollarSign, Calculator, Settings } from "lucide-react";
import { useTechnicalVisitSettings, TechnicalVisitSettingsFormData } from "@/hooks/useTechnicalVisitSettings";
import TechnicalVisitCalculatorWrapper from "./TechnicalVisitCalculatorWrapper";
import VehicleSettingsModal from "./VehicleSettingsModal";

interface TechnicalVisitSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TechnicalVisitSettingsModal = ({ isOpen, onClose }: TechnicalVisitSettingsModalProps) => {
  const { settings, loading, updateSettings } = useTechnicalVisitSettings();
  const [formData, setFormData] = useState<TechnicalVisitSettingsFormData>({
    visit_cost: 250.00,
    km_cost: 1.00
  });
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  console.log('🔧 TechnicalVisitSettingsModal render - isOpen:', isOpen);
  console.log('🔧 TechnicalVisitSettingsModal render - settings:', settings);

  useEffect(() => {
    if (settings) {
      setFormData({
        visit_cost: settings.visit_cost,
        km_cost: settings.km_cost
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateSettings(formData);
    onClose();
  };

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            Visita Técnica
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="vehicle" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Veículo
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Calculadora
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="visit_cost" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  Valor da Visita Técnica
                </Label>
                <Input
                  id="visit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.visit_cost}
                  onChange={(e) => setFormData({ ...formData, visit_cost: parseFloat(e.target.value) || 0 })}
                  placeholder="250.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Valor base para atendimento presencial: {formatPrice(formData.visit_cost)}
                </p>
              </div>
              
              <div>
                <Label htmlFor="km_cost" className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-600" />
                  Valor por Quilômetro
                </Label>
                <Input
                  id="km_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.km_cost}
                  onChange={(e) => setFormData({ ...formData, km_cost: parseFloat(e.target.value) || 0 })}
                  placeholder="1.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Valor por km rodado: {formatPrice(formData.km_cost)}
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Exemplo de Cálculo:</h4>
                <p className="text-sm text-blue-700">
                  Visita + 50km = {formatPrice(formData.visit_cost)} + {formatPrice(formData.km_cost * 50)} = {formatPrice(formData.visit_cost + (formData.km_cost * 50))}
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  Salvar Configurações
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="vehicle" className="space-y-4">
            <div className="text-center">
              <div className="mb-4">
                <Car className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold">Configurações do Veículo</h3>
                <p className="text-gray-600 mb-6">
                  Configure os dados do seu veículo para cálculos precisos de custos por km.
                </p>
              </div>
              <Button onClick={() => setVehicleModalOpen(true)} className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Configurar Veículo
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="calculator" className="space-y-4">
            <TechnicalVisitCalculatorWrapper />
          </TabsContent>
        </Tabs>
      </DialogContent>
      
      <VehicleSettingsModal 
        isOpen={vehicleModalOpen} 
        onClose={() => setVehicleModalOpen(false)} 
      />
    </Dialog>
  );
};

export default TechnicalVisitSettingsModal;
