import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Filter, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Download,
  Calendar,
  User,
  Building,
  RefreshCw
} from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import SignatureDetailsModal from '@/components/signatures/SignatureDetailsModal';
import ContractComparisonModal from '@/components/signatures/ContractComparisonModal';
import SignatureStatsCards from '@/components/signatures/SignatureStatsCards';
import ContractSignaturesTable from '@/components/signatures/ContractSignaturesTable';
import PlanChangeSignaturesTable from '@/components/signatures/PlanChangeSignaturesTable';
import ContractPreviewModal from '@/components/ContractPreviewModal';
import BulkDeleteSignaturesDialog from '@/components/signatures/BulkDeleteSignaturesDialog';
import { generateContractPDF } from '@/utils/contractPdfGenerator';
import { NotificationBell } from '@/components/NotificationBell';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';

const ContractSignatures = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [contractSignatures, setContractSignatures] = useState<any[]>([]);
  const [planChangeSignatures, setPlanChangeSignatures] = useState<any[]>([]);
  const [selectedSignature, setSelectedSignature] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [contractsToDelete, setContractsToDelete] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalContracts: 0,
    signedContracts: 0,
    pendingContracts: 0,
    planChanges: 0,
    signedPlanChanges: 0,
    pendingPlanChanges: 0
  });

  useEffect(() => {
    loadSignatureData();
  }, []);

  const loadSignatureData = async () => {
    try {
      setLoading(true);
      
      console.log("🔄 Recarregando dados de assinatura...");
      
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          status,
          created_at,
          monthly_value,
          plan_type,
          employee_count,
          cnpj_count,
          start_date,
          renewal_date,
          payment_start_date,
          payment_day,
          trial_days,
          semestral_discount,
          anual_discount,
          contractors(*),
          signed_contracts(*),
          admin_contract_signatures(*),
          companies(*),
          autentique_documents(
            id,
            pdf_file_path,
            public_id,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (contractsError) {
        console.error("❌ Erro ao carregar contratos:", contractsError);
        throw contractsError;
      }

      const contractsWithCompany = contracts?.map(contract => ({
        ...contract,
        company: contract.companies || {}
      })) || [];

      const { data: planChanges, error: planChangesError } = await supabase
        .from('contract_addons')
        .select(`
          id,
          contract_id,
          addon_type,
          description,
          new_value,
          previous_value,
          request_date,
          created_at,
          contract:contracts(
            contract_number,
            contractors(*)
          )
        `)
        .eq('addon_type', 'plan_change')
        .order('created_at', { ascending: false });

      if (planChangesError) {
        console.error("❌ Erro ao carregar mudanças de plano:", planChangesError);
        throw planChangesError;
      }

      console.log("✅ Contratos carregados:", contractsWithCompany.length);
      console.log("📋 Mudanças de plano carregadas:", planChanges?.length || 0);

      setContractSignatures(contractsWithCompany);
      setPlanChangeSignatures(planChanges || []);

      const signedContracts = contractsWithCompany?.filter(c => 
        c.signed_contracts?.length > 0
      ) || [];
      
      const pendingContracts = contractsWithCompany?.filter(c => 
        !c.signed_contracts?.length || c.signed_contracts?.length === 0
      ) || [];
      
      console.log("📊 Estatísticas calculadas:", {
        total: contractsWithCompany?.length || 0,
        signed: signedContracts.length,
        pending: pendingContracts.length
      });
      
      setStats({
        totalContracts: contractsWithCompany?.length || 0,
        signedContracts: signedContracts.length,
        pendingContracts: pendingContracts.length,
        planChanges: planChanges?.length || 0,
        signedPlanChanges: 0,
        pendingPlanChanges: planChanges?.length || 0
      });

    } catch (error: any) {
      console.error('❌ Erro ao carregar dados de assinatura:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados de assinatura: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async (contractIds: string[]) => {
    try {
      console.log("🗑️ Iniciando exclusão em massa de contratos:", contractIds);

      for (const contractId of contractIds) {
        await supabase
          .from('signed_contracts')
          .delete()
          .eq('contract_id', contractId);

        await supabase
          .from('admin_contract_signatures')
          .delete()
          .eq('contract_id', contractId);

        await supabase
          .from('contract_access_tokens')
          .delete()
          .eq('contract_id', contractId);

        await supabase
          .from('contract_addons')
          .delete()
          .eq('contract_id', contractId);

        await supabase
          .from('notifications')
          .delete()
          .eq('contract_id', contractId);

        await supabase
          .from('contractors')
          .delete()
          .eq('contract_id', contractId);

        await supabase
          .from('contracts')
          .delete()
          .eq('id', contractId);
      }

      toast({
        title: 'Sucesso',
        description: `${contractIds.length} contrato(s) excluído(s) com sucesso`,
      });

      await loadSignatureData();
      setShowBulkDeleteDialog(false);
      setContractsToDelete([]);
    } catch (error: any) {
      console.error('❌ Erro ao excluir contratos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir contratos: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleViewSignature = (signatureData: any) => {
    console.log("🔍 Abrindo modal de assinatura com dados:", signatureData);
    console.log("🔍 CONTRACT DATA que será passado:", signatureData.contract);
    console.log("🔍 MONTHLY VALUE encontrado:", signatureData.contract?.monthly_value);
    console.log("🔍 EMPLOYEE COUNT encontrado:", signatureData.contract?.employee_count);
    console.log("🔍 START DATE encontrado:", signatureData.contract?.start_date);
    setSelectedSignature(signatureData);
    setShowPreviewModal(true);
  };

  const handleCompareContracts = (contract: any) => {
    console.log("🔄 Abrindo modal de comparação:", contract);
    setSelectedContract(contract);
    setShowComparisonModal(true);
  };

  const handleDownloadSignedContract = async () => {
    if (!selectedSignature?.contract) {
      toast({
        title: 'Erro',
        description: 'Dados do contrato não encontrados',
        variant: 'destructive',
      });
      return;
    }

    try {
      await generateContractPDF(
        selectedSignature.contract,
        selectedSignature.contractors,
        'signed'
      );
      
      toast({
        title: 'Download concluído',
        description: 'Contrato assinado baixado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao baixar contrato:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar PDF do contrato',
        variant: 'destructive',
      });
    }
  };

  const handleSignatureComplete = async () => {
    console.log("✅ Assinatura concluída - recarregando dados da tabela");
    
    toast({
      title: 'Assinatura concluída!',
      description: 'O contrato foi assinado com sucesso. Atualizando a lista...',
    });

    await loadSignatureData();
    setShowPreviewModal(false);
    setSelectedSignature(null);
  };

  const filteredContracts = contractSignatures.filter(contract => {
    const matchesSearch = contract.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.contractors?.[0]?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'signed' && contract.signed_contracts?.length > 0) ||
                         (statusFilter === 'pending' && contract.signed_contracts?.length === 0);
    
    return matchesSearch && matchesStatus;
  });

  const filteredPlanChanges = planChangeSignatures.filter(planChange => {
    const matchesSearch = planChange.contract?.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         planChange.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-slate-50">
        <AppSidebar 
          activeView="contract-signatures" 
          onViewChange={() => {}} 
          onNewContract={() => {}}
        />
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 px-6 border-b bg-white shadow-sm">
            <SidebarTrigger className="-ml-1 hover:bg-slate-100 transition-colors" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-xl font-semibold text-slate-800 flex-1">Gerenciamento de Assinaturas</h1>
            <div className="flex items-center space-x-2">
              <NotificationBell onViewAll={() => {}} />
              <UserProfileDropdown />
            </div>
          </header>
          
          <main className="flex-1 bg-slate-50 p-6">
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header description */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mt-1">
                    Controle completo de assinaturas de contratos e mudanças de planos
                  </p>
                </div>
                <Button onClick={loadSignatureData} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>

              {/* Estatísticas */}
              <SignatureStatsCards stats={stats} />

              {/* Filtros */}
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por contrato ou contratante..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status da Assinatura" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="signed">Assinados</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Períodos</SelectItem>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="week">Esta Semana</SelectItem>
                        <SelectItem value="month">Este Mês</SelectItem>
                        <SelectItem value="quarter">Último Trimestre</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" className="w-full">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros Avançados
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs principais */}
              <Tabs defaultValue="contracts" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-white border rounded-lg p-1">
                  <TabsTrigger 
                    value="contracts" 
                    className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    <FileText className="h-4 w-4" />
                    Contratos ({stats.totalContracts})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="plan-changes"
                    className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Mudanças de Planos ({stats.planChanges})
                  </TabsTrigger>
                </TabsList>

                {/* Tab de Contratos */}
                <TabsContent value="contracts">
                  <ContractSignaturesTable
                    contracts={filteredContracts}
                    loading={loading}
                    onViewSignature={handleViewSignature}
                    onCompareContracts={handleCompareContracts}
                    onRefresh={loadSignatureData}
                    onBulkDelete={(contractIds) => {
                      setContractsToDelete(contractIds);
                      setShowBulkDeleteDialog(true);
                    }}
                  />
                </TabsContent>

                {/* Tab de Mudanças de Planos */}
                <TabsContent value="plan-changes">
                  <PlanChangeSignaturesTable
                    planChanges={filteredPlanChanges}
                    loading={loading}
                    onViewDetails={handleViewSignature}
                  />
                </TabsContent>
              </Tabs>

              {/* Modais */}
              <SignatureDetailsModal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                signature={selectedSignature}
              />

              <ContractComparisonModal
                isOpen={showComparisonModal}
                onClose={() => setShowComparisonModal(false)}
                contract={selectedContract}
              />

              {/* Modal de Preview do Contrato Assinado - ATUALIZADO com callback */}
              {selectedSignature && showPreviewModal && (
                <ContractPreviewModal
                  isOpen={showPreviewModal}
                  onClose={() => setShowPreviewModal(false)}
                  contractData={selectedSignature.contract}
                  contractorData={selectedSignature.contractors}
                  signedContractData={selectedSignature}
                  onDownload={handleDownloadSignedContract}
                  onSignatureComplete={handleSignatureComplete}
                />
              )}

              {/* Modal de Exclusão em Massa */}
              <BulkDeleteSignaturesDialog
                isOpen={showBulkDeleteDialog}
                onClose={() => setShowBulkDeleteDialog(false)}
                selectedContracts={contractsToDelete}
                contracts={contractSignatures}
                onConfirm={handleBulkDelete}
              />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ContractSignatures;
