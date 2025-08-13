import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { processRubyMessage } from './ruby-ai';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const OCCURRENCES_FILE = path.join(DATA_DIR, 'occurrences.json');

// Cria arquivos se não existirem
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
if (!fs.existsSync(OCCURRENCES_FILE)) fs.writeFileSync(OCCURRENCES_FILE, JSON.stringify([]));

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  polling: process.env.NODE_ENV === 'development',
  webHook: process.env.NODE_ENV === 'production'
});

const app = express();
app.use(express.json());

// Funções de leitura e escrita JSON
function readJSON(file: string) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJSON(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Comandos de administrador fixo
const MASTER_ADMIN_PHONE = '+5519999789879';
let ADMINS = [MASTER_ADMIN_PHONE];

// Tipos de ocorrência
const TYPES = {
  rede_externa: 'https://redeexterna.fillout.com/t/g56SBKiZALus',
  rede_externa_gpon: 'https://redeexterna.fillout.com/t/6VTMJST5NMus',
  backbone: 'https://redeexterna.fillout.com/t/7zfWL9BKM6us',
  backbone_gpon: 'https://redeexterna.fillout.com/t/atLL2dekh3us'
};

// Flow principal
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim() || '';
  const users = readJSON(USERS_FILE);
  const occurrences = readJSON(OCCURRENCES_FILE);

  // Inicial
  if (text === '/start') {
    return bot.sendMessage(chatId,
      `🤖 Bem-vindo ao Ruby Ocorrências Bot!\n\n` +
      `📋 Comandos disponíveis:\n` +
      `• /login - Autenticar como técnico\n` +
      `• /ocorrencia - Registrar nova ocorrência\n` +
      `• /historico - Ver suas ocorrências\n` +
      `• /status <número> - Consultar por contrato\n` +
      `• /help - Mostrar ajuda\n\n` +
      `🔐 Para começar a usar, faça seu login com o comando /login\n\n` +
      `Ruby Telecom - Sistema de Ocorrências`
    );
  }

  // Help
  if (text === '/help' || text === '/ajuda') {
    return bot.sendMessage(chatId,
      `📖 Ajuda - Ruby Ocorrências Bot\n\n` +
      `🔹 Comandos Principais:\n` +
      `/start - Inicializar o bot\n` +
      `/login - Fazer login no sistema\n` +
      `/forcelogin - Limpar todos os dados (Admin)\n` +
      `/logout - Sair do sistema\n` +
      `/ocorrencia - Registrar nova ocorrência\n` +
      `/historico - Ver suas ocorrências recentes\n` +
      `/status <número> - Consultar ocorrências por contrato\n\n` +
      `🔹 Tipos de Ocorrência:\n` +
      `• Rede Externa\n• Rede Externa NAP GPON\n• Backbone\n• Backbone GPON`
    );
  }

  // Login
  if (text.startsWith('/login')) {
    const parts = text.split(' ');
    if (parts.length < 2) return bot.sendMessage(chatId, 'Digite seu login, ex: /login Z481036');
    const login = parts[1].toUpperCase();
    let user = users.find(u => u.phone === msg.from?.phone_number || u.login === login);

    if (!user) {
      // Cadastro inicial
      user = {
        login,
        phone: msg.from?.phone_number || '',
        chatId,
        name: '',
        role: '',
        isMaster: ADMINS.includes(msg.from?.phone_number || '')
      };
      users.push(user);
      writeJSON(USERS_FILE, users);
      return bot.sendMessage(chatId,
        `🔐 Primeiro Acesso - Cadastro Obrigatório\n` +
        `Olá! Seu login ${login} não foi encontrado no sistema.\n` +
        `Digite seu nome completo para registro:`
      );
    } else {
      return bot.sendMessage(chatId, `✅ Login realizado com sucesso! Bem-vindo, ${user.name}`);
    }
  }

  // Logout
  if (text === '/logout') {
    const userIndex = users.findIndex(u => u.chatId === chatId);
    if (userIndex !== -1) {
      users[userIndex].chatId = null;
      writeJSON(USERS_FILE, users);
    }
    return bot.sendMessage(chatId, '✅ Logout realizado com sucesso!');
  }

  // Comando forcelogin (Admin)
  if (text === '/forcelogin') {
    const admin = users.find(u => u.chatId === chatId && u.isMaster);
    if (!admin) return bot.sendMessage(chatId, '❌ Apenas administradores podem usar este comando.');
    users.forEach(u => u.chatId = null);
    writeJSON(USERS_FILE, users);
    return bot.sendMessage(chatId, '✅ Todos os logins foram limpos.');
  }

  // Histórico
  if (text === '/historico') {
    const user = users.find(u => u.chatId === chatId);
    if (!user) return bot.sendMessage(chatId, '❌ Faça login primeiro com /login');
    const last30days = occurrences.filter(o => o.phone === user.phone && (Date.now() - new Date(o.created).getTime()) <= 30*24*60*60*1000);
    if (last30days.length === 0) return bot.sendMessage(chatId, '📋 Nenhuma ocorrência nos últimos 30 dias.');
    let msgHist = `📋 Histórico de Ocorrências - ${user.name}\n\n`;
    last30days.forEach(o => {
      msgHist += `🔹 ID ${o.id}\n📄 CONTRATO: ${o.contract}\n🔧 Tipo: ${o.type}\n⏰ Criado: ${o.created}\n📊 Status: ${o.status}\n\n`;
    });
    return bot.sendMessage(chatId, msgHist);
  }

  // Status
  if (text.startsWith('/status')) {
    const parts = text.split(' ');
    if (parts.length < 2) return bot.sendMessage(chatId, 'Digite o número do contrato, ex: /status 123456');
    const contract = parts[1];
    const found = occurrences.filter(o => o.contract === contract);
    if (!found.length) return bot.sendMessage(chatId, '❌ Nenhuma ocorrência encontrada para este contrato.');
    let msgStatus = `📊 Status das Ocorrências - CONTRATO ${contract}\n\n`;
    found.forEach(o => {
      msgStatus += `🔹 ID ${o.id}\n🔧 Tipo: ${o.type}\n⏰ Criado: ${o.created}\n📊 Status: ${o.status}\n\n`;
    });
    return bot.sendMessage(chatId, msgStatus);
  }

  // Nova ocorrência
  if (text === '/ocorrencia') {
    const keyboard = {
      inline_keyboard: [
        [{ text: 'Rede Externa', callback_data: 'rede_externa' }],
        [{ text: 'Rede Externa NAP GPON', callback_data: 'rede_externa_gpon' }],
        [{ text: 'Backbone', callback_data: 'backbone' }],
        [{ text: 'Backbone GPON', callback_data: 'backbone_gpon' }]
      ]
    };
    return bot.sendMessage(chatId, '🔧 Selecione o tipo de ocorrência:', { reply_markup: keyboard });
  }

  // Mensagens "Ruby AI"
  if (text.toLowerCase().includes('ruby')) {
    try {
      const response = await processRubyMessage(text);
      return bot.sendMessage(chatId, response.message, response.options || {});
    } catch (error) {
      console.error(error);
      return bot.sendMessage(chatId, '❌ Erro ao processar mensagem com Ruby AI');
    }
  }
});

