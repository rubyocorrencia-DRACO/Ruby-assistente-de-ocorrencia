import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import { processRubyMessage } from './ruby-ai';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { 
  polling: process.env.NODE_ENV === 'development',
  webHook: process.env.NODE_ENV === 'production'
});

const app = express();
app.use(express.json());

// RUBY AI - FUNÇÃO PRINCIPAL
async function handleMessage(msg: any) {
  const chatId = msg.chat.id;
  const text = msg.text?.toLowerCase() || '';
  
  console.log(`[${new Date().toLocaleString('pt-BR')}] Mensagem recebida: "${text}"`);

  // Comandos tradicionais (mantidos)
  if (text.startsWith('/start')) {
    return bot.sendMessage(chatId, 
      '🤖 *Ruby AI Bot Ativado!*\n\n' +
      '💬 *Modo Conversacional:*\n' +
      '• "Ruby, problema elétrico"\n' +
      '• "Oi Ruby, internet não funciona"\n' +
      '• "Ruby, ocorrência de rede"\n\n' +
      '⚡ *Comandos Rápidos:*\n' +
      '• `/ocorrencia` - Nova ocorrência\n' +
      '• `/historico` - Ver histórico\n\n' +
      '*Agora você pode falar naturalmente comigo!*', 
      { parse_mode: 'Markdown' }
    );
  }

  if (text.startsWith('/ocorrencia')) {
    const keyboard = {
      inline_keyboard: [
        [{ text: '⚡ Elétrica', callback_data: 'tipo_eletrica' }],
        [{ text: '🌐 Conectividade', callback_data: 'tipo_conectividade' }],
        [{ text: '📡 Rede Externa', callback_data: 'tipo_rede_externa' }],
        [{ text: '🔌 NAP GPON', callback_data: 'tipo_nap_gpon' }]
      ]
    };
    
    return bot.sendMessage(chatId, 
      '🔧 *Selecione o tipo de ocorrência:*', 
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    );
  }

  // RUBY AI - PROCESSAMENTO NATURAL
  if (text.includes('ruby') || text.includes('problema') || text.includes('ocorrencia') || text.includes('internet') || text.includes('eletric')) {
    try {
      console.log('[Ruby AI] Processando mensagem conversacional...');
      const response = await processRubyMessage(text);
      return bot.sendMessage(chatId, response.message, response.options || {});
    } catch (error) {
      console.error('[Ruby AI] Erro:', error);
      return bot.sendMessage(chatId, 
        '❌ Desculpe, houve um erro ao processar sua mensagem. Tente usar `/ocorrencia` para criar uma nova ocorrência.'
      );
    }
  }

  // Resposta padrão para mensagens não reconhecidas
  bot.sendMessage(chatId, 
    '🤖 Olá! Sou a Ruby AI.\n\n' +
    '💡 *Como posso ajudar?*\n' +
    '• "Ruby, problema elétrico"\n' +
    '• "Oi Ruby, internet não funciona"\n' +
    '• Use `/start` para ver todas as opções'
  );
}

// Callback dos botões
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;

  const links = {
    tipo_eletrica: 'https://form.fillout.com/t/2Z8FQqRJpYus',
    tipo_conectividade: 'https://form.fillout.com/t/bQXvnMkkYxus', 
    tipo_rede_externa: 'https://form.fillout.com/t/gPXvnMkkYxus',
    tipo_nap_gpon: 'https://form.fillout.com/t/hPXvnMkkYxus'
  };

  const link = links[query.data as keyof typeof links];
  if (link) {
    const tipos = {
      tipo_eletrica: '⚡ Elétrica',
      tipo_conectividade: '🌐 Conectividade', 
      tipo_rede_externa: '📡 Rede Externa',
      tipo_nap_gpon: '🔌 NAP GPON'
    };
    
    const tipo = tipos[query.data as keyof typeof tipos];
    const keyboard = { inline_keyboard: [[{ text: '📝 Abrir Formulário', url: link }]] };
    
    await bot.sendMessage(chatId, 
      `✅ *Ocorrência ${tipo} selecionada!*\n\n` +
      `🔗 Clique no botão abaixo para acessar o formulário:`, 
      { reply_markup: keyboard, parse_mode: 'Markdown' }
    );
  }
  
  bot.answerCallbackQuery(query.id);
});

// Listener principal
bot.on('message', handleMessage);

// Webhook para produção
if (process.env.NODE_ENV === 'production') {
  const port = process.env.PORT || 3000;
  const url = process.env.RENDER_EXTERNAL_URL || `https://ruby-ocorrencias-bot.onrender.com`;
  
  app.post(`/webhook/${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
  
  app.listen(port, async () => {
    console.log(`[${new Date().toLocaleString('pt-BR')}] 🚀 Server running on port ${port}`);
    try {
      await bot.setWebHook(`${url}/webhook/${process.env.TELEGRAM_BOT_TOKEN}`);
      console.log(`[${new Date().toLocaleString('pt-BR')}] ✅ Webhook configurado: ${url}`);
    } catch (error) {
      console.error('❌ Erro ao configurar webhook:', error);
    }
  });
} else {
  console.log(`[${new Date().toLocaleString('pt-BR')}] 🔄 Bot em modo desenvolvimento (polling)`);
}

console.log(`[${new Date().toLocaleString('pt-BR')}] 🤖 Ruby AI Bot inicializado!`);