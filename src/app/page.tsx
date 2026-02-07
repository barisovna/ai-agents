'use client';

import { useChat } from '@ai-sdk/react';
import { ChatContainer } from '@/components/chat/chat-container';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  type Chat,
  getChats,
  getChat,
  saveChat,
  deleteChat,
  createChat,
  getActiveChatId,
  setActiveChatId,
  generateTitle,
  exportChatAsMarkdown,
  downloadFile,
} from '@/lib/chat-store';
import { type Artifact } from '@/components/chat/artifact-panel';

export default function ChatPage() {
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const agentMapRef = useRef<Map<string, string>>(new Map());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [mounted, setMounted] = useState(false);

  const chat = useChat({
    onData(data) {
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && typeof item === 'object' && 'agentName' in item) {
            setCurrentAgent((item as { agentName: string }).agentName);
          }
        }
      }
    },
    onFinish({ message }) {
      if (currentAgent && message.id) {
        agentMapRef.current.set(message.id, currentAgent);
      }
      setCurrentAgent(null);
    },
  });

  // Load chats from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const chats = getChats();
    setChatList(chats);

    const savedId = getActiveChatId();
    if (savedId && chats.find((c) => c.id === savedId)) {
      setActiveChatIdState(savedId);
      const saved = getChat(savedId);
      if (saved) {
        // Restore agent map
        for (const [key, value] of Object.entries(saved.agentMap)) {
          agentMapRef.current.set(key, value);
        }
        // Set initial messages via the chat hook
        chat.setMessages(saved.messages);
      }
    } else if (chats.length === 0) {
      // Create first chat
      const newChat = createChat();
      saveChat(newChat);
      setChatList([newChat]);
      setActiveChatIdState(newChat.id);
      setActiveChatId(newChat.id);
    } else {
      setActiveChatIdState(chats[0].id);
      setActiveChatId(chats[0].id);
      const saved = getChat(chats[0].id);
      if (saved) {
        for (const [key, value] of Object.entries(saved.agentMap)) {
          agentMapRef.current.set(key, value);
        }
        chat.setMessages(saved.messages);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!mounted || !activeChatId) return;
    if (chat.messages.length === 0) return;

    const agentMap: Record<string, string> = {};
    agentMapRef.current.forEach((v, k) => {
      agentMap[k] = v;
    });

    const existing = getChat(activeChatId);
    const title =
      existing?.title === 'Новый чат' && chat.messages.length > 0
        ? generateTitle(
            chat.messages[0].parts
              ?.filter((p) => p.type === 'text')
              .map((p) => p.text)
              .join('') ?? 'Новый чат',
          )
        : existing?.title ?? 'Новый чат';

    const updated: Chat = {
      id: activeChatId,
      title,
      messages: chat.messages,
      agentMap,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    saveChat(updated);
    setChatList(getChats());
  }, [chat.messages, activeChatId, mounted]);

  const handleNewChat = useCallback(() => {
    const newChat = createChat();
    saveChat(newChat);
    setActiveChatIdState(newChat.id);
    setActiveChatId(newChat.id);
    agentMapRef.current = new Map();
    chat.setMessages([]);
    setChatList(getChats());
    setActiveArtifact(null);
  }, [chat]);

  const handleSelectChat = useCallback(
    (id: string) => {
      if (id === activeChatId) return;
      setActiveChatIdState(id);
      setActiveChatId(id);
      const saved = getChat(id);
      if (saved) {
        agentMapRef.current = new Map(Object.entries(saved.agentMap));
        chat.setMessages(saved.messages);
      } else {
        agentMapRef.current = new Map();
        chat.setMessages([]);
      }
      setActiveArtifact(null);
    },
    [activeChatId, chat],
  );

  const handleDeleteChat = useCallback(
    (id: string) => {
      deleteChat(id);
      const remaining = getChats();
      setChatList(remaining);

      if (id === activeChatId) {
        if (remaining.length > 0) {
          handleSelectChat(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    },
    [activeChatId, handleSelectChat, handleNewChat],
  );

  const handleExport = useCallback(() => {
    if (!activeChatId) return;
    const c = getChat(activeChatId);
    if (!c) return;
    const agentMap: Record<string, string> = {};
    agentMapRef.current.forEach((v, k) => {
      agentMap[k] = v;
    });
    const md = exportChatAsMarkdown(c, agentMap);
    downloadFile(md, `${c.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.md`);
  }, [activeChatId]);

  return (
    <div className="flex h-dvh bg-white dark:bg-zinc-900">
      <Sidebar
        chats={chatList}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onExport={handleExport}
          onNewChat={handleNewChat}
          hasMessages={chat.messages.length > 0}
        />
        <ChatContainer
          chat={chat}
          currentAgent={currentAgent}
          agentMap={agentMapRef.current}
          activeArtifact={activeArtifact}
          onOpenArtifact={setActiveArtifact}
          onCloseArtifact={() => setActiveArtifact(null)}
        />
      </div>
    </div>
  );
}
