// server/ruby-ai.ts
import { SendMessageOptions } from 'node-telegram-bot-api';

// Função que processa mensagens “Ruby AI”
export async function processRubyMessage(text: string): Promise<{ message: string; options?: SendMessageOptions }> {
  const lower = text.toLowerCase();

  // Saudações
  if (lower.includes('olá') || lower.includes('oi')) {
    return { message: 'Olá! 🤖 Eu sou a Ruby, seu assistente de ocorrências.' };
  }

  // Pedido de ajuda
  if (lower.includes('ajuda') || lower.includes('help')) {
    return {
      message:
        `📖 Comandos disponíveis:\n` +
        `/start - Iniciar o bot\n` +
        `/login - Autenticar técnico\n` +
        `/ocorrencia - Registrar nova ocorrência\n` +
        `/historico - Ver ocorrências recentes\n` +
        `/status <número> - Consultar contrato`
    };
  }

  // Perguntas sobre ocorrências
  if (lower.includes('problema') || lower.includes('ocorrencia') || lower.includes('internet') || lower.includes('eletric')) {
    return {
      message: 'Entendi! Para criar uma ocorrência, use o comando /ocorrencia e siga as instruções que eu enviarei.'
    };
  }

  // Resposta padrão
  return { message: 'Desculpe, não entendi. 🤔 Tente usar /help para ver os comandos disponíveis.' };
}
