import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const usersFile = path.join(__dirname, '../data/users.json');
const occurrencesFile = path.join(__dirname, '../data/occurrences.json');

export interface User {
  telegramId: number;
  login: string;
  name: string;
  area: string;
  phone: string;
}

export interface Occurrence {
  id: string;
  telegramId: number;
  contract: string;
  type: string;
  createdAt: string;
  status: string;
  notes?: string;
  location?: string;
  urgency?: string;
}

// Funções utilitárias
export function loadUsers(): User[] {
  return JSON.parse(fs.readFileSync(usersFile, 'utf-8') || '[]');
}

export function saveUsers(users: User[]) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

export function loadOccurrences(): Occurrence[] {
  return JSON.parse(fs.readFileSync(occurrencesFile, 'utf-8') || '[]');
}

export function saveOccurrences(occurrences: Occurrence[]) {
  fs.writeFileSync(occurrencesFile, JSON.stringify(occurrences, null, 2));
}

// Buscar usuário
export function findUserByTelegramId(id: number) {
  const users = loadUsers();
  return users.find(u => u.telegramId === id);
}

// Criar ocorrência
export function createOccurrence(telegramId: number, contract: string, type: string, notes?: string, location?: string, urgency?: string) {
  const occurrences = loadOccurrences();
  const newOcc: Occurrence = {
    id: generateOccurrenceId(),
    telegramId,
    contract,
    type,
    createdAt: new Date().toISOString(),
    status: 'Em análise',
    notes,
    location,
    urgency
  };
  occurrences.push(newOcc);
  saveOccurrences(occurrences);
  return newOcc;
}

// Gerar ID aleatório para ocorrência
export function generateOccurrenceId() {
  // 8 caracteres alfanuméricos
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// Buscar histórico do usuário (últimos 30 dias)
export function getUserHistory(telegramId: number) {
  const occurrences = loadOccurrences();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return occurrences.filter(o => o.telegramId === telegramId && new Date(o.createdAt) >= thirtyDaysAgo);
}

// Buscar status por contrato
export function getStatusByContract(contract: string) {
  const occurrences = loadOccurrences();
  return occurrences.filter(o => o.contract === contract);
}
