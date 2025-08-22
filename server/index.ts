import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { handleMessage } from "../ruby-ai.ts";

const app = express();
const port = process.env.PORT || 10000;

// Pega o token da variável TELEGRAM_BOT_TOKEN
const token = process.env.TELEGRAM_BOT_TOKEN as string;
if (!token) {
  throw new Error("Telegram Bot Token not provided!");
}

// Cria o bot com webhook (modo Render)
const bot = new TelegramBot(token, { webHook: true });

// Define o webhook (Render fornece a URL)
const url = process.env.RENDER_EXTERNAL_URL || `https://localhost:${port}`;
bot.setWebHook(`${url}/bot${token}`);

// Endpoint para o Telegram enviar mensagens
app.use(express.json());
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Quando receber mensagem, chama o ruby-ai
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  const resposta = await handleMessage(text);
  bot.sendMessage(chatId, resposta);
});

app.listen(port, () => {
  console.log(`🚀 Servidor ouvindo na porta ${port}`);
});
