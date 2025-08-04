import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Target, MapPin, ToggleLeft, ToggleRight } from "lucide-react";
import TechnicalVisitCalculator from "./TechnicalVisitCalculator";
import MultiDestinationCalculator from "./MultiDestinationCalculator";

const TechnicalVisitCalculatorWrapper = () => {
  const [isMultiDestination, setIsMultiDestination] = useState(false);

  return (
    <div className="space-y-6">
      {/* Toggle entre modo single e multi-destinos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Calculadora de Visita Técnica
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={!isMultiDestination ? "default" : "outline"} className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Destino Único
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMultiDestination(!isMultiDestination)}
                className="p-1"
              >
                {isMultiDestination ? (
                  <ToggleRight className="w-8 h-8 text-green-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </Button>
              <Badge variant={isMultiDestination ? "default" : "outline"} className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Multi-Destinos
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            {isMultiDestination 
              ? "Modo Multi-Destinos: Configure vários destinos com diferentes clientes e serviços"
              : "Modo Destino Único: Configure uma visita técnica para um cliente específico"
            }
          </div>
        </CardContent>
      </Card>

      {/* Renderizar calculadora apropriada */}
      {isMultiDestination ? (
        <MultiDestinationCalculator />
      ) : (
        <TechnicalVisitCalculator />
      )}
    </div>
  );
};

export default TechnicalVisitCalculatorWrapper;