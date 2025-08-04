
// Utilitários centralizados para formatação de datas
export const formatDateForInput = (dateStr: string): string => {
  console.log("formatDateForInput - entrada:", dateStr);
  
  if (!dateStr || dateStr.trim() === "" || dateStr === "NaN/NaN/NaN") {
    console.log("formatDateForInput - string vazia ou inválida, retornando vazio");
    return "";
  }
  
  // Se já está no formato yyyy-mm-dd, retorna como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.log("formatDateForInput - já no formato correto:", dateStr);
    return dateStr;
  }
  
  // Se está no formato dd/mm/yyyy, converte para yyyy-mm-dd
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    
    const result = `${year}-${month}-${day}`;
    console.log("formatDateForInput - convertido:", result);
    return result;
  }
  
  console.log("formatDateForInput - formato não reconhecido, retornando vazio");
  return "";
};

export const formatDateToBrazilian = (dateStr: string): string => {
  console.log("formatDateToBrazilian - entrada:", dateStr);
  
  if (!dateStr || dateStr.trim() === "" || dateStr === "NaN/NaN/NaN") {
    console.log("formatDateToBrazilian - string vazia ou inválida, retornando vazio");
    return "";
  }
  
  // Se já está no formato dd/mm/yyyy, retorna como está
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    console.log("formatDateToBrazilian - já no formato brasileiro:", dateStr);
    return dateStr;
  }
  
  // Se está no formato yyyy-mm-dd, converte para dd/mm/yyyy
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    
    const result = `${day}/${month}/${year}`;
    console.log("formatDateToBrazilian - convertido:", result);
    return result;
  }
  
  console.log("formatDateToBrazilian - formato não reconhecido, retornando vazio");
  return "";
};

export const calculatePaymentDate = (startDate: string, trialDays: string): string => {
  console.log("calculatePaymentDate - startDate:", startDate, "trialDays:", trialDays);
  
  // Validações básicas
  if (!startDate || startDate.trim() === "" || startDate === "NaN/NaN/NaN") {
    console.log("calculatePaymentDate - startDate inválida");
    return "";
  }
  
  if (!trialDays || trialDays.trim() === "") {
    console.log("calculatePaymentDate - trialDays vazio");
    return "";
  }
  
  const trial = parseInt(trialDays.replace(/\D/g, ''), 10);
  if (isNaN(trial) || trial <= 0) {
    console.log("calculatePaymentDate - trial inválido:", trial);
    return "";
  }
  
  try {
    // Se a data está no formato yyyy-mm-dd (input date)
    let date: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      date = new Date(startDate + 'T00:00:00');
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(startDate)) {
      // Se está no formato dd/mm/yyyy
      const parts = startDate.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      date = new Date(year, month - 1, day);
    } else {
      console.log("calculatePaymentDate - formato de data inválido:", startDate);
      return "";
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.log("calculatePaymentDate - data inválida após criação");
      return "";
    }
    
    // Adicionar os dias de teste
    date.setDate(date.getDate() + trial);
    
    // Retornar no formato yyyy-mm-dd para input
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const result = `${year}-${month}-${day}`;
    console.log("calculatePaymentDate - resultado:", result);
    return result;
  } catch (error) {
    console.error("calculatePaymentDate - erro:", error);
    return "";
  }
};

export const calculateRenewalDate = (startDate: string, months: number = 12): string => {
  console.log("Calculando data de renovação:", { startDate, months });
  
  if (!startDate || startDate === "NaN/NaN/NaN") {
    console.log("Data de início inválida");
    return "";
  }
  
  try {
    let date: Date;
    
    // Se a data está no formato yyyy-mm-dd (input date)
    if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      date = new Date(startDate + 'T00:00:00');
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(startDate)) {
      // Se está no formato dd/mm/yyyy
      const parts = startDate.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      date = new Date(year, month - 1, day);
    } else {
      console.log("Formato de data inválido");
      return "";
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.log("Data inválida após criação");
      return "";
    }
    
    // Adicionar meses
    date.setMonth(date.getMonth() + months);
    
    // Retornar no formato yyyy-mm-dd para input
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const renewalDate = `${year}-${month}-${day}`;
    console.log("Data de renovação calculada:", renewalDate);
    
    return renewalDate;
  } catch (error) {
    console.error("Erro ao calcular data de renovação:", error);
    return "";
  }
};

