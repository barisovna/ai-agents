'use client';

import { type UIMessage } from 'ai';
import { MessageBubble } from './message-bubble';
import { AgentIndicator } from './agent-indicator';
import { QuickPrompts } from './quick-prompts';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef } from 'react';
import { type Artifact } from './artifact-panel';

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  currentAgent: string | null;
  agentMap: Map<string, string>;
  onSendPrompt: (text: string, agentName?: string) => void;
  onOpenArtifact: (artifacts: Artifact[]) => void;
}

export function MessageList({
  messages,
  isLoading,
  currentAgent,
  agentMap,
  onSendPrompt,
  onOpenArtifact,
}: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Extra slot for loading indicator when last message is from user
  const showLoader = isLoading && messages[messages.length - 1]?.role === 'user';
  const totalCount = messages.length + (showLoader ? 1 : 0);

  const virtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  // Track whether user is near the bottom
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = parent;
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
    };
    parent.addEventListener('scroll', handleScroll, { passive: true });
    return () => parent.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom when content changes (only if already near bottom)
  useEffect(() => {
    if (totalCount === 0) return;
    if (!isAtBottomRef.current) return;
    const parent = parentRef.current;
    if (parent) {
      parent.scrollTop = parent.scrollHeight;
    }
  }, [messages, isLoading, totalCount]);

  if (messages.length === 0) {
    return <QuickPrompts onSelect={onSendPrompt} />;
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="h-full overflow-y-auto"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const isLoaderItem = virtualItem.index === messages.length;
          const message = messages[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="max-w-3xl mx-auto py-1">
                {isLoaderItem ? (
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
                ) : (
                  <MessageBubble
                    message={message}
                    agentName={
                      agentMap.get(message.id) ??
                      (message.role === 'assistant' && virtualItem.index === messages.length - 1
                        ? currentAgent
                        : null)
                    }
                    onOpenArtifact={onOpenArtifact}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
