
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import ContractPreview from '@/components/ContractPreview';
import { ContractProvider } from '@/context/ContractContext';
import DocuSignApiConfig from '@/components/DocuSignApiConfig';
import { useDocuSignRealIntegration } from '@/hooks/useDocuSignRealIntegration';
import { 
  FileSignature, 
  Shield, 
  ExternalLink, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Settings
} from 'lucide-react';

interface DocuSignIntegrationProps {
  contractData: any;
  contractorData: any;
  onSignatureComplete?: (envelopeId: string, status: string) => void;
  onCancel?: () => void;
}

const DocuSignIntegration: React.FC<DocuSignIntegrationProps> = ({
  contractData,
  contractorData,
  onSignatureComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const { loading, error, createRealEnvelope, isConfigured } = useDocuSignRealIntegration();
  const [envelope, setEnvelope] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const contractPreviewRef = useRef<HTMLDivElement>(null);

  // Normalizar contractorData - pode vir como array ou objeto único
  const contractorsArray = Array.isArray(contractorData) ? contractorData : [contractorData];
  
  // Criar objeto editingContract compatível com o ContractContext
  const editingContract = {
    id: contractData?.id,
    contractNumber: contractData?.contract_number || '',
    employeeCount: contractData?.employee_count || '',
    cnpjCount: contractData?.cnpj_count || '',
    monthlyValue: contractData?.monthly_value || '',
    trialDays: contractData?.trial_days || '',
    startDate: contractData?.start_date || '',
    renewalDate: contractData?.renewal_date || '',
    paymentStartDate: contractData?.payment_start_date || '',
    paymentDay: contractData?.payment_day || '',
    planType: contractData?.plan_type || 'mensal',
    semestralDiscount: contractData?.semestral_discount || '0',
    anualDiscount: contractData?.anual_discount || '0',
    contractors: contractorsArray.filter(contractor => contractor).map(contractor => ({
      id: contractor.id,
      name: contractor.name || '',
      cnpj: contractor.cnpj || '',
      email: contractor.email || '',
      address: contractor.address || '',
      city: contractor.city || '',
      state: contractor.state || '',
      responsibleName: contractor.responsible_name || '',
      responsibleCpf: contractor.responsible_cpf || '',
      responsibleRg: contractor.responsible_rg || ''
    })),
    companyData: {
      name: contractData?.company?.name || "",
      cnpj: contractData?.company?.cnpj || "",
      address: contractData?.company?.address || "", 
      city: contractData?.company?.city || "",
      state: contractData?.company?.state || "",
      responsibleName: contractData?.company?.responsible_name || "",
      phone: contractData?.company?.phone || "",
      email: contractData?.company?.email || "",
      website: contractData?.company?.website || "",
      logo: contractData?.company?.logo || ""
    }
  };

  // Usar dados da empresa do editing contract
  const companyData = editingContract.companyData;

  const handleCreateEnvelope = async () => {
    try {
      const envelope = await createRealEnvelope(contractData, contractorData, companyData);
      
      if (envelope) {
        setEnvelope(envelope);
        toast({
          title: "Envelope criado!",
          description: `Documento enviado para assinatura - ID: ${envelope.envelopeId}`,
        });
      }
    } catch (error) {
      console.error("Erro ao criar envelope:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar envelope no DocuSign",
        variant: "destructive",
      });
    }
  };

  const handleOpenSigning = () => {
    if (envelope?.signingUrl) {
      // Abrir em nova aba/janela
      const signingWindow = window.open(
        envelope.signingUrl, 
        'DocuSignSigning',
        'width=1024,height=768,scrollbars=yes,resizable=yes'
      );

      if (!signingWindow) {
        toast({
          title: "Pop-up bloqueado",
          description: "Permita pop-ups para este site e tente novamente",
          variant: "destructive",
        });
      }
    }
  };

  const handleConfigComplete = () => {
    setShowConfig(false);
    toast({
      title: "Configuração concluída",
      description: "DocuSign configurado! Agora você pode enviar contratos para assinatura.",
    });
  };

  if (!isConfigured()) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-amber-600" />
              Configuração Necessária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Para usar a assinatura digital via DocuSign, é necessário configurar suas credenciais de API.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3 mt-4">
              <Button onClick={() => setShowConfig(true)} className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Configurar DocuSign
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>

        {showConfig && (
          <DocuSignApiConfig onConfigured={handleConfigComplete} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-blue-600" />
            Assinatura Digital via DocuSign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Assinatura Segura e Juridicamente Válida</h4>
                <p className="text-sm text-blue-700 mt-1">
                  O DocuSign utiliza certificação digital e criptografia de nível bancário, 
                  garantindo a autenticidade e validade jurídica da assinatura.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Contrato</p>
              <p className="font-semibold">#{contractData?.contract_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Contratante</p>
              <p className="font-semibold">{contractorData?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Responsável</p>
              <p className="font-semibold">{contractorData?.responsible_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">E-mail</p>
              <p className="font-semibold">{contractorData?.email || 'Não informado'}</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {envelope && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Status do Envelope</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Clock className="h-3 w-3 mr-1" />
                  {envelope.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">ID: {envelope.envelopeId}</p>
            </div>
          )}

          <div className="flex gap-3 mb-4">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Ocultar Pré-visualização' : 'Visualizar Contrato'}
            </Button>
          </div>

          {showPreview && (
            <div className="border rounded-lg bg-white">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800">Pré-visualização do Contrato</h3>
                <p className="text-sm text-gray-600">Este é o conteúdo que será enviado para assinatura</p>
              </div>
              <div ref={contractPreviewRef} className="p-6">
                <ContractProvider editingContract={editingContract}>
                  <ContractPreview />
                </ContractProvider>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {!envelope ? (
          <Button
            onClick={handleCreateEnvelope}
            disabled={loading || !contractorData?.email}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando envelope...
              </>
            ) : (
              <>
                <FileSignature className="h-4 w-4 mr-2" />
                Enviar para Assinatura
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleOpenSigning}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir DocuSign para Assinar
          </Button>
        )}
        
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• O documento será enviado via e-mail para o signatário</p>
        <p>• A assinatura pode ser feita em qualquer dispositivo</p>
        <p>• O status será atualizado automaticamente</p>
        <p>• Você receberá uma notificação quando concluído</p>
      </div>
    </div>
  );
};

export default DocuSignIntegration;
