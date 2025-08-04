import { supabase } from '@/integrations/supabase/client';

export interface QuoteData {
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  clientPhone: string;
  selectedPlan: any;
  planPeriod: 'monthly' | 'semestral' | 'annual';
  selectedAddons: any[];
  systemName: string;
  systemDescription: string;
  validityDays: number;
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
    description: string;
  };
}

export const generateQuotePDF = async (quoteData: QuoteData) => {
  try {
    console.log('=== GERANDO PDF ===');
    console.log('Quote data recebida:', quoteData);

    // Generate quote HTML content
    const quoteHtml = generateQuoteHTML(quoteData);
    console.log('HTML gerado:', quoteHtml.substring(0, 500) + '...');
    
    console.log("🚀 Enviando HTML para Edge Function...");
    
    // Call the html-to-pdf edge function
    const { data, error } = await supabase.functions.invoke('html-to-pdf', {
      body: { html: quoteHtml }
    });

    if (error) {
      console.error("❌ Erro na Edge Function:", error);
      throw new Error(`Erro na conversão HTML para PDF: ${error.message}`);
    }

    if (!data?.success || !data?.pdfBase64) {
      console.error("❌ Resposta inválida da Edge Function:", data);
      throw new Error('Falha ao gerar PDF: resposta inválida do servidor');
    }

    console.log("✅ PDF gerado com sucesso pela Edge Function");

    // Create download link and trigger download
    const filename = `orcamento-${quoteData.clientName.replace(/\s/g, '_')}-${Date.now()}.pdf`;
    const dataUrl = `data:application/pdf;base64,${data.pdfBase64}`;
    
    // Create temporary link element for download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("📥 Download iniciado automaticamente");

    return true;
  } catch (error) {
    console.error('Erro detalhado ao gerar PDF:', error);
    throw new Error('Erro ao gerar PDF do orçamento');
  }
};

