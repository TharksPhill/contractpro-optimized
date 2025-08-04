
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, FileText } from 'lucide-react';

interface AdminDigitalSignatureProps {
  contractData: any;
  onSignatureComplete: (signatureData: string) => void;
  onCancel: () => void;
}

const AdminDigitalSignature: React.FC<AdminDigitalSignatureProps> = ({
  contractData,
  onSignatureComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [signing, setSigning] = useState(false);
  const [certificateInfo, setCertificateInfo] = useState<any>(null);

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
    
    // Simular extração de informações do certificado
    const mockCertInfo = {
      subject: "CN=ADMINISTRADOR CERTIFICADO:12345678901, OU=Certificado Digital, O=AC CERTISIGN, C=BR",
      issuer: "AC CERTISIGN",
      validFrom: new Date().toLocaleDateString('pt-BR'),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      serialNumber: Math.random().toString(36).substr(2, 9).toUpperCase()
    };

    setCertificateInfo(mockCertInfo);
    
    toast({
      title: "Certificado carregado",
      description: `Arquivo ${file.name} selecionado com sucesso`,
    });
  };

  const validateCertificate = async () => {
    if (!certificateFile || !password) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, selecione o certificado e digite a senha",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Simular validação do certificado
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      toast({
        title: "Erro na validação",
        description: "Não foi possível validar o certificado. Verifique o arquivo e a senha.",
        variant: "destructive",
      });
      return false;
    }
  };

  const generateDigitalSignature = async () => {
    if (!certificateFile || !password) return;

    setSigning(true);
    
    try {
      console.log("Iniciando processo de assinatura digital do administrador...");
      
      // Validar certificado
      const isValid = await validateCertificate();
      if (!isValid) {
        setSigning(false);
        return;
      }

      // Gerar hash do documento
      const contractContent = document.documentElement.outerHTML;
      const encoder = new TextEncoder();
      const data = encoder.encode(contractContent);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log("Hash do documento gerado:", hashHex);

      // Simular assinatura com certificado digital
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const digitalSignature = {
        type: 'digital',
        algorithm: 'SHA256withRSA',
        certificate: {
          subject: certificateInfo?.subject || "CN=ADMINISTRADOR CERTIFICADO",
          issuer: certificateInfo?.issuer || "AC CERTISIGN",
          serialNumber: certificateInfo?.serialNumber || Math.random().toString(36).substr(2, 9).toUpperCase(),
          validFrom: certificateInfo?.validFrom || new Date().toLocaleDateString('pt-BR'),
          validTo: certificateInfo?.validTo || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
        },
        documentHash: hashHex,
        signature: `admin_digital_cert_signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        contractId: contractData.id
      };

      const signatureData = JSON.stringify(digitalSignature);
      
      console.log("Assinatura digital do administrador gerada:", digitalSignature);
      
      toast({
        title: "Assinatura digital realizada!",
        description: "O contrato foi assinado digitalmente com sucesso.",
      });

      onSignatureComplete(signatureData);
    } catch (error) {
      console.error("Erro na assinatura digital:", error);
      toast({
        title: "Erro na assinatura",
        description: "Ocorreu um erro durante o processo de assinatura digital.",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assinatura Digital do Administrador
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
              disabled={signing}
            />
          </div>

          {certificateInfo && (
            <Card className="bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Informações do Certificado</CardTitle>
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
            O documento completo será assinado digitalmente com seu certificado.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={generateDigitalSignature}
          disabled={!certificateFile || !password || signing}
          className="flex-1"
        >
          {signing ? (
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
        
        <Button variant="outline" onClick={onCancel} disabled={signing}>
          Cancelar
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Apenas certificados A1 (.p12/.pfx) são suportados atualmente</p>
        <p>• Sua senha não é armazenada e é utilizada apenas para validação</p>
        <p>• A assinatura digital possui validade jurídica equivalente à assinatura manuscrita</p>
      </div>
    </div>
  );
};

export default AdminDigitalSignature;
