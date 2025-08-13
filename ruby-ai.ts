/**
 * Ruby AI - Sistema simplificado para GitHub deploy
 */

export interface RubyResponse {
  message: string;
  options?: any;
}

// Detecta tipo de ocorrência na mensagem
function detectOccurrenceType(message: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes('eletric') || msg.includes('energia') || msg.includes('luz') || msg.includes('força')) {
    return 'eletrica';
  }
  
  if (msg.includes('internet') || msg.includes('wifi') || msg.includes('rede') || msg.includes('conexao') || msg.includes('conectividade')) {
    return 'conectividade';
  }
  
  if (msg.includes('poste') || msg.includes('cabo') || msg.includes('rua') || msg.includes('externa') || msg.includes('rede externa')) {
    return 'rede_externa';
  }
  
  if (msg.includes('nap') || msg.includes('gpon') || msg.includes('fibra') || msg.includes('optica')) {
    return 'nap_gpon';
  }
  
  return 'geral';
}

// Links dos formulários
const FORM_LINKS = {
  eletrica: 'https://form.fillout.com/t/2Z8FQqRJpYus',
  conectividade: 'https://form.fillout.com/t/bQXvnMkkYxus',
  rede_externa: 'https://form.fillout.com/t/gPXvnMkkYxus', 
  nap_gpon: 'https://form.fillout.com/t/hPXvnMkkYxus'
};

// Processa mensagem da Ruby AI
export async function processRubyMessage(message: string): Promise<RubyResponse> {
  const occurrenceType = detectOccurrenceType(message);
  
  if (occurrenceType === 'geral') {
    return {
      message: '🤖 *Ruby AI ativada!*\n\n' +
        '💡 Posso ajudar você a criar ocorrências:\n\n' +
        '• "Ruby, problema elétrico"\n' +
        '• "Internet não funciona"\n' +
        '• "Problema na rede externa"\n' +
        '• "NAP GPON com defeito"\n\n' +
        'Ou use `/ocorrencia` para o menu tradicional.',
      options: { parse_mode: 'Markdown' }
    };
  }

  const tipos = {
    eletrica: { nome: '⚡ Elétrica', emoji: '⚡' },
    conectividade: { nome: '🌐 Conectividade', emoji: '🌐' },
    rede_externa: { nome: '📡 Rede Externa', emoji: '📡' },
    nap_gpon: { nome: '🔌 NAP GPON', emoji: '🔌' }
  };

  const tipo = tipos[occurrenceType as keyof typeof tipos];
  const link = FORM_LINKS[occurrenceType as keyof typeof FORM_LINKS];

  const keyboard = {
    inline_keyboard: [[
      { text: '📝 Abrir Formulário', url: link }
    ]]
  };

  return {
    message: `${tipo.emoji} *Ruby AI detectou: ${tipo.nome}*\n\n` +
      `✅ Identificei que você precisa registrar uma ocorrência do tipo *${tipo.nome}*\n\n` +
      `🔗 Clique no botão abaixo para acessar o formulário específico:`,
    options: { 
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    }
  };
}