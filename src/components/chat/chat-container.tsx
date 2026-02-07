'use client';

import { type useChat } from '@ai-sdk/react';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { ArtifactPanel, type Artifact } from './artifact-panel';

interface ChatContainerProps {
  chat: ReturnType<typeof useChat>;
  currentAgent: string | null;
  agentMap: Map<string, string>;
  activeArtifact: Artifact | null;
  onOpenArtifact: (artifact: Artifact) => void;
  onCloseArtifact: () => void;
}

export function ChatContainer({
  chat,
  currentAgent,
  agentMap,
  activeArtifact,
  onOpenArtifact,
  onCloseArtifact,
}: ChatContainerProps) {
  const { messages, sendMessage, status } = chat;
  const isLoading = status === 'streaming' || status === 'submitted';

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex-1 overflow-hidden">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            currentAgent={currentAgent}
            agentMap={agentMap}
            onSendPrompt={(text) => sendMessage({ text })}
            onOpenArtifact={onOpenArtifact}
          />
        </div>
        <ChatInput
          onSend={(text) => sendMessage({ text })}
          isLoading={isLoading}
        />
      </div>

      {/* Artifact panel */}
      {activeArtifact && (
        <ArtifactPanel artifact={activeArtifact} onClose={onCloseArtifact} />
      )}
    </div>
  );
}
