'use client';

import { type useChat } from '@ai-sdk/react';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';

interface ChatContainerProps {
  chat: ReturnType<typeof useChat>;
  currentAgent: string | null;
  agentMap: Map<string, string>;
}

export function ChatContainer({ chat, currentAgent, agentMap }: ChatContainerProps) {
  const { messages, sendMessage, status } = chat;
  const isLoading = status === 'streaming' || status === 'submitted';

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          currentAgent={currentAgent}
          agentMap={agentMap}
        />
      </div>
      <ChatInput
        onSend={(text) => sendMessage({ text })}
        isLoading={isLoading}
      />
    </div>
  );
}
