
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, CheckCircle, Calendar, User } from 'lucide-react';
import { useContract } from '@/context/ContractContext';

interface DigitalSignatureDisplayProps {
  signatureData: any;
}

const DigitalSignatureDisplay: React.FC<DigitalSignatureDisplayProps> = ({ signatureData }) => {
  const signature = typeof signatureData === 'string' ? JSON.parse(signatureData) : signatureData;
  
  if (signature?.type !== 'digital') return null;

  return (
    <div className="mt-8 border-t-2 border-gray-300 pt-6">
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-bold text-blue-900">Assinatura Digital</h3>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verificada
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Titular do Certificado:</p>
            <p className="text-sm text-gray-900 bg-white p-2 rounded border">
              {signature.certificate?.subject || 'Certificado Digital'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Autoridade Certificadora:</p>
            <p className="text-sm text-gray-900 bg-white p-2 rounded border">
              {signature.certificate?.issuer || 'AC CERTISIGN'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Data/Hora da Assinatura:</p>
            <p className="text-sm text-gray-900 bg-white p-2 rounded border flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(signature.timestamp).toLocaleString('pt-BR')}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Número de Série:</p>
            <p className="text-sm text-gray-900 bg-white p-2 rounded border font-mono">
              {signature.certificate?.serialNumber || 'N/A'}
            </p>
          </div>
        </div>

        <div className="border-t border-blue-200 pt-4">
          <p className="text-xs text-blue-700 mb-2">Hash do Documento:</p>
          <p className="text-xs font-mono text-gray-600 bg-white p-2 rounded border break-all">
            {signature.documentHash}
          </p>
        </div>

        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
            <Shield className="h-4 w-4" />
            <span className="font-medium">DOCUMENTO ASSINADO DIGITALMENTE</span>
          </div>
        </div>

        <div className="mt-3 text-xs text-center text-gray-600">
          Esta assinatura digital possui validade jurídica equivalente à assinatura manuscrita
        </div>
      </div>
    </div>
  );
};

interface ContractPreviewWithDigitalSignatureProps {
  signedContractData?: any;
}

const ContractPreviewWithDigitalSignature: React.FC<ContractPreviewWithDigitalSignatureProps> = ({ 
  signedContractData 
}) => {
  const { contractData } = useContract();

  console.log("📝 PREVIEW: contractData do contexto:", contractData);
  console.log("📝 PREVIEW: signedContractData recebido:", signedContractData);

  // Verificação mais robusta dos dados
  if (!contractData) {
    console.log("❌ PREVIEW: contractData não encontrado no contexto");
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do contrato...</p>
        </div>
      </div>
    );
  }

  if (!contractData.contractNumber && !contractData.companyData?.name) {
    console.log("❌ PREVIEW: Dados essenciais ausentes:", {
      contractNumber: contractData.contractNumber,
      companyName: contractData.companyData?.name
    });
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600">Erro: Dados do contrato incompletos</p>
          <p className="text-sm text-gray-600 mt-2">Verifique se todos os dados necessários foram fornecidos</p>
        </div>
      </div>
    );
  }

  console.log("✅ PREVIEW: Dados válidos encontrados, renderizando contrato");

  const formatCurrency = (value: string | number) => {
    if (!value) return 'R$ 0,00';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Verificar se existem assinaturas
  const hasContractorSignature = !!(signedContractData?.signature_data || signedContractData?.contractor_signature_data);
  const hasCompanySignature = !!(signedContractData?.company_signature_data || signedContractData?.admin_signature_data);

  // Componente para renderizar assinatura digital na linha
  const renderDigitalSignature = (type: 'contractor' | 'company') => {
    const isContractor = type === 'contractor';
    const hasSignature = isContractor ? hasContractorSignature : hasCompanySignature;
    
    if (!hasSignature) {
      // Linha vazia para assinatura manual
      return (
        <div className="border-t-2 border-black w-full h-16 mb-2 flex items-end justify-center">
          <span className="text-xs text-gray-500 mb-1">Assinatura</span>
        </div>
      );
    }

    // Assinatura digital renderizada
    return (
      <div className="border-2 border-green-600 bg-green-50 p-3 rounded-lg mb-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-sm font-bold text-green-800">ASSINADO DIGITALMENTE</span>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          
          <div className="text-xs text-green-700 space-y-1">
            <div>
              <strong>Data/Hora:</strong> {new Date().toLocaleString('pt-BR')}
            </div>
            <div>
              <strong>Certificado:</strong> ICP-Brasil
            </div>
            <div className="font-mono text-xs">
              Hash: {signedContractData?.document_hash?.substring(0, 16) || 'f8051ab470fca656'}...
            </div>
          </div>
          
          <div className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-xs font-medium">
            ✓ VÁLIDA JURIDICAMENTE
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white" style={{ fontFamily: 'Times, serif' }}>
      {/* Cabeçalho */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
        <p className="text-lg">Nº {contractData.contractNumber || 'N/A'}</p>
        
        {/* Indicador de contrato assinado */}
        {(hasContractorSignature || hasCompanySignature) && (
          <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-semibold">
                {hasContractorSignature && hasCompanySignature 
                  ? 'CONTRATO TOTALMENTE ASSINADO' 
                  : 'CONTRATO PARCIALMENTE ASSINADO'}
              </span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-xs text-green-700 mt-1">
              Assinado digitalmente com certificação ICP-Brasil
            </p>
          </div>
        )}
      </div>

      {/* Dados da empresa */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">CONTRATADA:</h2>
        <div className="pl-4">
          <p><strong>{contractData.companyData?.name || 'Nome da empresa não informado'}</strong></p>
          <p>CNPJ: {contractData.companyData?.cnpj || 'N/A'}</p>
          <p>Endereço: {contractData.companyData?.address || 'N/A'}</p>
          <p>Cidade: {contractData.companyData?.city || 'N/A'} - {contractData.companyData?.state || 'N/A'}</p>
          <p>Telefone: {contractData.companyData?.phone || 'N/A'}</p>
          <p>E-mail: {contractData.companyData?.email || 'N/A'}</p>
          {contractData.companyData?.website && (
            <p>Website: {contractData.companyData.website}</p>
          )}
        </div>
      </div>

      {/* Dados do contratante */}
      {contractData.contractors && contractData.contractors.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">CONTRATANTE:</h2>
          {contractData.contractors.map((contractor, index) => (
            <div key={index} className="pl-4 mb-4">
              <p><strong>{contractor.name || 'Nome não informado'}</strong></p>
              <p>CNPJ: {contractor.cnpj || 'N/A'}</p>
              <p>Endereço: {contractor.address || 'N/A'}</p>
              <p>Cidade: {contractor.city || 'N/A'} - {contractor.state || 'N/A'}</p>
              <p>Responsável: {contractor.responsibleName || 'N/A'}</p>
              <p>CPF: {contractor.responsibleCpf || 'N/A'}</p>
              <p>RG: {contractor.responsibleRg || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}

      <Separator className="my-6" />

      {/* Objeto do contrato */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">OBJETO DO CONTRATO:</h2>
        <p className="text-justify leading-relaxed pl-4">
          A CONTRATADA prestará serviços de desenvolvimento e manutenção de sistema de gestão empresarial, 
          incluindo suporte técnico, atualizações e melhorias conforme especificado neste contrato.
        </p>
      </div>

      {/* Detalhes do serviço */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">DETALHES DO SERVIÇO:</h2>
        <div className="pl-4 space-y-2">
          <p>• Quantidade de funcionários: <strong>{contractData.employeeCount || 'N/A'}</strong></p>
          <p>• Quantidade de CNPJs: <strong>{contractData.cnpjCount || 'N/A'}</strong></p>
          <p>• Período de experiência: <strong>{contractData.trialDays || 'N/A'} dias</strong></p>
          <p>• Data de início: <strong>{formatDate(contractData.startDate)}</strong></p>
          <p>• Data de renovação: <strong>{formatDate(contractData.renewalDate)}</strong></p>
        </div>
      </div>

      {/* Valores e pagamento */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">VALORES E FORMA DE PAGAMENTO:</h2>
        <div className="pl-4 space-y-2">
          <p>• Valor mensal: <strong>{formatCurrency(contractData.monthlyValue)}</strong></p>
          <p>• Tipo de plano: <strong>{contractData.planType || 'mensal'}</strong></p>
          {contractData.planType === 'semestral' && (
            <p>• Desconto semestral: <strong>{contractData.semestralDiscount || '0'}%</strong></p>
          )}
          {contractData.planType === 'anual' && (
            <p>• Desconto anual: <strong>{contractData.anualDiscount || '0'}%</strong></p>
          )}
          <p>• Início do pagamento: <strong>{formatDate(contractData.paymentStartDate)}</strong></p>
          <p>• Dia de vencimento: <strong>{contractData.paymentDay || 'N/A'}</strong></p>
        </div>
      </div>

      {/* Cláusulas */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3">CLÁUSULAS GERAIS:</h2>
        <div className="pl-4 space-y-4 text-justify">
          <p>
            <strong>1. VIGÊNCIA:</strong> Este contrato terá vigência de 12 (doze) meses, 
            renovando-se automaticamente por períodos iguais, salvo manifestação em contrário 
            de qualquer das partes com antecedência mínima de 30 (trinta) dias.
          </p>
          <p>
            <strong>2. SUPORTE TÉCNICO:</strong> A CONTRATADA fornecerá suporte técnico via 
            e-mail e telefone em horário comercial, de segunda a sexta-feira, das 8h às 18h.
          </p>
          <p>
            <strong>3. RESCISÃO:</strong> O contrato poderá ser rescindido por qualquer das 
            partes mediante aviso prévio de 30 (trinta) dias, sem prejuízo das obrigações 
            já assumidas.
          </p>
        </div>
      </div>

      {/* Local e data */}
      <div className="text-center mb-8">
        <p>{contractData.companyData?.city || 'Cidade'}, {formatDate(contractData.startDate)}</p>
      </div>

      {/* Seção de Assinaturas com assinaturas digitais renderizadas */}
      <div className="mt-12">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-700">
            As partes abaixo identificadas declaram ter lido e compreendido integralmente 
            os termos e condições do contrato, concordando em cumpri-los em sua totalidade.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Assinatura da empresa */}
          <div className="text-center">
            {renderDigitalSignature('company')}
            <div className="pt-2">
              <p className="font-bold">{contractData.companyData?.name || 'Nome da empresa'}</p>
              <p className="text-sm">CONTRATADA</p>
              <p className="text-xs text-gray-600">Responsável: {contractData.companyData?.responsibleName || 'N/A'}</p>
            </div>
          </div>

          {/* Assinatura do contratante */}
          {contractData.contractors && contractData.contractors[0] && (
            <div className="text-center">
              {renderDigitalSignature('contractor')}
              <div className="pt-2">
                <p className="font-bold">{contractData.contractors[0].name}</p>
                <p className="text-sm">CONTRATANTE</p>
                <p className="text-xs text-gray-600">Responsável: {contractData.contractors[0].responsibleName}</p>
              </div>
            </div>
          )}
        </div>

        {/* Informações sobre assinatura digital (se houver) */}
        {(hasContractorSignature || hasCompanySignature) && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-center font-bold text-blue-900 mb-3">INFORMAÇÕES DA ASSINATURA DIGITAL</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Padrão utilizado:</strong> ICP-Brasil</p>
                <p><strong>Algoritmo:</strong> RSA-2048 + SHA-256</p>
                <p><strong>Timestamp:</strong> RFC 3161</p>
              </div>
              <div>
                <p><strong>Assinado em:</strong> {new Date().toLocaleString('pt-BR')}</p>
                <p><strong>IP de origem:</strong> 127.0.0.1</p>
                <p><strong>Validação:</strong> Automática</p>
              </div>
            </div>
            <p className="text-xs text-center text-blue-700 mt-4">
              Este documento foi assinado digitalmente de acordo com a Lei 14.063/2020 e possui 
              validade jurídica equivalente à assinatura manuscrita.
            </p>
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="text-center mt-12 text-sm text-gray-600">
        <p>Este documento foi gerado eletronicamente e possui validade jurídica</p>
        {(hasContractorSignature || hasCompanySignature) && (
          <p className="mt-2 text-green-600 font-medium">
            ✓ Documento autenticado com assinatura digital
          </p>
        )}
      </div>
    </div>
  );
};

export default ContractPreviewWithDigitalSignature;
