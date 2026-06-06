'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { downloadFile } from '@/lib/chat-store';
import { cn } from '@/lib/utils';

export interface Artifact {
  id: string;
  title: string;
  language: string;
  content: string;
}

interface ArtifactPanelProps {
  artifacts: Artifact[];
  onClose: () => void;
}

export function ArtifactPanel({ artifacts, onClose }: ArtifactPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setCopied(false);
  }, [artifacts]);

  if (artifacts.length === 0) return null;

  const safeIndex = Math.min(activeIndex, artifacts.length - 1);
  const artifact = artifacts[safeIndex];
  const lineCount = artifact.content.split('\n').length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = getExtension(artifact.language);
    downloadFile(artifact.content, `${artifact.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.${ext}`);
  };

  return (
    <div className="w-full lg:w-[500px] xl:w-[600px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
              {artifact.title}
            </p>
            <p className="text-xs text-zinc-400">
              {artifact.language} · {lineCount} строк
              {artifacts.length > 1 && ` · ${safeIndex + 1} из ${artifacts.length}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
            title="Копировать"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
            title="Скачать"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
            title="Закрыть"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs — shown only when 2+ artifacts */}
      {artifacts.length > 1 && (
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shrink-0">
          {artifacts.map((a, i) => (
            <button
              key={a.id}
              onClick={() => { setActiveIndex(i); setCopied(false); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors shrink-0',
                i === safeIndex
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300',
              )}
            >
              <span className="font-mono text-[10px] text-zinc-400">{a.language}</span>
              <span className="max-w-[120px] truncate">{a.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Code content */}
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          style={oneDark}
          language={artifact.language}
          showLineNumbers
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '0.8rem',
            minHeight: '100%',
          }}
        >
          {artifact.content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function getExtension(language: string): string {
  const map: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    html: 'html',
    css: 'css',
    json: 'json',
    bash: 'sh',
    shell: 'sh',
    sql: 'sql',
    markdown: 'md',
    yaml: 'yml',
    rust: 'rs',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
  };
  return map[language] ?? 'txt';
}

// Extract artifacts from message text
export function extractArtifacts(text: string): Artifact[] {
  const artifacts: Artifact[] = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let index = 0;

  while ((match = regex.exec(text)) !== null) {
    const language = match[1] || 'text';
    const content = match[2].trim();
    const lines = content.split('\n').length;

    if (lines > 8) {
      artifacts.push({
        id: `artifact-${index}`,
        title: guessTitle(content, language),
        language,
        content,
      });
      index++;
    }
  }

  return artifacts;
}

function guessTitle(content: string, language: string): string {
  const fnMatch = content.match(/(?:function|def|class|const|let|var|export)\s+(\w+)/);
  if (fnMatch) return fnMatch[1];

  const commentMatch = content.match(/(?:\/\/|#|\/\*)\s*(.+)/);
  if (commentMatch) return commentMatch[1].slice(0, 30);

  return `${language} code`;
}
