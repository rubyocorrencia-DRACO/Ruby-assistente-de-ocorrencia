// server/index.ts
import TelegramBot from "node-telegram-bot-api";
import express from "express";
import bodyParser from "body-parser";
import { processRubyMessage } from "./ruby-ai.js";

const token = process.env.BOT_TOKEN!;
const url = process.env.RENDER_EXTERNAL_URL!; // URL pública do Render
const port = process.env.PORT || 3000;

const bot = new TelegramBot(token, { webHook: { port: Number(port) } });

// Define webhook no endpoint do Render
bot.setWebHook(`${url}/webhook`);

// Express app
const app = express();
app.use(bodyParser.json());

// Rota de saúde
app.get("/", (req, res) => {
  res.send("✅ Ruby Bot rodando via webhook!");
});

// Endpoint que o Telegram vai chamar
app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Lógica principal do bot
bot.on("message", async (msg) => {
  if (!msg.text) return;
  const chatId = msg.chat.id;

  try {
    const response = await processRubyMessage(msg.text);
    await bot.sendMessage(chatId, response.message, response.options);
  } catch (err) {
    console.error("Erro ao processar mensagem:", err);
    await bot.sendMessage(chatId, "⚠️ Ocorreu um erro interno. Tente novamente.");
  }
});

// Start manual caso o webhook não dispare
app.listen(port, () => {
  console.log(`🚀 Servidor ouvindo na porta ${port}`);
});
