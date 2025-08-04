import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertTriangle, X, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useContracts } from '@/hooks/useContracts';

interface CSVImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  selectedFile: File | null;
}

interface ImportResult {
  row: number;
  status: 'success' | 'error';
  message: string;
  data?: any;
}

interface ContractGroup {
  contractData: any;
  contractors: any[];
  rows: number[];
}

export const CSVImporter: React.FC<CSVImporterProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  selectedFile
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [fileProcessed, setFileProcessed] = useState(false);
  const { toast } = useToast();
  const { saveContract } = useContracts();

  useEffect(() => {
    console.log('🔄 CSVImporter - useEffect triggered:', {
      selectedFile: selectedFile?.name,
      isOpen,
      fileProcessed
    });
    
    if (selectedFile && isOpen && !fileProcessed) {
      console.log('📁 Processando arquivo CSV:', selectedFile.name);
      parseCSVFile(selectedFile);
    }
  }, [selectedFile, isOpen, fileProcessed]);

  const parseCSVFile = (file: File) => {
    console.log('📄 Iniciando parsing do arquivo CSV:', file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        console.log('📝 Conteúdo do arquivo lido:', text.substring(0, 200) + '...');
        
        const lines = text.split('\n').filter(line => line.trim());
        console.log('📊 Número de linhas encontradas:', lines.length);
        
        const data = lines.map((line, index) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim().replace(/^"/, '').replace(/"$/, ''));
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim().replace(/^"/, '').replace(/"$/, ''));
          console.log(`Linha ${index + 1} processada:`, result);
          return result;
        });
        
        setCsvData(data);
        setPreviewData(data.slice(0, 6)); // Mostrar apenas as primeiras 5 linhas + header
        setFileProcessed(true);
        
        console.log('✅ Arquivo CSV processado com sucesso');
        console.log('📋 Preview dos dados:', data.slice(0, 3));
        console.log('📋 Estrutura do header:', data[0]);
        
        toast({
          title: "Arquivo carregado",
          description: `${data.length - 1} linhas encontradas para importação`,
        });
      } catch (error) {
        console.error('❌ Erro ao processar arquivo CSV:', error);
        toast({
          title: "Erro",
          description: "Erro ao processar arquivo CSV",
          variant: "destructive",
        });
      }
    };
    
    reader.onerror = () => {
      console.error('❌ Erro ao ler arquivo');
      toast({
        title: "Erro",
        description: "Erro ao ler arquivo",
        variant: "destructive",
      });
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  const validateCPF = (cpf: string): boolean => {
    if (!cpf) return false;
    
    const cleanCPF = cpf.replace(/\D/g, '');
    console.log(`🔍 Validando CPF: ${cpf} -> limpo: ${cleanCPF}`);
    
    if (cleanCPF.length !== 11) {
      console.log(`❌ CPF com tamanho inválido: ${cleanCPF.length} caracteres`);
      return false;
    }
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      console.log(`❌ CPF com todos os dígitos iguais: ${cleanCPF}`);
      return false;
    }
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) {
      console.log(`❌ Primeiro dígito verificador inválido`);
      return false;
    }

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) {
      console.log(`❌ Segundo dígito verificador inválido`);
      return false;
    }

    console.log(`✅ CPF válido: ${cleanCPF}`);
    return true;
  };

  const validateCNPJ = (cnpj: string): boolean => {
    if (!cnpj) return false;
    
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    console.log(`🔍 Validando CNPJ: ${cnpj} -> limpo: ${cleanCNPJ}`);
    
    if (cleanCNPJ.length !== 14) {
      console.log(`❌ CNPJ com tamanho inválido: ${cleanCNPJ.length} caracteres`);
      return false;
    }
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
      console.log(`❌ CNPJ com todos os dígitos iguais: ${cleanCNPJ}`);
      return false;
    }
    
    // Validação dos dígitos verificadores do CNPJ
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (digit1 !== parseInt(cleanCNPJ.charAt(12))) {
      console.log(`❌ Primeiro dígito verificador do CNPJ inválido`);
      return false;
    }
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    if (digit2 !== parseInt(cleanCNPJ.charAt(13))) {
      console.log(`❌ Segundo dígito verificador do CNPJ inválido`);
      return false;
    }
    
    console.log(`✅ CNPJ válido: ${cleanCNPJ}`);
    return true;
  };

  const validateRow = (row: string[], rowIndex: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    console.log(`🔍 Validando linha ${rowIndex + 2}:`, row);
    console.log(`📊 Número de colunas: ${row.length}`);

    // Mapeamento correto das colunas baseado no novo layout
    const contractNumber = row[0]?.trim(); // Número do contrato
    const contractorName = row[1]?.trim(); // Nome do contratante
    const contractorCpf = row[2]?.trim(); // CPF do contratante
    const cnpj = row[3]?.trim(); // CNPJ
    const employeeCount = row[4]?.trim(); // Quantidade de funcionários
    const cnpjCount = row[5]?.trim(); // Quantidade de CNPJs
    const responsibleName = row[6]?.trim(); // Nome do responsável
    const responsibleCpf = row[7]?.trim(); // CPF do responsável
    const paymentDay = row[8]?.trim(); // Data de pagamento (dia do mês)
    const startDate = row[9]?.trim(); // Data de início do contrato
    const city = row[10]?.trim(); // Cidade
    const state = row[11]?.trim(); // Estado
    const email = row[12]?.trim(); // Email
    const address = row[13]?.trim(); // Endereço completo
    const monthlyValue = row[14]?.trim(); // Valor do contrato
    const planType = row[15]?.trim().replace(/\s+/g, ' ').trim(); // Tipo de plano - limpeza extra

    console.log(`🔍 Dados extraídos da linha ${rowIndex + 2}:`, {
      contractNumber,
      contractorName,
      contractorCpf,
      cnpj,
      responsibleName,
      responsibleCpf,
      startDate,
      city,
      state,
      monthlyValue,
      planType: `"${planType}"`, // Mostra exatamente o valor com aspas para detectar espaços
      planTypeLength: planType?.length,
      planTypeCharCodes: planType?.split('').map(c => c.charCodeAt(0))
    });

    // Campos obrigatórios
    if (!contractNumber) errors.push('Número do contrato é obrigatório');
    if (!contractorName) errors.push('Nome do contratante é obrigatório');
    if (!cnpj) errors.push('CNPJ é obrigatório');
    if (!responsibleName) errors.push('Nome do responsável é obrigatório');
    if (!responsibleCpf) errors.push('CPF do responsável é obrigatório');
    if (!startDate) errors.push('Data de início é obrigatória');
    if (!city) errors.push('Cidade é obrigatória');
    if (!state) errors.push('Estado é obrigatório');
    if (!monthlyValue) errors.push('Valor do contrato é obrigatório');
    if (!planType) errors.push('Tipo de plano é obrigatório');

    // Validações específicas
    if (responsibleCpf && !validateCPF(responsibleCpf)) {
      errors.push('CPF do responsável inválido');
    }
    
    if (contractorCpf && !validateCPF(contractorCpf)) {
      errors.push('CPF do contratante inválido');
    }
    
    if (cnpj && !validateCNPJ(cnpj)) {
      errors.push('CNPJ inválido');
    }

    // Validar data no formato YYYY-MM-DD
    if (startDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate)) {
        errors.push('Data de início deve estar no formato YYYY-MM-DD');
      } else {
        // Verificar se a data é válida
        const date = new Date(startDate);
        if (isNaN(date.getTime())) {
          errors.push('Data de início inválida');
        }
      }
    }

    // Validar valor monetário
    if (monthlyValue) {
      const value = parseFloat(monthlyValue.replace(/[^\d.]/g, ''));
      if (isNaN(value) || value <= 0) {
        errors.push('Valor do contrato deve ser um número válido maior que zero');
      }
    }

    // Validar tipo de plano - versão corrigida
    if (planType) {
      // Limpar completamente o valor e normalizar
      const cleanPlanType = planType
        .toLowerCase()
        .replace(/[^\w]/g, '') // Remove todos os caracteres não-alfanuméricos
        .trim();
      
      console.log(`🔍 Tipo de plano original: "${planType}"`);
      console.log(`🔍 Tipo de plano limpo: "${cleanPlanType}"`);
      
      const validPlans = ['mensal', 'semestral', 'anual'];
      
      if (!validPlans.includes(cleanPlanType)) {
        errors.push(`Tipo de plano deve ser: mensal, semestral ou anual. Valor recebido: "${planType}"`);
        console.log(`❌ Tipo de plano inválido: "${cleanPlanType}" não está em:`, validPlans);
      } else {
        console.log(`✅ Tipo de plano válido: "${cleanPlanType}"`);
      }
    }

    console.log(`📝 Validação linha ${rowIndex + 2}:`, {
      isValid: errors.length === 0,
      errors
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const groupContractsByNumber = (dataRows: string[][]): Map<string, ContractGroup> => {
    console.log('📋 Agrupando contratos por número...');
    
    const contractGroups = new Map<string, ContractGroup>();
    
    dataRows.forEach((row, index) => {
      const contractNumber = row[0]?.trim();
      if (!contractNumber) return;
      
      const contractData = {
        contractNumber: contractNumber,
        employeeCount: row[4]?.trim() || '0',
        cnpjCount: row[5]?.trim() || '1',
        trialDays: row[19]?.trim() || '0', // Dias de teste
        startDate: row[9]?.trim(),
        monthlyValue: row[14]?.trim().replace(/[^\d.]/g, ''),
        renewalDate: row[20]?.trim() || row[9]?.trim(), // Data de renovação ou data de início
        paymentStartDate: row[9]?.trim(),
        paymentDay: row[8]?.trim() || '1',
        planType: row[15]?.trim().toLowerCase().replace(/[^\w]/g, '') || 'mensal', // Limpeza extra aqui também
        semestralDiscount: row[17]?.trim() || '0', // Desconto semestral
        anualDiscount: row[18]?.trim() || '0' // Desconto anual
      };
      
      const contractor = {
        name: row[1]?.trim(),
        cnpj: row[3]?.trim(),
        city: row[10]?.trim(),
        state: row[11]?.trim(),
        address: row[13]?.trim() || '', // Endereço completo
        responsibleName: row[6]?.trim(),
        responsibleCpf: row[7]?.trim(),
        responsibleRg: row[16]?.trim() || '', // RG do responsável
        email: row[12]?.trim() || '' // Email
      };
      
      if (contractGroups.has(contractNumber)) {
        // Adicionar contratante ao contrato existente
        const existing = contractGroups.get(contractNumber)!;
        existing.contractors.push(contractor);
        existing.rows.push(index + 2);
        console.log(`➕ Adicionado contratante ao contrato ${contractNumber}:`, contractor);
      } else {
        // Criar novo grupo de contrato
        contractGroups.set(contractNumber, {
          contractData,
          contractors: [contractor],
          rows: [index + 2]
        });
        console.log(`🆕 Novo contrato criado ${contractNumber}:`, { contractData, contractor });
      }
    });
    
    console.log(`📊 Agrupamento concluído: ${contractGroups.size} contratos únicos encontrados`);
    return contractGroups;
  };

  const processImport = async () => {
    console.log('🚀 Iniciando processo de importação');
    
    if (csvData.length <= 1) {
      console.error('❌ Arquivo CSV vazio ou sem dados válidos');
      toast({
        title: "Erro",
        description: "Arquivo CSV vazio ou sem dados válidos",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setResults([]);
    setProgress(0);

    const dataRows = csvData.slice(1); // Pular o header
    const importResults: ImportResult[] = [];

    // Primeiro, validar todas as linhas
    console.log(`🔍 Validando ${dataRows.length} linhas...`);
    const invalidRows: number[] = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const validation = validateRow(dataRows[i], i);
      if (!validation.isValid) {
        const rowNumber = i + 2;
        invalidRows.push(rowNumber);
        importResults.push({
          row: rowNumber,
          status: 'error',
          message: validation.errors.join('; ')
        });
      }
    }

    if (invalidRows.length > 0) {
      console.log(`❌ ${invalidRows.length} linhas inválidas encontradas:`, invalidRows);
      setResults([...importResults]);
      setIsProcessing(false);
      return;
    }

    // Agrupar contratos por número
    const contractGroups = groupContractsByNumber(dataRows);
    const contractsToProcess = Array.from(contractGroups.entries());
    
    console.log(`📊 Processando ${contractsToProcess.length} contratos únicos`);

    // Processar cada contrato agrupado
    for (let i = 0; i < contractsToProcess.length; i++) {
      const [contractNumber, group] = contractsToProcess[i];
      
      console.log(`🔄 Processando contrato ${contractNumber} (${i + 1}/${contractsToProcess.length})`);
      console.log(`👥 Contratantes: ${group.contractors.length}`);
      console.log(`📍 Linhas originais: ${group.rows.join(', ')}`);
      
      try {
        console.log(`💾 Salvando contrato ${contractNumber}:`, {
          contractData: group.contractData,
          contractors: group.contractors
        });

        // Salvar contrato com todos os contratantes
        await saveContract(group.contractData, group.contractors);
        
        console.log(`✅ Contrato ${contractNumber} salvo com sucesso`);
        
        // Adicionar resultado de sucesso para cada linha do grupo
        group.rows.forEach(rowNumber => {
          importResults.push({
            row: rowNumber,
            status: 'success',
            message: `Contrato ${contractNumber} importado com sucesso (${group.contractors.length} contratante(s))`,
            data: group.contractData
          });
        });
        
      } catch (error) {
        console.error(`❌ Erro ao salvar contrato ${contractNumber}:`, error);
        
        // Adicionar resultado de erro para cada linha do grupo
        group.rows.forEach(rowNumber => {
          importResults.push({
            row: rowNumber,
            status: 'error',
            message: `Erro ao salvar contrato ${contractNumber}: ${error.message || 'Erro desconhecido'}`
          });
        });
      }

      // Atualizar progresso
      const currentProgress = ((i + 1) / contractsToProcess.length) * 100;
      setProgress(currentProgress);
      setResults([...importResults]);
      
      console.log(`📈 Progresso: ${currentProgress.toFixed(1)}%`);
      
      // Pequena pausa para não sobrecarregar a UI
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsProcessing(false);
    
    const successCount = importResults.filter(r => r.status === 'success').length;
    const errorCount = importResults.filter(r => r.status === 'error').length;
    const uniqueContracts = contractGroups.size;
    
    console.log(`🎯 Importação concluída: ${uniqueContracts} contratos únicos processados, ${successCount} linhas com sucesso, ${errorCount} erros`);
    
    toast({
      title: "Importação concluída",
      description: `${uniqueContracts} contratos importados com ${successCount} linhas processadas, ${errorCount} erros`,
      variant: uniqueContracts > 0 ? "default" : "destructive",
    });

    if (uniqueContracts > 0) {
      onImportSuccess();
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      console.log('🚪 Fechando modal de importação');
      onClose();
      setResults([]);
      setCsvData([]);
      setPreviewData([]);
      setProgress(0);
      setFileProcessed(false);
    }
  };

  console.log('🎯 CSVImporter render state:', {
    isOpen,
    fileProcessed,
    csvDataLength: csvData.length,
    previewDataLength: previewData.length,
    isProcessing,
    resultsLength: results.length
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Contratos via CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status do arquivo */}
          {selectedFile && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Arquivo selecionado:</span>
                  <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
                  <Badge variant={fileProcessed ? "default" : "secondary"}>
                    {fileProcessed ? "Processado" : "Processando..."}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview dos dados */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Preview do arquivo (primeiras 5 linhas)
                  <Badge variant="outline" className="ml-2">
                    {csvData.length - 1} linhas para importar
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="text-xs font-mono">
                    {previewData.map((row, index) => (
                      <div key={index} className={index === 0 ? "font-bold border-b pb-1 mb-1" : ""}>
                        {row.join(' | ')}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Progresso */}
          {isProcessing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processando importação...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultados */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Resultados da Importação
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      {results.filter(r => r.status === 'success').length} Sucessos
                    </Badge>
                    <Badge variant="destructive">
                      {results.filter(r => r.status === 'error').length} Erros
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-2 p-2 rounded text-sm ${
                          result.status === 'success' 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {result.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <span className="font-medium">Linha {result.row}:</span> {result.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              <X className="mr-2 h-4 w-4" />
              Fechar
            </Button>
            
            {csvData.length > 1 && !isProcessing && results.length === 0 && (
              <Button onClick={processImport}>
                <Upload className="mr-2 h-4 w-4" />
                Iniciar Importação ({csvData.length - 1} linhas)
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
