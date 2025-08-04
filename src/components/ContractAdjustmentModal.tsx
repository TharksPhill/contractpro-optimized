import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContractAdjustments } from "@/hooks/useContractAdjustments";
import { format, parseISO, addYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, TrendingUp, Lock } from "lucide-react";
import AdjustmentLockControl from "./contracts/AdjustmentLockControl";

interface ContractAdjustmentModalProps {
  contract: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContractAdjustmentModal = ({ contract, open, onOpenChange }: ContractAdjustmentModalProps) => {
  const { createAdjustment, isCreating, getEffectiveValueForContract, getAdjustmentsForContract } = useContractAdjustments();
  const [adjustmentType, setAdjustmentType] = useState<'value' | 'percentage'>('percentage');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [notes, setNotes] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  if (!contract) return null;

  const getNextRenewalDate = () => {
    if (!contract.renewal_date) return null;
    
    try {
      let originalRenewalDate: Date;
      
      if (contract.renewal_date.includes('/')) {
        const [day, month, year] = contract.renewal_date.split('/');
        originalRenewalDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        originalRenewalDate = parseISO(contract.renewal_date);
      }
      
      const today = new Date();
      const currentYear = today.getFullYear();
      
      // Buscar ajustes existentes para este contrato
      const contractAdjustments = getAdjustmentsForContract(contract.id);
      
      console.log(`📅 MODAL - Calculando próxima renovação MELHORADA:`, {
        contratoId: contract.id,
        dataRenovacaoOriginal: contract.renewal_date,
        dataHoje: today.toISOString().split('T')[0],
        anoAtual: currentYear,
        ajustesExistentes: contractAdjustments.length,
        ultimosAjustes: contractAdjustments.slice(0, 3).map(adj => ({
          id: adj.id,
          dataEfetiva: adj.effective_date,
          anoEfetivo: new Date(adj.effective_date).getFullYear(),
          valorNovo: adj.new_value
        }))
      });
      
      // Se não há ajustes, calcular para o próximo ano baseado na data original
      if (contractAdjustments.length === 0) {
        let nextRenewalDate = new Date(
          currentYear,
          originalRenewalDate.getMonth(),
          originalRenewalDate.getDate()
        );
        
        // Se a data de renovação deste ano já passou, usar o próximo ano
        if (nextRenewalDate <= today) {
          nextRenewalDate = addYears(nextRenewalDate, 1);
        }
        
        console.log(`📅 MODAL - Sem ajustes existentes, próxima renovação:`, {
          proximaRenovacao: nextRenewalDate.toISOString().split('T')[0],
          anoCalculado: nextRenewalDate.getFullYear()
        });
        
        return nextRenewalDate;
      }
      
      // CORREÇÃO: Se há ajustes, encontrar o último ano com ajuste e calcular o próximo
      const adjustmentYears = contractAdjustments
        .map(adj => new Date(adj.effective_date).getFullYear())
        .sort((a, b) => b - a); // Ordenar do mais recente para o mais antigo
      
      const lastAdjustmentYear = adjustmentYears[0];
      const nextYearForAdjustment = Math.max(lastAdjustmentYear + 1, currentYear + 1);
      
      const nextRenewalDate = new Date(
        nextYearForAdjustment,
        originalRenewalDate.getMonth(),
        originalRenewalDate.getDate()
      );
      
      console.log(`📅 MODAL - Com ajustes existentes, próxima renovação:`, {
        ultimoAnoComAjuste: lastAdjustmentYear,
        proximoAnoParaAjuste: nextYearForAdjustment,
        proximaRenovacao: nextRenewalDate.toISOString().split('T')[0],
        logicaAplicada: `Último ajuste em ${lastAdjustmentYear}, próximo em ${nextYearForAdjustment}`
      });
      
      return nextRenewalDate;
      
    } catch (error) {
      console.error(`❌ MODAL - Erro ao calcular próxima renovação:`, error);
      return null;
    }
  };

  const renewalDate = getNextRenewalDate();

  const getCurrentEffectiveValue = () => {
    const baseValue = parseFloat(contract.monthly_value || '0');
    
    if (!renewalDate) {
      console.log(`⚠️ MODAL - Sem data de renovação, usando valor base:`, baseValue);
      return baseValue;
    }
    
    // CORREÇÃO: Para calcular o valor base do próximo reajuste, devemos usar o valor efetivo
    // que estará vigente na data ANTERIOR à próxima renovação (ou seja, o último valor efetivo antes do novo reajuste)
    
    // Calcular um dia antes da próxima renovação para obter o valor que estará vigente até então
    const dayBeforeRenewal = new Date(renewalDate);
    dayBeforeRenewal.setDate(dayBeforeRenewal.getDate() - 1);
    
    const effectiveValue = getEffectiveValueForContract(contract.id, baseValue, dayBeforeRenewal);
    
    console.log(`💰 MODAL - Valor base CORRIGIDO para NOVO reajuste (${renewalDate.getFullYear()}):`, {
      contratoId: contract.id,
      valorBaseOriginal: baseValue,
      dataConsultaCorrigida: dayBeforeRenewal.toISOString().split('T')[0],
      valorEfetivoNaDataAnterior: effectiveValue,
      proximaRenovacao: renewalDate.toISOString().split('T')[0],
      anoNovoReajuste: renewalDate.getFullYear(),
      diferencaDoBase: effectiveValue - baseValue,
      explicacao: `Usando valor efetivo em ${dayBeforeRenewal.toISOString().split('T')[0]} como base para reajuste de ${renewalDate.getFullYear()}`
    });
    
    return effectiveValue;
  };
  
  const currentValue = getCurrentEffectiveValue();
  
  // Calculate new value based on adjustment
  const getNewValue = () => {
    const adjValue = parseFloat(adjustmentValue || '0');
    if (adjustmentType === 'percentage') {
      return currentValue * (1 + adjValue / 100);
    } else {
      return adjValue;
    }
  };

  const newValue = getNewValue();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!renewalDate || !adjustmentValue) {
      console.warn("🚫 MODAL - Dados insuficientes para criar reajuste");
      return;
    }

