'use client';

import { type UIMessage } from 'ai';
import { AgentIndicator } from './agent-indicator';
import { MarkdownRenderer } from './markdown-renderer';
import { MessageActions } from './message-actions';
import { extractArtifacts, type Artifact } from './artifact-panel';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: UIMessage;
  agentName?: string | null;
  onOpenArtifact?: (artifact: Artifact) => void;
}

export function MessageBubble({ message, agentName, onOpenArtifact }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const textContent =
    message.parts
      ?.filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('') ?? '';

  const artifacts = isUser ? [] : extractArtifacts(textContent);
  const hasArtifact = artifacts.length > 0;

  return (
    <div
      className={cn(
        'group flex gap-3 px-4 py-3',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
        )}
      >
        {!isUser && agentName && (
          <AgentIndicator agentName={agentName} className="mb-2" />
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{textContent}</p>
        ) : (
          <>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
              <MarkdownRenderer content={textContent} />
            </div>
            <MessageActions
              text={textContent}
              hasArtifact={hasArtifact}
              onOpenArtifact={
                hasArtifact && onOpenArtifact
                  ? () => onOpenArtifact(artifacts[0])
                  : undefined
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
