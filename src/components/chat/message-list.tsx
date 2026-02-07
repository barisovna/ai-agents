'use client';

import { type UIMessage } from 'ai';
import { MessageBubble } from './message-bubble';
import { AgentIndicator } from './agent-indicator';
import { QuickPrompts } from './quick-prompts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';
import { type Artifact } from './artifact-panel';

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  currentAgent: string | null;
  agentMap: Map<string, string>;
  onSendPrompt: (text: string) => void;
  onOpenArtifact: (artifact: Artifact) => void;
}

export function MessageList({
  messages,
  isLoading,
  currentAgent,
  agentMap,
  onSendPrompt,
  onOpenArtifact,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return <QuickPrompts onSelect={onSendPrompt} />;
  }

  return (
    <ScrollArea className="h-full">
      <div className="max-w-3xl mx-auto py-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            agentName={
              agentMap.get(message.id) ??
              (message.role === 'assistant' &&
              message === messages[messages.length - 1]
                ? currentAgent
                : null)
            }
            onOpenArtifact={onOpenArtifact}
          />
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3 px-4 py-3">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                {currentAgent && (
                  <AgentIndicator agentName={currentAgent} className="mr-1" />
                )}
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Думаю...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
