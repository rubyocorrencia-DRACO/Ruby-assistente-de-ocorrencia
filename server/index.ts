import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import * as Commands from './commands';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  polling: process.env.NODE_ENV === 'development',
  webHook: process.env.NODE_ENV === 'production'
});

const app = express();
app.use(express.json());

// Estado temporário de login por telegramId
const loginStates: Record<number, 'waitingLogin' | 'waitingName' | 'waitingArea' | 'waitingPhone' | 'confirmed'> = {};
const tempUserData: Record<number, Partial<Commands.User>> = {};

// ---------- HANDLER DE MENSAGENS ---------- //

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text) return;

  const user = Commands.getUser(chatId);

  // ---- COMANDOS INICIAIS ---- //
  if (text === '/start') {
    return bot.sendMessage(chatId,
      `🤖 Bem-vindo ao Ruby Ocorrências Bot!\n\n` +
      `Olá! 👋\n\n` +
      `Este bot foi desenvolvido para facilitar o registro de ocorrências técnicas em campo.\n\n` +
      `📋 Comandos disponíveis:\n` +
      `• /login - Autenticar como técnico\n` +
      `• /ocorrencia - Registrar nova ocorrência\n` +
      `• /historico - Ver suas ocorrências\n` +
      `• /status <número> - Consultar por contrato\n` +
      `• /help - Mostrar esta ajuda\n\n` +
      `🔐 Para começar a usar, faça o login com /login\n\n` +
      `Ruby Telecom - Sistema de Ocorrências`
    );
  }

  if (text === '/help' || text === '/ajuda') {
    return bot.sendMessage(chatId, Commands.getHelpMessage());
  }

  // ---- LOGIN / CADASTRO ---- //
  if (text.startsWith('/login')) {
    if (user) {
      return bot.sendMessage(chatId, `✅ Você já está logado como ${user.name}`);
    }
    loginStates[chatId] = 'waitingLogin';
    return bot.sendMessage(chatId, `🔐 Digite seu login (Ex: A123456):`);
  }

  if (loginStates[chatId] === 'waitingLogin') {
    tempUserData[chatId] = { telegramId: chatId, login: text.toUpperCase() };
    loginStates[chatId] = 'waitingName';
    return bot.sendMessage(chatId, `👤 Digite seu nome completo:`);
  }

  if (loginStates[chatId] === 'waitingName') {
    tempUserData[chatId]!.name = text.toUpperCase();
    loginStates[chatId] = 'waitingArea';
    return bot.sendMessage(chatId, `🏢 Agora digite sua área de atuação:`);
  }

  if (loginStates[chatId] === 'waitingArea') {
    tempUserData[chatId]!.area = text.toUpperCase();
    loginStates[chatId] = 'waitingPhone';
    return bot.sendMessage(chatId, `📱 Agora digite seu número de telefone:`);
  }

  if (loginStates[chatId] === 'waitingPhone') {
    tempUserData[chatId]!.phone = text;
    loginStates[chatId] = 'confirmed';
    const u = tempUserData[chatId] as Commands.User;
    Commands.addUser(u);
    delete tempUserData[chatId];
    delete loginStates[chatId];
    return bot.sendMessage(chatId, `✅ Login realizado com sucesso!\nBem-vindo, ${u.name}`);
  }

  // ---- OCORRÊNCIA ---- //
  if (text.startsWith('/ocorrencia')) {
    if (!user) return bot.sendMessage(chatId, `⚠️ Você precisa fazer login primeiro com /login`);
    const keyboard = {
      inline_keyboard: Object.keys(Commands.occurrenceForms).map(type => [{ text: type, callback_data: type }])
    };
    return bot.sendMessage(chatId, `🔧 Selecione o tipo de ocorrência:`, { reply_markup: keyboard });
  }

  // ---- HISTÓRICO ---- //
  if (text.startsWith('/historico')) {
    if (!user) return bot.sendMessage(chatId, `⚠️ Você precisa fazer login primeiro com /login`);
    const occs = Commands.getOccurrencesByUser(chatId);
    return bot.sendMessage(chatId, `📋 Histórico de Ocorrências - ${user.name}\n\n${Commands.formatOccurrencesList(occs)}`);
  }

  // ---- STATUS ---- //
  if (text.startsWith('/status')) {
    const parts = text.split(' ');
    if (parts.length < 2) return bot.sendMessage(chatId, `⚠️ Use /status <número do contrato>`);
    const contract = parts[1];
    const occs = Commands.getOccurrencesByContract(contract);
    return bot.sendMessage(chatId, `📋 Status do contrato ${contract}\n\n${Commands.formatOccurrencesList(occs)}`);
  }
});

// ---- CALLBACK DOS BOTÕES ---- //

bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId || !query.data) return;

  const type = query.data;
  const formLink = Commands.occurrenceForms[type];
  if (!formLink) return;

  // Criar ocorrência temporária com ID
  const user = Commands.getUser(chatId);
  if (!user) return bot.sendMessage(chatId, `⚠️ Você precisa fazer login primeiro com /login`);

  const occurrence = Commands.createOccurrence(chatId, '000000', type); // contrato será preenchido no formulário real

  // Enviar mensagem de ocorrência e apagar depois para não poluir
  const msg = await bot.sendMessage(chatId,
    `✅ Tipo selecionado: ${type}\n\n📋 Clique no link abaixo para preencher o formulário:\n🔗 ${formLink}\n\n⚠️ Após enviar, sua ocorrência será registrada automaticamente.\nUse /historico para ver suas ocorrências ou /status <número> para consultar por contrato.`
  );

  setTimeout(() => {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
  }, 15000); // apaga após 15 segundos

  bot.answerCallbackQuery(query.id);
});

// ---- WEBHOOK PARA PRODUÇÃO ---- //
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
