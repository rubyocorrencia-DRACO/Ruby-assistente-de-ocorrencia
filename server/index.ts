import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { processRubyMessage } from './ruby-ai';
import { v4 as uuidv4 } from 'uuid';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  polling: process.env.NODE_ENV === 'development',
  webHook: process.env.NODE_ENV === 'production',
});

const app = express();
app.use(express.json());

// Arquivos de dados
const USERS_FILE = path.join(__dirname, 'data/users.json');
const OCCURRENCES_FILE = path.join(__dirname, 'data/occurrences.json');

// Carrega JSON ou cria vazio
function loadJson(file: string) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveJson(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Função auxiliar
function formatDate(d: Date) {
  return d.toLocaleString('pt-BR');
}

// Verifica se o Telegram ID é master
function isMaster(chatId: number) {
  const masters = [parseInt(process.env.MASTER_ID || '0')];
  return masters.includes(chatId);
}

// Função principal de mensagens
async function handleMessage(msg: any) {
  const chatId = msg.chat.id;
  const text = msg.text?.trim() || '';

  console.log(`[${formatDate(new Date())}] Mensagem recebida: "${text}"`);

  const users = loadJson(USERS_FILE);
  const occurrences = loadJson(OCCURRENCES_FILE);

  // /start
  if (text.startsWith('/start')) {
    return bot.sendMessage(chatId,
      `🤖 Bem-vindo ao Ruby Ocorrências Bot!\n\n` +
      `Olá! 👋\n\n` +
      `📋 Comandos disponíveis:\n` +
      `• /login - Autenticar como técnico\n` +
      `• /ocorrencia - Registrar nova ocorrência\n` +
      `• /historico - Ver suas ocorrências\n` +
      `• /status <número> - Consultar por contrato\n` +
      `• /help - Mostrar ajuda\n\n` +
      `🔐 Para começar a usar, faça seu login com /login\n\n` +
      `Ruby Telecom - Sistema de Ocorrências`
    );
  }

  // /help
  if (text.startsWith('/help') || text.startsWith('/ajuda')) {
    return bot.sendMessage(chatId,
      `📖 Ajuda - Ruby Ocorrências Bot\n\n` +
      `🔹 Comandos Principais:\n` +
      `/start - Inicializar o bot\n` +
      `/login - Fazer login no sistema\n` +
      `/forcelogin - Limpar todos os dados do seu login\n` +
      `/logout - Sair do sistema\n` +
      `/ocorrencia - Registrar nova ocorrência\n` +
      `/historico - Ver suas ocorrências recentes\n` +
      `/status <número> - Consultar ocorrências por contrato\n\n` +
      `🔹 Tipos de Ocorrência:\n` +
      `• Rede Externa\n` +
      `• Rede Externa NAP GPON\n` +
      `• Backbone\n` +
      `• Backbone GPON\n\n` +
      `Ruby Telecom - Sistema de Ocorrências`
    );
  }

  // /login
  if (text.startsWith('/login')) {
    const arg = text.split(' ')[1];
    if (!arg) return bot.sendMessage(chatId, '🔐 Digite seu login após /login (ex: A123456)');

    let user = users.find((u: any) => u.telegramId === chatId);

    if (!user) {
      // Novo cadastro
      user = { telegramId: chatId, login: arg.toUpperCase(), step: 'nome' };
      users.push(user);
      saveJson(USERS_FILE, users);
      return bot.sendMessage(chatId, '👤 Digite seu nome completo:');
    } else {
      return bot.sendMessage(chatId, '✅ Login já registrado. Você pode usar /ocorrencia ou /historico.');
    }
  }

  // Cadastro passo a passo
  let user = users.find((u: any) => u.telegramId === chatId);
  if (user && user.step) {
    switch (user.step) {
      case 'nome':
        user.nome = text.toUpperCase();
        user.step = 'area';
        saveJson(USERS_FILE, users);
        return bot.sendMessage(chatId, '🏢 Digite sua área de atuação:');
      case 'area':
        user.area = text.toUpperCase();
        user.step = 'telefone';
        saveJson(USERS_FILE, users);
        return bot.sendMessage(chatId, '📱 Digite seu telefone:');
      case 'telefone':
        user.telefone = text;
        user.step = 'confirmar';
        saveJson(USERS_FILE, users);
        return bot.sendMessage(chatId,
          `📋 Confirme seus dados:\n\n` +
          `🔐 Login: ${user.login}\n` +
          `👤 Nome: ${user.nome}\n` +
          `🏢 Área: ${user.area}\n` +
          `📱 Telefone: ${user.telefone}\n\n` +
          `Digite CONFIRMAR para finalizar ou CANCELAR para reiniciar.`
        );
      case 'confirmar':
        if (text.toUpperCase() === 'CONFIRMAR') {
          delete user.step;
          saveJson(USERS_FILE, users);
          return bot.sendMessage(chatId, `✅ Login realizado com sucesso! Bem-vindo, ${user.nome}`);
        } else if (text.toUpperCase() === 'CANCELAR') {
          users.splice(users.indexOf(user), 1);
          saveJson(USERS_FILE, users);
          return bot.sendMessage(chatId, '❌ Cadastro cancelado. Use /login para reiniciar.');
        } else {
          return bot.sendMessage(chatId, 'Digite CONFIRMAR ou CANCELAR.');
        }
    }
    return;
  }

  // /forcelogin
  if (text.startsWith('/forcelogin')) {
    const idx = users.findIndex((u: any) => u.telegramId === chatId);
    if (idx >= 0) users.splice(idx, 1);
    saveJson(USERS_FILE, users);
    return bot.sendMessage(chatId, '✅ Seus dados foram limpos. Use /login para registrar novo login.');
  }

  // /setmaster - só você autoriza
  if (text.startsWith('/setmaster')) {
    if (chatId.toString() === process.env.ADMIN_ID) {
      const arg = text.split(' ')[1];
      if (!arg) return bot.sendMessage(chatId, 'Digite o Telegram ID do usuário para tornar master.');
      const targetId = parseInt(arg);
      const userTarget = users.find((u: any) => u.telegramId === targetId);
      if (!userTarget) return bot.sendMessage(chatId, 'Usuário não encontrado.');
      userTarget.master = true;
      saveJson(USERS_FILE, users);
      return bot.sendMessage(chatId, `✅ Usuário ${userTarget.nome} agora é master.`);
    } else {
      return bot.sendMessage(chatId, '❌ Você não tem autorização.');
    }
  }

  // /clearuser - só master
  if (text.startsWith('/clearuser')) {
    if (!isMaster(chatId)) return bot.sendMessage(chatId, '❌ Você não é master.');
    const arg = text.split(' ')[1];
    if (!arg) return bot.sendMessage(chatId, 'Digite o login do usuário a ser removido.');
    const idx = users.findIndex((u: any) => u.login === arg.toUpperCase());
    if (idx < 0) return bot.sendMessage(chatId, 'Usuário não encontrado.');
    const userTarget = users[idx];
    // Remove usuário e suas ocorrências
    users.splice(idx, 1);
    const updatedOccurrences = occurrences.filter((o: any) => o.telegramId !== userTarget.telegramId);
    saveJson(USERS_FILE, users);
    saveJson(OCCURRENCES_FILE, updatedOccurrences);
    return bot.sendMessage(chatId, `✅ Usuário ${userTarget.nome} e seu histórico removidos.`);
  }

  // RUBY AI - mensagens naturais
  if (text.toLowerCase().includes('ruby')) {
    try {
      const response = await processRubyMessage(text);
      return bot.sendMessage(chatId, response.message, response.options || {});
    } catch (e) {
      console.error(e);
      return bot.sendMessage(chatId, '❌ Erro ao processar sua mensagem.');
    }
  }

  // Mensagens padrão
  return bot.sendMessage(chatId,
    '🤖 Use /help para ver os comandos disponíveis.'
  );
}

// Callback de botões de ocorrência
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;

  const forms: Record<string, string> = {
    rede_externa: 'https://redeexterna.fillout.com/t/g56SBKiZALus',
    rede_externa_gpon: 'https://redeexterna.fillout.com/t/6VTMJST5NMus',
    backbone: 'https://redeexterna.fillout.com/t/7zfWL9BKM6us',
    backbone_gpon: 'https://redeexterna.fillout.com/t/atLL2dekh3us',
  };

  const tipoMap: Record<string, string> = {
    rede_externa: 'Rede Externa',
    rede_externa_gpon: 'Rede Externa NAP GPON',
    backbone: 'Backbone',
    backbone_gpon: 'Backbone GPON',
  };

  const formLink = forms[query.data as keyof typeof forms];
  const tipo = tipoMap[query.data as keyof typeof tipoMap];

  if (formLink) {
    await bot.sendMessage(chatId,
      `✅ Tipo selecionado: ${tipo}\n\n` +
      `📋 Clique no link abaixo para preencher o formulário:\n\n` +
      `🔗 ${formLink}\n\n` +
      `⚠️ Preencha todos os campos obrigatórios. Use /historico para ver suas ocorrências ou /status <número> para consultar por contrato.`
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
    console.log(`[${formatDate(new Date())}] 🚀 Server running on port ${port}`);
    try {
      await bot.setWebHook(`${url}/webhook/${process.env.TELEGRAM_BOT_TOKEN}`);
      console.log(`[${formatDate(new Date())}] ✅ Webhook configurado: ${url}`);
    } catch (error) {
      console.error('❌ Erro ao configurar webhook:', error);
    }
  });
} else {
  console.log(`[${formatDate(new Date())}] 🔄 Bot em modo desenvolvimento (polling)`);
}

console.log(`[${formatDate(new Date())}] 🤖 Ruby AI Bot inicializado!`);
