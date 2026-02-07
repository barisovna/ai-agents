'use client';

import { Button } from '@/components/ui/button';
import { useState, useRef, type KeyboardEvent, type ChangeEvent } from 'react';

const TEXT_EXTENSIONS = [
  '.txt', '.md', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts',
  '.py', '.java', '.c', '.cpp', '.go', '.rs', '.sql', '.yaml', '.yml',
  '.toml', '.ini', '.cfg', '.log', '.sh', '.bat', '.ps1', '.env',
];

interface AttachedFile {
  name: string;
  content: string;
}

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const send = () => {
    const parts: string[] = [];

    // Add file contents
    for (const file of files) {
      parts.push(`📎 Файл: ${file.name}\n\`\`\`\n${file.content}\n\`\`\``);
    }

    // Add user text
    if (input.trim()) {
      parts.push(input.trim());
    }

    const fullMessage = parts.join('\n\n');
    if (fullMessage && !isLoading) {
      onSend(fullMessage);
      setInput('');
      setFiles([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    for (const file of Array.from(selectedFiles)) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isText = TEXT_EXTENSIONS.includes(ext) || file.type.startsWith('text/');

      if (isText || file.size < 100_000) {
        try {
          const content = await file.text();
          setFiles((prev) => [...prev, { name: file.name, content }]);
        } catch {
          setFiles((prev) => [...prev, { name: file.name, content: `[Не удалось прочитать файл: ${file.name}]` }]);
        }
      } else {
        setFiles((prev) => [...prev, { name: file.name, content: `[Файл слишком большой или неподдерживаемый формат: ${file.name} (${(file.size / 1024).toFixed(0)} KB)]` }]);
      }
    }

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const hasContent = input.trim() || files.length > 0;

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      <div className="max-w-3xl mx-auto p-4">
        {/* Attached files */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg text-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                </svg>
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(i)}
                  className="hover:text-red-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex gap-2 items-end">
          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-12 h-12 rounded-xl flex items-center justify-center border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-500 dark:text-zinc-400 shrink-0 disabled:opacity-50"
            title="Прикрепить файл"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.py,.java,.sql,.yaml,.yml,.log,.sh,.env,.cfg,.ini,.toml"
            onChange={handleFileSelect}
            className="hidden"
          />

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder:text-zinc-400"
            style={{ minHeight: '48px', maxHeight: '200px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
            }}
          />
          <Button
            type="button"
            onClick={send}
            disabled={!hasContent || isLoading}
            className="rounded-xl px-6 h-12 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