    // Verificar se o período está bloqueado
    if (isLocked) {
      console.warn("🔒 MODAL - Período de reajuste bloqueado");
      return;
    }

    // O reajuste entra em vigor na data de renovação
    const effectiveDate = renewalDate;

    const adjustmentData = {
      contract_id: contract.id,
      adjustment_type: adjustmentType,
      adjustment_value: parseFloat(adjustmentValue),
      renewal_date: format(renewalDate, 'yyyy-MM-dd'),
      previous_value: currentValue, // CORREÇÃO: Usar o valor efetivo atual como valor anterior
      new_value: newValue,
      effective_date: format(effectiveDate, 'yyyy-MM-dd'),
      notes: notes.trim() || undefined,
    };

    console.log(`🚀 MODAL - ENVIANDO NOVO reajuste CORRIGIDO:`, {
      contratoId: contract.id,
      anoReajuste: renewalDate.getFullYear(),
      valorAnteriorEfetivo: currentValue, // Agora é realmente o valor com reajustes anteriores
      valorNovoCalculado: newValue,
      tipoReajuste: adjustmentType,
      percentualOuValor: adjustmentValue,
      incrementoReal: newValue - currentValue,
      percentualRealCalculado: ((newValue - currentValue) / currentValue * 100).toFixed(2) + '%',
      explicacaoValorBase: `Valor ${currentValue} já inclui todos os reajustes anteriores até a data de renovação`,
      dadosParaEnvio: adjustmentData
    });

