
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  TrendingUp,
  Users
} from 'lucide-react';

interface SignatureStatsCardsProps {
  stats: {
    totalContracts: number;
    signedContracts: number;
    pendingContracts: number;
    planChanges: number;
    signedPlanChanges: number;
    pendingPlanChanges: number;
  };
}

const SignatureStatsCards: React.FC<SignatureStatsCardsProps> = ({ stats }) => {
  const signatureRate = stats.totalContracts > 0 
    ? Math.round((stats.signedContracts / stats.totalContracts) * 100) 
    : 0;

  const statsCards = [
    {
      title: 'Total de Contratos',
      value: stats.totalContracts,
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'Contratos Assinados',
      value: stats.signedContracts,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      percentage: `${signatureRate}%`,
    },
    {
      title: 'Aguardando Assinatura',
      value: stats.pendingContracts,
      icon: Clock,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
    {
      title: 'Mudanças de Planos',
      value: stats.planChanges,
      icon: RefreshCw,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      title: 'Taxa de Assinatura',
      value: `${signatureRate}%`,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
    },
    {
      title: 'Contratantes Únicos',
      value: stats.signedContracts, // TODO: calcular contratantes únicos
      icon: Users,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    {stat.percentage && (
                      <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        {stat.percentage}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SignatureStatsCards;
