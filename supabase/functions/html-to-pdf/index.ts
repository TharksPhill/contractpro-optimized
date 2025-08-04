import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://cdn.skypack.dev/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedContent {
  title: string;
  sections: Array<{
    heading: string;
    content: string;
    level: number;
  }>;
  plainText: string;
}

function parseHTML(html: string): ParsedContent {
  // Remove scripts e styles
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Extrair título
  const titleMatch = cleanHtml.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Documento';
  
  // Extrair seções com headings
  const sections: Array<{ heading: string; content: string; level: number }> = [];
  
  // Capturar h1-h6 e seu conteúdo seguinte
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
  let match;
  
  while ((match = headingRegex.exec(cleanHtml)) !== null) {
    const level = parseInt(match[1]);
    const heading = match[2].replace(/<[^>]*>/g, '').trim();
    
    // Tentar capturar conteúdo após o heading até o próximo heading
    const afterHeading = cleanHtml.substring(match.index + match[0].length);
    const nextHeadingMatch = afterHeading.match(/<h[1-6][^>]*>/i);
    const contentEnd = nextHeadingMatch ? nextHeadingMatch.index : 1000;
    const content = afterHeading.substring(0, contentEnd)
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    sections.push({ heading, content, level });
  }
  
  // Se não há headings, tratar como texto simples
  if (sections.length === 0) {
    const plainText = cleanHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    sections.push({ heading: title, content: plainText, level: 1 });
  }
  
  const plainText = cleanHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  return { title, sections, plainText };
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const estimatedWidth = testLine.length * (fontSize * 0.6); // Estimativa aproximada
    
    if (estimatedWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word); // Palavra muito longa
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

async function htmlToPdfBase64(html: string): Promise<{ success: boolean; pdfBase64?: string; error?: string; detail?: any }> {
  try {
    console.log('[DEBUG PDF-LIB] 🚀 === INÍCIO DA CONVERSÃO HTML→PDF ===');
    console.log('[DEBUG PDF-LIB] Timestamp:', new Date().toISOString());
    
    // Validar HTML
    if (!html || html.trim().length === 0) {
      console.error('[ERROR PDF-LIB] HTML vazio ou inválido');
      return { 
        success: false, 
        error: 'HTML vazio ou inválido fornecido',
        detail: {
          htmlLength: html?.length || 0,
          step: 'validation_html'
        }
      };
    }
    
    console.log('[DEBUG PDF-LIB] HTML recebido, length:', html.length);
    
    // Parse do HTML
    const parsed = parseHTML(html);
    console.log('[DEBUG PDF-LIB] Conteúdo parseado:', {
      title: parsed.title,
      sectionsCount: parsed.sections.length,
      plainTextLength: parsed.plainText.length
    });
    
    // Criar documento PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Configurações da página
    const pageWidth = 595; // A4 width in points
    const pageHeight = 842; // A4 height in points
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;
    
    // Função para adicionar nova página se necessário
    const addNewPageIfNeeded = (requiredSpace: number) => {
      if (yPosition - requiredSpace < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
        return true;
      }
      return false;
    };
    
    // Título do documento
    const titleFontSize = 20;
    const titleLines = wrapText(parsed.title, contentWidth, titleFontSize);
    
    for (const line of titleLines) {
      addNewPageIfNeeded(titleFontSize + 10);
      page.drawText(line, {
        x: margin,
        y: yPosition,
        size: titleFontSize,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPosition -= titleFontSize + 5;
    }
    
    yPosition -= 20; // Espaço após título
    
    // Renderizar seções
    for (const section of parsed.sections) {
      // Heading
      const headingFontSize = Math.max(16 - (section.level * 2), 12);
      addNewPageIfNeeded(headingFontSize + 15);
      
      const headingLines = wrapText(section.heading, contentWidth, headingFontSize);
      for (const line of headingLines) {
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: headingFontSize,
          font: boldFont,
          color: rgb(0.1, 0.1, 0.1),
        });
        yPosition -= headingFontSize + 3;
      }
      
      yPosition -= 10; // Espaço após heading
      
      // Conteúdo
      if (section.content) {
        const contentFontSize = 11;
        const contentLines = wrapText(section.content, contentWidth, contentFontSize);
        
        for (const line of contentLines) {
          addNewPageIfNeeded(contentFontSize + 5);
          page.drawText(line, {
            x: margin,
            y: yPosition,
            size: contentFontSize,
            font: font,
            color: rgb(0.3, 0.3, 0.3),
          });
          yPosition -= contentFontSize + 4;
        }
      }
      
      yPosition -= 15; // Espaço entre seções
    }
    
    // Adicionar rodapé com data
    const footerText = `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
    const footerFontSize = 8;
    
    // Adicionar rodapé em todas as páginas
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const currentPage = pages[i];
      currentPage.drawText(footerText, {
        x: margin,
        y: 30,
        size: footerFontSize,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      // Número da página
      const pageNumber = `Página ${i + 1} de ${pages.length}`;
      currentPage.drawText(pageNumber, {
        x: pageWidth - margin - (pageNumber.length * footerFontSize * 0.6),
        y: 30,
        size: footerFontSize,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
    
    // Gerar PDF
    console.log('[DEBUG PDF-LIB] Gerando PDF bytes...');
    const pdfBytes = await pdfDoc.save();
    
    // Converter para base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
    console.log('[DEBUG PDF-LIB] PDF gerado com sucesso!');
    console.log('[DEBUG PDF-LIB] Tamanho do PDF:', pdfBytes.length, 'bytes');
    console.log('[DEBUG PDF-LIB] Tamanho do Base64:', base64.length, 'chars');
    console.log('[DEBUG PDF-LIB] Páginas criadas:', pages.length);
    
    return { success: true, pdfBase64: base64 };
    
  } catch (error) {
    console.error('[ERROR PDF-LIB] ❌ === ERRO CRÍTICO ===');
    console.error('[ERROR PDF-LIB] Error name:', error.constructor.name);
    console.error('[ERROR PDF-LIB] Error message:', error.message);
    console.error('[ERROR PDF-LIB] Error stack:', error.stack);
    
    return { 
      success: false, 
      error: `Erro interno: ${error.message}`,
      detail: {
        name: error.constructor.name,
        message: error.message,
        stack: error.stack,
        step: 'critical_error'
      }
    };
  }
}

serve(async (req) => {
  console.log('🚀 Edge Function html-to-pdf chamada (pdf-lib)');
  console.log('📍 Método:', req.method);
  console.log('📍 URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ Respondendo a CORS preflight');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📥 Processando requisição POST...');
    
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📄 Body da requisição recebido:', Object.keys(requestBody));
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'JSON inválido na requisição',
          detail: parseError.message 
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    const { html } = requestBody;
    
    if (!html) {
      console.error('❌ HTML não fornecido na requisição');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Parâmetro "html" é obrigatório',
          detail: 'O campo html deve estar presente no body da requisição'
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    console.log('🔄 Iniciando conversão HTML para PDF com pdf-lib...');
    const result = await htmlToPdfBase64(html);
    
    if (result.success) {
      console.log('✅ PDF gerado com sucesso, retornando resposta');
      return new Response(
        JSON.stringify({ 
          success: true, 
          pdfBase64: result.pdfBase64 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    } else {
      console.error('❌ Falha na geração do PDF:', result.error);
      console.error('❌ Detalhes:', result.detail);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error,
          detail: result.detail
        }),
        { 
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO no handler principal:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Tipo do erro:', error.constructor.name);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Erro interno do servidor: ${error.message}`,
        detail: {
          name: error.constructor.name,
          message: error.message,
          stack: error.stack
        }
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});