// Callback inline
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;
  const type = query.data;
  const users = readJSON(USERS_FILE);
  const occurrences = readJSON(OCCURRENCES_FILE);
  const user = users.find(u => u.chatId === chatId);
  if (!user) return bot.sendMessage(chatId, '❌ Faça login primeiro.');

  const url = TYPES[type as keyof typeof TYPES];
  if (!url) return;

  const id = uuidv4().slice(0, 8).toUpperCase();
  const contract = '000000'; // Pode solicitar contrato após tipo
  const newOcc = {
    id,
    contract,
    type: type,
    phone: user.phone,
    status: 'Em análise',
    created: new Date().toLocaleString('pt-BR')
  };
  occurrences.push(newOcc);
  writeJSON(OCCURRENCES_FILE, occurrences);

  await bot.sendMessage(chatId,
    `✅ Tipo selecionado: ${type.replace('_',' ')}\n\n` +
    `📋 Clique no link abaixo para preencher o formulário:\n🔗 ${url}\n\n` +
    `⚠️ IMPORTANTE: Preencha todos os campos obrigatórios.\n` +
    `Após envio, sua ocorrência será registrada automaticamente.\n\n` +
    `Use /historico para ver suas ocorrências ou /status <número> para consultar por contrato.`
  );

  bot.answerCallbackQuery(query.id);
});

// Webhook
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
