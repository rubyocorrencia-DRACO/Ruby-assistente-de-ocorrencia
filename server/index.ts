// server/index.ts
import TelegramBot, { SendMessageOptions } from 'node-telegram-bot-api';
import path from 'path';
import fs from 'fs';
import { processRubyMessage } from './ruby-ai.ts'; // Caminho corrigido
import { fileURLToPath } from 'url';

// Ajuste para __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pasta para armazenar dados
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const OCCURRENCES_FILE = path.join(DATA_DIR, 'occurrences.json');

// Certifique-se de ter a variável de ambiente com seu token
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  throw new Error('Telegram Bot Token não fornecido! Defina a variável de ambiente TELEGRAM_BOT_TOKEN.');
}

// Inicializa o bot
const bot = new TelegramBot(TOKEN, { polling: true });
console.log('🚀 Servidor Ruby Bot iniciado!');

// Função para ler JSON
function readJSON(file: string) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

// Função para escrever JSON
function writeJSON(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Handlers principais
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  // Verifica se é comando
  if (text.startsWith('/')) {
    switch (true) {
      case text === '/start':
        bot.sendMessage(chatId, 'Olá! Eu sou a Ruby, seu assistente de ocorrências. Use /help para ver os comandos.');
        break;

      case text === '/help':
        bot.sendMessage(chatId,
          `📖 Comandos disponíveis:\n` +
          `/start - Iniciar o bot\n` +
          `/login - Autenticar técnico\n` +
          `/forcelogin - Limpar todos os dados (apenas admins)\n` +
          `/logout - Sair do sistema\n` +
          `/ocorrencia - Registrar nova ocorrência\n` +
          `/historico - Ver ocorrências recentes\n` +
          `/status <número> - Consultar contrato\n` +
          `/whoami - Ver usuário atual`
        );
        break;

      default:
        bot.sendMessage(chatId, 'Comando não reconhecido. Use /help para ver os comandos disponíveis.');
        break;
    }
    return;
  }

  // Processa mensagens normais via Ruby AI
  const response = await processRubyMessage(text);
  bot.sendMessage(chatId, response.message, response.options);
});

