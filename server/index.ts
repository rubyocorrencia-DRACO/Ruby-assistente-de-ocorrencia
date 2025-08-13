import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { processRubyMessage } from './ruby-ai';

const USERS_FILE = path.join(__dirname, 'data/users.json');
const OCCURRENCES_FILE = path.join(__dirname, 'data/occurrences.json');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { 
  polling: process.env.NODE_ENV === 'development',
  webHook: process.env.NODE_ENV === 'production'
});

const app = express();
app.use(express.json());

// ---------- UTILITÁRIOS ----------
const loadJSON = (filePath: string) => {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

const saveJSON = (filePath: string, data: any) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const generateId = () => Math.random().toString(36).substring(2, 10).toUpperCase();

// ---------- ADMINS ----------
const MAIN_ADMIN_PHONE = '+5519999789879';
let admins: string[] = [MAIN_ADMIN_PHONE]; // números de telefone

const isAdmin = (phone: string) => admins.includes(phone);

// ---------- HANDLER PRINCIPAL ----------
async function handleMessage(msg: any) {
  const chatId = msg.chat.id;
  const text = msg.text?.trim() || '';

  console.log(`[${new Date().toLocaleString('pt-BR')}] Mensagem recebida: "${text}"`);

  const users = loadJSON(USERS_FILE);
  const occurrences = loadJSON(OCCURRENCES_FILE);

  // ---------- /start ----------
  if (text === '/start') {
    return bot.sendMessage(chatId, 
      `🤖 Bem-vindo ao Ruby Ocorrências Bot!\n\n` +
      `Olá! 👋\n\n` +
      `📋 Comandos disponíveis:\n` +
      `• /login - Autenticar como técnico\n` +
      `• /ocorrencia - Registrar nova ocorrência\n` +
      `• /historico - Ver suas ocorrências\n` +
      `• /status <número> - Consultar por contrato\n` +
      `• /help - Mostrar ajuda\n\n` +
      `🔐 Para começar, faça seu login com o comando /login\n\n` +
      `Ruby Telecom - Sistema de Ocorrências`
    );
  }

  // ---------- /help ----------
  if (text === '/help' || text === '/ajuda') {
    return bot.sendMessage(chatId,
      `📖 Ajuda - Ruby Ocorrências Bot\n\n` +
      `🔹 Comandos Principais:\n` +
      `/start - Inicializar o bot\n` +
      `/login - Fazer login no sistema\n` +
      `/forcelogin - Limpar todos os dados (admin)\n` +
      `/logout - Sair do sistema\n` +
      `/ocorrencia - Registrar nova ocorrência\n` +
      `/historico - Ver suas ocorrências recentes\n` +
      `/status <número> - Consultar ocorrências por contrato\n\n` +
      `🔹 Como usar:\n` +
      `1️⃣ /login → autenticar\n` +
      `2️⃣ /ocorrencia → registrar ocorrências\n` +
      `3️⃣ Escolha tipo e preencha formulário\n` +
      `4️⃣ /historico → ver ocorrências\n` +
      `5️⃣ /status <contrato> → consultar\n\n` +
      `🔹 Tipos de Ocorrência:\n` +
      `• Rede Externa\n• Rede Externa NAP GPON\n• Backbone\n• Backbone GPON\n\n` +
      `📞 Suporte: Entre em contato com a administração`
    );
  }

  // ---------- /login ----------
  if (text.startsWith('/login')) {
    const args = text.split(' ')[1];
    if (!args) {
      return bot.sendMessage(chatId, '🔐 Digite seu login no formato: A123456');
    }

    const phone = args; // aqui usamos login como número de celular
    let user = users.find(u => u.phone === phone);

    if (!user) {
      // cadastro obrigatório
      users.push({ phone, name: '', area: '', chatId, isLogged: false });
      saveJSON(USERS_FILE, users);
      return bot.sendMessage(chatId,
        `🔐 Primeiro acesso - cadastro obrigatório\n\n` +
        `Olá! Seu login ${phone} não foi encontrado.\n` +
        `Digite seu nome completo:`
      );
    }

    user.isLogged = true;
    saveJSON(USERS_FILE, users);

    return bot.sendMessage(chatId, `✅ Login realizado com sucesso!\nBem-vindo, ${user.name || 'Técnico'}`);
  }

  // ---------- /logout ----------
  if (text === '/logout') {
    const user = users.find(u => u.chatId === chatId);
    if (user) {
      user.isLogged = false;
      saveJSON(USERS_FILE, users);
      return bot.sendMessage(chatId, `✅ Logout realizado com sucesso!`);
    }
    return bot.sendMessage(chatId, `⚠️ Nenhum usuário logado.`);
  }

  // ---------- /forcelogin ----------
  if (text === '/forcelogin') {
    const user = users.find(u => u.chatId === chatId);
    if (!user || !isAdmin(user.phone)) {
      return bot.sendMessage(chatId, `❌ Comando restrito a administradores.`);
    }

    // limpa todos os logins
    users.forEach(u => u.isLogged = false);
    saveJSON(USERS_FILE, users);

    return bot.sendMessage(chatId, `✅ Todos os logins foram limpos.`);
  }

  // ---------- /clearlogin ----------
  if (text.startsWith('/clearlogin')) {
    const user = users.find(u => u.chatId === chatId);
    if (!user || !isAdmin(user.phone)) {
      return bot.sendMessage(chatId, `❌ Comando restrito a administradores.`);
    }

    const args = text.split(' ')[1];
    if (!args) return bot.sendMessage(chatId, `❌ Use: /clearlogin <celular>`);

    const index = users.findIndex(u => u.phone === args);
    if (index === -1) return bot.sendMessage(chatId, `❌ Usuário não encontrado.`);

    users.splice(index, 1);
    saveJSON(USERS_FILE, users);
    return bot.sendMessage(chatId, `✅ Usuário e histórico apagados com sucesso.`);
  }

  // ---------- /historico ----------
  if (text.startsWith('/historico')) {
    const user = users.find(u => u.chatId === chatId);
    if (!user) return bot.sendMessage(chatId, `⚠️ Faça login primeiro.`);

    const recent = occurrences
      .filter(o => o.phone === user.phone)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (recent.length === 0) return bot.sendMessage(chatId, `📋 Nenhuma ocorrência encontrada.`);

    let message = `📋 Histórico de Ocorrências - ${user.name}\n\n`;
    recent.forEach(o => {
      message += `🔹 ID ${o.id}\n📄 CONTRATO: ${o.contract}\n🔧 Tipo: ${o.type}\n⏰ Criado: ${o.createdAt}\n📊 Status: ${o.status}\n\n`;
    });

    return bot.sendMessage(chatId, message);
  }

  // ---------- /status ----------
  if (text.startsWith('/status')) {
    const args = text.split(' ')[1];
    if (!args) return bot.sendMessage(chatId, `⚠️ Use: /status <contrato>`);

    const found = occurrences.filter(o => o.contract === args);
    if (found.length === 0) return bot.sendMessage(chatId, `⚠️ Nenhuma ocorrência encontrada para este contrato.`);

    let message = `📋 Status do contrato ${args}:\n\n`;
    found.forEach(o => {
      message += `🔹 ID ${o.id}\n🔧 Tipo: ${o.type}\n⏰ Criado: ${o.createdAt}\n📊 Status: ${o.status}\n\n`;
    });

    return bot.sendMessage(chatId, message);
  }

  // ---------- /ocorrencia ----------
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

  // ---------- MENSAGENS NATURAIS COM RUBY ----------
  if (text.toLowerCase().includes('ruby')) {
    try {
      const response = await processRubyMessage(text);
      return bot.sendMessage(chatId, response.message, response.options || {});
    } catch (err) {
      console.error(err);
      return bot.sendMessage(chatId, `❌ Erro ao processar mensagem.`);
    }
  }

  // ---------- PADRÃO ----------
  bot.sendMessage(chatId, `🤖 Não entendi. Use /help para ver os comandos disponíveis.`);
}

// ---------- CALLBACK DOS BOTÕES ----------
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;

  const links: Record<string, string> = {
    rede_externa: 'https://redeexterna.fillout.com/t/g56SBKiZALus',
    rede_externa_gpon: 'https://redeexterna.fillout.com/t/6VTMJST5NMus',
    backbone: 'https://redeexterna.fillout.com/t/7zfWL9BKM6us',
    backbone_gpon: 'https://redeexterna.fillout.com/t/atLL2dekh3us'
  };

  const types: Record<string, string> = {
    rede_externa: 'Rede Externa',
    rede_externa_gpon: 'Rede Externa NAP GPON',
    backbone: 'Backbone',
    backbone_gpon: 'Backbone GPON'
  };

  const type = types[query.data as keyof typeof types];
  const link = links[query.data as keyof typeof links];
  if (!link) return;

  const occurrences = loadJSON(OCCURRENCES_FILE);
  const users = loadJSON(USERS_FILE);
  const user = users.find(u => u.chatId === chatId);
  if (!user) return;

  const newOccurrence = {
    id: generateId(),
    phone: user.phone,
    contract: 'XXXXXX', // poderia pedir ao usuário digitar
    type,
    createdAt: new Date().toLocaleString('pt-BR'),
    status: 'Em análise'
  };
  occurrences.push(newOccurrence);
  saveJSON(OCCURRENCES_FILE, occurrences);

  const keyboard = { inline_keyboard: [[{ text: '📝 Abrir Formulário', url: link }]] };
  await bot.sendMessage(chatId, `✅ Tipo selecionado: ${type}\n\n📋 Clique no link abaixo para preencher o formulário:`, { reply_markup: keyboard });
  bot.answerCallbackQuery(query.id);
});

// ---------- LISTENER ----------
bot.on('message', handleMessage);

// ---------- WEBHOOK PRODUÇÃO ----------
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
