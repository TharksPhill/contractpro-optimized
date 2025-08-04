
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Plus, Settings, MapPin } from "lucide-react";

interface QuickActionsCardsProps {
  onActionClick?: (action: string) => void;
}

const QuickActionsCards = ({ onActionClick }: QuickActionsCardsProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Novo Contrato */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onActionClick?.('create-contract')}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Novo Contrato</h3>
              <p className="text-sm text-gray-600">Criar um novo contrato</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meus Contratos */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onActionClick?.('view-contracts')}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Meus Contratos</h3>
              <p className="text-sm text-gray-600">Ver todos os contratos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapas de Contratos no Brasil */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onActionClick?.('brazil-map')}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Mapas de Contratos no Brasil</h3>
              <p className="text-sm text-gray-600">Visualizar distribuição geográfica</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActionsCards;
