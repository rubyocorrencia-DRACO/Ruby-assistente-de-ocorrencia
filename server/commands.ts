import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import TelegramBot from 'node-telegram-bot-api';

const usersFile = path.join(__dirname, 'data', 'users.json');
const occurrencesFile = path.join(__dirname, 'data', 'occurrences.json');

interface User {
  telegramId: number;
  login: string;
  name: string;
  area: string;
  phone: string;
}

interface Occurrence {
  id: string;
  telegramId: number;
  contract: string;
  type: string;
  createdAt: string;
  status: string;
  problem?: string;
  location?: string;
  urgency?: string;
}

// ---------- UTILIDADES ---------- //

function readJson<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data) as T[];
}

function writeJson<T>(filePath: string, data: T[]) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ---------- USUÁRIOS ---------- //

export function getUser(telegramId: number): User | undefined {
  const users = readJson<User>(usersFile);
  return users.find(u => u.telegramId === telegramId);
}

export function addUser(user: User) {
  const users = readJson<User>(usersFile);
  users.push(user);
  writeJson(usersFile, users);
}

// ---------- OCORRÊNCIAS ---------- //

export function createOccurrence(
  telegramId: number,
  contract: string,
  type: string,
  problem?: string,
  location?: string,
  urgency?: string
): Occurrence {
  const occurrences = readJson<Occurrence>(occurrencesFile);
  const occurrence: Occurrence = {
    id: uuidv4().slice(0, 8).toUpperCase(), // ID curto
    telegramId,
    contract,
    type,
    createdAt: new Date().toISOString(),
    status: 'Em análise',
    problem,
    location,
    urgency
  };
  occurrences.push(occurrence);
  writeJson(occurrencesFile, occurrences);
  return occurrence;
}

export function getOccurrencesByUser(telegramId: number): Occurrence[] {
  const occurrences = readJson<Occurrence>(occurrencesFile);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return occurrences
    .filter(o => o.telegramId === telegramId)
    .filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
}

export function getOccurrencesByContract(contract: string): Occurrence[] {
  const occurrences = readJson<Occurrence>(occurrencesFile);
  return occurrences.filter(o => o.contract === contract);
}

// ---------- TIPOS DE OCORRÊNCIA ---------- //

export const occurrenceForms: Record<string, string> = {
  'Rede Externa': 'https://redeexterna.fillout.com/t/g56SBKiZALus',
  'Rede Externa NAP GPON': 'https://redeexterna.fillout.com/t/6VTMJST5NMus',
  'Backbone': 'https://redeexterna.fillout.com/t/7zfWL9BKM6us',
  'Backbone GPON': 'https://redeexterna.fillout.com/t/atLL2dekh3us'
};

// ---------- FUNÇÕES DE MENSAGENS ---------- //

export function formatOccurrence(occ: Occurrence): string {
  let msg = `🔹 ID ${occ.id}\n📄 CONTRATO: ${occ.contract}\n🔧 Tipo: ${occ.type}\n⏰ Criado: ${new Date(occ.createdAt).toLocaleString('pt-BR')}\n📊 Status: ${occ.status}`;
  if (occ.problem) msg += `\n📝 Problema: ${occ.problem}`;
  if (occ.location) msg += `\n📍 Local: ${occ.location}`;
  if (occ.urgency) msg += `\n⚡ Urgência: ${occ.urgency}`;
  return msg;
}

export function formatOccurrencesList(occurrences: Occurrence[]): string {
  if (occurrences.length === 0) return '📋 Nenhuma ocorrência encontrada.';
  return occurrences.map(formatOccurrence).join('\n\n');
}

// ---------- COMANDOS HELP ---------- //

export function getHelpMessage(): string {
  return `
📖 Ajuda - Ruby Ocorrências Bot

🔹 Comandos Principais:
/start - Inicializar o bot
/login - Fazer login no sistema
/forcelogin - Forçar novo login (limpar dados)
/logout - Sair do sistema
/ocorrencia - Registrar nova ocorrência
/historico - Ver suas ocorrências recentes
/status <número> - Consultar ocorrências por contrato

🔹 Como usar:
1️⃣ Primeiro, use /login para se autenticar
2️⃣ Depois, use /ocorrencia para registrar ocorrências
3️⃣ Escolha o tipo de ocorrência desejado
4️⃣ Digite o número do contrato
5️⃣ Preencha o formulário que será enviado
6️⃣ Use /historico para ver suas ocorrências
7️⃣ Use /status <número> para consultar por contrato

🔹 Tipos de Ocorrência:
• Rede Externa
• Rede Externa NAP GPON  
• Backbone
• Backbone GPON

📞 Suporte: Entre em contato com a administração para dúvidas.

Ruby Telecom - Sistema de Ocorrências
`;
}