    try {
      createAdjustment(adjustmentData);
      
      console.log("✅ MODAL - NOVO reajuste enviado com valor base CORRETO, aguardando confirmação...");
      
      // Reset form
      setAdjustmentValue('');
      setNotes('');
      onOpenChange(false);
      
    } catch (error) {
      console.error("❌ MODAL - Erro ao criar NOVO reajuste:", error);
    }
  };

  const getDaysUntilRenewal = () => {
    if (!renewalDate) return null;
    const today = new Date();
    const diffTime = renewalDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntilRenewal = getDaysUntilRenewal();
  const renewalYear = renewalDate?.getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Reajustar Contrato - Renovação {renewalYear}
          </DialogTitle>
          <DialogDescription>
            Configure o reajuste para a renovação do contrato {contract.contract_number} em {renewalYear}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controle de Bloqueio */}
          {renewalYear && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Controle de Bloqueio - Renovação {renewalYear}
                </span>
              </div>
              <AdjustmentLockControl
                contractId={contract.id}
                renewalYear={renewalYear}
                onLockStatusChange={setIsLocked}
              />
              {isLocked && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Período bloqueado para reajustes. Desbloqueie para continuar.</span>
                </div>
              )}
            </div>
          )}

          {/* Contract Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Contrato</Label>
              <p className="font-semibold">{contract.contract_number}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Valor Efetivo Atual</Label>
              <p className="font-semibold text-green-600">R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">
                {currentValue !== parseFloat(contract.monthly_value || '0') 
                  ? `(Já inclui reajustes anteriores)` 
                  : `(Valor base original)`
                }
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Renovação em {renewalYear}</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">
                  {renewalDate ? format(renewalDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Não definida'}
                </p>
                {daysUntilRenewal !== null && daysUntilRenewal <= 60 && daysUntilRenewal > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {daysUntilRenewal} dias
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Valor Base Original</Label>
              <p className="font-semibold text-muted-foreground">R$ {parseFloat(contract.monthly_value || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              {currentValue !== parseFloat(contract.monthly_value || '0') && (
                <p className="text-xs text-blue-600">
                  +R$ {(currentValue - parseFloat(contract.monthly_value || '0')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em reajustes
                </p>
              )}
            </div>
          </div>

          {/* Adjustment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adjustmentType">Tipo de Reajuste</Label>
                <Select 
                  value={adjustmentType} 
                  onValueChange={(value: 'value' | 'percentage') => setAdjustmentType(value)}
                  disabled={isLocked}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="value">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="adjustmentValue">
                  {adjustmentType === 'percentage' ? 'Percentual' : 'Novo Valor'}
                </Label>
                <Input
                  id="adjustmentValue"
                  type="number"
                  step="0.01"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder={adjustmentType === 'percentage' ? '10.5' : '1200.00'}
                  disabled={isLocked}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={`Justificativa para o reajuste da renovação ${renewalYear}...`}
                disabled={isLocked}
                rows={3}
              />
            </div>

            {/* Preview */}
            {adjustmentValue && !isLocked && (
              <div className="p-4 bg-blue-50 rounded-lg border">
                <h4 className="font-medium text-blue-900 mb-2">Resumo do Reajuste - Renovação {renewalYear}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Valor Atual (com reajustes anteriores):</span>
                    <span className="font-medium text-blue-900 ml-2">
                      R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Novo Valor (após este reajuste):</span>
                    <span className="font-medium text-green-700 ml-2">
                      R$ {newValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-blue-700">Variação deste reajuste:</span>
                    <span className={`font-medium ml-2 ${newValue > currentValue ? 'text-green-600' : 'text-red-600'}`}>
                      {newValue > currentValue ? '+' : ''}
                      {((newValue - currentValue) / currentValue * 100).toFixed(2)}%
                      ({newValue > currentValue ? '+' : ''}R$ {(newValue - currentValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-blue-700">Vigência:</span>
                    <span className="font-medium text-blue-900 ml-2">
                      A partir de {renewalDate ? format(renewalDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data não definida'} ({renewalYear})
                    </span>
                    <span className="text-xs text-green-600 block mt-1">
                      ✅ Este reajuste será aplicado sobre o valor efetivo atual de R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating || !renewalDate || isLocked}
              >
                {isCreating ? 'Aplicando Reajuste...' : `Aplicar Reajuste ${renewalYear}`}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractAdjustmentModal;
