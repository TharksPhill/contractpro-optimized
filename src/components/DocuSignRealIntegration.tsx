
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import ContractPreview from '@/components/ContractPreview';
import { ContractProvider } from '@/context/ContractContext';
import DocuSignApiConfig from '@/components/DocuSignApiConfig';
import DocuSignModal from '@/components/DocuSignModal';
import { useDocuSignRealIntegration } from '@/hooks/useDocuSignRealIntegration';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileSignature, 
  Shield, 
  ExternalLink, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Users,
  Send,
  ArrowLeft
} from 'lucide-react';

interface DocuSignRealIntegrationProps {
  contractData: any;
  contractorData: any;
  companyData: any;
  onSignatureComplete?: (envelopeId: string, status: string) => void;
  onCancel?: () => void;
}

const DocuSignRealIntegration: React.FC<DocuSignRealIntegrationProps> = ({
  contractData,
  contractorData,
  companyData,
  onSignatureComplete,
  onCancel
}) => {
  console.log('🔥 [DocuSignRealIntegration] RENDERIZANDO!', {
    contractData: contractData?.contract_number,
    contractorData: contractorData?.name,
    companyData: companyData?.name,
    companyDataIsNull: companyData === null,
    companyDataIsUndefined: companyData === undefined
  });

  const { toast } = useToast();
  const { 
    loading, 
    error, 
    createRealEnvelope, 
    checkEnvelopeStatus, 
    isConfigured 
  } = useDocuSignRealIntegration();
  
  const [envelope, setEnvelope] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [envelopeStatus, setEnvelopeStatus] = useState<any>(null);
  const [showDocuSignModal, setShowDocuSignModal] = useState(false);
  const [finalCompanyData, setFinalCompanyData] = useState<any>(null);

  // Normalizar contractorData
  const contractorsArray = Array.isArray(contractorData) ? contractorData : [contractorData];
  const contractor = contractorsArray[0];

  // Preparar dados da empresa de forma garantida
  useEffect(() => {
    const prepareCompanyData = async () => {
      console.log('🏢 [COMPANY] Preparando dados da empresa...');
      console.log('🏢 [COMPANY] companyData recebido:', companyData);
      console.log('🏢 [COMPANY] contractData.company:', contractData?.company);

      let preparedCompanyData = {
        name: 'Empresa Contratada',
        email: 'contato@empresa.com',
        phone: '(11) 99999-9999',
        responsibleName: 'Administrador',
        cnpj: '00.000.000/0001-00',
        address: 'Endereço da Empresa',
        city: 'São Paulo',
        state: 'SP',
        website: '',
        logo: ''
      };

      // Tentar usar companyData se existir
      if (companyData && typeof companyData === 'object') {
        preparedCompanyData = {
          name: companyData.name || preparedCompanyData.name,
          email: companyData.email || preparedCompanyData.email,
          phone: companyData.phone || preparedCompanyData.phone,
          responsibleName: companyData.responsibleName || companyData.responsible_name || preparedCompanyData.responsibleName,
          cnpj: companyData.cnpj || preparedCompanyData.cnpj,
          address: companyData.address || preparedCompanyData.address,
          city: companyData.city || preparedCompanyData.city,
          state: companyData.state || preparedCompanyData.state,
          website: companyData.website || preparedCompanyData.website,
          logo: companyData.logo || preparedCompanyData.logo
        };
      }

      // Tentar usar contractData.company se existir
      if (contractData?.company && typeof contractData.company === 'object') {
        preparedCompanyData = {
          name: contractData.company.name || preparedCompanyData.name,
          email: contractData.company.email || preparedCompanyData.email,
          phone: contractData.company.phone || preparedCompanyData.phone,
          responsibleName: contractData.company.responsible_name || preparedCompanyData.responsibleName,
          cnpj: contractData.company.cnpj || preparedCompanyData.cnpj,
          address: contractData.company.address || preparedCompanyData.address,
          city: contractData.company.city || preparedCompanyData.city,
          state: contractData.company.state || preparedCompanyData.state,
          website: contractData.company.website || preparedCompanyData.website,
          logo: contractData.company.logo || preparedCompanyData.logo
        };
      }

      // Se ainda não temos dados válidos, buscar do banco
      if ((!preparedCompanyData.name || preparedCompanyData.name === 'Empresa Contratada') && contractData?.company_id) {
        console.log('🏢 [COMPANY] Buscando dados da empresa do banco...');
        try {
          const { data: companyFromDB, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', contractData.company_id)
            .single();

          if (companyFromDB && !companyError) {
            console.log('✅ [COMPANY] Dados da empresa recuperados do banco:', companyFromDB);
            preparedCompanyData = {
              name: companyFromDB.name || preparedCompanyData.name,
              email: companyFromDB.email || preparedCompanyData.email,
              phone: companyFromDB.phone || preparedCompanyData.phone,
              responsibleName: preparedCompanyData.responsibleName,
              cnpj: preparedCompanyData.cnpj,
              address: companyFromDB.address || preparedCompanyData.address,
              city: preparedCompanyData.city,
              state: preparedCompanyData.state,
              website: companyFromDB.website || preparedCompanyData.website,
              logo: companyFromDB.logo || preparedCompanyData.logo
            };
          }
        } catch (dbError) {
          console.error('❌ [COMPANY] Erro ao buscar empresa do banco:', dbError);
        }
      }

      console.log('🏢 [COMPANY] Dados finais preparados:', preparedCompanyData);
      setFinalCompanyData(preparedCompanyData);
    };

    prepareCompanyData();
  }, [contractData, companyData]);
  
  console.log('🔍 [DocuSignRealIntegration] Dados processados:', {
    contractData: contractData?.contract_number,
    contractor: contractor?.name,
    finalCompanyData: finalCompanyData?.name,
    envelope: envelope?.envelopeId,
    loading,
    error
  });

  // Criar objeto editingContract compatível
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
      address: contractor.address || '',
      city: contractor.city || '',
      state: contractor.state || '',
      responsibleName: contractor.responsible_name || '',
      responsibleCpf: contractor.responsible_cpf || '',
      responsibleRg: contractor.responsible_rg || ''
    })),
    companyData: finalCompanyData || {}
  };

  const handleCreateEnvelope = async () => {
    console.log('🚀 [DocuSignRealIntegration] BOTÃO CLICADO - Iniciando criação de envelope DocuSign...');
    
    if (!contractor) {
      console.error('❌ [DocuSignRealIntegration] Dados do contratante não encontrados');
      toast({
        title: "Erro nos dados",
        description: "Dados do contratante não encontrados",
        variant: "destructive",
      });
      return;
    }

    if (!contractData?.id) {
      console.error('❌ [DocuSignRealIntegration] ID do contrato não encontrado');
      toast({
        title: "Erro nos dados",
        description: "ID do contrato não encontrado",
        variant: "destructive",
      });
      return;
    }

    if (!finalCompanyData) {
      console.error('❌ [DocuSignRealIntegration] Dados da empresa ainda não preparados');
      toast({
        title: "Aguarde",
        description: "Preparando dados da empresa...",
        variant: "destructive",
      });
      return;
    }

    console.log('📤 [DocuSignRealIntegration] Dados finais para a chamada:', {
      contractData: {
        id: contractData.id,
        contract_number: contractData.contract_number
      },
      contractor: {
        id: contractor.id,
        name: contractor.name,
        email: contractor.email
      },
      finalCompanyData
    });

    try {
      console.log('📞 [DocuSignRealIntegration] Chamando createRealEnvelope...');
      const newEnvelope = await createRealEnvelope(contractData, contractor, finalCompanyData, {
        emailSubject: `Contrato #${contractData?.contract_number} - Assinatura Digital DocuSign`,
        emailMessage: 'Por favor, assine o contrato anexo via DocuSign. Ambas as partes receberão uma cópia do documento assinado.',
        redirectUrl: window.location.origin + '/contract-signatures'
      });

      console.log('📥 [DocuSignRealIntegration] Resultado do createRealEnvelope:', newEnvelope);

      if (newEnvelope) {
        console.log('✅ [DocuSignRealIntegration] Envelope criado com sucesso:', newEnvelope);
        setEnvelope(newEnvelope);
        
        toast({
          title: "Envelope Criado com Sucesso!",
          description: `Envelope ${newEnvelope.envelopeId} criado. Abrindo modal para assinatura...`,
        });

        // Abrir o modal do DocuSign para assinatura
        setShowDocuSignModal(true);
      } else {
        console.error('❌ [DocuSignRealIntegration] Falha na criação do envelope - resultado null');
        toast({
          title: "Erro na criação",
          description: "Não foi possível criar o envelope",
          variant: "destructive",
        });
      }
    } catch (createError: any) {
      console.error('❌ [DocuSignRealIntegration] Erro ao criar envelope:', createError);
      console.error('❌ [DocuSignRealIntegration] Stack trace:', createError.stack);
      toast({
        title: "Erro ao criar envelope",
        description: createError.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleConfigComplete = () => {
    setShowConfig(false);
    toast({
      title: "DocuSign configurado",
      description: "Agora você pode usar a API real do DocuSign.",
    });
  };

  const handleSigningComplete = () => {
    console.log('🎉 Assinatura concluída no modal DocuSign');
    setShowDocuSignModal(false);
    
    if (onSignatureComplete && envelope) {
      onSignatureComplete(envelope.envelopeId, 'completed');
    }
    
    toast({
      title: "Processo Concluído!",
      description: "A assinatura foi realizada com sucesso via DocuSign",
    });
  };

  console.log('🎯 [DocuSignRealIntegration] ANTES DO RETURN - Estado atual:', {
    envelope: !!envelope,
    loading,
    error,
    contractData: !!contractData,
    contractor: !!contractor,
    showDocuSignModal,
    finalCompanyData: !!finalCompanyData
  });

  // Mostrar loading enquanto prepara dados da empresa
  if (!finalCompanyData) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <h3 className="text-xl font-semibold">Preparando DocuSign...</h3>
            <p className="text-gray-600">
              Carregando dados da empresa para criação do envelope
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-blue-600" />
            Assinatura Digital Profissional - DocuSign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Processo de Assinatura Bilateral</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Este contrato será enviado para assinatura de ambas as partes via DocuSign. 
                  Cada signatário receberá um email com link único para assinar digitalmente.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Signatários
              </h5>
              
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm text-gray-600">Contratante</p>
                  <p className="font-semibold">{contractor?.responsible_name || contractor?.name || 'Nome não informado'}</p>
                  <p className="text-sm text-gray-500">{contractor?.email || 'Email não informado'}</p>
                  <p className="text-xs text-gray-400">{contractor?.name || 'Empresa não informada'}</p>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm text-gray-600">Contratada</p>
                  <p className="font-semibold">{finalCompanyData?.responsibleName || 'Administrador'}</p>
                  <p className="text-sm text-gray-500">{finalCompanyData?.email || 'Email não configurado'}</p>
                  <p className="text-xs text-gray-400">{finalCompanyData?.name || 'Nome da empresa'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-semibold text-gray-800">Detalhes do Contrato</h5>
              <div className="bg-white p-3 rounded border space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Número:</span>
                  <span className="font-semibold">#{contractData?.contract_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor:</span>
                  <span className="font-semibold">R$ {contractData?.monthly_value || '0,00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Funcionários:</span>
                  <span className="font-semibold">{contractData?.employee_count || '0'}</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Erro detalhado:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {envelope && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">
                    Envelope DocuSign Criado com Sucesso
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Clock className="h-3 w-3 mr-1" />
                    {envelopeStatus?.status || envelope.status}
                  </Badge>
                </div>
                <p className="text-xs text-green-600">
                  ID: {envelope.envelopeId}
                </p>
                {envelope.recipients && (
                  <div className="mt-2 text-xs">
                    <p>📧 Emails enviados para {envelope.recipients.length} destinatários</p>
                  </div>
                )}
              </div>
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
                <p className="text-sm text-gray-600">Documento que será enviado para assinatura via DocuSign</p>
              </div>
              <div className="p-6">
                <ContractProvider editingContract={editingContract}>
                  <ContractPreview />
                </ContractProvider>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ⭐ BOTÃO PRINCIPAL - SEMPRE VISÍVEL E DESTACADO ⭐ */}
      <Card className="border-2 border-blue-500 bg-blue-50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <FileSignature className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">
                Assinatura Digital DocuSign
              </h3>
              <p className="text-blue-700 text-sm">
                Clique no botão abaixo para criar e enviar o envelope de assinatura
              </p>
            </div>

            <div className="flex gap-3 justify-center max-w-md mx-auto">
              <Button
                onClick={handleCreateEnvelope}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 text-base shadow-lg"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                    Criando envelope...
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6 mr-3" />
                    CRIAR ENVELOPE DOCUSIGN
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onCancel} 
                size="lg"
                className="px-6"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg text-sm space-y-2">
        <h6 className="font-semibold text-blue-900">Como funciona:</h6>
        <ul className="text-blue-800 space-y-1">
          <li>• 📧 Ambas as partes recebem email com link personalizado</li>
          <li>• ✍️ Cada um assina em sua própria sessão segura no DocuSign</li>
          <li>• 📋 Sistema rastreia o progresso das assinaturas em tempo real</li>
          <li>• ✅ Documento completamente assinado é enviado para ambos por email</li>
          <li>• 🔒 Certificação digital e auditoria completa incluídas</li>
        </ul>
      </div>

      {/* Modal do DocuSign */}
      <DocuSignModal
        isOpen={showDocuSignModal}
        onClose={() => setShowDocuSignModal(false)}
        envelopeData={envelope}
        contractNumber={contractData?.contract_number}
        onSigningComplete={handleSigningComplete}
      />

      {showConfig && (
        <DocuSignApiConfig onConfigured={handleConfigComplete} />
      )}
    </div>
  );
};

export default DocuSignRealIntegration;
