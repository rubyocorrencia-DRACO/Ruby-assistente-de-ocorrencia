import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Corrige __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminhos dos arquivos JSON
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const OCCURRENCES_FILE = path.join(DATA_DIR, "occurrences.json");

// Garante que arquivos existam
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]", "utf-8");
if (!fs.existsSync(OCCURRENCES_FILE)) fs.writeFileSync(OCCURRENCES_FILE, "[]", "utf-8");

// Lê arquivo JSON
function readJson(file: string) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

// Salva arquivo JSON
function writeJson(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

// ----- REGISTRO DE COMANDOS -----
const commands: Record<string, Function> = {};

// Registra novo comando
export function registerCommand(name: string, callback: Function) {
  commands[name] = callback;
}

// Executa comando
export async function handleCommand(message: string, chatId: string) {
  const [cmd, ...args] = message.trim().split(" ");
  const command = commands[cmd];

  if (command) {
    return await command(chatId, args);
  }
  return `❌ Comando desconhecido: ${cmd}\nDigite /help para ver os comandos disponíveis.`;
}

// ----- IMPLEMENTAÇÃO DOS COMANDOS -----

// /start → Boas-vindas
registerCommand("/start", async (chatId: string) => {
  return `👋 Olá! Eu sou o *Ruby Bot*.\nUse /help para ver os comandos disponíveis.`;
});

// /help → Lista comandos
registerCommand("/help", async () => {
  return `📖 *Comandos disponíveis*:
  
/start → Inicia o bot
/help → Mostra esta ajuda
/forcelogin <nome> → Força login de um usuário
/master → Lista todas as ocorrências`;
});

// /forcelogin → Cadastra manualmente usuário
registerCommand("/forcelogin", async (chatId: string, args: string[]) => {
  if (args.length === 0) {
    return "⚠️ Uso correto: /forcelogin <nome>";
  }

  const name = args.join(" ");
  const users = readJson(USERS_FILE);

  // Verifica se já existe
  if (users.find((u: any) => u.chatId === chatId)) {
    return "✅ Usuário já está cadastrado!";
  }

  users.push({ chatId, name, createdAt: new Date().toISOString() });
  writeJson(USERS_FILE, users);

  return `✅ Usuário *${name}* cadastrado com sucesso!`;
});

// /master → Lista ocorrências registradas
registerCommand("/master", async () => {
  const occurrences = readJson(OCCURRENCES_FILE);

  if (occurrences.length === 0) {
    return "📂 Nenhuma ocorrência registrada até agora.";
  }

  let text = "📋 *Ocorrências registradas*:\n\n";
  occurrences.forEach((occ: any, i: number) => {
    text += `${i + 1}. ${occ.type || "Sem tipo"} - ${occ.description || "Sem descrição"} (${occ.createdAt})\n`;
  });

  return text;
});
