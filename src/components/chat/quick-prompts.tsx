'use client';

const PROMPTS = [
  { emoji: '💻', text: 'Напиши функцию сортировки на Python', agent: 'Coder' },
  { emoji: '✍️', text: 'Напиши пост для Telegram-канала про ИИ', agent: 'Writer' },
  { emoji: '🎯', text: 'Составь стратегию продвижения в VK', agent: 'Marketer' },
  { emoji: '🎪', text: 'Настрой таргет VK Реклама с нуля', agent: 'Targeting' },
  { emoji: '🎪', text: 'Собери ключевые слова для Яндекс Директ', agent: 'Targeting' },
  { emoji: '📊', text: 'Сравни React, Vue и Svelte', agent: 'Analyst' },
  { emoji: '🤖', text: 'Составь план на неделю для фрилансера', agent: 'Assistant' },
  { emoji: '♟️', text: 'Проанализируй мой проект и найди слабые места', agent: 'Strategist' },
];

interface QuickPromptsProps {
  onSelect: (text: string) => void;
}

export function QuickPrompts({ onSelect }: QuickPromptsProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-6 max-w-2xl px-4">
        <div className="space-y-2">
          <div className="text-5xl">🤖</div>
          <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-200">
            AI Multi-Agent
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Напиши что угодно — система сама направит к нужному агенту
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p.text}
              onClick={() => onSelect(p.text)}
              className="text-left px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{p.emoji}</span>
                <div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                    {p.text}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">{p.agent}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
