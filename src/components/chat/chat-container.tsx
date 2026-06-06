'use client';

import { type useChat } from '@ai-sdk/react';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { ArtifactPanel, type Artifact } from './artifact-panel';

interface ChatContainerProps {
  chat: ReturnType<typeof useChat>;
  currentAgent: string | null;
  agentMap: Map<string, string>;
  artifacts: Artifact[];
  onOpenArtifact: (artifacts: Artifact[]) => void;
  onCloseArtifact: () => void;
}

export function ChatContainer({
  chat,
  currentAgent,
  agentMap,
  artifacts,
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
            onSendPrompt={(text, agentName) => {
              const options = agentName ? { body: { forceAgent: agentName } } : undefined;
              sendMessage({ text }, options);
            }}
            onOpenArtifact={onOpenArtifact}
          />
        </div>
        <ChatInput
          onSend={(text) => sendMessage({ text })}
          isLoading={isLoading}
        />
      </div>

      {/* Artifact panel */}
      {artifacts.length > 0 && (
        <ArtifactPanel artifacts={artifacts} onClose={onCloseArtifact} />
      )}
    </div>
  );
}
