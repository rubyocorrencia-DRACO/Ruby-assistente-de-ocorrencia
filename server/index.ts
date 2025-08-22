import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { processRubyMessage } from "./ruby-ai";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error("⚠️ TELEGRAM_BOT_TOKEN não definido nas variáveis de ambiente!");
}

// Inicializa o bot do Telegram com polling
const bot = new TelegramBot(token, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  try {
    const response = await processRubyMessage(text);
    await bot.sendMessage(chatId, response);
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    await bot.sendMessage(chatId, "⚠️ Ocorreu um erro ao processar sua mensagem.");
  }
});

// 🚀 Servidor Express apenas para manter o serviço ativo no Render
const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (_, res) => {
  res.send("🤖 Bot Ruby rodando com sucesso no Render!");
});

app.listen(PORT, () => {
  console.log(`✅ Servidor web ativo na porta ${PORT}`);
});
