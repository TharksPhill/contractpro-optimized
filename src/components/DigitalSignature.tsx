import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, FileText, Download, CheckCircle2 } from 'lucide-react';
import ThankYouMessage from './ThankYouMessage';
import { Confetti } from '@/components/ui/confetti';
import { useDigitalSignature } from '@/hooks/useDigitalSignature';
import { supabase } from '@/integrations/supabase/client';

interface DigitalSignatureProps {
  contractData: any;
  onSignatureComplete: (signatureData: string) => void;
  onCancel: () => void;
}

const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  contractData,
  onSignatureComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const { loading, validateCertificate: validateCert, signPdf, downloadSignedPdf } = useDigitalSignature();
  
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [certificateInfo, setCertificateInfo] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [signatureProcessed, setSignatureProcessed] = useState(false);
  const [digitalSignatureData, setDigitalSignatureData] = useState<any>(null);
  const [signedPdfBase64, setSignedPdfBase64] = useState<string>('');

  const handleSignatureSuccess = (signatureData: string, signedPdf: string) => {
    console.log('🎉 Assinatura digital concluída, iniciando processo de finalização...');
    
    // Armazenar os dados da assinatura
    setDigitalSignatureData(JSON.parse(signatureData));
    setSignedPdfBase64(signedPdf);
    setSignatureProcessed(true);
    
    // Mostrar confetes
    setShowConfetti(true);
    
    // Mostrar mensagem de agradecimento após um pequeno delay
    setTimeout(() => {
      setShowThankYou(true);
    }, 500);

    // Aguardar a exibição da mensagem de agradecimento antes de chamar o callback
    setTimeout(() => {
      console.log('✅ Chamando callback de conclusão da assinatura...');
      onSignatureComplete(signatureData);
    }, 4000);
  };

  const handleContinueAfterThankYou = () => {
    console.log('👋 Usuário confirmou no ThankYou, finalizando processo...');
    setShowThankYou(false);
    setShowConfetti(false);
    // O callback já foi chamado em handleSignatureSuccess
  };

  const handleCertificateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.p12') && !file.name.toLowerCase().endsWith('.pfx')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo .p12 ou .pfx",
        variant: "destructive",
      });
      return;
    }

    setCertificateFile(file);
    
    toast({
      title: "Certificado carregado",
      description: `Arquivo ${file.name} selecionado com sucesso`,
    });
  };

  const handleValidateCertificate = async () => {
    if (!certificateFile || !password) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, selecione o certificado e digite a senha",
        variant: "destructive",
      });
      return;
    }

    try {
      const certInfo = await validateCert(certificateFile, password);
      setCertificateInfo(certInfo);
      
      toast({
        title: "Certificado validado!",
        description: "Certificado ICP-Brasil válido e pronto para uso.",
      });
    } catch (error) {
      console.error("Erro na validação:", error);
    }
  };

  const generateContractPdf = async () => {
    try {
      console.log('📄 Gerando PDF do contrato...');
      
      // Gerar PDF usando a edge function existente
      const { data, error } = await supabase.functions.invoke('html-to-pdf', {
        body: {
          html: document.documentElement.outerHTML,
          options: {
            format: 'A4',
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
            printBackground: true
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao gerar PDF');
      }

      console.log('✅ PDF gerado com sucesso');
      return data.pdf;
      
    } catch (error: any) {
      console.error('❌ Erro ao gerar PDF:', error);
      throw new Error('Erro ao gerar PDF do contrato');
    }
  };

  const generateDigitalSignature = async () => {
    if (!certificateFile || !password) return;

    try {
      console.log("Iniciando processo de assinatura digital...");
      
      // Primeiro gerar o PDF do contrato
      const pdfBase64 = await generateContractPdf();
      
      // Assinar o PDF com o certificado
      const result = await signPdf(pdfBase64, certificateFile, password, contractData);
      
      // Criar dados da assinatura
      const digitalSignature = {
        type: 'digital',
        algorithm: result.signature.algorithm,
        certificate: result.signature.certificate,
        documentHash: result.signature.documentHash,
        signature: `digital_cert_signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: result.signature.timestamp,
        contractId: contractData.id,
        contractorName: contractData?.company?.name || 'Contratante'
      };

      const signatureData = JSON.stringify(digitalSignature);
      
      console.log("Assinatura digital gerada:", digitalSignature);
      
      toast({
        title: "Assinatura digital realizada!",
        description: "O contrato foi assinado digitalmente com sucesso.",
      });

      handleSignatureSuccess(signatureData, result.signedPdfBase64);
    } catch (error: any) {
      console.error("Erro na assinatura digital:", error);
      toast({
        title: "Erro na assinatura",
        description: error.message || "Ocorreu um erro durante o processo de assinatura digital.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSignedPdf = () => {
    if (signedPdfBase64) {
      const filename = `contrato-${contractData.contract_number}-assinado.pdf`;
      downloadSignedPdf(signedPdfBase64, filename);
    }
  };

  // Se o processo de assinatura foi iniciado, mostrar apenas os elementos de conclusão
  if (signatureProcessed) {
    return (
      <>
        {/* Confetti Effect */}
        <Confetti trigger={showConfetti} />
        
        {/* Preview da assinatura antes do ThankYou */}
        {digitalSignatureData && !showThankYou && (
          <div className="text-center space-y-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Shield className="h-8 w-8 text-green-600" />
                <h2 className="text-2xl font-bold text-green-600">Assinatura Digital Concluída!</h2>
              </div>
              
              <div className="bg-white border rounded-lg p-4 text-left mb-4">
                <h3 className="font-bold text-gray-800 mb-3">Dados da Assinatura:</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Titular:</strong> {digitalSignatureData.certificate.subject}</p>
                  <p><strong>Emissor:</strong> {digitalSignatureData.certificate.issuer}</p>
                  <p><strong>Data/Hora:</strong> {new Date(digitalSignatureData.timestamp).toLocaleString('pt-BR')}</p>
                  <p><strong>Algoritmo:</strong> {digitalSignatureData.algorithm}</p>
                </div>
              </div>

              {signedPdfBase64 && (
                <Button 
                  onClick={handleDownloadSignedPdf}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF Assinado
                </Button>
              )}
              
              <p className="text-sm text-green-700 mt-4">
                Sua assinatura foi aplicada ao contrato e está disponível para download.
              </p>
            </div>
          </div>
        )}
        
        {/* Thank You Message */}
        <ThankYouMessage 
          isVisible={showThankYou}
          contractorName={contractData?.company?.name}
          onContinue={handleContinueAfterThankYou}
        />
      </>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assinatura Digital com Certificado ICP-Brasil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="certificate">Certificado Digital (.p12 ou .pfx)</Label>
            <div className="mt-2">
              <Input
                id="certificate"
                type="file"
                accept=".p12,.pfx"
                onChange={handleCertificateUpload}
                className="cursor-pointer"
                disabled={loading}
              />
            </div>
            {certificateFile && (
              <p className="text-sm text-green-600 mt-1">
                ✓ {certificateFile.name} carregado
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Senha do Certificado</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha do seu certificado"
              disabled={loading}
            />
          </div>

          {certificateFile && password && !certificateInfo && (
            <Button 
              onClick={handleValidateCertificate}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando Certificado...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Validar Certificado
                </>
              )}
            </Button>
          )}

          {certificateInfo && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Certificado Validado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <strong>Titular:</strong> {certificateInfo.subject}
                </div>
                <div>
                  <strong>Emissor:</strong> {certificateInfo.issuer}
                </div>
                <div>
                  <strong>Válido de:</strong> {certificateInfo.validFrom} <strong>até:</strong> {certificateInfo.validTo}
                </div>
                <div>
                  <strong>Número de série:</strong> {certificateInfo.serialNumber}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            Documento a ser Assinado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Contrato #{contractData.contract_number} - {contractData.company?.name}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            O PDF será gerado e assinado digitalmente com seu certificado ICP-Brasil.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={generateDigitalSignature}
          disabled={!certificateInfo || loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Assinando Digitalmente...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Assinar com Certificado Digital
            </>
          )}
        </Button>
        
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Certificados A1 (.p12/.pfx) com padrão ICP-Brasil</p>
        <p>• Assinatura digital com validade jurídica total</p>
        <p>• Processamento seguro sem armazenamento de dados</p>
        <p>• Download imediato do PDF assinado</p>
      </div>
    </div>
  );
};

export default DigitalSignature;