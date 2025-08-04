import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from "recharts";
import { MapPin, Target, TrendingUp, Globe, Users, Building, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatMonetaryValue, formatMonetaryValueWithPeriod, getMostCommonPlanType } from "@/utils/monetaryValueParser";
import { useGeographicData } from "@/hooks/useGeographicData";
import GeographicRefreshButton from "./GeographicRefreshButton";

const GeographicStatistics = () => {
  const { geographicData, loading, isRefreshing, forceRefresh, lastUpdated } = useGeographicData();

  // Move all hooks to the top, before any conditional logic
  const { regionalData, stateData, cityData, totalContracts } = geographicData;

  const coverageMetrics = useMemo(() => {
    // Only process if we have data
    if (!stateData || !cityData) {
      return {
        stateCoverage: 0,
        cityCoverage: 0,
        averageCitiesPerState: 0,
        averageContractsPerCity: 0
      };
    }

    const totalBrazilianStates = 27; // 26 estados + DF
    const estimatedCitiesInBrazil = 5570; // Estimativa de cidades brasileiras
    
    return {
      stateCoverage: (stateData.length / totalBrazilianStates) * 100,
      cityCoverage: (cityData.length / estimatedCitiesInBrazil) * 100,
      averageCitiesPerState: stateData.length > 0 ? cityData.length / stateData.length : 0,
      averageContractsPerCity: cityData.length > 0 ? 
        cityData.reduce((sum, city) => sum + city.contracts, 0) / cityData.length : 0
    };
  }, [stateData, cityData]);

  // Preparar dados de densidade de contratos
  const contractDensity = useMemo(() => {
    if (!cityData) return [];
    
    return cityData
      .filter(city => city.contracts > 1)
      .map(city => ({
        ...city,
        density: city.contracts / city.value * 1000000, // Densidade: contratos por milhão em valor
        efficiency: city.value / city.contracts // Valor médio por contrato
      }))
      .sort((a, b) => b.density - a.density)
      .slice(0, 15);
  }, [cityData]);

  // Now we can have conditional rendering after all hooks are defined
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando estatísticas geográficas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estatísticas Geográficas</h1>
            <p className="text-gray-600">Análise detalhada da distribuição geográfica dos contratos</p>
          </div>
        </div>
        
        <GeographicRefreshButton 
          onRefresh={forceRefresh}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total de Estados</p>
                <p className="text-3xl font-bold text-blue-900">{stateData.length}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                    {coverageMetrics.stateCoverage.toFixed(1)}% do Brasil
                  </Badge>
                </div>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total de Cidades</p>
                <p className="text-3xl font-bold text-green-900">{cityData.length}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-green-200 text-green-800">
                    {coverageMetrics.cityCoverage.toFixed(2)}% do Brasil
                  </Badge>
                </div>
              </div>
              <Building className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Contratos/Cidade</p>
                <p className="text-3xl font-bold text-purple-900">
                  {coverageMetrics.averageContractsPerCity.toFixed(1)}
                </p>
                <p className="text-sm text-purple-600 mt-1">Média nacional</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Cidades/Estado</p>
                <p className="text-3xl font-bold text-orange-900">
                  {coverageMetrics.averageCitiesPerState.toFixed(1)}
                </p>
                <p className="text-sm text-orange-600 mt-1">Distribuição média</p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cidades por Número de Contratos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Top Cidades por Contratos
            </CardTitle>
            <CardDescription>
              Cidades com maior concentração de contratos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData.slice(0, 15)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="city" 
                    type="category" 
                    width={80}
                    tickFormatter={(value, index) => {
                      const item = cityData.slice(0, 15)[index];
                      return `${value}/${item?.state}`;
                    }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [`${value} contratos`, 'Total']}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return `${item?.city}/${item?.state}`;
                    }}
                  />
                  <Bar dataKey="contracts" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Estados por Número de Cidades Atendidas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Cobertura por Estado
            </CardTitle>
            <CardDescription>
              Estados com maior número de cidades atendidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="state" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'cities' ? `${value} cidades` : `${value} contratos`,
                      name === 'cities' ? 'Cidades' : 'Contratos'
                    ]}
                  />
                  <Bar dataKey="cities" fill="#3B82F6" name="cities" />
                  <Bar dataKey="contracts" fill="#8B5CF6" name="contracts" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Valor por Localização e Densidade de Contratos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Localizações por Valor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Top Localizações por Receita
            </CardTitle>
            <CardDescription>
              Cidades que geram maior receita
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cityData.slice(0, 10).map((location, index) => {
                const mostCommonPlan = getMostCommonPlanType(location.planTypes || {});
                return (
                  <div key={`${location.city}-${location.state}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{location.city}/{location.state}</p>
                        <p className="text-sm text-gray-500">{location.contracts} contratos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatMonetaryValueWithPeriod(location.value, mostCommonPlan)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatMonetaryValue(location.value / location.contracts)} por contrato
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Densidade de Contratos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Densidade de Contratos
            </CardTitle>
            <CardDescription>
              Relação entre número de contratos e valor por cidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={contractDensity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="contracts" 
                    name="Contratos"
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="efficiency" 
                    name="Valor Médio"
                    tickFormatter={(value) => formatMonetaryValue(value)}
                  />
                  <ZAxis type="number" dataKey="density" range={[50, 400]} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'efficiency') {
                        return [formatMonetaryValue(value as number), 'Valor Médio por Contrato'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return `${item?.city}/${item?.state}`;
                    }}
                  />
                  <Scatter dataKey="efficiency" fill="#8B5CF6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GeographicStatistics;
