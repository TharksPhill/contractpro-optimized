
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Clock, 
  Car,
  DollarSign,
  Fuel,
  Settings,
  Edit3,
  Check,
  X,
  Utensils,
  Wrench,
  Route
} from "lucide-react";

interface DistanceResult {
  distance: string;
  distanceValue: number;
  duration: string;
  durationValue: number;
}

interface TollData {
  totalCost: number;
  tollStations: Array<{
    name: string;
    cost: number;
    location: string;
  }>;
  route: string;
}

interface VehicleBreakdown {
  fuelCostPerKm: number;
  ipvaCostPerKm: number;
  insuranceCostPerKm: number;
  maintenanceCostPerKm: number;
  depreciationCostPerKm: number;
  totalFuelCost: number;
  totalIpvaCost: number;
  totalInsuranceCost: number;
  totalMaintenanceCost: number;
  totalDepreciationCost: number;
  totalTollCost: number;
  totalVehicleCost: number;
  totalCostPerKm: number;
  baseVehicleCost?: number;
  vehicleMarginValue?: number;
}

interface LaborBreakdown {
  employeeName: string;
  hourlyRate: number;
  travelTimeHours: number;
  workTimeHours: number;
  totalTimeHours: number;
  totalLaborCost: number;
}

interface ServiceBreakdown {
  serviceName: string;
  pricingType: 'hourly' | 'fixed';
  unitCost: number;
  quantity: number;
  totalServiceCost: number;
  estimatedHours?: number;
  fixedPrice?: number;
}

interface Breakdown {
  visitCost: number;
  distance: number;
  duration: string;
  vehicleBreakdown: VehicleBreakdown | null;
  laborBreakdown: LaborBreakdown | null;
  serviceBreakdown?: ServiceBreakdown | null;
  totalVehicleCost: number;
  totalLaborCost: number;
  totalServiceCost?: number;
  totalCost: number;
  totalMealCost?: number;
  visitTechnicalCost?: number;
  baseLaborCost?: number;
  laborMarginValue?: number;
  totalTravelCost?: number;
  totalTravelLaborCost?: number;
}

interface EditableCalculatorResultsProps {
  result: DistanceResult;
  tollData: TollData | null;
  breakdown: Breakdown;
  vehicleSettings: any;
  roundTrip?: boolean;
}