// Nova função para calcular renovação baseada na data de início dos pagamentos
export const calculateRenewalFromPaymentStart = (paymentStartDate: string, months: number = 12): string => {
  console.log("Calculando data de renovação baseada no início dos pagamentos:", { paymentStartDate, months });
  
  if (!paymentStartDate || paymentStartDate === "NaN/NaN/NaN") {
    console.log("Data de início dos pagamentos inválida");
    return "";
  }
  
  try {
    let date: Date;
    
    // Se a data está no formato yyyy-mm-dd (input date)
    if (/^\d{4}-\d{2}-\d{2}$/.test(paymentStartDate)) {
      date = new Date(paymentStartDate + 'T00:00:00');
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(paymentStartDate)) {
      // Se está no formato dd/mm/yyyy
      const parts = paymentStartDate.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      date = new Date(year, month - 1, day);
    } else {
      console.log("Formato de data inválido");
      return "";
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.log("Data inválida após criação");
      return "";
    }
    
    // Adicionar meses
    date.setMonth(date.getMonth() + months);
    
    // Retornar no formato yyyy-mm-dd para input
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const renewalDate = `${year}-${month}-${day}`;
    console.log("Data de renovação calculada baseada no pagamento:", renewalDate);
    
    return renewalDate;
  } catch (error) {
    console.error("Erro ao calcular data de renovação baseada no pagamento:", error);
    return "";
  }
};

// Nova função para calcular data de renovação baseada na data de reajuste
export const calculateNextRenewalFromAdjustment = (
  startDate: string, 
  adjustmentDate: string,
  months: number = 12
): string => {
  console.log("Calculando próxima renovação após reajuste:", { startDate, adjustmentDate, months });
  
  if (!startDate || !adjustmentDate) {
    console.log("Datas inválidas");
    return "";
  }
  
  try {
    // Converter data de início
    let startDateTime: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      startDateTime = new Date(startDate + 'T00:00:00');
    } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(startDate)) {
      const parts = startDate.split('/');
      startDateTime = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      console.log("Formato de data de início inválido");
      return "";
    }
    
    // Converter data de reajuste
    const adjustmentDateTime = new Date(adjustmentDate);
    
    if (isNaN(startDateTime.getTime()) || isNaN(adjustmentDateTime.getTime())) {
      console.log("Datas inválidas após conversão");
      return "";
    }
    
    // Calcular quantos anos completos se passaram desde o início
    const yearsPassed = adjustmentDateTime.getFullYear() - startDateTime.getFullYear();
    
    // Determinar a próxima data de renovação (aniversário do contrato)
    let nextRenewalYear = startDateTime.getFullYear() + yearsPassed + 1;
    
    // Se o reajuste foi feito depois do aniversário do contrato no ano atual,
    // a próxima renovação é no próximo ano
    const currentYearAnniversary = new Date(
      startDateTime.getFullYear() + yearsPassed, 
      startDateTime.getMonth(), 
      startDateTime.getDate()
    );
    
    if (adjustmentDateTime >= currentYearAnniversary) {
      nextRenewalYear = startDateTime.getFullYear() + yearsPassed + 1;
    } else {
      nextRenewalYear = startDateTime.getFullYear() + yearsPassed;
    }
    
    const nextRenewal = new Date(nextRenewalYear, startDateTime.getMonth(), startDateTime.getDate());
    const renewalDate = `${nextRenewal.getFullYear()}-${(nextRenewal.getMonth() + 1).toString().padStart(2, '0')}-${nextRenewal.getDate().toString().padStart(2, '0')}`;
    
    console.log(`Próxima renovação calculada: ${renewalDate} (Início: ${startDate}, Reajuste: ${adjustmentDate})`);
    
    return renewalDate;
  } catch (error) {
    console.error("Erro ao calcular próxima renovação:", error);
    return "";
  }
};
