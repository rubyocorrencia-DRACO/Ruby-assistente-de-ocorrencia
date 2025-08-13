import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import { 
  findUserByTelegramId, 
  loadUsers, 
  saveUsers, 
  createOccurrence, 
  getUserHistory, 
  getStatusByContract,
  User
} from './commands';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { 
  polling: process.env.NODE_ENV === 'development',
  webHook: process.env.NODE_ENV === 'production'
});

const app = express();
app.use(express.json());

// -------------------------
// Função principal de mensagens
// -------------------------
async function handleMessage(msg: any) {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text) return;

  // -------------------------
  // /start
  // -------------------------
  if (text.startsWith('/start')) {
    return bot.sendMessage(chatId, 
      `🤖 Bem-vindo ao Ruby Ocorrências Bot!\n\nOlá! 👋\n\n` +
      `📋 Comandos disponíveis:\n` +
      `• /login - Autenticar como técnico\n` +
      `• /ocorrencia - Registrar nova ocorrência\n` +
      `• /historico - Ver suas ocorrências\n` +
      `• /status <número> - Consultar por contrato\n` +
      `• /help - Mostrar ajuda\n\n` +
      `🔐 Para começar, faça seu login com /login\n\n` +
      `Ruby Telecom - Sistema de Ocorrências`
    );
  }

  // -------------------------
  // /help ou /ajuda
  // -------------------------
  if (text.startsWith('/help') || text.startsWith('/ajuda')) {
    return bot.sendMessage(chatId, 
      `📖 Ajuda - Ruby Ocorrências Bot\n\n` +
      `🔹 Comandos Principais:\n` +
      `/start - Inicializar o bot\n` +
      `/login - Fazer login no sistema\n` +
      `/forcelogin - Forçar novo login (limpar dados)\n` +
      `/logout - Sair do sistema\n` +
      `/ocorrencia - Registrar nova ocorrência\n` +
      `/historico - Ver suas ocorrências recentes\n` +
      `/status <número> - Consultar ocorrências por contrato\n\n` +
      `🔹 Tipos de Ocorrência:\n` +
      `• Rede Externa\n• Rede Externa NAP GPON\n• Backbone\n• Backbone GPON\n\n` +
      `Ruby Telecom - Sistema de Ocorrências`
    );
  }

  // -------------------------
  // /login - autenticação e cadastro passo a passo
  // -------------------------
  if (text.startsWith('/login')) {
    const users = loadUsers();
    const args = text.split(' ');
    const loginCode = args[1];

    if (!loginCode) {
      return bot.sendMessage(chatId, '🔐 Digite seu login (ex: A123456)');
    }

    let user = users.find(u => u.login === loginCode);

    if (!user) {
      // Cadastro passo a passo
      return startUserRegistration(chatId, loginCode);
    }

    // Usuário já cadastrado
    bot.sendMessage(chatId, `✅ Login realizado com sucesso!\nBem-vindo, ${user.name}`);
    return;
  }

  // -------------------------
  // /ocorrencia
  // -------------------------
  if (text.startsWith('/ocorrencia')) {
    const keyboard = {
      inline_keyboard: [
        [{ text: 'Rede Externa', callback_data: 'Rede Externa' }],
        [{ text: 'Rede Externa NAP GPON', callback_data: 'Rede Externa NAP GPON' }],
        [{ text: 'Backbone', callback_data: 'Backbone' }],
        [{ text: 'Backbone GPON', callback_data: 'Backbone GPON' }]
      ]
    };
    return bot.sendMessage(chatId, '🔧 Selecione o tipo de ocorrência:', { reply_markup: keyboard });
  }

  // -------------------------
  // /historico
  // -------------------------
  if (text.startsWith('/historico')) {
    const user = findUserByTelegramId(chatId);
    if (!user) return bot.sendMessage(chatId, '❌ Você precisa fazer login primeiro com /login');

    const history = getUserHistory(chatId);
    if (history.length === 0) return bot.sendMessage(chatId, '📋 Nenhuma ocorrência nos últimos 30 dias.');

    let msg = `📋 Histórico de Ocorrências - ${user.name}\n\n`;
    history.forEach(o => {
      msg += `🔹 ID ${o.id}\n📄 CONTRATO: ${o.contract}\n🔧 Tipo: ${o.type}\n⏰ Criado: ${new Date(o.createdAt).toLocaleString()}\n📊 Status: ${o.status}\n\n`;
    });

    return bot.sendMessage(chatId, msg);
  }

  // -------------------------
  // /status <contrato>
  // -------------------------
  if (text.startsWith('/status')) {
    const parts = text.split(' ');
    const contract = parts[1];
    if (!contract) return bot.sendMessage(chatId, '❌ Digite /status <número do contrato>');

    const statusList = getStatusByContract(contract);
    if (statusList.length === 0) return bot.sendMessage(chatId, '📋 Nenhuma ocorrência encontrada para esse contrato.');

    let msg = `📋 Status do contrato ${contract}\n\n`;
    statusList.forEach(o => {
      msg += `🔹 ID ${o.id}\n🔧 Tipo: ${o.type}\n⏰ Criado: ${new Date(o.createdAt).toLocaleString()}\n📊 Status: ${o.status}\n\n`;
    });

    return bot.sendMessage(chatId, msg);
  }

  // -------------------------
  // Mensagem padrão
  // -------------------------
  bot.sendMessage(chatId, '🤖 Use /help para ver os comandos disponíveis.');
}

