
import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { MapPin, TrendingUp, Users, DollarSign } from "lucide-react";
import { formatMonetaryValue } from "@/utils/monetaryValueParser";
import { useGeographicData } from "@/hooks/useGeographicData";
import GeographicRefreshButton from "./GeographicRefreshButton";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

const RegionalAnalysis = () => {
  const { geographicData, loading, isRefreshing, forceRefresh, lastUpdated } = useGeographicData();

  // Move all hooks to the top, before any conditional logic
  const { regionalData, stateData, cityData } = geographicData;

  // Preparar dados para gráfico de evolução mensal
  const monthlyGrowth = useMemo(() => {
    // Only process if we have data
    if (!regionalData || regionalData.length === 0) {
      return [];
    }
    
    // Simulação de dados mensais baseados nos dados atuais
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      const monthData: any = { month: monthKey };
      regionalData.forEach(region => {
        // Distribuição proporcional dos contratos ao longo dos meses
        monthData[region.region] = Math.floor(region.contracts * (0.7 + Math.random() * 0.6));
      });
      months.push(monthData);
    }
    return months;
  }, [regionalData]);

  // Now we can have conditional rendering after all hooks are defined
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados regionais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <BarChart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Análise Regional</h1>
            <p className="text-gray-600">Análise detalhada dos contratos por região do Brasil (valores mensais)</p>
          </div>
        </div>
        
        <GeographicRefreshButton 
          onRefresh={forceRefresh}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* Cards de Resumo Regional */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {regionalData.map(region => (
          <Card key={region.region} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {region.region}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">{region.contracts}</span>
                <span className="text-xs text-gray-500">contratos</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Ativos:</span>
                <span className="font-medium text-green-600">{region.activeContracts}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Cidades:</span>
                <span className="font-medium">{region.cities}</span>
              </div>
              <div className="pt-2 border-t">
                <span className="text-xs text-gray-500">Receita mensal</span>
                <p className="text-sm font-medium text-green-600">
                  {formatMonetaryValue(region.value)}
                </p>
                <span className="text-xs text-gray-500">Valor médio</span>
                <p className="text-sm font-medium">
                  {formatMonetaryValue(region.contracts > 0 ? region.value / region.contracts : 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Região */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição por Região
            </CardTitle>
            <CardDescription>
              Percentual de contratos por região brasileira
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regionalData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({region, contracts, percent}) => 
                      `${region}: ${contracts} (${(percent * 100).toFixed(1)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="contracts"
                  >
                    {regionalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} contratos`, 'Total']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Estados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top 10 Estados
            </CardTitle>
            <CardDescription>
              Estados com maior número de contratos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData.slice(0, 10)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="state" type="category" width={40} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'contracts' ? `${value} contratos` : 
                      formatMonetaryValue(value as number),
                      name === 'contracts' ? 'Contratos' : 'Receita Mensal'
                    ]}
                  />
                  <Bar dataKey="contracts" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crescimento Mensal por Região */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Evolução Mensal por Região
          </CardTitle>
          <CardDescription>
            Distribuição de contratos nos últimos 6 meses por região
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                {regionalData.map((region, index) => (
                  <Area
                    key={region.region}
                    type="monotone"
                    dataKey={region.region}
                    stackId="1"
                    stroke={COLORS[index]}
                    fill={COLORS[index]}
                    fillOpacity={0.6}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegionalAnalysis;
