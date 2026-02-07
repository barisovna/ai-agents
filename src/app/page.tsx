'use client';

import { useChat } from '@ai-sdk/react';
import { ChatContainer } from '@/components/chat/chat-container';
import { Header } from '@/components/layout/header';
import { useState, useRef } from 'react';

export default function ChatPage() {
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const agentMapRef = useRef<Map<string, string>>(new Map());

  const chat = useChat({
    onData(data) {
      // data is an array of data parts from the stream
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

  return (
    <main className="flex flex-col h-dvh bg-white dark:bg-zinc-900">
      <Header />
      <ChatContainer
        chat={chat}
        currentAgent={currentAgent}
        agentMap={agentMapRef.current}
      />
    </main>
  );
}
