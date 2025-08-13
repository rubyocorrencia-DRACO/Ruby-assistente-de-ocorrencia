import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import fs from 'fs';
import { processRubyMessage } from './ruby-ai';

// Caminhos dos arquivos JSON
const USERS_FILE = './data/users.json';
const OCCURRENCES_FILE = './data/occurrences.json';

// Carregar arquivos JSON
let users: Record<number, any> = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) : {};
let occurrences: any[] = fs.existsSync(OCCURRENCES_FILE) ? JSON.parse(fs.readFileSync(OCCURRENCES_FILE, 'utf-8')) : [];

// Funções para salvar dados
const saveUsers = () => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
const saveOccurrences = () => fs.writeFileSync(OCCURRENCES_FILE, JSON.stringify(occurrences, null, 2));

// Criar bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { 
  polling: process.env.NODE_ENV === 'development',
  webHook: process.env.NODE_ENV === 'production'
});

const app = express();
app.use(express.json());

// Map dos formulários
const formLinks: Record<string, string> = {
  rede_externa: 'https://redeexterna.fillout.com/t/g56SBKiZALus',
  rede_externa_gpon: 'https://redeexterna.fillout.com/t/6VTMJST5NMus',
  backbone: 'https://redeexterna.fillout.com/t/7zfWL9BKM6us',
  backbone_gpon: 'https://redeexterna.fillout.com/t/atLL2dekh3us'
};

// Função auxiliar para deletar mensagens temporárias
const deleteMessage = (chatId: number, messageId: number, delay = 5000) => {
  setTimeout(() => {
    bot.deleteMessage(chatId, messageId).catch(() => {});
  }, delay);
};

