// server/index.ts
import TelegramBot, { SendMessageOptions } from 'node-telegram-bot-api';
import path from 'path';
import fs from 'fs';
import { processRubyMessage } from './ruby-ai.js';

// Pega token do ambiente
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  throw new Error('Telegram Bot Token não fornecido! Configure TELEGRAM_BOT_TOKEN nas variáveis de ambiente.');
}

// Cria instância do bot
const bot = new TelegramBot(botToken, { polling: true });

// Define diretório de dados
const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const usersFile = path.join(DATA_DIR, 'users.json');
const occurrencesFile = path.join(DATA_DIR, 'occurrences.json');

// Função auxiliar para ler JSON
function readJSON(filePath: string) {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

// Função auxiliar para salvar JSON
function saveJSON(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Comandos básicos do bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Olá! 🤖 Eu sou a Ruby, seu assistente de ocorrências.\nUse /help para ver os comandos.');
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `📖 Comandos disponíveis:\n` +
      `/start - Iniciar o bot\n` +
      `/login - Autenticar técnico\n` +
      `/ocorrencia - Registrar nova ocorrência\n` +
      `/historico - Ver ocorrências recentes\n` +
      `/status <número> - Consultar contrato`
  );
});

// Registrar ocorrência
bot.onText(/\/ocorrencia/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Digite a descrição da ocorrência:');
});

// Histórico de ocorrências
bot.onText(/\/historico/, (msg) => {
  const chatId = msg.chat.id;
  const occurrences = readJSON(occurrencesFile);
  if (!occurrences.length) {
    bot.sendMessage(chatId, 'Nenhuma ocorrência registrada ainda.');
    return;
  }
  const list = occurrences.map((o: any, i: number) => `${i + 1}. ${o.description}`).join('\n');
  bot.sendMessage(chatId, `📄 Histórico de ocorrências:\n${list}`);
});

// Mensagens genéricas processadas pelo Ruby AI
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  // Ignora comandos que já são tratados
  if (msg.text?.startsWith('/')) return;

  const response = await processRubyMessage(msg.text || '');
  const options: SendMessageOptions = response.options || {};
  bot.sendMessage(chatId, response.message, options);
});

console.log('🚀 Bot Ruby iniciado com sucesso na porta do Telegram!');
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

