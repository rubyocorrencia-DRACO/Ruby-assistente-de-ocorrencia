import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";

const token = process.env.BOT_TOKEN!;
const bot = new TelegramBot(token, { polling: true });

const dataDir = path.join(process.cwd(), "data");
const usersFile = path.join(dataDir, "users.json");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));

interface User {
  id: number;
  phone?: string;
  login?: string;
  isAdmin?: boolean;
}

const MASTER_PHONE = "+5519999789879"; // Seu número
let users: User[] = JSON.parse(fs.readFileSync(usersFile, "utf8"));

function saveUsers() {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function getUser(id: number) {
  return users.find((u) => u.id === id);
}

function isAdmin(userId: number) {
  const user = getUser(userId);
  return user?.isAdmin || false;
}

function isMaster(userId: number) {
  const user = getUser(userId);
  return user?.phone === MASTER_PHONE;
}

// ----- Comando /start -----
bot.onText(/^\/start$/, (msg) => {
  bot.sendMessage(msg.chat.id, `👋 Olá, bem-vindo ao Ruby Ocorrências Bot!\nUse /login para começar.`);
});

// ----- Comando /login -----
bot.onText(/^\/login$/, (msg) => {
  const user = getUser(msg.from!.id);
  if (user?.login) {
    bot.sendMessage(msg.chat.id, `✅ Você já está logado como *${user.login}*`, { parse_mode: "Markdown" });
  } else {
    bot.sendMessage(msg.chat.id, `📱 Envie seu número de telefone para login.`, {
      reply_markup: { keyboard: [[{ text: "📲 Enviar número", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true }
    });
  }
});

// ----- Receber contato para login -----
bot.on("contact", (msg) => {
  const phone = msg.contact!.phone_number.startsWith("+") ? msg.contact!.phone_number : `+${msg.contact!.phone_number}`;
  let user = getUser(msg.from!.id);
  if (!user) {
    user = { id: msg.from!.id, phone, isAdmin: phone === MASTER_PHONE };
    users.push(user);
  } else {
    user.phone = phone;
    if (phone === MASTER_PHONE) user.isAdmin = true;
  }
  saveUsers();
  bot.sendMessage(msg.chat.id, `✅ Login realizado com sucesso!\nNúmero: ${phone}`);
});

// ----- Comando /whoami -----
bot.onText(/^\/whoami$/, (msg) => {
  const user = getUser(msg.from!.id);
  if (!user) return bot.sendMessage(msg.chat.id, "❌ Você não está registrado.");
  bot.sendMessage(msg.chat.id, `🆔 ID: ${user.id}\n📱 Telefone: ${user.phone || "Não informado"}\n👑 Admin: ${user.isAdmin ? "Sim" : "Não"}`);
});

// ----- Comando /forcelogin (ADM apenas) -----
bot.onText(/^\/forcelogin$/, (msg) => {
  if (!isAdmin(msg.from!.id)) return bot.sendMessage(msg.chat.id, "❌ Apenas administradores podem usar este comando.");
  let user = getUser(msg.from!.id);
  if (user) {
    user.login = undefined;
    saveUsers();
    bot.sendMessage(msg.chat.id, "🔄 Seu login foi limpo. Use /login para entrar novamente.");
  }
});

// ----- Comando /removeuser (ADM apenas) -----
bot.onText(/^\/removeuser (.+)$/, (msg, match) => {
  if (!isAdmin(msg.from!.id)) return bot.sendMessage(msg.chat.id, "❌ Apenas administradores podem remover usuários.");
  
  const phoneToRemove = match![1].trim();
  if (phoneToRemove === MASTER_PHONE) {
    return bot.sendMessage(msg.chat.id, "🚫 Você não pode remover o Master da Ruby.");
  }
  
  const index = users.findIndex(u => u.phone === phoneToRemove);
  if (index === -1) return bot.sendMessage(msg.chat.id, "⚠️ Usuário não encontrado.");
  
  users.splice(index, 1);
  saveUsers();
  bot.sendMessage(msg.chat.id, `✅ Usuário com número ${phoneToRemove} foi removido do sistema.`);
});

// ----- Comando /addadmin (ADM apenas) -----
bot.onText(/^\/addadmin (.+)$/, (msg, match) => {
  if (!isAdmin(msg.from!.id)) return bot.sendMessage(msg.chat.id, "❌ Apenas administradores podem adicionar novos administradores.");
  
  const phone = match![1].trim();
  const user = users.find(u => u.phone === phone);
  if (!user) return bot.sendMessage(msg.chat.id, "⚠️ Usuário não encontrado.");
  
  user.isAdmin = true;
  saveUsers();
  bot.sendMessage(msg.chat.id, `✅ ${phone} agora é administrador.`);
});

// ----- Comando /removeadmin (ADM apenas, não remove master) -----
bot.onText(/^\/removeadmin (.+)$/, (msg, match) => {
  if (!isAdmin(msg.from!.id)) return bot.sendMessage(msg.chat.id, "❌ Apenas administradores podem remover administradores.");
  
  const phone = match![1].trim();
  if (phone === MASTER_PHONE) return bot.sendMessage(msg.chat.id, "🚫 Você não pode remover o Master da Ruby.");
  
  const user = users.find(u => u.phone === phone);
  if (!user) return bot.sendMessage(msg.chat.id, "⚠️ Usuário não encontrado.");
  
  user.isAdmin = false;
  saveUsers();
  bot.sendMessage(msg.chat.id, `✅ ${phone} não é mais administrador.`);
});

console.log("🤖 Ruby Ocorrências Bot iniciado!");
