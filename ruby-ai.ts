/**
 * Ruby AI - Sistema de IA conversacional para o bot
 * Permite conversas naturais sem comandos, entendendo contexto e intenções
 */

import { buscarUsuario } from '../google-sheets';
import { getFormLinkByType } from './github-forms';

export interface ConversationContext {
  userId: string;
  username: string;
  chatId: number;
  messageHistory: Array<{
    role: 'user' | 'ruby';
    content: string;
    timestamp: Date;
  }>;
  currentIntent?: string;
  userData?: any;
}

// Contextos de conversação por usuário
const conversationContexts = new Map<string, ConversationContext>();

// Estado global da Ruby AI (pode ser ativada/desativada)
let rubyAIEnabled = true;

export function setRubyAIEnabled(enabled: boolean) {
  rubyAIEnabled = enabled;
}

export function isRubyAIEnabled(): boolean {
  return rubyAIEnabled;
}

/**
 * Analisa a mensagem do usuário e identifica a intenção
 */
function analyzeIntent(message: string): string {
  const msg = message.toLowerCase().trim();
  
  // Intenções relacionadas a ocorrências
  if (msg.includes('ocorrência') || msg.includes('ocorrencia') || msg.includes('problema') || 
      msg.includes('incidente') || msg.includes('falha') || msg.includes('defeito')) {
    return 'nova_ocorrencia';
  }
  
  // Intenções relacionadas a consultas
  if (msg.includes('histórico') || msg.includes('historico') || msg.includes('consultar') ||
      msg.includes('buscar') || msg.includes('ver') || msg.includes('listar')) {
    return 'consulta_historico';
  }
  
  // Intenções relacionadas a status
  if (msg.includes('status') || msg.includes('situação') || msg.includes('situacao') ||
      msg.includes('andamento') || msg.includes('progresso')) {
    return 'consulta_status';
  }
  
  // Saudações e cumprimentos
  if (msg.includes('oi') || msg.includes('olá') || msg.includes('ola') || msg.includes('bom dia') ||
      msg.includes('boa tarde') || msg.includes('boa noite') || msg.includes('hello') || msg.includes('hi')) {
    return 'saudacao';
  }
  
  // Pedido de ajuda
  if (msg.includes('ajuda') || msg.includes('help') || msg.includes('socorro') || msg.includes('como')) {
    return 'ajuda';
  }
  
  return 'conversa_geral';
}

/**
 * Gera resposta contextual baseada na intenção e histórico
 */
