
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PenTool, CheckCircle2, Shield, Award } from 'lucide-react';
import { useSignWellConfig } from '@/hooks/useSignWellConfig';

interface SignWellSignatureOptionProps {
  onSelect: () => void;
  isMain?: boolean;
}

const SignWellSignatureOption: React.FC<SignWellSignatureOptionProps> = ({ onSelect, isMain = false }) => {
  const { isConfigured } = useSignWellConfig();

  if (isMain) {
    return (
      <Card className={`relative border-2 ${
        isConfigured
          ? 'border-purple-400 bg-gradient-to-br from-purple-50 via-white to-indigo-50'
          : 'border-gray-300 bg-gray-50'
      } hover:shadow-2xl transition-all duration-500 cursor-pointer max-w-lg w-full transform hover:scale-105`}
            onClick={onSelect}>
        
        {/* Badge de destaque */}
        {isConfigured && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 text-sm font-semibold">
              ⭐ ASSINATURA DIGITAL
            </Badge>
          </div>
        )}

        <CardHeader className="pb-4 pt-8">
          <CardTitle className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className={`p-4 ${isConfigured ? 'bg-gradient-to-br from-purple-100 to-indigo-100' : 'bg-gray-100'} rounded-2xl shadow-lg`}>
                <PenTool className={`h-12 w-12 ${isConfigured ? 'text-purple-600' : 'text-gray-400'}`} />
              </div>
              {isConfigured && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            
            <div className="text-center">
              <h3 className={`text-2xl font-bold ${isConfigured ? 'text-purple-900' : 'text-gray-500'} mb-2`}>
                SignWell
              </h3>
              <Badge variant="outline" className={`${
                isConfigured 
                  ? 'border-purple-400 text-purple-700 bg-purple-50' 
                  : 'border-gray-300 text-gray-500 bg-gray-100'
              } px-3 py-1`}>
                {isConfigured ? 'Configurado' : 'Não Configurado'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className={`text-center leading-relaxed ${isConfigured ? 'text-gray-700' : 'text-gray-500'}`}>
            {isConfigured 
              ? 'Assinatura digital profissional com SignWell - Interface moderna e compliance total'
              : 'Configure sua API Key do SignWell para habilitar assinaturas digitais'
            }
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`flex items-center gap-2 p-2 ${isConfigured ? 'bg-white' : 'bg-gray-100'} rounded-lg border ${isConfigured ? 'border-purple-100' : 'border-gray-200'}`}>
              <Shield className={`h-5 w-5 ${isConfigured ? 'text-purple-600' : 'text-gray-400'} flex-shrink-0`} />
              <span className={`text-sm font-medium ${isConfigured ? 'text-gray-700' : 'text-gray-500'}`}>
                Interface Moderna
              </span>
            </div>
            
            <div className={`flex items-center gap-2 p-2 ${isConfigured ? 'bg-white' : 'bg-gray-100'} rounded-lg border ${isConfigured ? 'border-purple-100' : 'border-gray-200'}`}>
              <CheckCircle2 className={`h-5 w-5 ${isConfigured ? 'text-purple-600' : 'text-gray-400'} flex-shrink-0`} />
              <span className={`text-sm font-medium ${isConfigured ? 'text-gray-700' : 'text-gray-500'}`}>
                Compliance Total
              </span>
            </div>
            
            <div className={`flex items-center gap-2 p-2 ${isConfigured ? 'bg-white' : 'bg-gray-100'} rounded-lg border ${isConfigured ? 'border-purple-100' : 'border-gray-200'}`}>
              <Award className={`h-5 w-5 ${isConfigured ? 'text-purple-600' : 'text-gray-400'} flex-shrink-0`} />
              <span className={`text-sm font-medium ${isConfigured ? 'text-gray-700' : 'text-gray-500'}`}>
                Processo Rápido
              </span>
            </div>

            <div className={`flex items-center gap-2 p-2 ${isConfigured ? 'bg-white' : 'bg-gray-100'} rounded-lg border ${isConfigured ? 'border-purple-100' : 'border-gray-200'}`}>
              <PenTool className={`h-5 w-5 ${isConfigured ? 'text-purple-600' : 'text-gray-400'} flex-shrink-0`} />
              <span className={`text-sm font-medium ${isConfigured ? 'text-gray-700' : 'text-gray-500'}`}>
                API Confiável
              </span>
            </div>
          </div>

          <Button 
            onClick={onSelect}
            disabled={!isConfigured}
            className={`w-full font-bold py-4 text-lg shadow-lg transform transition-all duration-200 hover:shadow-xl ${
              isConfigured 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <PenTool className="h-5 w-5 mr-2" />
            {isConfigured ? 'Usar SignWell' : 'Configurar SignWell'}
          </Button>

          {!isConfigured && (
            <p className="text-xs text-center text-gray-500 bg-gray-100 p-2 rounded-lg">
              💡 Configure sua API Key nas integrações para habilitar esta opção
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Versão compacta para uso em listas
  return (
    <Card className={`border-2 ${
      isConfigured
        ? 'border-purple-300 hover:border-purple-400'
        : 'border-gray-200 hover:border-purple-200'
    } hover:shadow-lg transition-all duration-300 cursor-pointer bg-white`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <PenTool className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-900">SignWell</h3>
            <Badge
              className={isConfigured
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-yellow-100 text-yellow-800 border-yellow-300"}>
              {isConfigured ? 'Configurado' : 'Não Configurado'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700 text-sm">
          Assinatura digital profissional com SignWell
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-gray-700">
              Interface moderna e compliance
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-gray-700">
              Processo rápido de assinatura
            </span>
          </div>
        </div>

        <Button
          onClick={onSelect}
          disabled={!isConfigured}
          className={`w-full ${
            isConfigured 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <PenTool className="h-4 w-4 mr-2" />
          {isConfigured ? 'Usar SignWell' : 'Configurar SignWell'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SignWellSignatureOption;
