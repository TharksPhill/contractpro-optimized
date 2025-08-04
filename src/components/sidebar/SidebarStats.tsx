import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";

export interface SidebarStatsData {
  mapStats: {
    totalStates: number;
    totalCities: number;
    totalContracts: number;
  };
  billingStats: {
    totalRevenue: number;
    activeContracts: number;
  };
  signatureStats: {
    pendingSignatures: number;
    totalSignatures: number;
  };
  trialStats: {
    trialContracts: number;
    expiringSoon: number;
  };
  renewalStats: {
    renewalsNeeded: number;
    expiringSoon: number;
  };
}

interface SidebarStatsProps {
  stats: SidebarStatsData;
}

const SidebarStats = memo(({ stats }: SidebarStatsProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      notation: 'compact'
    }).format(value);

  const createBadge = (count: number, variant: 'default' | 'warning' | 'danger' | 'success' = 'default') => {
    const variantClasses = {
      default: "bg-blue-500/20 text-blue-100",
      warning: "bg-orange-500/20 text-orange-100",
      danger: "bg-red-500/20 text-red-100",
      success: "bg-green-500/20 text-green-100"
    };

    return (
      <Badge variant="secondary" className={`${variantClasses[variant]} text-xs px-2 py-0.5`}>
        {count}
      </Badge>
    );
  };

  return {
    billingBadge: createBadge(stats.billingStats.totalRevenue, 'success'),
    mapBadge: createBadge(stats.mapStats.totalContracts, 'success'),
    statesBadge: createBadge(stats.mapStats.totalStates, 'default'),
    citiesBadge: createBadge(stats.mapStats.totalCities, 'success'),
    signaturesBadge: stats.signatureStats.pendingSignatures > 0 ? createBadge(stats.signatureStats.pendingSignatures, 'warning') : null,
    renewalsBadge: stats.renewalStats.renewalsNeeded > 0 ? createBadge(stats.renewalStats.renewalsNeeded, 'warning') : null,
    renewalsUrgentBadge: stats.renewalStats.expiringSoon > 0 ? (
      <Badge variant="secondary" className="bg-red-500/20 text-red-100 text-xs px-1 py-0.5">
        !
      </Badge>
    ) : null,
    trialsBadge: stats.trialStats.trialContracts > 0 ? createBadge(stats.trialStats.trialContracts, 'warning') : null,
    trialsUrgentBadge: stats.trialStats.expiringSoon > 0 ? (
      <Badge variant="secondary" className="bg-red-500/20 text-red-100 text-xs px-1 py-0.5">
        !
      </Badge>
    ) : null,
    formatCurrency
  };
});

SidebarStats.displayName = "SidebarStats";

export default SidebarStats;