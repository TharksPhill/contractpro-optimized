
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileSignature, 
  Shield, 
  Zap, 
  Globe,
  CheckCircle
} from 'lucide-react';

interface DocuSignSignatureOptionProps {
  onSelect: () => void;
  disabled?: boolean;
}

const DocuSignSignatureOption: React.FC<DocuSignSignatureOptionProps> = ({
  onSelect,
  disabled = false
}) => {
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileSignature className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-blue-900">DocuSign</h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 mt-1">
              Recomendado
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-gray-700">
          Assinatura digital profissional com validade jurídica internacional, 
          utilizada por milhões de empresas ao redor do mundo.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-700">Certificação digital de nível bancário</span>
          </div>
          
          <div className="flex items-center gap-3">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-700">Validade jurídica internacional</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-700">Processo rápido e intuitivo</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-700">Assinatura em qualquer dispositivo</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 font-medium">
            ✨ Recursos Inclusos:
          </p>
          <ul className="text-xs text-blue-700 mt-1 space-y-1">
            <li>• Auditoria completa do processo</li>
            <li>• Notificações automáticas por e-mail</li>
            <li>• Backup seguro na nuvem</li>
            <li>• Conformidade com LGPD</li>
          </ul>
        </div>

        <Button 
          onClick={onSelect}
          disabled={disabled}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
        >
          <FileSignature className="h-4 w-4 mr-2" />
          Usar DocuSign
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Padrão internacional para assinatura digital empresarial
        </p>
      </CardContent>
    </Card>
  );
};

export default DocuSignSignatureOption;