// Função principal do bot
async function handleMessage(msg: any) {
  const chatId = msg.chat.id;
  const text = msg.text?.trim() || '';
  const user = users[chatId];

  console.log(`[${new Date().toLocaleString('pt-BR')}] Mensagem recebida: "${text}"`);

  // /start
  if (text.startsWith('/start')) {
    return bot.sendMessage(chatId, 
      '🤖 *Ruby AI Bot Ativado!*\n\n' +
      '💬 Comandos disponíveis:\n' +
      '• /login <código> - Login do técnico\n' +
      '• /ocorrencia - Criar nova ocorrência\n' +
      '• /historico - Ver histórico\n' +
      '• /status <contrato> - Status de contrato\n' +
      '• /buscar <contrato> - Buscar ocorrências por contrato\n' +
      '• /master - Comandos administrativos (se admin)', 
      { parse_mode: 'Markdown' }
    );
  }

  // /login
  if (text.startsWith('/login')) {
    const code = text.split(' ')[1];
    if (!code) return bot.sendMessage(chatId, '❌ Informe seu código após /login (ex: /login Z481036)');
    users[chatId] = { code, chatId, isMaster: false };
    saveUsers();
    return bot.sendMessage(chatId, `✅ Login efetuado com sucesso! Código: ${code}`);
  }

  // /logout
  if (text.startsWith('/logout')) {
    delete users[chatId];
    saveUsers();
    return bot.sendMessage(chatId, '✅ Logout efetuado.');
  }

  // /ocorrencia
  if (text.startsWith('/ocorrencia')) {
    if (!user) return bot.sendMessage(chatId, '❌ Faça login primeiro com /login <código>');

    const keyboard = {
      inline_keyboard: [
        [{ text: '📡 Rede Externa', callback_data: 'rede_externa' }],
        [{ text: '📡 Rede Externa GPON', callback_data: 'rede_externa_gpon' }],
        [{ text: '🌐 Backbone', callback_data: 'backbone' }],
        [{ text: '🌐 Backbone GPON', callback_data: 'backbone_gpon' }]
      ]
    };
    return bot.sendMessage(chatId, '🔧 *Selecione o tipo de ocorrência:*', { reply_markup: keyboard, parse_mode: 'Markdown' });
  }

  // /historico
  if (text.startsWith('/historico')) {
    if (!user) return bot.sendMessage(chatId, '❌ Faça login primeiro com /login <código>');
    const userOccurrences = occurrences.filter(o => o.chatId === chatId);
    if (userOccurrences.length === 0) return bot.sendMessage(chatId, '📋 Nenhuma ocorrência encontrada.');
    
    let msgText = '📊 *Histórico de Ocorrências:*\n\n';
    userOccurrences.forEach(o => {
      msgText += `🔹 ID: ${o.id}\n📄 Contrato: ${o.contract}\n👷 Técnico: ${o.userCode}\n🔧 Tipo: ${o.type}\n📊 Status: ${o.status}\n⏰ Data: ${o.date}\n\n`;
    });

    return bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' });
  }

  // /status <contrato>
  if (text.startsWith('/status')) {
    const parts = text.split(' ');
    const contract = parts[1];
    if (!contract) return bot.sendMessage(chatId, '❌ Use /status <contrato>');
    const contractOccurrences = occurrences.filter(o => o.contract === contract);
    if (contractOccurrences.length === 0) return bot.sendMessage(chatId, '📋 Nenhuma ocorrência para este contrato.');

    let msgText = `📊 *Status do contrato ${contract}:*\n\n`;
    contractOccurrences.forEach(o => {
      msgText += `🔹 ID: ${o.id}\n🔧 Tipo: ${o.type}\n📊 Status: ${o.status}\n⏰ Data: ${o.date}\n\n`;
    });
    return bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' });
  }

  // /buscar <contrato>
  if (text.startsWith('/buscar')) {
    const parts = text.split(' ');
    const contract = parts[1];
    if (!contract) return bot.sendMessage(chatId, '❌ Use /buscar <contrato>');
    const results = occurrences.filter(o => o.contract.includes(contract));
    if (results.length === 0) return bot.sendMessage(chatId, '📋 Nenhuma ocorrência encontrada.');
    
    let msgText = `🔎 *Ocorrências encontradas para ${contract}:*\n\n`;
    results.forEach(o => {
      msgText += `🔹 ID: ${o.id}\n📄 Contrato: ${o.contract}\n👷 Técnico: ${o.userCode}\n🔧 Tipo: ${o.type}\n📊 Status: ${o.status}\n⏰ Data: ${o.date}\n\n`;
    });

    return bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' });
  }

  // Processamento natural com Ruby AI
  if (text.includes('ruby') || text.includes('problema') || text.includes('ocorrencia')) {
    try {
      const response = await processRubyMessage(text);
      return bot.sendMessage(chatId, response.message, response.options || {});
    } catch (error) {
      console.error('[Ruby AI] Erro:', error);
      return bot.sendMessage(chatId, '❌ Erro ao processar mensagem.');
    }
  }

  // Resposta padrão
  bot.sendMessage(chatId, '🤖 Use /start para ver os comandos disponíveis.');
}

// Callback dos botões de ocorrência
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;
  const user = users[chatId];
  if (!user) return bot.sendMessage(chatId, '❌ Faça login primeiro com /login <código>');

  const typeKey = query.data as keyof typeof formLinks;
  const link = formLinks[typeKey];
  if (!link) return;

  // Registrar ocorrência
  const newOccurrence = {
    id: `ID${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    chatId,
    userCode: user.code,
    type: query.data.replace('_', ' ').toUpperCase(),
    contract: '123456', // Aqui pode ser input do usuário futuramente
    status: 'Em análise',
    date: new Date().toLocaleString('pt-BR')
  };
  occurrences.push(newOccurrence);
  saveOccurrences();

  // Mensagem temporária
  const sentMsg = await bot.sendMessage(chatId, `✅ *Ocorrência registrada: ${newOccurrence.type}*\nClique abaixo para preencher o formulário.`, 
    { reply_markup: { inline_keyboard: [[{ text: '📝 Abrir Formulário', url: link }]] }, parse_mode: 'Markdown' }
  );
  deleteMessage(chatId, sentMsg.message_id, 5000); // 5 segundos

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
