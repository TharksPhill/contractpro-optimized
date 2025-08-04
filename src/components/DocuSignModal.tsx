
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, X, CheckCircle, FileSignature } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocuSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelopeData: {
    envelopeId: string;
    signingUrl: string;
    status: string;
    recipients?: Array<{
      name: string;
      email: string;
      status: string;
    }>;
  } | null;
  contractNumber?: string;
  onSigningComplete?: () => void;
}

const DocuSignModal: React.FC<DocuSignModalProps> = ({
  isOpen,
  onClose,
  envelopeData,
  contractNumber,
  onSigningComplete
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [signingCompleted, setSigningCompleted] = useState(false);

  useEffect(() => {
    if (isOpen && envelopeData) {
      console.log('📋 DocuSign Modal aberto com dados:', envelopeData);
    }
  }, [isOpen, envelopeData]);

  const handleStartSigning = () => {
    console.log('🚀 Iniciando processo de assinatura no modal');
    setIsLoading(true);
    setShowIframe(true);
    
    // Simular carregamento
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleOpenInNewTab = () => {
    if (envelopeData?.signingUrl) {
      console.log('🔗 Abrindo DocuSign em nova aba:', envelopeData.signingUrl);
      window.open(envelopeData.signingUrl, '_blank');
      
      toast({
        title: "DocuSign aberto em nova aba",
        description: "Complete a assinatura na nova aba que foi aberta",
      });
    }
  };

  const handleSigningComplete = () => {
    console.log('✅ Assinatura completada no modal');
    setSigningCompleted(true);
    
    toast({
      title: "Assinatura concluída!",
      description: "O contrato foi assinado com sucesso via DocuSign",
    });
    
    setTimeout(() => {
      onSigningComplete?.();
      onClose();
    }, 2000);
  };

  if (!envelopeData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-blue-600" />
              <span>Assinatura DocuSign - Contrato #{contractNumber}</span>
            </div>
            <Button variant="outline" onClick={onClose} size="sm">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status do Envelope */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-blue-900">Status do Envelope</h4>
              <span className="text-sm text-blue-600">ID: {envelopeData.envelopeId}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700">Status: <strong>{envelopeData.status}</strong></p>
              </div>
              <div>
                <p className="text-sm text-blue-700">
                  Signatários: <strong>{envelopeData.recipients?.length || 0}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Signatários */}
          {envelopeData.recipients && envelopeData.recipients.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-semibold text-gray-800">Signatários:</h5>
              {envelopeData.recipients.map((recipient, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{recipient.name}</p>
                    <p className="text-sm text-gray-600">{recipient.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    recipient.status === 'completed' ? 'bg-green-100 text-green-800' :
                    recipient.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {recipient.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {signingCompleted ? (
            // Tela de conclusão
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-600 mb-2">
                Assinatura Concluída!
              </h3>
              <p className="text-gray-600">
                O contrato foi assinado com sucesso via DocuSign
              </p>
            </div>
          ) : showIframe ? (
            // Interface de assinatura integrada
            <div className="space-y-4">
              <Alert>
                <FileSignature className="h-4 w-4" />
                <AlertDescription>
                  Interface de assinatura DocuSign carregada. Complete sua assinatura abaixo.
                </AlertDescription>
              </Alert>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Carregando interface de assinatura...</p>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '500px' }}>
                  {/* Simulação da interface do DocuSign */}
                  <div className="h-full flex flex-col">
                    <div className="bg-blue-600 text-white p-3 text-center">
                      <h4 className="font-semibold">DocuSign - Interface de Assinatura</h4>
                    </div>
                    
                    <div className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <FileSignature className="h-16 w-16 text-blue-600 mx-auto" />
                        <div>
                          <h5 className="text-lg font-semibold mb-2">Documento Pronto para Assinatura</h5>
                          <p className="text-gray-600 mb-4">
                            Contrato #{contractNumber} - Clique para simular a assinatura
                          </p>
                          <Button 
                            onClick={handleSigningComplete}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <FileSignature className="h-4 w-4 mr-2" />
                            Assinar Documento
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Opções de assinatura
            <div className="space-y-4">
              <Alert>
                <FileSignature className="h-4 w-4" />
                <AlertDescription>
                  Escolha como deseja proceder com a assinatura do documento via DocuSign.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleStartSigning}
                  className="h-20 bg-blue-600 hover:bg-blue-700 flex flex-col items-center justify-center"
                >
                  <FileSignature className="h-6 w-6 mb-2" />
                  <span>Assinar Aqui</span>
                  <span className="text-xs opacity-80">Interface integrada</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleOpenInNewTab}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <ExternalLink className="h-6 w-6 mb-2" />
                  <span>Abrir em Nova Aba</span>
                  <span className="text-xs opacity-60">Site do DocuSign</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocuSignModal;
