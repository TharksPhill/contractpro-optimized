
export class ImportLayoutGenerator {
  static generateImportLayout() {
    const headers = [
      // Colunas obrigatórias
      'Número do contrato (*)',
      'Nome do contratante (*)',
      'CPF do contratante (*)',
      'CNPJ (*)',
      'Quantidade de funcionários (*)',
      'Quantidade de CNPJs (*)',
      'Nome do responsável (*)',
      'CPF do responsável (*)',
      'Data de pagamento (dia do mês)',
      'Data de início do contrato (*)',
      'Cidade (*)',
      'Estado (*)',
      'Email',
      'Endereço completo',
      'Valor do contrato (*)',
      'Tipo de plano (*)',
      'RG do responsável',
      'Desconto semestral (%)',
      'Desconto anual (%)',
      'Dias de teste',
      'Data de renovação'
    ];

    // Criar linha de exemplo com dados válidos
    const exampleData = [
      '001',                      // Número do contrato
      'Empresa Exemplo Ltda',     // Nome do contratante
      '111.444.777-35',          // CPF do contratante (válido)
      '11.222.333/0001-81',      // CNPJ (válido)
      '50',                      // Quantidade de funcionários
      '1',                       // Quantidade de CNPJs
      'João Silva',              // Nome do responsável
      '111.444.777-35',          // CPF do responsável (válido)
      '10',                      // Data de pagamento
      '2024-01-01',              // Data de início (formato YYYY-MM-DD)
      'São Paulo',               // Cidade
      'SP',                      // Estado
      'joao@empresa.com',        // Email
      'Rua das Flores, 123, Centro', // Endereço
      '1500.00',                 // Valor do contrato
      'mensal',                  // Tipo de plano
      '12.345.678-9',            // RG do responsável
      '5',                       // Desconto semestral
      '10',                      // Desconto anual
      '30',                      // Dias de teste
      '2025-01-01'               // Data de renovação
    ];

    // Instruções detalhadas
    const instructions = [
      '',
      '=== INSTRUÇÕES PARA IMPORTAÇÃO ===',
      '',
      '1. FORMATO DO ARQUIVO:',
      '   - Salve como: CSV (separado por vírgula)',
      '   - Codificação: UTF-8',
      '   - Extensão: .csv',
      '',
      '2. COMO SALVAR NO EXCEL:',
      '   - Arquivo → Salvar Como → Escolha "CSV (separado por vírgulas) (*.csv)"',
      '   - Certifique-se de usar vírgula como separador',
      '',
      '3. COMO SALVAR NO GOOGLE SHEETS:',
      '   - Arquivo → Fazer download → Valores separados por vírgula (.csv)',
      '',
      '4. COLUNAS OBRIGATÓRIAS (marcadas com *):',
      '   - Devem estar sempre preenchidas',
      '   - Não podem estar vazias',
      '',
      '5. FORMATOS ESPECÍFICOS:',
      '   - Datas: YYYY-MM-DD (exemplo: 2024-03-15)',
      '   - CPF: XXX.XXX.XXX-XX (com pontos e hífen) - deve ser válido',
      '   - CNPJ: XX.XXX.XXX/XXXX-XX (com pontos, barra e hífen) - deve ser válido',
      '   - Valores monetários: use ponto para decimais (exemplo: 1500.00)',
      '   - Tipo de plano: exatamente "mensal", "semestral" ou "anual"',
      '   - Estados: use siglas (SP, RJ, MG, etc.)',
      '',
      '6. OBSERVAÇÕES IMPORTANTES:',
      '   - Não altere os nomes das colunas',
      '   - Não deixe linhas vazias entre os dados',
      '   - Remova esta seção de instruções antes de importar',
      '   - A primeira linha deve conter apenas os cabeçalhos',
      '   - Máximo de 1000 contratos por importação',
      '   - Use CPFs e CNPJs válidos (podem ser gerados online)',
      '',
      '7. EXEMPLO DE DADOS VÁLIDOS:',
      '   - CPF válido: 111.444.777-35',
      '   - CNPJ válido: 11.222.333/0001-81',
      '   - Data: 2024-01-01',
      '   - Tipo de plano: mensal',
      '',
      '8. ERROS COMUNS:',
      '   - CPF/CNPJ inválidos ou mal formatados',
      '   - Datas em formato brasileiro (DD/MM/AAAA)',
      '   - Tipo de plano com texto diferente de mensal/semestral/anual',
      '   - Valores com vírgula como separador decimal',
      '',
      '=== FIM DAS INSTRUÇÕES ==='
    ];

    // Combinar tudo
    const csvContent = [
      headers.join(','),
      exampleData.join(','),
      ...instructions
    ].join('\n');

    // Download do arquivo
    const blob = new Blob([csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `layout_importacao_contratos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  }
}
