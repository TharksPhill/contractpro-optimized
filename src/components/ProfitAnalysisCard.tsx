
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProfitAnalysisCardProps {
  title: string;
  value: number;
  percentage?: number;
  format?: 'currency' | 'percentage';
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'indigo' | 'yellow';
}

const ProfitAnalysisCard = ({ 
  title, 
  value, 
  percentage, 
  format = 'currency', 
  trend,
  subtitle,
  icon,
  color = 'blue'
}: ProfitAnalysisCardProps) => {
  const formatValue = (val: number) => {
    if (format === 'currency') {
      return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return `${val.toFixed(2)}%`;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getColorClasses = () => {
    const colors = {
      blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-900',
      green: 'from-green-50 to-green-100 border-green-200 text-green-900',
      red: 'from-red-50 to-red-100 border-red-200 text-red-900',
      orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-900',
      purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-900',
      indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-900',
      yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-900'
    };
    return colors[color];
  };

  return (
    <Card className={`bg-gradient-to-br ${getColorClasses()}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
          {trend && getTrendIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {formatValue(value)}
        </div>
        {percentage !== undefined && (
          <Badge variant={percentage >= 0 ? "default" : "destructive"} className="mb-2">
            {percentage.toFixed(1)}%
          </Badge>
        )}
        {subtitle && (
          <p className="text-xs opacity-75">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitAnalysisCard;
