export function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            AI
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-white">
              Multi-Agent AI
            </h1>
            <p className="text-xs text-zinc-500">
              Coder &middot; Writer &middot; Marketer &middot; Analyst &middot; Assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-xs text-zinc-500">Online</span>
        </div>
      </div>
    </header>
  );
}
