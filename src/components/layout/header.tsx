import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
  onToggleSidebar: () => void;
  onExport: () => void;
  onNewChat: () => void;
  hasMessages: boolean;
}

export function Header({ onToggleSidebar, onExport, onNewChat, hasMessages }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shrink-0">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          {/* Sidebar toggle */}
          <button
            onClick={onToggleSidebar}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400 lg:hidden"
            title="Меню"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>

          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
            AI
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">
              Multi-Agent AI
            </h1>
            <p className="text-[10px] text-zinc-400 leading-tight">
              Coder &middot; Writer &middot; Marketer &middot; Analyst &middot; Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* New chat */}
          <button
            onClick={onNewChat}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
            title="Новый чат"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
          </button>

          {/* Export */}
          {hasMessages && (
            <button
              onClick={onExport}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
              title="Скачать чат (.md)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
              </svg>
            </button>
          )}

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Status */}
          <div className="flex items-center gap-1 ml-1">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-[10px] text-zinc-400 hidden sm:inline">Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
