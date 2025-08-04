import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTechnicalVisitSettings } from "@/hooks/useTechnicalVisitSettings";
import { useVehicleSettings } from "@/hooks/useVehicleSettings";
import { useCosts } from "@/hooks/useCosts";
import { useToast } from "@/hooks/use-toast";
import { useTollCalculator } from "@/hooks/useTollCalculator";
import EditableCalculatorResults from "./EditableCalculatorResults";
import { 
  MapPin, 
  Calculator, 
  Navigation,
  Building,
  Settings,
  Route,
  Car,
  CheckCircle,
  AlertTriangle,
  Search,
  User,
  Target,
  Wrench,
  Plus
} from "lucide-react";
import { useGoogleMapsDistance } from "@/hooks/useGoogleMapsDistance";
import { useGoogleMapsConfig } from "@/hooks/useGoogleMapsConfig";
import { useTechnicalVisitServices } from "@/hooks/useTechnicalVisitServices";

import AddressAutocomplete from "./AddressAutocomplete";
import TechnicalVisitServiceModal from "./TechnicalVisitServiceModal";

interface DistanceResult {
  distance: string;
  distanceValue: number;
  duration: string;
  durationValue: number;
  isSimulated?: boolean;
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

const TechnicalVisitCalculator = () => {
  const { settings, loading: settingsLoading } = useTechnicalVisitSettings();
  const { settings: vehicleSettings, loading: vehicleLoading } = useVehicleSettings();
  const { employeeCosts } = useCosts();
  const { services } = useTechnicalVisitServices();
  const { toast } = useToast();
  const { calculateTolls, loading: tollLoading } = useTollCalculator();
  const { calculateDistance, loading: googleMapsLoading } = useGoogleMapsDistance();
  const { hasValidConfig } = useGoogleMapsConfig();
  
  // Estados para endereços
  const [originAddress, setOriginAddress] = useState("Av. Padre Antônio Cezarino, 842 - Vila Xavier (Vila Xavier), Araraquara - SP, 14810-142");
  const [useManualOrigin, setUseManualOrigin] = useState(false);
  
  // Estados para destino
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [selectedContractorId, setSelectedContractorId] = useState<string>("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [useContractAddress, setUseContractAddress] = useState(true);
  
  // Estados para serviços
  const [hasService, setHasService] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [serviceQuantity, setServiceQuantity] = useState(1);
  
  // Estados gerais
  const [contractFilter, setContractFilter] = useState("");
  const [roundTrip, setRoundTrip] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<DistanceResult | null>(null);
  const [tollData, setTollData] = useState<TollData | null>(null);

  const { data: contracts } = useQuery({
    queryKey: ['contracts-for-calculator'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          contractors (
            id,
            name,
            address,
            city,
            state
          )
        `)
        .eq('status', 'Ativo');

      if (error) throw error;
      return data;
    }
  });

  const validateAddress = (address: string) => {
    if (!address) return { isValid: false, message: "Endereço vazio" };
    
    const hasNumber = /\d/.test(address);
    const hasComma = address.includes(',');
    const parts = address.split(',').map(part => part.trim());
    
    if (parts.length < 2) {
      return { 
        isValid: false, 
        message: "Endereço incompleto. Inclua: Rua, Número, Cidade, Estado" 
      };
    }
    
    if (!hasNumber) {
      return { 
        isValid: false, 
        message: "Inclua o número do endereço" 
      };
    }
    
    return { isValid: true, message: "Endereço válido" };
  };

  // Filtrar contratos com base no filtro de busca
  const filteredContracts = contracts?.filter(contract => {
    if (!contractFilter) return true;
    
    const contractText = `${contract.contract_number} ${contract.contractors?.map(c => c.name).join(' ')}`.toLowerCase();
    return contractText.includes(contractFilter.toLowerCase());
  }) || [];

  const selectedContract = contracts?.find(c => c.id === selectedContractId);
  const selectedContractor = selectedContract?.contractors?.find(c => c.id === selectedContractorId);

  // Calcular endereço final de destino
  const finalDestinationAddress = useContractAddress && selectedContractor
    ? `${selectedContractor.address}, ${selectedContractor.city}, ${selectedContractor.state}`
    : destinationAddress;

  const originValidation = originAddress ? validateAddress(originAddress) : null;
  const destinationValidation = finalDestinationAddress ? validateAddress(finalDestinationAddress) : null;

  const handleCalculateDistance = async () => {
    if (!originAddress) {
      toast({
        title: "Erro",
        description: "Endereço de origem é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (originValidation && !originValidation.isValid) {
      toast({
        title: "Endereço de Origem Inválido",
        description: originValidation.message,
        variant: "destructive",
      });
      return;
    }

    if (!finalDestinationAddress) {
      toast({
        title: "Erro", 
        description: "Selecione um contrato ou digite um endereço de destino manual.",
        variant: "destructive",
      });
      return;
    }

    if (destinationValidation && !destinationValidation.isValid) {
      toast({
        title: "Endereço de Destino Inválido",
        description: destinationValidation.message,
        variant: "destructive",
      });
      return;
    }

    setCalculating(true);
    
    try {
      console.log('🗺️ Calculando distância entre:', originAddress, 'e', finalDestinationAddress);
      
      const distanceResult = await calculateDistance(originAddress, finalDestinationAddress);
      
      if (!distanceResult) {
        throw new Error('Não foi possível calcular a distância');
      }

      console.log('📊 Resultado da distância recebido:', distanceResult);

      const displayMultiplier = roundTrip ? 2 : 1;
      const totalDistance = distanceResult.distanceValue * displayMultiplier;
      const totalDuration = distanceResult.durationValue * displayMultiplier;
      
      const finalResult = {
        ...distanceResult,
        distance: `${totalDistance} km${distanceResult.isSimulated ? ' (simulado)' : ''}`,
        distanceValue: totalDistance,
        duration: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}min${distanceResult.isSimulated ? ' (simulado)' : ''}`,
        durationValue: totalDuration
      };

      setResult(finalResult);
      
      console.log('🛣️ Iniciando cálculo de pedágios...');
      const tollResult = await calculateTolls(originAddress, finalDestinationAddress, distanceResult.distanceValue);
      console.log('💰 Resultado dos pedágios recebido:', tollResult);
      
      if (tollResult && roundTrip) {
        const adjustedTollData = {
          ...tollResult,
          totalCost: tollResult.totalCost * 2,
          tollStations: tollResult.tollStations.map(station => ({
            ...station,
            cost: station.cost * 2
          }))
        };
        setTollData(adjustedTollData);
      } else {
        setTollData(tollResult);
      }
      
    } catch (error) {
      console.error('❌ Erro ao calcular distância:', error);
      toast({
        title: "Erro",
        description: "Erro ao calcular distância. Verifique os endereços e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateVehicleCostBreakdown = () => {
    if (!result || !vehicleSettings) return null;

    const distanceMultiplier = roundTrip ? 2 : 1;
    const distance = result.distanceValue * distanceMultiplier;
    
    const fuelCostPerKm = vehicleSettings.fuel_price / vehicleSettings.fuel_consumption;
    const ipvaCostPerKm = vehicleSettings.annual_ipva / vehicleSettings.annual_mileage;
    const insuranceCostPerKm = vehicleSettings.annual_insurance / vehicleSettings.annual_mileage;
    const maintenanceCostPerKm = vehicleSettings.annual_maintenance / vehicleSettings.annual_mileage;
    const depreciationCostPerKm = (vehicleSettings.purchase_value * (vehicleSettings.depreciation_rate / 100)) / vehicleSettings.annual_mileage;
    
    const totalFuelCost = fuelCostPerKm * distance;
    const totalIpvaCost = ipvaCostPerKm * distance;
    const totalInsuranceCost = insuranceCostPerKm * distance;
    const totalMaintenanceCost = maintenanceCostPerKm * distance;
    const totalDepreciationCost = depreciationCostPerKm * distance;
    
    const totalTollCost = tollData?.totalCost || 0;
    
    const totalVehicleCost = totalFuelCost + totalIpvaCost + totalInsuranceCost + 
                            totalMaintenanceCost + totalDepreciationCost + totalTollCost;
    
    return {
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
      totalCostPerKm: totalVehicleCost / distance
    };
  };

  const calculateLaborCost = () => {
    if (!result || !employeeCosts.length) return null;

    const selectedEmployee = employeeCosts.find(emp => emp.is_active) || employeeCosts[0];
    if (!selectedEmployee) return null;

    const monthlyHours = 220;
    const totalMonthlyCost = selectedEmployee.salary + (selectedEmployee.benefits || 0) + (selectedEmployee.taxes || 0);
    const hourlyRate = totalMonthlyCost / monthlyHours;
    
    // Corrigir: usar apenas o tempo base da API, não multiplicar pelo roundTrip aqui
    // O roundTrip já foi aplicado no resultado final
    const travelTimeHours = result.durationValue / 60;
    const workTimeHours = 2;
    
    // IMPORTANTE: Não somar o tempo de serviço aqui, pois será calculado separadamente
    const totalTimeHours = travelTimeHours + workTimeHours;
    
    const totalLaborCost = hourlyRate * totalTimeHours;

    return {
      employeeName: selectedEmployee.name,
      hourlyRate,
      travelTimeHours,
      workTimeHours,
      totalTimeHours,
      totalLaborCost
    };
  };

  // Calcular custos de serviços selecionados
  const calculateServiceCost = () => {
    if (!hasService || !selectedServiceId) return null;

    const selectedService = services.find(service => service.id === selectedServiceId);
    if (!selectedService) return null;

    const selectedEmployee = employeeCosts.find(emp => emp.is_active) || employeeCosts[0];
    
    let unitCost = 0;
    if (selectedService.pricing_type === 'fixed') {
      unitCost = selectedService.fixed_price || 0;
    } else if (selectedService.pricing_type === 'hourly' && selectedEmployee) {
      const monthlyHours = 220;
      const totalMonthlyCost = selectedEmployee.salary + (selectedEmployee.benefits || 0) + (selectedEmployee.taxes || 0);
      const hourlyRate = totalMonthlyCost / monthlyHours;
      unitCost = hourlyRate * (selectedService.estimated_hours || 0);
    }

    const totalServiceCost = unitCost * serviceQuantity;

    return {
      serviceName: selectedService.name,
      pricingType: selectedService.pricing_type,
      unitCost,
      quantity: serviceQuantity,
      totalServiceCost,
      estimatedHours: selectedService.estimated_hours,
      fixedPrice: selectedService.fixed_price
    };
  };

  const calculateBreakdown = () => {
    if (!result || !settings) return null;
    
    const visitCost = Number(settings.visit_cost) || 0;
    const vehicleBreakdown = calculateVehicleCostBreakdown();
    const laborBreakdown = calculateLaborCost();
    const serviceBreakdown = calculateServiceCost();
    
    const totalVehicleCost = vehicleBreakdown?.totalVehicleCost || 0;
    const totalLaborCost = laborBreakdown?.totalLaborCost || 0;
    const totalServiceCost = serviceBreakdown?.totalServiceCost || 0;
    const totalCost = visitCost + totalVehicleCost + totalLaborCost + totalServiceCost;
    
    return {
      visitCost,
      distance: result.distanceValue,
      duration: result.duration,
      vehicleBreakdown,
      laborBreakdown,
      serviceBreakdown,
      totalVehicleCost,
      totalLaborCost,
      totalServiceCost,
      totalCost
    };
  };

  const breakdown = calculateBreakdown();

  if (settingsLoading || vehicleLoading) {
    return <div>Carregando configurações...</div>;
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Configure primeiro as configurações de visita técnica.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vehicleSettings) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Car className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Configure primeiro os dados do veículo na aba "Veículo".</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Calculadora de Visita Técnica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seção de Origem */}
          <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <User className="w-5 h-5" />
              <h3 className="font-semibold">1. Ponto de Partida (Seu Endereço)</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="manual-origin"
                  checked={useManualOrigin}
                  onCheckedChange={setUseManualOrigin}
                />
                <Label htmlFor="manual-origin" className="text-sm font-medium">
                  Digitar endereço manualmente
                </Label>
              </div>

              {useManualOrigin ? (
                <AddressAutocomplete
                  value={originAddress}
                  onChange={setOriginAddress}
                  placeholder="Digite seu endereço de partida"
                  label="Endereço de Partida"
                />
              ) : (
                <div className="p-3 bg-white border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Endereço padrão:</span>
                  </div>
                  <p className="text-sm text-gray-700">{originAddress}</p>
                </div>
              )}

              {originAddress && originValidation && !originValidation.isValid && (
                <div className="p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs text-red-800">
                    <strong>⚠️ PROBLEMA:</strong> {originValidation.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Seção de Destino */}
          <div className="space-y-4 p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Target className="w-5 h-5" />
              <h3 className="font-semibold">2. Destino da Visita</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-contract"
                  checked={useContractAddress}
                  onCheckedChange={setUseContractAddress}
                />
                <Label htmlFor="use-contract" className="text-sm font-medium">
                  Usar endereço do contrato
                </Label>
              </div>

              {useContractAddress ? (
                <div className="space-y-3">
                  {/* Filtro de contratos */}
                  <div className="space-y-2">
                    <Label htmlFor="contract-filter" className="text-sm font-medium">
                      Buscar contrato
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="contract-filter"
                        type="text"
                        placeholder="Digite o número do contrato ou nome do cliente..."
                        value={contractFilter}
                        onChange={(e) => setContractFilter(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {contractFilter && (
                      <p className="text-xs text-gray-500">
                        {filteredContracts.length} contrato(s) encontrado(s)
                      </p>
                    )}
                  </div>

                  {/* Seleção de contrato */}
                  <div className="space-y-2">
                    <Label>Contrato</Label>
                    <Select value={selectedContractId} onValueChange={setSelectedContractId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contrato" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {filteredContracts.map((contract) => (
                          <SelectItem key={contract.id} value={contract.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{contract.contract_number}</span>
                              <span className="text-xs text-gray-500">
                                {contract.contractors?.map(c => c.name).join(', ')}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Seleção de contratante */}
                  {selectedContract && (
                    <div className="space-y-2">
                      <Label>Cliente</Label>
                      <Select value={selectedContractorId} onValueChange={setSelectedContractorId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedContract.contractors?.map((contractor) => (
                            <SelectItem key={contractor.id} value={contractor.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{contractor.name}</span>
                                <span className="text-xs text-gray-500">
                                  {contractor.city}, {contractor.state}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Endereço selecionado */}
                  {selectedContractor && (
                    <div className="p-3 bg-white border border-green-200 rounded-md">
                      <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
                        <Building className="w-4 h-4" />
                        <span className="font-medium">{selectedContractor.name}</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {selectedContractor.address}, {selectedContractor.city}, {selectedContractor.state}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <AddressAutocomplete
                  value={destinationAddress}
                  onChange={setDestinationAddress}
                  placeholder="Digite o endereço de destino"
                  label="Endereço de Destino"
                />
              )}

              {finalDestinationAddress && destinationValidation && !destinationValidation.isValid && (
                <div className="p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs text-red-800">
                    <strong>⚠️ PROBLEMA:</strong> {destinationValidation.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resumo da Rota */}
          {originAddress && finalDestinationAddress && originValidation?.isValid && destinationValidation?.isValid && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 mb-3">
                <Route className="w-5 h-5" />
                <h3 className="font-semibold">3. Resumo da Rota</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span><strong>Saída:</strong> {originAddress}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span><strong>Destino:</strong> {finalDestinationAddress}</span>
                </div>
              </div>
            </div>
          )}

          {/* Seção de Serviços */}
          <div className="space-y-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-800">
                <Wrench className="w-5 h-5" />
                <h3 className="font-semibold">3. Serviços da Visita (Opcional)</h3>
              </div>
              <TechnicalVisitServiceModal>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Gerenciar Serviços
                </Button>
              </TechnicalVisitServiceModal>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="has-service"
                  checked={hasService}
                  onCheckedChange={setHasService}
                />
                <Label htmlFor="has-service" className="text-sm font-medium">
                  Esta visita inclui um serviço
                </Label>
              </div>

              {hasService && (
                <div className="space-y-3">
                  {services.length === 0 ? (
                    <div className="p-3 bg-white border border-orange-200 rounded-md">
                      <div className="flex items-center gap-2 text-orange-700 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Nenhum serviço cadastrado</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Você precisa cadastrar pelo menos um serviço antes de poder selecioná-lo.
                      </p>
                      <TechnicalVisitServiceModal>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Cadastrar Primeiro Serviço
                        </Button>
                      </TechnicalVisitServiceModal>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Serviço</Label>
                        <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um serviço" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{service.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {service.pricing_type === 'hourly' 
                                      ? `${service.estimated_hours}h • Por hora`
                                      : `${formatCurrency(service.fixed_price || 0)} • Valor fixo`
                                    }
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedServiceId && (
                        <div className="space-y-2">
                          <Label htmlFor="service-quantity">Quantidade de vezes</Label>
                          <Input
                            id="service-quantity"
                            type="number"
                            min="1"
                            value={serviceQuantity}
                            onChange={(e) => setServiceQuantity(parseInt(e.target.value) || 1)}
                            placeholder="Ex: 3 (para 3 instalações no mesmo dia)"
                          />
                          <p className="text-xs text-gray-500">
                            Quantas vezes este serviço será realizado durante a visita
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Configurações da viagem */}
          <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Route className="w-4 h-4 text-purple-600" />
              <Label htmlFor="round-trip" className="font-medium text-purple-800">
                Calcular ida e volta
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-purple-700">
                {roundTrip ? "Ida e volta" : "Apenas ida"}
              </span>
              <Switch
                id="round-trip"
                checked={roundTrip}
                onCheckedChange={setRoundTrip}
              />
            </div>
          </div>

          {/* Botão de cálculo */}
          <Button 
            onClick={handleCalculateDistance} 
            disabled={calculating || googleMapsLoading || tollLoading || !originAddress || !finalDestinationAddress || (originValidation && !originValidation.isValid) || (destinationValidation && !destinationValidation.isValid)}
            className="w-full h-12 text-base"
            size="lg"
          >
            {calculating || googleMapsLoading || tollLoading ? (
              <>
                <Route className="w-5 h-5 mr-2 animate-spin" />
                {googleMapsLoading ? "Calculando distância..." : tollLoading ? "Calculando pedágios..." : "Processando..."}
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5 mr-2" />
                Calcular Distância e Pedágios
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && breakdown && (
        <EditableCalculatorResults 
          result={result}
          tollData={tollData}
          breakdown={breakdown}
          vehicleSettings={vehicleSettings}
          roundTrip={roundTrip}
        />
      )}
    </div>
  );
};

export default TechnicalVisitCalculator;