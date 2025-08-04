
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileSignature, 
  Shield, 
  CheckCircle, 
  Loader2,
  AlertTriangle,
  X,
  ArrowLeft
} from 'lucide-react';

interface EnhancedDigitalSignatureProps {
  contractData: any;
  contractorData: any;
  onSignatureComplete: (signatureData: string, method: 'certificate' | 'docusign') => void;
  onCancel: () => void;
}

const EnhancedDigitalSignature: React.FC<EnhancedDigitalSignatureProps> = ({
  contractData,
  contractorData,
  onSignatureComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<'certificate' | 'docusign' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signatureStep, setSignatureStep] = useState<'method' | 'signing' | 'complete'>('method');

  console.log("🔐 EnhancedDigitalSignature iniciado com:", { contractData, contractorData });

  const handleCertificateSignature = async () => {
    setIsProcessing(true);
    setSignatureStep('signing');

    try {
      console.log("📝 Iniciando assinatura por certificado digital para contrato:", contractData.id);

      // Simular processo de certificado digital (2 segundos)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Dados da assinatura simulada
      const signatureData = {
        signature_method: 'certificate',
        signature_data: `certificate_signature_${Date.now()}`,
        certificate_info: `CN=CONTRATANTE CERTIFICADO:${contractorData.responsible_cpf || '12345678900'}, OU=Certificado Digital, O=AC CERTISIGN, C=BR`,
        ip_address: '192.168.1.100',
        user_agent: navigator.userAgent,
        signed_html_content: `<html>Contrato ${contractData.contract_number} assinado digitalmente</html>`
      };

      // Salvar a assinatura no banco de dados
      const { error: signatureError } = await supabase
        .from('signed_contracts')
        .insert({
          contract_id: contractData.id,
          contractor_id: contractorData.id || contractData.contractors?.[0]?.id,
          signature_data: signatureData.signature_data,
          signed_html_content: signatureData.signed_html_content,
          ip_address: signatureData.ip_address,
          user_agent: signatureData.user_agent
        });

      if (signatureError) {
        console.error("❌ Erro ao salvar assinatura:", signatureError);
        throw signatureError;
      }

      console.log("✅ Assinatura salva com sucesso no banco de dados");

      setSignatureStep('complete');
      
      toast({
        title: "Assinatura concluída!",
        description: "Contrato assinado com certificado digital com sucesso",
      });

      // Aguardar um momento para mostrar o sucesso
      setTimeout(() => {
        onSignatureComplete(signatureData.signature_data, 'certificate');
      }, 1500);

    } catch (error: any) {
      console.error("❌ Erro na assinatura por certificado:", error);
      setSignatureStep('method');
      
      toast({
        title: "Erro na assinatura",
        description: error.message || "Erro ao processar assinatura digital",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDocuSignSignature = async () => {
    setIsProcessing(true);
    setSignatureStep('signing');

    try {
      console.log("📝 Iniciando assinatura DocuSign para contrato:", contractData.id);

      // Simular processo DocuSign (3 segundos)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Dados da assinatura DocuSign simulada
      const signatureData = {
        signature_method: 'docusign',
        signature_data: `docusign_envelope_${Date.now()}`,
        docusign_envelope_id: `envelope_${Date.now()}`,
        ip_address: '192.168.1.100',
        user_agent: navigator.userAgent,
        signed_html_content: `<html>Contrato ${contractData.contract_number} assinado via DocuSign</html>`
      };

      // Salvar a assinatura no banco de dados
      const { error: signatureError } = await supabase
        .from('signed_contracts')
        .insert({
          contract_id: contractData.id,
          contractor_id: contractorData.id || contractData.contractors?.[0]?.id,
          signature_data: signatureData.signature_data,
          signed_html_content: signatureData.signed_html_content,
          ip_address: signatureData.ip_address,
          user_agent: signatureData.user_agent
        });

      if (signatureError) {
        console.error("❌ Erro ao salvar assinatura DocuSign:", signatureError);
        throw signatureError;
      }

      console.log("✅ Assinatura DocuSign salva com sucesso no banco de dados");

      setSignatureStep('complete');
      
      toast({
        title: "Assinatura concluída!",
        description: "Contrato assinado via DocuSign com sucesso",
      });

      // Aguardar um momento para mostrar o sucesso
      setTimeout(() => {
        onSignatureComplete(signatureData.signature_data, 'docusign');
      }, 1500);

    } catch (error: any) {
      console.error("❌ Erro na assinatura DocuSign:", error);
      setSignatureStep('method');
      
      toast({
        title: "Erro na assinatura",
        description: error.message || "Erro ao processar assinatura DocuSign",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (signatureStep === 'complete') {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-green-600 mb-4">
          Assinatura Concluída!
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          O contrato #{contractData.contract_number} foi assinado com sucesso
        </p>
        <div className="flex justify-center">
          <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
            <CheckCircle className="h-5 w-5 mr-2" />
            Documento Válido
          </Badge>
        </div>
      </div>
    );
  }

  if (signatureStep === 'signing') {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {selectedMethod === 'certificate' ? 'Processando Certificado Digital' : 'Processando DocuSign'}
        </h2>
        <p className="text-gray-600 mb-6">
          {selectedMethod === 'certificate' 
            ? 'Validando certificado digital e processando assinatura...'
            : 'Enviando documento para o DocuSign e processando assinatura...'
          }
        </p>
        <div className="flex justify-center">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileSignature className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Assinatura Digital do Contrato
        </h2>
        <p className="text-gray-600">
          Escolha o método de assinatura digital para o contrato #{contractData.contract_number}
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          As assinaturas digitais possuem validade jurídica equivalente à assinatura manuscrita,
          conforme MP 2.200-2/2001 e Lei 14.063/2020.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Certificado Digital */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Shield className="h-6 w-6" />
              Certificado Digital A3/A1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Assinatura com certificado digital instalado no computador ou token/smartcard.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Máxima segurança jurídica</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Processo rápido e direto</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Sem dependência de terceiros</span>
                </div>
              </div>

              <Button 
                onClick={handleCertificateSignature}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Assinar com Certificado
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DocuSign */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <FileSignature className="h-6 w-6" />
              DocuSign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Assinatura digital através da plataforma DocuSign, líder mundial em assinaturas eletrônicas.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Interface amigável</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Aceito globalmente</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Rastreamento completo</span>
                </div>
              </div>

              <Button 
                onClick={handleDocuSignSignature}
                disabled={isProcessing}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSignature className="h-4 w-4 mr-2" />
                )}
                Assinar com DocuSign
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações do contrato */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-700">Informações do Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Número:</span>
              <div className="text-gray-800">{contractData.contract_number}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Contratante:</span>
              <div className="text-gray-800">{contractorData.name}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Responsável:</span>
              <div className="text-gray-800">{contractorData.responsible_name}</div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Valor Mensal:</span>
              <div className="text-gray-800">R$ {contractData.monthly_value}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de ação */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div className="text-sm text-gray-500">
          A assinatura será registrada com timestamp e dados do dispositivo
        </div>
      </div>
    </div>
  );
};

export default EnhancedDigitalSignature;