const EditableCalculatorResults = ({ 
  result, 
  tollData, 
  breakdown: initialBreakdown, 
  vehicleSettings,
  roundTrip = true
}: EditableCalculatorResultsProps) => {
  // Estados para edição de valores
  const [editingToll, setEditingToll] = useState(false);
  const [editingFuel, setEditingFuel] = useState(false);
  const [editingConsumption, setEditingConsumption] = useState(false);
  
  const [editableTollCost, setEditableTollCost] = useState(tollData?.totalCost || 0);
  const [editableFuelPrice, setEditableFuelPrice] = useState(vehicleSettings?.fuel_price || 5.50);
  const [editableFuelConsumption, setEditableFuelConsumption] = useState(vehicleSettings?.fuel_consumption || 12.0);
  
  // Estados para margens de lucro
  const [vehicleMargin, setVehicleMargin] = useState(0); // percentual de margem
  const [laborMargin, setLaborMargin] = useState(0); // percentual de margem
  
  // Estados para custos de refeições
  const [mealCosts, setMealCosts] = useState({
    breakfast: 0,
    lunch: 0,
    dinner: 0
  });

  // Estados para quantidade de refeições
  const [mealQuantities, setMealQuantities] = useState({
    breakfast: 1,
    lunch: 1,
    dinner: 1
  });

  // Atualizar valores quando props mudarem
  useEffect(() => {
    console.log('Dados de pedágio recebidos no EditableCalculatorResults:', tollData);
    setEditableTollCost(tollData?.totalCost || 0);
    setEditableFuelPrice(vehicleSettings?.fuel_price || 5.50);
    setEditableFuelConsumption(vehicleSettings?.fuel_consumption || 12.0);
  }, [tollData, vehicleSettings]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular breakdown com valores editáveis e margens
  const calculateEditableBreakdown = () => {
    if (!result || !vehicleSettings) return initialBreakdown;

    const distance = result.distanceValue;
    
    // Usar valores editáveis para combustível
    const fuelCostPerKm = editableFuelPrice / editableFuelConsumption;
    const ipvaCostPerKm = vehicleSettings.annual_ipva / vehicleSettings.annual_mileage;
    const insuranceCostPerKm = vehicleSettings.annual_insurance / vehicleSettings.annual_mileage;
    const maintenanceCostPerKm = vehicleSettings.annual_maintenance / vehicleSettings.annual_mileage;
    const depreciationCostPerKm = (vehicleSettings.purchase_value * (vehicleSettings.depreciation_rate / 100)) / vehicleSettings.annual_mileage;
    
    // Custos totais para a distância
    const totalFuelCost = fuelCostPerKm * distance;
    const totalIpvaCost = ipvaCostPerKm * distance;
    const totalInsuranceCost = insuranceCostPerKm * distance;
    const totalMaintenanceCost = maintenanceCostPerKm * distance;
    const totalDepreciationCost = depreciationCostPerKm * distance;
    
    // Usar valor editável do pedágio
    const totalTollCost = editableTollCost;
    
    // Custo base do veículo (sem margem)
    const baseVehicleCost = totalFuelCost + totalIpvaCost + totalInsuranceCost + 
                           totalMaintenanceCost + totalDepreciationCost + totalTollCost;
    
    // Aplicar margem no custo do veículo
    const vehicleMarginValue = (baseVehicleCost * vehicleMargin) / 100;
    const totalVehicleCost = baseVehicleCost + vehicleMarginValue;

    // Calcular apenas o custo da hora técnica de viagem (sem tempo de trabalho)
    const selectedEmployee = initialBreakdown.laborBreakdown;
    let travelLaborCost = 0;
    if (selectedEmployee) {
      const travelTimeHours = result.durationValue / 60;
      travelLaborCost = selectedEmployee.hourlyRate * travelTimeHours;
    }
    
    // Aplicar margem na mão de obra de viagem
    const laborMarginValue = (travelLaborCost * laborMargin) / 100;
    const totalTravelLaborCost = travelLaborCost + laborMarginValue;

    // Total das refeições com quantidade
    const totalMealCost = (mealCosts.breakfast * mealQuantities.breakfast) + 
                         (mealCosts.lunch * mealQuantities.lunch) + 
                         (mealCosts.dinner * mealQuantities.dinner);
    
    // Custo total de viagem = veículo + hora técnica de viagem + refeições
    const totalTravelCost = totalVehicleCost + totalTravelLaborCost + totalMealCost;
    
    // Incluir custos de serviços se existirem
    const totalServiceCost = initialBreakdown.totalServiceCost || 0;
    
    // Total geral = custo de viagem + serviços
    const totalCost = totalTravelCost + totalServiceCost;
    
    return {
      ...initialBreakdown,
      vehicleBreakdown: {
        fuelCostPerKm,
        ipvaCostPerKm,
        insuranceCostPerKm,
        maintenanceCostPerKm,
        depreciationCostPerKm,
        totalFuelCost,
        totalIpvaCost,
        totalInsuranceCost,
        totalMaintenanceCost,
        totalDepreciationCost,
        totalTollCost,
        totalVehicleCost,
        totalCostPerKm: totalVehicleCost / distance,
        baseVehicleCost,
        vehicleMarginValue
      },
      totalVehicleCost,
      totalTravelLaborCost,
      totalTravelCost,
      baseLaborCost: travelLaborCost,
      laborMarginValue,
      totalCost,
      totalMealCost
    };
  };

  const breakdown = calculateEditableBreakdown();

  const handleSaveToll = () => {
    setEditingToll(false);
  };

  const handleSaveFuel = () => {
    setEditingFuel(false);
  };

  const handleSaveConsumption = () => {
    setEditingConsumption(false);
  };

  const handleCancelEdit = (field: string) => {
    switch (field) {
      case 'toll':
        setEditableTollCost(tollData?.totalCost || 0);
        setEditingToll(false);
        break;
      case 'fuel':
        setEditableFuelPrice(vehicleSettings?.fuel_price || 5.50);
        setEditingFuel(false);
        break;
      case 'consumption':
        setEditableFuelConsumption(vehicleSettings?.fuel_consumption || 12.0);
        setEditingConsumption(false);
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-green-600" />
            Resultado da Calculadora
          </div>
          <Badge variant={roundTrip ? "default" : "secondary"} className="text-xs">
            {roundTrip ? "Ida e Volta" : "Apenas Ida"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações da rota */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <MapPin className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-800">{result.distance}</div>
            <div className="text-sm text-blue-600">Distância Total</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Clock className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-orange-800">{result.duration}</div>
            <div className="text-sm text-orange-600">Tempo de Viagem</div>
          </div>
        </div>

        <Separator />

        {/* Análise Financeira Moderna */}
        <div className="space-y-6">
          <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Análise Financeira da Visita Técnica
          </h4>

          {/* Cards principais organizados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Card 1: Custo de Viagem */}
            {breakdown.vehicleBreakdown && (
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                    <Route className="w-5 h-5" />
                    Custo de Viagem
                  </CardTitle>
                  <div className="text-sm text-blue-600">
                    Percurso: {breakdown.distance} km • Custo por km: {formatCurrency(breakdown.vehicleBreakdown.totalCostPerKm)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Combustível editável */}
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 font-medium">
                        <Fuel className="w-4 h-4 text-yellow-600" />
                        Combustível
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-yellow-800">{formatCurrency(breakdown.vehicleBreakdown.totalFuelCost)}</span>
                        <Button size="sm" variant="ghost" onClick={() => setEditingFuel(!editingFuel)}>
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {editingFuel && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div>
                          <Label className="text-xs">Preço/Litro (R$)</Label>
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={editableFuelPrice}
                              onChange={(e) => setEditableFuelPrice(parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs"
                            />
                            <Button size="sm" onClick={handleSaveFuel} className="h-8 px-2">
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleCancelEdit('fuel')} className="h-8 px-2">
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Consumo (km/L)</Label>
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              value={editableFuelConsumption}
                              onChange={(e) => setEditableFuelConsumption(parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs"
                            />
                            <Button size="sm" onClick={handleSaveConsumption} className="h-8 px-2">
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleCancelEdit('consumption')} className="h-8 px-2">
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Outros custos do veículo */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="text-sm">IPVA</span>
                      <span className="font-medium">{formatCurrency(breakdown.vehicleBreakdown.totalIpvaCost)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="text-sm">Seguro</span>
                      <span className="font-medium">{formatCurrency(breakdown.vehicleBreakdown.totalInsuranceCost)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="text-sm">Manutenção</span>
                      <span className="font-medium">{formatCurrency(breakdown.vehicleBreakdown.totalMaintenanceCost)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="text-sm">Depreciação</span>
                      <span className="font-medium">{formatCurrency(breakdown.vehicleBreakdown.totalDepreciationCost)}</span>
                    </div>
                  </div>

                  {/* Pedágios editáveis */}
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 font-medium text-orange-800">
                        Pedágios da Rota
                        <Badge variant="outline" className="text-xs bg-orange-100">
                          {roundTrip ? "Ida e Volta" : "Apenas Ida"}
                        </Badge>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-orange-800">{formatCurrency(breakdown.vehicleBreakdown.totalTollCost)}</span>
                        <Button size="sm" variant="ghost" onClick={() => setEditingToll(!editingToll)}>
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {editingToll && (
                      <div className="flex gap-2 mt-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={editableTollCost}
                          onChange={(e) => setEditableTollCost(parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs"
                          placeholder={`Valor total (${roundTrip ? 'ida e volta' : 'apenas ida'})`}
                        />
                        <Button size="sm" onClick={handleSaveToll} className="h-8 px-2">
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleCancelEdit('toll')} className="h-8 px-2">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {tollData?.tollStations && tollData.tollStations.length > 0 && !editingToll && (
                      <div className="mt-2 space-y-1">
                        {tollData.tollStations.map((toll, index) => (
                          <div key={index} className="flex justify-between text-xs text-orange-700">
                            <span>{toll.name} ({toll.location})</span>
                            <span>{formatCurrency(toll.cost)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hora Técnica de Viagem */}
                  {breakdown.laborBreakdown && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-sm font-medium text-purple-700 mb-2">
                        👨‍💼 Hora Técnica de Viagem
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-purple-600 mb-2">
                        <span>Valor/hora: {formatCurrency(breakdown.laborBreakdown.hourlyRate)}</span>
                        <span>Tempo viagem: {breakdown.laborBreakdown.travelTimeHours.toFixed(1)}h</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Subtotal</span>
                        <span className="font-bold text-purple-800">{formatCurrency(breakdown.baseLaborCost || 0)}</span>
                      </div>
                    </div>
                  )}

                  {/* Refeições */}
                  <div className="space-y-3">
                    <h6 className="font-medium text-gray-800 flex items-center gap-2">
                      <Utensils className="w-4 h-4" />
                      Refeições
                    </h6>
                    
                    <div className="space-y-3">
                      {/* Café da Manhã */}
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <Label className="text-sm font-medium text-green-800 flex items-center gap-2 mb-2">
                          ☕ Café da Manhã
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Valor Unitário</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={mealCosts.breakfast}
                              onChange={(e) => setMealCosts({...mealCosts, breakfast: parseFloat(e.target.value) || 0})}
                              className="h-8 text-xs"
                              placeholder="R$ 0,00"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Quantidade</Label>
                            <Input
                              type="number"
                              min="0"
                              value={mealQuantities.breakfast}
                              onChange={(e) => setMealQuantities({...mealQuantities, breakfast: parseInt(e.target.value) || 0})}
                              className="h-8 text-xs"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {mealCosts.breakfast > 0 && mealQuantities.breakfast > 0 && (
                          <div className="mt-2 text-xs text-green-700 font-medium">
                            Subtotal: {formatCurrency(mealCosts.breakfast * mealQuantities.breakfast)}
                          </div>
                        )}
                      </div>

                      {/* Almoço */}
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <Label className="text-sm font-medium text-green-800 flex items-center gap-2 mb-2">
                          🍽️ Almoço
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Valor Unitário</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={mealCosts.lunch}
                              onChange={(e) => setMealCosts({...mealCosts, lunch: parseFloat(e.target.value) || 0})}
                              className="h-8 text-xs"
                              placeholder="R$ 0,00"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Quantidade</Label>
                            <Input
                              type="number"
                              min="0"
                              value={mealQuantities.lunch}
                              onChange={(e) => setMealQuantities({...mealQuantities, lunch: parseInt(e.target.value) || 0})}
                              className="h-8 text-xs"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {mealCosts.lunch > 0 && mealQuantities.lunch > 0 && (
                          <div className="mt-2 text-xs text-green-700 font-medium">
                            Subtotal: {formatCurrency(mealCosts.lunch * mealQuantities.lunch)}
                          </div>
                        )}
                      </div>

                      {/* Janta */}
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <Label className="text-sm font-medium text-green-800 flex items-center gap-2 mb-2">
                          🌙 Janta
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Valor Unitário</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={mealCosts.dinner}
                              onChange={(e) => setMealCosts({...mealCosts, dinner: parseFloat(e.target.value) || 0})}
                              className="h-8 text-xs"
                              placeholder="R$ 0,00"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Quantidade</Label>
                            <Input
                              type="number"
                              min="0"
                              value={mealQuantities.dinner}
                              onChange={(e) => setMealQuantities({...mealQuantities, dinner: parseInt(e.target.value) || 0})}
                              className="h-8 text-xs"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {mealCosts.dinner > 0 && mealQuantities.dinner > 0 && (
                          <div className="mt-2 text-xs text-green-700 font-medium">
                            Subtotal: {formatCurrency(mealCosts.dinner * mealQuantities.dinner)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Margem do Custo de Viagem */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Subtotal Viagem</span>
                      <span className="font-medium">{formatCurrency((breakdown.vehicleBreakdown.baseVehicleCost || 0) + (breakdown.baseLaborCost || 0) + (breakdown.totalMealCost || 0))}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Margem (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={vehicleMargin}
                        onChange={(e) => setVehicleMargin(parseFloat(e.target.value) || 0)}
                        className="h-7 text-xs w-20"
                        placeholder="0"
                      />
                      <span className="text-xs text-gray-600">
                        = {formatCurrency(((breakdown.vehicleBreakdown.baseVehicleCost || 0) + (breakdown.baseLaborCost || 0) + (breakdown.totalMealCost || 0)) * (vehicleMargin / 100))}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-100 rounded-lg border border-blue-300">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-800">Total Custo de Viagem</span>
                      <span className="font-bold text-blue-800 text-lg">{formatCurrency(breakdown.totalTravelCost || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card 2: Serviços (se existir) */}
            {breakdown.serviceBreakdown && (
              <Card className="border-orange-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                    <Wrench className="w-5 h-5" />
                    Serviços da Visita
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-orange-600">Serviço</div>
                        <div className="font-bold text-orange-800">{breakdown.serviceBreakdown.serviceName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-orange-600">Tipo</div>
                        <div className="font-bold text-orange-800">
                          {breakdown.serviceBreakdown.pricingType === 'hourly' ? 'Por Hora' : 'Valor Fixo'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-orange-600">Valor Unitário</div>
                        <div className="font-bold text-orange-800">{formatCurrency(breakdown.serviceBreakdown.unitCost)}</div>
                        {breakdown.serviceBreakdown.pricingType === 'hourly' && breakdown.serviceBreakdown.estimatedHours && (
                          <div className="text-xs text-orange-600">
                            {breakdown.serviceBreakdown.estimatedHours}h × {formatCurrency(breakdown.serviceBreakdown.unitCost / breakdown.serviceBreakdown.estimatedHours)}/h
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-orange-600">Quantidade</div>
                        <div className="font-bold text-orange-800">{breakdown.serviceBreakdown.quantity}x</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-orange-100 rounded-lg border border-orange-300">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-orange-800">Total Serviços</span>
                      <span className="font-bold text-orange-800 text-lg">{formatCurrency(breakdown.serviceBreakdown.totalServiceCost)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumo Final */}
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-lg text-indigo-800">📋 Resumo da Visita Técnica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`grid grid-cols-1 ${breakdown.serviceBreakdown ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4`}>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-sm text-gray-600">Custo de Viagem</div>
                  <div className="text-lg font-bold text-blue-700">{formatCurrency(breakdown.totalTravelCost || 0)}</div>
                  <div className="text-xs text-gray-500">Veículo + Hora Técnica + Refeições</div>
                </div>
                {breakdown.serviceBreakdown && (
                  <div className="p-3 bg-white rounded-lg border">
                    <div className="text-sm text-gray-600">Serviços Técnicos</div>
                    <div className="text-lg font-bold text-orange-700">{formatCurrency(breakdown.totalServiceCost || 0)}</div>
                    <div className="text-xs text-gray-500">{breakdown.serviceBreakdown.serviceName}</div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Total Final */}
              <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-300">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-green-800">💰 Total da Visita Técnica</span>
                  <Badge className="text-xl font-bold bg-green-200 text-green-800 px-4 py-2">
                    {formatCurrency(breakdown.totalCost)}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-green-700">
                  Custo por km: {formatCurrency(breakdown.totalCost / breakdown.distance)}/km
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditableCalculatorResults;