// -------------------------
// Callback de botões de ocorrência
// -------------------------
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;

  const type = query.data;
  const formLinks: Record<string, string> = {
    'Rede Externa': 'https://redeexterna.fillout.com/t/g56SBKiZALus',
    'Rede Externa NAP GPON': 'https://redeexterna.fillout.com/t/6VTMJST5NMus',
    'Backbone': 'https://redeexterna.fillout.com/t/7zfWL9BKM6us',
    'Backbone GPON': 'https://redeexterna.fillout.com/t/atLL2dekh3us'
  };

  const link = formLinks[type];
  if (!link) return;

  await bot.sendMessage(chatId,
    `✅ Tipo selecionado: ${type}\n\n` +
    `📋 Clique no link abaixo para preencher o formulário:\n\n🔗 ${type}\n\n` +
    `⚠️ Após preencher, sua ocorrência será registrada automaticamente.\n` +
    `Use /historico para ver suas ocorrências ou /status <número> para consultar por contrato.`
  );

  bot.answerCallbackQuery(query.id);
});

// -------------------------
// Listener principal
// -------------------------
bot.on('message', handleMessage);

// -------------------------
// Webhook para produção
// -------------------------
if (process.env.NODE_ENV === 'production') {
  const port = process.env.PORT || 3000;
  const url = process.env.RENDER_EXTERNAL_URL || `https://ruby-ocorrencias-bot.onrender.com`;
  
  app.post(`/webhook/${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
  
  app.listen(port, async () => {
    console.log(`[${new Date().toLocaleString()}] 🚀 Server running on port ${port}`);
    try {
      await bot.setWebHook(`${url}/webhook/${process.env.TELEGRAM_BOT_TOKEN}`);
      console.log(`[${new Date().toLocaleString()}] ✅ Webhook configurado: ${url}`);
    } catch (error) {
      console.error('❌ Erro ao configurar webhook:', error);
    }
  });
} else {
  console.log(`[${new Date().toLocaleString()}] 🔄 Bot em modo desenvolvimento (polling)`);
}

console.log(`[${new Date().toLocaleString()}] 🤖 Ruby Ocorrências Bot inicializado!`);


// -------------------------
// Função de cadastro passo a passo
// -------------------------
function startUserRegistration(chatId: number, loginCode: string) {
  const registration: Partial<User> = { login: loginCode, telegramId: chatId };
  bot.sendMessage(chatId, `🔐 Primeiro Acesso - Cadastro Obrigatório\nDigite seu nome completo:`);

  const listener = (msg: any) => {
    if (msg.chat.id !== chatId) return;

    if (!registration.name) {
      registration.name = msg.text.toUpperCase();
      bot.sendMessage(chatId, `✅ Nome registrado: ${registration.name}\nAgora digite sua área de atuação:`);
      return;
    }

    if (!registration.area) {
      registration.area = msg.text.toUpperCase();
      bot.sendMessage(chatId, `✅ Área registrada: ${registration.area}\nAgora digite seu número de telefone:`);
      return;
    }

    if (!registration.phone) {
      registration.phone = msg.text;
      bot.sendMessage(chatId,
        `📋 Confirme seus dados:\n\n🔐 Login: ${registration.login}\n👤 Nome: ${registration.name}\n🏢 Área: ${registration.area}\n📱 Telefone: ${registration.phone}\n\n✅ Digite CONFIRMAR para finalizar ou CANCELAR para recomeçar`
      );
      return;
    }

    if (msg.text.toUpperCase() === 'CONFIRMAR') {
      const users = loadUsers();
      users.push(registration as User);
      saveUsers(users);
      bot.sendMessage(chatId, `✅ Login realizado com sucesso!\nBem-vindo, ${registration.name}`);
      bot.removeListener('message', listener);
      return;
    }

    if (msg.text.toUpperCase() === 'CANCELAR') {
      bot.sendMessage(chatId, '❌ Cadastro cancelado. Use /login para tentar novamente.');
      bot.removeListener('message', listener);
      return;
    }
  };

  bot.on('message', listener);
}