function generateContextualResponse(intent: string, message: string, context: ConversationContext): string {
  const userName = context.userData?.nome || context.username || 'técnico';
  
  switch (intent) {
    case 'saudacao':
      return `Olá ${userName}! 👋 Sou a Ruby, sua assistente para ocorrências técnicas. Como posso te ajudar hoje? Você pode me contar sobre algum problema no campo, consultar histórico de ocorrências ou verificar status de contratos.`;
    
    case 'nova_ocorrencia':
      // Identifica o tipo de ocorrência pela mensagem
      const msgLower = message.toLowerCase();
      let tipoOcorrencia = '';
      let linkFormulario = '';
      
      if (msgLower.includes('manutenção') || msgLower.includes('manutencao') || msgLower.includes('reparo')) {
        tipoOcorrencia = 'Manutenção';
        linkFormulario = getFormLinkByType('manutencao');
      } else if (msgLower.includes('elétrica') || msgLower.includes('eletrica') || msgLower.includes('energia')) {
        tipoOcorrencia = 'Elétrica';
        linkFormulario = getFormLinkByType('eletrica');
      } else if (msgLower.includes('internet') || msgLower.includes('conectividade') || msgLower.includes('rede')) {
        tipoOcorrencia = 'Internet/Conectividade';
        linkFormulario = getFormLinkByType('internet');
      } else if (msgLower.includes('segurança') || msgLower.includes('seguranca') || msgLower.includes('acesso')) {
        tipoOcorrencia = 'Segurança';
        linkFormulario = getFormLinkByType('seguranca');
      }
      
      if (tipoOcorrencia && linkFormulario) {
        return `Perfeito, ${userName}! Identifiquei que você precisa registrar uma ocorrência de **${tipoOcorrencia}**. \n\n🔗 [**Clique aqui para abrir o formulário**](${linkFormulario})\n\nO formulário já está otimizado para esse tipo de ocorrência. Após preencher, você receberá um ID único para acompanhamento. Precisa de mais alguma coisa?`;
      } else {
        return `Entendo que você tem uma nova ocorrência para registrar, ${userName}. Para te direcionar ao formulário correto, me conte qual tipo:\n\n🔧 **Manutenção** - Reparos, defeitos em equipamentos\n⚡ **Elétrica** - Problemas com energia, instalações elétricas\n🌐 **Internet** - Conectividade, rede, comunicação\n🔒 **Segurança** - Acesso, controles, câmeras\n📱 **Outros** - Qualquer outro tipo de ocorrência\n\nÉ só me dizer o tipo que eu te envio o link direto!`;
      }
    
    case 'consulta_historico':
      return `Claro! Posso te mostrar seu histórico de ocorrências, ${userName}. Você gostaria de ver:\n\n📋 Todas as suas ocorrências\n🔍 Ocorrências de um contrato específico\n📅 Ocorrências de um período específico\n\nMe diga qual opção prefere ou mencione o contrato que quer consultar.`;
    
    case 'consulta_status':
      return `Posso verificar o status das ocorrências para você, ${userName}. Me informe:\n\n🏢 O número do contrato que quer consultar\n🔢 O ID específico de uma ocorrência\n📊 Ou se quer ver um resumo geral\n\nQual informação você precisa?`;
    
    case 'ajuda':
      return `Estou aqui para te ajudar, ${userName}! Aqui está o que posso fazer:\n\n✅ **Registrar ocorrências** - Me conte sobre qualquer problema técnico\n📋 **Consultar histórico** - Vejo todas as suas ocorrências passadas\n🔍 **Verificar status** - Checo andamento de contratos ou ocorrências específicas\n📊 **Relatórios** - Posso gerar resumos e estatísticas\n\nÉ só conversar comigo naturalmente! Não precisa usar comandos específicos. O que você precisa?`;
    
    case 'conversa_geral':
      // Resposta mais inteligente baseada no contexto e palavras-chave
      const msgLowerGeneral = message.toLowerCase();
      
      if (msgLowerGeneral.includes('contrato')) {
        return `Vou te ajudar com informações sobre contratos, ${userName}. Me informe o número do contrato e posso mostrar todas as ocorrências relacionadas, status atual e histórico completo.`;
      }
      
      if (msgLowerGeneral.includes('cliente')) {
        return `Entendo que você está lidando com algo relacionado a clientes, ${userName}. Posso te ajudar a registrar ocorrências, consultar histórico ou verificar status de atendimentos. Me conte mais detalhes!`;
      }
      
      // Detecção de tipos específicos de problemas
      if (msgLowerGeneral.includes('não funciona') || msgLowerGeneral.includes('nao funciona') || msgLowerGeneral.includes('parou') || msgLowerGeneral.includes('quebrado')) {
        return `Entendo que algo não está funcionando, ${userName}. Vou te ajudar a registrar essa ocorrência. Pode me contar mais detalhes sobre o equipamento ou sistema que está com problema? Por exemplo:\n\n🔧 Que equipamento está com defeito?\n📍 Onde está localizado?\n⚠️ Qual é o problema específico?\n\nCom essas informações, vou te direcionar para o formulário correto!`;
      }
      
      if (msgLowerGeneral.includes('urgente') || msgLowerGeneral.includes('emergência') || msgLowerGeneral.includes('emergencia') || msgLowerGeneral.includes('crítico')) {
        return `Entendi que é uma situação urgente, ${userName}! Vou acelerar o processo. Me diga rapidamente:\n\n⚠️ **Que tipo de emergência?**\n📍 **Local/Contrato**\n🚨 **Risco de segurança ou operacional?**\n\nVou te conectar imediatamente ao formulário correto para registro prioritário!`;
      }
      
      if (msgLowerGeneral.includes('como') || msgLowerGeneral.includes('posso') || msgLowerGeneral.includes('preciso')) {
        return `Claro, ${userName}! Estou aqui para te orientar. Posso te ajudar com:\n\n✅ **Registrar nova ocorrência** - Me conte o problema\n📋 **Ver histórico** - Digite "histórico" ou "minhas ocorrências"\n🔍 **Consultar status** - Me informe o contrato ou ID\n📊 **Relatórios** - Digite "relatório" para ver estatísticas\n\nO que você precisa fazer?`;
      }
      
      return `Entendo, ${userName}. Estou aqui para te auxiliar com qualquer questão técnica. Pode me contar o que está acontecendo que eu vou te orientar da melhor forma possível. É sobre alguma ocorrência, consulta ou outra necessidade?`;
    
    default:
      return `Oi ${userName}! Como posso te ajudar hoje? Estou pronta para auxiliar com ocorrências, consultas e qualquer dúvida que você tenha.`;
  }
}

/**
 * Processa mensagem com IA conversacional
 */
export async function processRubyAI(
  userId: string,
  username: string,
  chatId: number,
  message: string
): Promise<string | null> {
  
  // Verifica se Ruby AI está habilitada
  if (!rubyAIEnabled) {
    return null; // Retorna null para indicar que não deve responder
  }
  
  // Busca ou cria contexto da conversa
  let context = conversationContexts.get(userId);
  
  if (!context) {
    // Busca dados do usuário
    const userData = await buscarUsuario(username);
    
    context = {
      userId,
      username,
      chatId,
      messageHistory: [],
      userData
    };
    conversationContexts.set(userId, context);
  }
  
  // Adiciona mensagem ao histórico
  context.messageHistory.push({
    role: 'user',
    content: message,
    timestamp: new Date()
  });
  
  // Mantém apenas últimas 10 mensagens para performance
  if (context.messageHistory.length > 10) {
    context.messageHistory = context.messageHistory.slice(-10);
  }
  
  // Analisa intenção da mensagem
  const intent = analyzeIntent(message);
  context.currentIntent = intent;
  
  // Gera resposta contextual
  const response = generateContextualResponse(intent, message, context);
  
  // Adiciona resposta ao histórico
  context.messageHistory.push({
    role: 'ruby',
    content: response,
    timestamp: new Date()
  });
  
  // Atualiza contexto
  conversationContexts.set(userId, context);
  
  return response;
}

/**
 * Limpa contextos antigos (executar periodicamente)
 */
export function cleanOldContexts() {
  const now = new Date();
  const maxAge = 2 * 60 * 60 * 1000; // 2 horas
  
  for (const [userId, context] of conversationContexts.entries()) {
    const lastMessage = context.messageHistory[context.messageHistory.length - 1];
    if (lastMessage && (now.getTime() - lastMessage.timestamp.getTime()) > maxAge) {
      conversationContexts.delete(userId);
    }
  }
}

/**
 * Obtém contexto atual do usuário
 */
export function getUserContext(userId: string): ConversationContext | undefined {
  return conversationContexts.get(userId);
}

// Limpeza automática de contextos antigos a cada hora
setInterval(cleanOldContexts, 60 * 60 * 1000);