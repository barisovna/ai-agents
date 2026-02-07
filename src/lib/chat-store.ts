import { type UIMessage } from 'ai';

export interface Chat {
  id: string;
  title: string;
  messages: UIMessage[];
  agentMap: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'ai-agents-chats';
const ACTIVE_CHAT_KEY = 'ai-agents-active-chat';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function generateTitle(text: string): string {
  const clean = text.trim().replace(/\n/g, ' ');
  if (clean.length <= 40) return clean;
  return clean.slice(0, 40) + '...';
}

export function getChats(): Chat[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const chats: Chat[] = JSON.parse(raw);
    return chats.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function getChat(id: string): Chat | null {
  const chats = getChats();
  return chats.find((c) => c.id === id) ?? null;
}

export function saveChat(chat: Chat): void {
  if (typeof window === 'undefined') return;
  const chats = getChats();
  const idx = chats.findIndex((c) => c.id === chat.id);
  if (idx >= 0) {
    chats[idx] = chat;
  } else {
    chats.unshift(chat);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function deleteChat(id: string): void {
  if (typeof window === 'undefined') return;
  const chats = getChats().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function createChat(): Chat {
  return {
    id: generateId(),
    title: 'Новый чат',
    messages: [],
    agentMap: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function getActiveChatId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_CHAT_KEY);
}

export function setActiveChatId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_CHAT_KEY, id);
}

export function exportChatAsMarkdown(chat: Chat, agentMap: Record<string, string>): string {
  const lines: string[] = [];
  lines.push(`# ${chat.title}`);
  lines.push(`_${new Date(chat.createdAt).toLocaleString('ru-RU')}_`);
  lines.push('');

  for (const msg of chat.messages) {
    const text =
      msg.parts
        ?.filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('') ?? '';

    if (msg.role === 'user') {
      lines.push(`## User`);
    } else {
      const agent = agentMap[msg.id];
      lines.push(`## ${agent ? agent.charAt(0).toUpperCase() + agent.slice(1) : 'Assistant'}`);
    }
    lines.push('');
    lines.push(text);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
