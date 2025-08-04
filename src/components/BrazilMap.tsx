import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { MapPin, DollarSign, FileText, Filter, Percent } from 'lucide-react';
import { formatMonetaryValue, formatMonetaryValueWithPeriod, getMostCommonPlanType } from '@/utils/monetaryValueParser';
import { useGeographicData } from '@/hooks/useGeographicData';
import GeographicRefreshButton from './GeographicRefreshButton';

interface ContractData {
  state: string;
  stateName: string;
  city: string;
  count: number;
  totalValue: number;
  monthlyValue: number;
  coordinates: [number, number];
  planTypes: { [key: string]: number };
  contractDetails: Array<{
    contractNumber: string;
    value: number;
    planType: string;
  }>;
}

interface FilterState {
  state: string;
  city: string;
  minValue: string;
  maxValue: string;
  planType: string;
}

interface StateInfo {
  count: number;
  totalValue: number;
  monthlyValue: number;
  stateName: string;
  planTypes: { [key: string]: number };
}

const BrazilMap = ({ contracts }: { contracts: any[] }) => {
  const { geographicData, loading, isRefreshing, forceRefresh, lastUpdated } = useGeographicData();
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    state: '',
    city: '',
    minValue: '',
    maxValue: '',
    planType: ''
  });

  // URL correta do GeoJSON do Brasil
  const brazilGeoJson = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

  // Mapeamento de códigos para nomes dos estados
  const stateNames: { [key: string]: string } = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
    'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
    'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
    'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
    'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
    'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
  };

  // Coordenadas das capitais dos estados brasileiros
  const stateCoordinates: { [key: string]: [number, number] } = {
    'AC': [-70.812, -8.77], 'AL': [-35.735, -9.571], 'AP': [-51.066, 0.034], 'AM': [-60.025, -3.1],
    'BA': [-38.511, -12.971], 'CE': [-38.527, -3.732], 'DF': [-47.882, -15.826], 'ES': [-40.308, -20.315],
    'GO': [-49.253, -16.686], 'MA': [-44.307, -2.539], 'MT': [-56.097, -15.601], 'MS': [-54.647, -20.469],
    'MG': [-43.938, -19.921], 'PA': [-48.504, -1.456], 'PB': [-34.845, -7.134], 'PR': [-49.273, -25.428],
    'PE': [-34.876, -8.048], 'PI': [-42.802, -5.092], 'RJ': [-43.173, -22.907], 'RN': [-35.208, -5.795],
    'RS': [-51.218, -30.035], 'RO': [-63.901, -8.762], 'RR': [-60.672, 2.82], 'SC': [-48.548, -27.595],
    'SP': [-46.633, -23.551], 'SE': [-37.073, -10.909], 'TO': [-48.36, -10.25]
  };

  // Usar dados do hook otimizado
  const contractData = useMemo(() => {
    if (loading || !geographicData?.cityData) return [];
    
    return geographicData.cityData
      .filter(city => {
        if (filters.state && filters.state !== 'all' && city.state !== filters.state) return false;
        if (filters.city && filters.city !== 'all' && city.city !== filters.city) return false;
        if (filters.minValue && city.value < parseFloat(filters.minValue)) return false;
        if (filters.maxValue && city.value > parseFloat(filters.maxValue)) return false;
        return true;
      })
      .map(city => ({
        state: city.state,
        stateName: stateNames[city.state] || city.state,
        city: city.city,
        count: city.contracts,
        totalValue: city.value,
        monthlyValue: city.value, // Manter valor original
        coordinates: stateCoordinates[city.state] || [-46.633, -23.551],
        planTypes: city.planTypes || {},
        contractDetails: city.contractDetails || []
      }));
  }, [geographicData, filters, loading, stateNames, stateCoordinates]);

  // Agrupar dados por estado usando dados otimizados
  const stateData = useMemo((): { [key: string]: StateInfo } => {
    if (loading || !geographicData?.stateData) return {};
    
    return geographicData.stateData.reduce((acc, state) => {
      acc[state.state] = {
        count: state.contracts,
        totalValue: state.value,
        monthlyValue: state.value, // Manter valor original
        stateName: stateNames[state.state] || state.state,
        planTypes: state.planTypes || {}
      };
      return acc;
    }, {} as { [key: string]: StateInfo });
  }, [geographicData, loading, stateNames]);

  // Calcular totais para percentuais
  const totalRevenue = useMemo(() => {
    return geographicData?.totalRevenue || 0;
  }, [geographicData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando mapa do Brasil...</p>
        </div>
      </div>
    );
  }

  const getStateColor = (stateCode: string) => {
    const data = stateData[stateCode];
    
    if (!data) return "#f8fafc";
    
    const stateValues = Object.values(stateData);
    if (stateValues.length === 0) return "#f8fafc";
    
    const maxValue = Math.max(...stateValues.map(d => d.monthlyValue));
    const intensity = data.monthlyValue / maxValue;
    
    if (intensity > 0.7) return "#1e40af";
    if (intensity > 0.5) return "#3b82f6";
    if (intensity > 0.3) return "#60a5fa";
    if (intensity > 0.1) return "#93c5fd";
    return "#dbeafe";
  };

  const getStatePercentage = (stateCode: string) => {
    const data = stateData[stateCode];
    if (!data || totalRevenue === 0) return 0;
    return (data.monthlyValue / totalRevenue) * 100;
  };

  const clearFilters = () => {
    setFilters({
      state: '',
      city: '',
      minValue: '',
      maxValue: '',
      planType: ''
    });
  };

  const uniqueStates = [...new Set(contracts.flatMap(c => c.contractors?.map((cont: any) => cont.state) || []))];
  const uniqueCities = [...new Set(contracts.flatMap(c => c.contractors?.map((cont: any) => cont.city) || []))];

  return (
    <div className="space-y-4">
      {/* Header com botão de refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mapa do Brasil</h2>
          <p className="text-gray-600">Distribuição geográfica dos contratos</p>
        </div>
        
        <GeographicRefreshButton 
          onRefresh={forceRefresh}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* Filtros */}
      <Card className="bg-gradient-to-br from-gray-50 to-blue-50 border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Estado</label>
                <Select value={filters.state} onValueChange={(value) => setFilters({...filters, state: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    {uniqueStates.map(state => (
                      <SelectItem key={state} value={state}>{stateNames[state] || state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Cidade</label>
                <Select value={filters.city} onValueChange={(value) => setFilters({...filters, city: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as cidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as cidades</SelectItem>
                    {uniqueCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo de Plano</label>
                <Select value={filters.planType} onValueChange={(value) => setFilters({...filters, planType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os planos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os planos</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Valor Mín. (R$)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minValue}
                  onChange={(e) => setFilters({...filters, minValue: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Valor Máx. (R$)</label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={filters.maxValue}
                  onChange={(e) => setFilters({...filters, maxValue: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar Filtros
              </Button>
              <Badge variant="secondary">
                {contractData.length} resultado(s) encontrado(s)
              </Badge>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Mapa */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <MapPin className="h-5 w-5" />
            Mapa de Contratos do Brasil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96 bg-white rounded-lg border border-gray-200 shadow-inner overflow-hidden relative">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                center: [-54, -15],
                scale: 700
              }}
              width={800}
              height={400}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={brazilGeoJson}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const stateCode = geo.properties.sigla || geo.properties.SIGLA || geo.properties.CD_GEOCUF;
                    const stateInfo = stateData[stateCode];
                    const percentage = getStatePercentage(stateCode);
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getStateColor(stateCode)}
                        stroke="#e5e7eb"
                        strokeWidth={0.5}
                        onMouseEnter={() => setHoveredState(stateCode)}
                        onMouseLeave={() => setHoveredState(null)}
                        style={{
                          default: { outline: "none" },
                          hover: { 
                            outline: "none",
                            fill: "#1d4ed8",
                            cursor: "pointer"
                          },
                          pressed: { outline: "none" }
                        }}
                      />
                    );
                  })
                }
              </Geographies>
              
              {/* Marcadores das cidades */}
              {contractData.map((data, index) => (
                <Marker 
                  key={index} 
                  coordinates={data.coordinates}
                  onClick={() => setSelectedCity(selectedCity === `${data.city}-${data.state}` ? null : `${data.city}-${data.state}`)}
                >
                  <circle
                    r={Math.max(4, Math.min(15, 4 + data.count * 2))}
                    fill="#dc2626"
                    stroke="#ffffff"
                    strokeWidth={2}
                    style={{
                      cursor: "pointer",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                    }}
                  />
                  <text
                    textAnchor="middle"
                    dy={-20}
                    fontSize={10}
                    fill="#374151"
                    fontWeight="bold"
                    style={{ pointerEvents: "none" }}
                  >
                    {data.count}
                  </text>
                </Marker>
              ))}
            </ComposableMap>
            
            {/* Tooltip do Estado */}
            {hoveredState && stateData[hoveredState] && (
              <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border z-10">
                <div className="text-sm">
                  <p className="font-bold text-gray-900">{stateData[hoveredState].stateName} ({hoveredState})</p>
                  <p className="text-gray-600">{stateData[hoveredState].count} contratos</p>
                  <p className="text-green-600 font-medium">
                    {formatMonetaryValueWithPeriod(
                      stateData[hoveredState].monthlyValue,
                      getMostCommonPlanType(stateData[hoveredState].planTypes)
                    )}
                  </p>
                  <p className="text-blue-600 font-medium">
                    {getStatePercentage(hoveredState).toFixed(1)}% da receita
                  </p>
                </div>
              </div>
            )}

            {/* Tooltip da Cidade */}
            {selectedCity && (
              <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border z-10 max-w-xs">
                {contractData
                  .filter(data => `${data.city}-${data.state}` === selectedCity)
                  .map((data, index) => {
                    const cityPercentage = totalRevenue > 0 ? (data.monthlyValue / totalRevenue) * 100 : 0;
                    const mostCommonPlan = getMostCommonPlanType(data.planTypes);
                    return (
                      <div key={index} className="text-sm">
                        <p className="font-bold text-gray-900">{data.city}, {data.stateName}</p>
                        <p className="text-gray-600">{data.count} contratos</p>
                        <p className="text-green-600 font-medium">
                          {formatMonetaryValueWithPeriod(data.monthlyValue, mostCommonPlan)}
                        </p>
                        <p className="text-blue-600 font-medium">
                          {cityPercentage.toFixed(1)}% da receita
                        </p>
                      </div>
                    );
                  })
                }
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 w-full"
                  onClick={() => setSelectedCity(null)}
                >
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas por Estado e Cidade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Estados */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Percent className="h-5 w-5" />
              Top Estados por Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stateData)
                .sort(([,a], [,b]) => b.monthlyValue - a.monthlyValue)
                .slice(0, 5)
                .map(([stateCode, data], index) => {
                  const percentage = getStatePercentage(stateCode);
                  const mostCommonPlan = getMostCommonPlanType(data.planTypes);
                  return (
                    <div key={stateCode} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-gray-900">{data.stateName} ({stateCode})</p>
                          <p className="text-sm text-gray-600">{data.count} contratos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatMonetaryValueWithPeriod(data.monthlyValue, mostCommonPlan)}
                        </p>
                        <p className="text-sm text-blue-600">
                          {percentage.toFixed(1)}% da receita
                        </p>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </CardContent>
        </Card>

        {/* Top Cidades */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <DollarSign className="h-5 w-5" />
              Top Cidades por Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contractData.slice(0, 5).map((data, index) => {
                const percentage = totalRevenue > 0 ? (data.monthlyValue / totalRevenue) * 100 : 0;
                const mostCommonPlan = getMostCommonPlanType(data.planTypes);
                return (
                  <div key={`${data.city}-${data.state}`} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-purple-100 text-purple-800">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-gray-900">{data.city}, {data.stateName}</p>
                        <p className="text-sm text-gray-600">{data.count} contratos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">
                        {formatMonetaryValueWithPeriod(data.monthlyValue, mostCommonPlan)}
                      </p>
                      <p className="text-sm text-blue-600">
                        {percentage.toFixed(1)}% da receita
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Geral */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <FileText className="h-5 w-5" />
            Resumo Geral (Filtrado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-blue-600">
                {contractData.reduce((sum, data) => sum + data.count, 0)}
              </p>
              <p className="text-sm text-gray-600">Total de Contratos</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-green-600">
                {formatMonetaryValue(totalRevenue)}
              </p>
              <p className="text-sm text-gray-600">Receita Total</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-purple-600">
                {Object.keys(stateData).length}
              </p>
              <p className="text-sm text-gray-600">Estados Atendidos</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-orange-600">
                {contractData.length}
              </p>
              <p className="text-sm text-gray-600">Cidades Atendidas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrazilMap;
