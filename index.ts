import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { handleRubyAI } from "./ruby-ai.js";
import { registerCommand, handleCommand } from "./commands.js";

// Corrige __dirname em ambiente ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório onde ficam os arquivos JSON
const DATA_DIR = path.join(__dirname, "data");

// Garante que a pasta data existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Inicializa servidor
const app = express();
app.use(bodyParser.json());

// Rota principal do bot
app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.message || "";
    const chatId = req.body.chatId || "";

    let response;

    if (message.startsWith("/")) {
      response = await handleCommand(message, chatId);
    } else {
      response = await handleRubyAI(message, chatId);
    }

    res.json({ reply: response });
  } catch (err) {
    console.error("Erro no webhook:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota de status
app.get("/", (req, res) => {
  res.send("Ruby Bot está rodando ✅");
});

// Porta do Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