const generateQuoteHTML = (quoteData: QuoteData) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const calculatePlanPrice = () => {
    if (!quoteData.selectedPlan) return 0;
    
    switch (quoteData.planPeriod) {
      case 'semestral':
        return quoteData.selectedPlan.semestral_price;
      case 'annual':
        return quoteData.selectedPlan.annual_price;
      default:
        return quoteData.selectedPlan.monthly_price;
    }
  };

  const calculateAddonsTotal = () => {
    const periodMultiplier = getPlanPeriodMultiplier();
    return quoteData.selectedAddons.reduce((total, { addon, quantity }) => {
      return total + (addon.price_per_unit * quantity * periodMultiplier);
    }, 0);
  };

  const getSubtotal = () => {
    return calculatePlanPrice() + calculateAddonsTotal();
  };

  const calculateDiscount = () => {
    const subtotal = getSubtotal();
    if (quoteData.discount.value <= 0) return 0;

    if (quoteData.discount.type === 'percentage') {
      return subtotal * (quoteData.discount.value / 100);
    } else {
      return Math.min(quoteData.discount.value, subtotal);
    }
  };

  const getTotalValue = () => {
    return getSubtotal() - calculateDiscount();
  };

  const getPlanPeriodMultiplier = () => {
    switch (quoteData.planPeriod) {
      case 'semestral': return 6;
      case 'annual': return 12;
      default: return 1;
    }
  };

  const getPeriodLabel = () => {
    switch (quoteData.planPeriod) {
      case 'semestral': return 'Semestral (6 meses)';
      case 'annual': return 'Anual (12 meses)';
      default: return 'Mensal';
    }
  };

  // Simplified HTML with basic styling
  return `
    <div style="width: 100%; max-width: 800px; margin: 0 auto; background: white; color: black; font-family: Arial, sans-serif;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: #3b82f6; color: white;">
        <h1 style="font-size: 28px; font-weight: bold; margin: 0 0 10px 0;">RHiD & iDSecure</h1>
        <p style="font-size: 16px; margin: 0;">Sistema Completo de Gestão de Ponto e Controle de Acesso</p>
        <div style="margin-top: 15px; font-size: 14px;">
          <p style="margin: 5px 0;">contato@araponto.com | (16) 99232-6766</p>
          <p style="margin: 5px 0;">www.araponto.com</p>
        </div>
      </div>

      <!-- Título do Orçamento -->
      <div style="text-align: center; margin-bottom: 25px; padding: 15px; border: 2px solid #e5e7eb;">
        <h2 style="font-size: 24px; font-weight: bold; color: #3b82f6; margin: 0 0 8px 0;">ORÇAMENTO</h2>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">Número: ORC-${Date.now().toString().slice(-6)}</p>
        <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0;">Data: ${formatDate(new Date())}</p>
      </div>

      <!-- Dados do Cliente -->
      <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb;">
        <h3 style="font-size: 16px; font-weight: bold; color: #374151; margin: 0 0 12px 0; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">DADOS DO CLIENTE</h3>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Nome:</strong> ${quoteData.clientName}</p>
        ${quoteData.clientCompany ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Empresa:</strong> ${quoteData.clientCompany}</p>` : ''}
        ${quoteData.clientEmail ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${quoteData.clientEmail}</p>` : ''}
        ${quoteData.clientPhone ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Telefone:</strong> ${quoteData.clientPhone}</p>` : ''}
      </div>

      <!-- Sistema -->
      <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb; background: #f8fafc;">
        <h3 style="font-size: 16px; font-weight: bold; color: #374151; margin: 0 0 12px 0; border-bottom: 2px solid #3b82f6; padding-bottom: 5px;">SISTEMA</h3>
        <h4 style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">${quoteData.systemName}</h4>
        <p style="font-size: 14px; color: #6b7280; margin: 0; line-height: 1.5;">${quoteData.systemDescription}</p>
      </div>

      <!-- Plano Selecionado -->
      ${quoteData.selectedPlan ? `
        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb; background: #f0fdf4;">
          <h3 style="font-size: 16px; font-weight: bold; color: #374151; margin: 0 0 12px 0; border-bottom: 2px solid #10b981; padding-bottom: 5px;">PLANO SELECIONADO</h3>
          <div style="background: white; padding: 12px; border: 1px solid #d1fae5;">
            <h4 style="font-size: 14px; font-weight: bold; color: #065f46; margin: 0 0 8px 0;">${quoteData.selectedPlan.name}</h4>
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 5px 0;">Funcionários: ${quoteData.selectedPlan.employee_range}</p>
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 10px 0;">Período: ${getPeriodLabel()}</p>
            <div style="text-align: right;">
              <span style="font-size: 20px; font-weight: bold; color: #10b981;">${formatCurrency(calculatePlanPrice())}</span>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Adicionais -->
      ${quoteData.selectedAddons.length > 0 ? `
        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb; background: #fef3c7;">
          <h3 style="font-size: 16px; font-weight: bold; color: #374151; margin: 0 0 12px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 5px;">ADICIONAIS</h3>
          ${quoteData.selectedAddons.map(({ addon, quantity }) => {
            const periodMultiplier = getPlanPeriodMultiplier();
            const addonTotal = addon.price_per_unit * quantity * periodMultiplier;
            return `
              <div style="background: white; padding: 12px; border: 1px solid #fbbf24; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between;">
                  <div style="flex: 1;">
                    <h4 style="font-size: 14px; font-weight: bold; color: #92400e; margin: 0 0 4px 0;">${addon.name}</h4>
                    <p style="font-size: 12px; color: #6b7280; margin: 0 0 2px 0;">${addon.description}</p>
                    <p style="font-size: 12px; color: #6b7280; margin: 0;">Quantidade: ${quantity}x por ${periodMultiplier === 1 ? 'mês' : periodMultiplier + ' meses'}</p>
                  </div>
                  <div style="text-align: right;">
                    <span style="font-size: 16px; font-weight: bold; color: #f59e0b;">${formatCurrency(addonTotal)}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
          <div style="text-align: right; margin-top: 12px; padding-top: 12px; border-top: 2px solid #f59e0b;">
            <span style="font-size: 16px; font-weight: bold; color: #92400e;">Total dos Adicionais: ${formatCurrency(calculateAddonsTotal())}</span>
          </div>
        </div>
      ` : ''}

      <!-- Resumo Financeiro -->
      <div style="margin-bottom: 25px; padding: 20px; border: 2px solid #3b82f6; background: #f0f9ff;">
        <h3 style="font-size: 18px; font-weight: bold; color: #1e40af; margin: 0 0 15px 0; text-align: center;">RESUMO FINANCEIRO</h3>
        
        <div style="background: white; padding: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
            <span style="color: #374151;">Subtotal:</span>
            <span style="font-weight: bold; color: #374151;">${formatCurrency(getSubtotal())}</span>
          </div>
          
          ${quoteData.discount.value > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #dc2626;">
              <span>
                Desconto ${quoteData.discount.description ? `(${quoteData.discount.description})` : ''}
                ${quoteData.discount.type === 'percentage' ? ` ${quoteData.discount.value}%` : ''}
              </span>
              <span style="font-weight: bold;">-${formatCurrency(calculateDiscount())}</span>
            </div>
          ` : ''}
          
          <div style="border-top: 2px solid #3b82f6; padding-top: 10px; margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 16px; font-weight: bold; color: #1e40af;">VALOR TOTAL (${getPeriodLabel()}):</span>
              <span style="font-size: 20px; font-weight: bold; color: #059669;">${formatCurrency(getTotalValue())}</span>
            </div>
            ${quoteData.planPeriod !== 'monthly' ? `
              <p style="text-align: right; font-size: 12px; color: #6b7280; margin: 8px 0 0 0;">
                Equivale a ${formatCurrency(getTotalValue() / getPlanPeriodMultiplier())} por mês
              </p>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Informações Importantes -->
      <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #fbbf24; background: #fffbeb;">
        <h3 style="font-size: 14px; font-weight: bold; color: #92400e; margin: 0 0 10px 0;">INFORMAÇÕES IMPORTANTES</h3>
        <ul style="font-size: 12px; color: #6b7280; line-height: 1.4; margin: 0; padding-left: 16px;">
          <li style="margin-bottom: 3px;">Orçamento válido por ${quoteData.validityDays} dias</li>
          <li style="margin-bottom: 3px;">Valores sujeitos a alteração sem aviso prévio</li>
          <li style="margin-bottom: 3px;">Proposta comercial sem valor fiscal</li>
          <li style="margin-bottom: 3px;">Condições especiais mediante negociação</li>
        </ul>
      </div>

      <!-- Rodapé -->
      <div style="text-align: center; padding: 15px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 11px;">
        <p style="margin: 0 0 5px 0;">
          <strong>RHiD & iDSecure</strong> - Sistema Completo de Gestão de Ponto e Controle de Acesso
        </p>
        <p style="margin: 0 0 5px 0;">
          Este orçamento foi gerado automaticamente em ${formatDate(new Date())} às ${new Date().toLocaleTimeString('pt-BR')}
        </p>
        <p style="margin: 0;">
          Para dúvidas ou esclarecimentos, entre em contato conosco através dos canais de atendimento.
        </p>
      </div>
    </div>
  `;
};

export const generateQuoteText = (quoteData: QuoteData) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculatePlanPrice = () => {
    if (!quoteData.selectedPlan) return 0;
    
    switch (quoteData.planPeriod) {
      case 'semestral':
        return quoteData.selectedPlan.semestral_price;
      case 'annual':
        return quoteData.selectedPlan.annual_price;
      default:
        return quoteData.selectedPlan.monthly_price;
    }
  };

  const calculateAddonsTotal = () => {
    const periodMultiplier = getPlanPeriodMultiplier();
    return quoteData.selectedAddons.reduce((total, { addon, quantity }) => {
      return total + (addon.price_per_unit * quantity * periodMultiplier);
    }, 0);
  };

  const getSubtotal = () => {
    return calculatePlanPrice() + calculateAddonsTotal();
  };

  const calculateDiscount = () => {
    const subtotal = getSubtotal();
    if (quoteData.discount.value <= 0) return 0;

    if (quoteData.discount.type === 'percentage') {
      return subtotal * (quoteData.discount.value / 100);
    } else {
      return Math.min(quoteData.discount.value, subtotal);
    }
  };

  const getTotalValue = () => {
    return getSubtotal() - calculateDiscount();
  };

  const getPlanPeriodMultiplier = () => {
    switch (quoteData.planPeriod) {
      case 'semestral': return 6;
      case 'annual': return 12;
      default: return 1;
    }
  };

  const getPeriodLabel = () => {
    switch (quoteData.planPeriod) {
      case 'semestral': return 'Semestral (6 meses)';
      case 'annual': return 'Anual (12 meses)';
      default: return 'Mensal';
    }
  };

  let quoteText = `═══════════════════════════════════════════════════════════════\n`;
  quoteText += `                    📋 ORÇAMENTO - ${quoteData.systemName}\n`;
  quoteText += `═══════════════════════════════════════════════════════════════\n\n`;
  
  quoteText += `🏢 EMPRESA: RHiD & iDSecure\n`;
  quoteText += `📧 Email: contato@araponto.com\n`;
  quoteText += `📱 Telefone: (16) 99232-6766\n`;
  quoteText += `🌐 Website: www.araponto.com\n\n`;
  
  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `                        👤 DADOS DO CLIENTE\n`;
  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `▸ Nome: ${quoteData.clientName}\n`;
  if (quoteData.clientCompany) quoteText += `▸ Empresa: ${quoteData.clientCompany}\n`;
  if (quoteData.clientEmail) quoteText += `▸ Email: ${quoteData.clientEmail}\n`;
  if (quoteData.clientPhone) quoteText += `▸ Telefone: ${quoteData.clientPhone}\n`;
  quoteText += `\n`;

  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `                          🖥️ SISTEMA\n`;
  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `▸ Sistema: ${quoteData.systemName}\n`;
  quoteText += `▸ Descrição: ${quoteData.systemDescription}\n\n`;
  
  if (quoteData.selectedPlan) {
    quoteText += `───────────────────────────────────────────────────────────────\n`;
    quoteText += `                        📦 PLANO SELECIONADO\n`;
    quoteText += `───────────────────────────────────────────────────────────────\n`;
    quoteText += `▸ Plano: ${quoteData.selectedPlan.name}\n`;
    quoteText += `▸ Funcionários: ${quoteData.selectedPlan.employee_range}\n`;
    quoteText += `▸ Período: ${getPeriodLabel()}\n`;
    quoteText += `▸ Valor: ${formatCurrency(calculatePlanPrice())}\n\n`;
  }
  
  if (quoteData.selectedAddons.length > 0) {
    quoteText += `───────────────────────────────────────────────────────────────\n`;
    quoteText += `                          🔧 ADICIONAIS\n`;
    quoteText += `───────────────────────────────────────────────────────────────\n`;
    quoteData.selectedAddons.forEach(({ addon, quantity }) => {
      const periodMultiplier = getPlanPeriodMultiplier();
      const addonTotalPeriod = addon.price_per_unit * quantity * periodMultiplier;
      quoteText += `▸ ${addon.name}\n`;
      quoteText += `  Quantidade: ${quantity}x por ${periodMultiplier === 1 ? 'mês' : periodMultiplier + ' meses'}\n`;
      quoteText += `  Valor: ${formatCurrency(addonTotalPeriod)}\n\n`;
    });
    quoteText += `💰 Total dos Adicionais: ${formatCurrency(calculateAddonsTotal())}\n\n`;
  }
  
  quoteText += `═══════════════════════════════════════════════════════════════\n`;
  quoteText += `                        💰 RESUMO FINANCEIRO\n`;
  quoteText += `═══════════════════════════════════════════════════════════════\n`;
  quoteText += `▸ Subtotal: ${formatCurrency(getSubtotal())}\n`;
  
  if (quoteData.discount.value > 0) {
    quoteText += `▸ Desconto`;
    if (quoteData.discount.description) {
      quoteText += ` (${quoteData.discount.description})`;
    }
    if (quoteData.discount.type === 'percentage') {
      quoteText += ` ${quoteData.discount.value}%`;
    }
    quoteText += `: -${formatCurrency(calculateDiscount())}\n`;
  }
  
  quoteText += `\n💵 VALOR TOTAL (${getPeriodLabel()}): ${formatCurrency(getTotalValue())}\n`;
  
  if (quoteData.planPeriod !== 'monthly') {
    quoteText += `📊 Equivale a ${formatCurrency(getTotalValue() / getPlanPeriodMultiplier())} por mês\n`;
  }
  
  quoteText += `\n───────────────────────────────────────────────────────────────\n`;
  quoteText += `                    ⚠️ INFORMAÇÕES IMPORTANTES\n`;
  quoteText += `───────────────────────────────────────────────────────────────\n`;
  quoteText += `▸ Validade: ${quoteData.validityDays} dias\n`;
  quoteText += `▸ Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}\n`;
  quoteText += `▸ Valores sujeitos a alteração sem aviso prévio\n`;
  quoteText += `▸ Proposta comercial sem valor fiscal\n`;
  quoteText += `▸ Condições especiais mediante negociação\n\n`;
  
  quoteText += `═══════════════════════════════════════════════════════════════\n`;
  quoteText += `              RHiD & iDSecure - Sistema Completo\n`;
  quoteText += `         Para dúvidas: contato@araponto.com | (16) 99232-6766\n`;
  quoteText += `═══════════════════════════════════════════════════════════════\n`;
  
  return quoteText;
};
