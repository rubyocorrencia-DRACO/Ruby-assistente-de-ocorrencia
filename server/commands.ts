import fs from 'fs';
import path from 'path';
import { TelegramBot } from 'node-telegram-bot-api';

const usersPath = path.join(__dirname, 'data', 'users.json');
const occurrencesPath = path.join(__dirname, 'data', 'occurrences.json');

interface User {
  login: string;
  nome: string;
  area: string;
  telefone: string;
  telegramId: number;
  isAdmin?: boolean;
}

interface Occurrence {
  id: string;
  contrato: string;
  tipo: string;
  problema?: string;
  local?: string;
  urgencia?: string;
  status: string;
  tecnico: string;
  criadoEm: string;
}

export function loadUsers(): User[] {
  if (!fs.existsSync(usersPath)) return [];
  return JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
}

export function saveUsers(users: User[]) {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf-8');
}

export function loadOccurrences(): Occurrence[] {
  if (!fs.existsSync(occurrencesPath)) return [];
  return JSON.parse(fs.readFileSync(occurrencesPath, 'utf-8'));
}

export function saveOccurrences(occurrences: Occurrence[]) {
  fs.writeFileSync(occurrencesPath, JSON.stringify(occurrences, null, 2), 'utf-8');
}

export function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Verifica se é administrador
export function isAdmin(user: User, masterNumber: string) {
  return user.isAdmin || user.telefone === masterNumber;
}

// Limpar histórico e remover usuário (apenas admin)
export function limparUsuario(telefone: string) {
  let users = loadUsers();
  let occurrences = loadOccurrences();

  users = users.filter(u => u.telefone !== telefone);
  occurrences = occurrences.filter(o => o.tecnico !== telefone);

  saveUsers(users);
  saveOccurrences(occurrences);
}

// Comando de ajuda
export function helpMessage(): string {
  return `
📖 Ajuda - Ruby Ocorrências Bot

🔹 Comandos Principais:
/start - Inicializar o bot
/login - Fazer login no sistema
/forcelogin - Forçar novo login (limpar dados, apenas admins)
/logout - Sair do sistema
/ocorrencia - Registrar nova ocorrência
/historico - Ver suas ocorrências recentes
/status <número> - Consultar ocorrências por contrato

🔹 Como usar:
1️⃣ /login para se autenticar
2️⃣ /ocorrencia para registrar ocorrências
3️⃣ Escolha o tipo de ocorrência
4️⃣ Digite o número do contrato
5️⃣ Preencha o formulário enviado
6️⃣ /historico para ver suas ocorrências
7️⃣ /status <número> para consultar por contrato

🔹 Tipos de Ocorrência:
• Rede Externa
• Rede Externa NAP GPON  
• Backbone
• Backbone GPON

📞 Suporte: Entre em contato com a administração

Ruby Telecom - Sistema de Ocorrências
  `;
}

// Mapas de formulários
export const formsMap: Record<string, string> = {
  'Rede Externa': 'https://redeexterna.fillout.com/t/g56SBKiZALus',
  'Rede Externa NAP GPON': 'https://redeexterna.fillout.com/t/6VTMJST5NMus',
  'Backbone': 'https://redeexterna.fillout.com/t/7zfWL9BKM6us',
  'Backbone GPON': 'https://redeexterna.fillout.com/t/atLL2dekh3us'
};
