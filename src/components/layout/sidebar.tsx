'use client';

import { type Chat } from '@/lib/chat-store';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  open,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800
          flex flex-col transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            История чатов
          </span>
          <button
            onClick={onNewChat}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
            title="Новый чат"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
          </button>
        </div>

        {/* Chat list */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chats.length === 0 && (
              <p className="text-xs text-zinc-400 text-center py-8">
                Пока нет чатов
              </p>
            )}
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`
                  px-3 py-2.5 rounded-lg cursor-pointer transition-colors overflow-hidden
                  ${chat.id === activeChatId
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                  }
                `}
                onClick={() => {
                  onSelectChat(chat.id);
                  onClose();
                }}
              >
                <p className="text-sm truncate">{chat.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-zinc-400">
                    {new Date(chat.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    {' · '}
                    {chat.messages.length} сообщ.
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Удалить этот чат?')) {
                        onDeleteChat(chat.id);
                      }
                    }}
                    className="px-2 py-0.5 rounded text-xs bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/60 hover:text-red-700 transition-colors"
                    title="Удалить чат"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
