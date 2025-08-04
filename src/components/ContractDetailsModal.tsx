import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContractShare } from "@/hooks/useContractShare";
import ShareContractModal from "./ShareContractModal";
import ContractAddons from "./ContractAddons";
import ContractSignaturesTab from "./ContractSignaturesTab";
import { supabase } from "@/integrations/supabase/client";
import { formatDateToBrazilian } from "@/utils/dateUtils";
import { 
  FileText, 
  Share2, 
  Users, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  CreditCard,
  DollarSign,
  Clock,
  UserCheck,
  Hash,
  Briefcase
} from "lucide-react";

interface ContractDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
  onContractUpdate?: () => void;
}

const ContractDetailsModal = ({ isOpen, onClose, contract, onContractUpdate }: ContractDetailsModalProps) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [signedContracts, setSignedContracts] = useState<any[]>([]);
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { getSignedContracts } = useContractShare();

  useEffect(() => {
    if (isOpen && contract) {
      console.log("🔄 Modal aberto, carregando dados para o contrato:", contract);
      loadSignedContracts();
      loadCompanyData();
    }
  }, [isOpen, contract]);

  const loadSignedContracts = async () => {
    if (contract?.id) {
      const signed = await getSignedContracts(contract.id);
      setSignedContracts(signed);
    }
  };

  const loadCompanyData = async () => {
    setLoading(true);
    console.log("🏢 === INICIANDO BUSCA DOS DADOS DA EMPRESA ===");
    console.log("📋 Contrato completo recebido:", JSON.stringify(contract, null, 2));
    
    try {
      // Primeiro, vamos verificar se existe dados no localStorage mais recentes
      const savedCompanyData = localStorage.getItem("companyProfile");
      let localStorageData = null;
      if (savedCompanyData) {
        localStorageData = JSON.parse(savedCompanyData);
        console.log("💾 Dados encontrados no localStorage:", localStorageData);
      }

      // 1. Tentar buscar pela company_id do contrato
      if (contract?.company_id) {
        console.log("🔍 MÉTODO 1: Buscando empresa pelo company_id:", contract.company_id);
        const { data: company, error } = await supabase
          .from("companies")
          .select("*")
          .eq("id", contract.company_id)
          .maybeSingle();

        console.log("📊 Resultado da busca por company_id:", { company, error });

        if (error) {
          console.error("❌ Erro ao carregar dados da empresa pelo company_id:", error);
        } else if (company) {
          console.log("✅ SUCESSO - Empresa encontrada pelo company_id:", company);
          
          // Se temos dados do localStorage que são mais recentes ou diferentes, vamos usar eles e atualizar o Supabase
          if (localStorageData && localStorageData.name && localStorageData.name !== company.name) {
            console.log("🔄 Dados do localStorage são diferentes/mais recentes, atualizando Supabase...");
            
            const updateData = {
              name: localStorageData.name,
              address: localStorageData.address || company.address,
              phone: localStorageData.phone || company.phone,
              email: localStorageData.email || company.email,
              website: localStorageData.website || company.website,
              logo: localStorageData.logo || company.logo,
            };

            const { data: updatedCompany, error: updateError } = await supabase
              .from("companies")
              .update(updateData)
              .eq("id", company.id)
              .select()
              .single();

            if (!updateError && updatedCompany) {
              console.log("✅ Empresa atualizada com dados do localStorage:", updatedCompany);
              setCompanyData(updatedCompany);
            } else {
              console.log("⚠️ Erro ao atualizar empresa, usando dados do localStorage:", updateError);
              setCompanyData({ ...company, ...localStorageData });
            }
          } else {
            // Usar dados do Supabase
            setCompanyData(company);
          }
          
          setLoading(false);
          return;
        } else {
          console.log("⚠️ Nenhuma empresa encontrada com company_id:", contract.company_id);
        }
      } else {
        console.log("⚠️ Contract não possui company_id:", contract?.company_id);
      }

      // 2. Tentar buscar pela user_id do contrato
      if (contract?.user_id) {
        console.log("🔍 MÉTODO 2: Buscando empresa pelo user_id do contrato:", contract.user_id);
        const { data: company, error } = await supabase
          .from("companies")
          .select("*")
          .eq("user_id", contract.user_id)
          .maybeSingle();

        console.log("📊 Resultado da busca por user_id:", { company, error });

        if (error) {
          console.error("❌ Erro ao carregar dados da empresa pelo user_id:", error);
        } else if (company) {
          console.log("✅ SUCESSO - Empresa encontrada pelo user_id:", company);
          
          // Se temos dados do localStorage que são mais recentes ou diferentes, vamos usar eles e atualizar o Supabase
          if (localStorageData && localStorageData.name && localStorageData.name !== company.name) {
            console.log("🔄 Dados do localStorage são diferentes/mais recentes, atualizando Supabase...");
            
            const updateData = {
              name: localStorageData.name,
              address: localStorageData.address || company.address,
              phone: localStorageData.phone || company.phone,
              email: localStorageData.email || company.email,
              website: localStorageData.website || company.website,
              logo: localStorageData.logo || company.logo,
            };

            const { data: updatedCompany, error: updateError } = await supabase
              .from("companies")
              .update(updateData)
              .eq("id", company.id)
              .select()
              .single();

            if (!updateError && updatedCompany) {
              console.log("✅ Empresa atualizada com dados do localStorage:", updatedCompany);
              setCompanyData(updatedCompany);
            } else {
              console.log("⚠️ Erro ao atualizar empresa, usando dados do localStorage:", updateError);
              setCompanyData({ ...company, ...localStorageData });
            }
          } else {
            // Usar dados do Supabase
            setCompanyData(company);
          }
          
          setLoading(false);
          return;
        } else {
          console.log("⚠️ Nenhuma empresa encontrada com user_id:", contract.user_id);
        }
      } else {
        console.log("⚠️ Contract não possui user_id:", contract?.user_id);
      }

      // 3. Usar localStorage como fallback
      console.log("🔍 MÉTODO 3: Usando localStorage como fallback");
      if (localStorageData && localStorageData.name && localStorageData.name !== "") {
        console.log("✅ Usando dados do localStorage:", localStorageData);
        setCompanyData(localStorageData);
      } else {
        console.log("⚠️ Nenhum dado válido encontrado");
        setCompanyData(null);
      }
      
    } catch (error) {
      console.error("❌ Erro inesperado ao buscar empresa:", error);
      setCompanyData(null);
    } finally {
      setLoading(false);
      console.log("🏁 === BUSCA DOS DADOS DA EMPRESA FINALIZADA ===");
    }
  };

  const getSigningStatus = (contractorId: string) => {
    const signed = signedContracts.find(sc => sc.contractor_id === contractorId);
    if (signed) {
      return signed.is_cancelled ? 'cancelled' : 'signed';
    }
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Assinado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: string | number) => {
    // Se o valor for string, preservar como está e converter para number
    let numValue: number;
    
    if (typeof value === 'string') {
      // Remove qualquer formatação existente e converte para número
      const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
      numValue = parseFloat(cleanValue);
    } else {
      numValue = value;
    }
    
    // Se não for um número válido, retorna 0
    if (isNaN(numValue)) {
      numValue = 0;
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  // Function to get the correct label based on plan type
  const getValueLabel = () => {
    const planType = contract.plan_type || 'mensal';
    
    switch (planType) {
      case 'anual':
        return 'Valor Anual';
      case 'semestral':
        return 'Valor Semestral';
      default:
        return 'Valor Mensal';
    }
  };

  const handleRefreshSignatures = () => {
    loadSignedContracts();
    if (onContractUpdate) {
      onContractUpdate();
    }
  };

  if (!contract) return null;

  console.log("🖼️ Renderizando modal com companyData:", companyData);
  console.log("⏳ Estado do loading:", loading);
  console.log("💰 Valor do contrato para formatação:", contract.monthly_value);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <span className="text-gray-900">Contrato #{contract.contract_number}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={contract.status === 'Ativo' ? 'default' : 'secondary'} className="text-xs">
                    {contract.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Criado em {formatDate(contract.created_at)}
                  </span>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="signatures">Assinaturas</TabsTrigger>
              <TabsTrigger value="addons">Adicionais e Mudanças</TabsTrigger>
              <TabsTrigger value="sharing">Compartilhamento</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Cards de resumo principais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">{getValueLabel()}</p>
                        <p className="text-lg font-bold text-blue-600">{formatCurrency(contract.monthly_value)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500 p-2 rounded-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-900">Funcionários</p>
                        <p className="text-lg font-bold text-green-600">{contract.employee_count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-500 p-2 rounded-lg">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-900">CNPJs</p>
                        <p className="text-lg font-bold text-purple-600">{contract.cnpj_count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-500 p-2 rounded-lg">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-900">Teste</p>
                        <p className="text-lg font-bold text-amber-600">{contract.trial_days} dias</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informações do Contrato */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-600" />
                      Detalhes do Contrato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo de Plano</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{contract.plan_type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
                        <Badge variant={contract.status === 'Ativo' ? 'default' : 'secondary'}>
                          {contract.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500">Data de Início</p>
                          <p className="text-sm font-medium text-gray-900">{formatDateToBrazilian(contract.start_date)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500">Data de Renovação</p>
                          <p className="text-sm font-medium text-gray-900">{formatDateToBrazilian(contract.renewal_date)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500">Dia de Pagamento</p>
                          <p className="text-sm font-medium text-gray-900">Todo dia {contract.payment_day}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Empresa Contratada */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Empresa Contratada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-pulse flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-200 rounded-full animate-bounce"></div>
                          <span className="text-gray-500">Carregando dados da empresa...</span>
                        </div>
                      </div>
                    ) : companyData ? (
                      <div className="space-y-4">
                        {/* Logo e nome */}
                        <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                          {companyData.logo ? (
                            <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center justify-center flex-shrink-0">
                              <img 
                                src={companyData.logo} 
                                alt="Logo da empresa" 
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-blue-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900">{companyData.name}</h3>
                            {companyData.cnpj && (
                              <p className="text-sm text-gray-600">CNPJ: {companyData.cnpj}</p>
                            )}
                          </div>
                        </div>

                        {/* Informações de contato */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-gray-500">Endereço</p>
                              <p className="text-sm text-gray-900">{companyData.address}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center gap-3">
                              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-gray-500">Telefone</p>
                                <p className="text-sm text-gray-900">{companyData.phone}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-gray-500">E-mail</p>
                                <p className="text-sm text-blue-600 hover:text-blue-800">
                                  <a href={`mailto:${companyData.email}`}>{companyData.email}</a>
                                </p>
                              </div>
                            </div>
                          </div>

                          {companyData.website && (
                            <div className="flex items-center gap-3">
                              <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-gray-500">Website</p>
                                <p className="text-sm text-blue-600 hover:text-blue-800">
                                  <a 
                                    href={`http://${companyData.website}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    {companyData.website}
                                  </a>
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Building2 className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="font-medium text-gray-900 mb-2">Dados da empresa não encontrados</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Configure o perfil da empresa nas configurações para que as informações apareçam aqui.
                        </p>
                        <div className="text-xs text-gray-400 space-y-1">
                          <p>Debug info:</p>
                          <p>company_id: {contract?.company_id || 'N/A'}</p>
                          <p>user_id: {contract?.user_id || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Contratantes */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    Contratantes ({contract.contractors?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {contract.contractors?.length > 0 ? (
                    <div className="space-y-4">
                      {contract.contractors.map((contractor: any, index: number) => (
                        <div key={contractor.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-semibold text-sm">{index + 1}</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{contractor.name}</h4>
                                <p className="text-sm text-gray-600">CNPJ: {contractor.cnpj}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 ml-13">
                              <div>
                                <span className="font-medium">Responsável:</span> {contractor.responsible_name}
                              </div>
                              <div>
                                <span className="font-medium">Localização:</span> {contractor.city}/{contractor.state}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(getSigningStatus(contractor.id))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">Nenhum contratante cadastrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signatures" className="space-y-4">
              <ContractSignaturesTab
                contractId={contract.id}
                signedContracts={signedContracts}
                allContractors={contract.contractors || []}
                onRefresh={handleRefreshSignatures}
              />
            </TabsContent>

            <TabsContent value="addons" className="space-y-4">
              <ContractAddons 
                contractId={contract.id}
                contractNumber={contract.contract_number}
                onContractUpdate={onContractUpdate}
              />
            </TabsContent>

            <TabsContent value="sharing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Compartilhar Contrato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <Share2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">
                      Gere links seguros para que os contratantes possam acessar e assinar o contrato
                    </p>
                    <Button onClick={() => setShowShareModal(true)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Gerar Links de Compartilhamento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ShareContractModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        contract={contract}
      />
    </>
  );
};

export default ContractDetailsModal;
