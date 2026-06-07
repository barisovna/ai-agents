'use client';

import { useState } from 'react';
import { QuickPromptForm, type PromptField } from './quick-prompt-form';

type PromptDef = {
  emoji: string;
  agentName: string;
  text: string;
  fields?: PromptField[];
  buildPrompt?: (values: Record<string, string>) => string;
};

const PROMPTS: PromptDef[] = [
  { emoji: '💻', agentName: 'coder', text: 'Напиши функцию сортировки на Python' },
  { emoji: '✍️', agentName: 'writer', text: 'Напиши пост для Telegram-канала про ИИ' },
  {
    emoji: '🎯',
    agentName: 'marketer',
    text: 'Составь стратегию продвижения в VK',
    fields: [
      {
        name: 'niche',
        label: 'Что продвигаете?',
        type: 'text',
        placeholder: 'школа английского языка для взрослых',
        required: true,
        defaultValue: '',
      },
      {
        name: 'audience',
        label: 'Кто ваша аудитория?',
        type: 'text',
        placeholder: 'женщины 25-40, Москва',
        defaultValue: 'широкая аудитория — определи сам, исходя из ниши',
      },
      {
        name: 'budget',
        label: 'Бюджет в месяц (необязательно)',
        type: 'select',
        defaultValue: 'не указан',
        options: [
          { value: 'не указан', label: 'не указан' },
          { value: 'до 30 000 ₽', label: 'до 30 000 ₽' },
          { value: '30 000–100 000 ₽', label: '30 000–100 000 ₽' },
          { value: 'свыше 100 000 ₽', label: 'свыше 100 000 ₽' },
        ],
      },
    ],
    buildPrompt: (v) =>
      `Составь стратегию продвижения в VK для следующего проекта:
— Что продвигаем: ${v.niche}
— Целевая аудитория: ${v.audience}
— Бюджет на продвижение: ${v.budget}

Дай конкретный, выполнимый план: каналы, форматы контента, примерный график публикаций и первые шаги.`,
  },
  {
    emoji: '🎪',
    agentName: 'targeting',
    text: 'Настрой таргет VK Реклама с нуля',
    fields: [
      {
        name: 'niche',
        label: 'Что рекламируете?',
        type: 'text',
        placeholder: 'интернет-магазин украшений ручной работы',
        required: true,
        defaultValue: '',
      },
      {
        name: 'audience',
        label: 'Целевая аудитория (если знаете)',
        type: 'text',
        placeholder: 'девушки 18-30, интересуются handmade',
        defaultValue: 'аудитория не определена — предложи варианты сегментации',
      },
      {
        name: 'budget',
        label: 'Дневной бюджет (необязательно)',
        type: 'select',
        defaultValue: 'не указан',
        options: [
          { value: 'не указан', label: 'не указан' },
          { value: 'до 1 000 ₽/день', label: 'до 1 000 ₽/день' },
          { value: '1 000–5 000 ₽/день', label: '1 000–5 000 ₽/день' },
          { value: 'свыше 5 000 ₽/день', label: 'свыше 5 000 ₽/день' },
        ],
      },
    ],
    buildPrompt: (v) =>
      `Настрой таргетированную рекламу VK Реклама с нуля для следующего проекта:
— Что рекламируем: ${v.niche}
— Целевая аудитория: ${v.audience}
— Дневной бюджет: ${v.budget}

Распиши пошагово: настройки кабинета, сегменты аудитории, форматы объявлений и на что обратить внимание при запуске.`,
  },
  {
    emoji: '🎪',
    agentName: 'targeting',
    text: 'Собери ключевые слова для Яндекс Директ',
    fields: [
      {
        name: 'niche',
        label: 'Какой товар/услуга?',
        type: 'text',
        placeholder: 'ремонт стиральных машин на дому',
        required: true,
        defaultValue: '',
      },
      {
        name: 'region',
        label: 'Регион показа',
        type: 'text',
        placeholder: 'Москва и область',
        defaultValue: 'вся Россия',
      },
      {
        name: 'intent',
        label: 'Тип запросов',
        type: 'select',
        defaultValue: 'любые',
        options: [
          { value: 'любые', label: 'любые' },
          { value: 'коммерческие (купить, заказать, цена)', label: 'коммерческие (купить, заказать, цена)' },
          { value: 'информационные (как, почему, что такое)', label: 'информационные (как, почему, что такое)' },
        ],
      },
    ],
    buildPrompt: (v) =>
      `Собери семантическое ядро (ключевые слова) для Яндекс Директ по следующему запросу:
— Товар/услуга: ${v.niche}
— Регион показа: ${v.region}
— Тип запросов: ${v.intent}

Сгруппируй ключи по смыслу (горячие/тёплые/холодные), укажи минус-слова и дай рекомендации по структуре кампании.`,
  },
  { emoji: '📊', agentName: 'analyst', text: 'Сравни React, Vue и Svelte' },
  {
    emoji: '🤖',
    agentName: 'assistant',
    text: 'Составь план на неделю для фрилансера',
    fields: [
      {
        name: 'field',
        label: 'В какой сфере вы фрилансите?',
        type: 'text',
        placeholder: 'веб-дизайн, копирайтинг, разработка...',
        required: true,
        defaultValue: '',
      },
      {
        name: 'goal',
        label: 'Главная цель на неделю (необязательно)',
        type: 'text',
        placeholder: 'найти 2 новых клиентов',
        defaultValue: 'сбалансировать текущие проекты и поиск новых заказов',
      },
      {
        name: 'hours',
        label: 'Сколько часов в день готовы уделять работе?',
        type: 'select',
        defaultValue: 'не указано',
        options: [
          { value: 'не указано', label: 'не указано' },
          { value: 'до 4 часов', label: 'до 4 часов' },
          { value: '4-6 часов', label: '4-6 часов' },
          { value: 'полный день (8+ часов)', label: 'полный день (8+ часов)' },
        ],
      },
    ],
    buildPrompt: (v) =>
      `Составь план на неделю для фрилансера со следующими вводными:
— Сфера деятельности: ${v.field}
— Главная цель на неделю: ${v.goal}
— Нагрузка: ${v.hours}

Распредели задачи по дням, учти баланс между текущими проектами, поиском клиентов и развитием навыков.`,
  },
  {
    emoji: '♟️',
    agentName: 'strategist',
    text: 'Проанализируй мой проект и найди слабые места',
    fields: [
      {
        name: 'project',
        label: 'Что за проект? (продукт/услуга, в двух словах)',
        type: 'text',
        placeholder: 'сервис подписки на готовую еду',
        required: true,
        defaultValue: '',
      },
      {
        name: 'problem',
        label: 'Что беспокоит больше всего? (необязательно)',
        type: 'textarea',
        placeholder:
          'мало продаж при хорошем трафике / не понимаю, кто мой клиент / высокая стоимость привлечения...',
        defaultValue: 'проблема не уточнена — проведи общий аудит по ключевым точкам роста',
      },
      {
        name: 'stage',
        label: 'На каком этапе проект?',
        type: 'select',
        defaultValue: 'не указано',
        options: [
          { value: 'не указано', label: 'не указано' },
          { value: 'идея / ещё не запущен', label: 'идея / ещё не запущен' },
          { value: 'запущен, есть первые клиенты', label: 'запущен, есть первые клиенты' },
          { value: 'работает давно, нужен рост', label: 'работает давно, нужен рост' },
        ],
      },
    ],
    buildPrompt: (v) =>
      `Проанализируй мой проект и найди слабые места:
— О проекте: ${v.project}
— Что беспокоит: ${v.problem}
— Стадия проекта: ${v.stage}

Используй фреймворк "4 ПОЧЕМУ" (почему сейчас, почему вы, почему этот продукт, почему эта цена) и дай конкретные точки роста — без уточняющих вопросов в первом ответе, сразу содержательный разбор.`,
  },
];

interface QuickPromptsProps {
  onSelect: (text: string, agentName?: string) => void;
}

export function QuickPrompts({ onSelect }: QuickPromptsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex((current) => (current === index ? null : index));
  };

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
          {PROMPTS.map((p, i) => (
            <div
              key={p.text}
              className="text-left rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => (p.fields ? toggleExpand(i) : onSelect(p.text, p.agentName))}
                className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{p.emoji}</span>
                  <div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                      {p.text}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5 capitalize">{p.agentName}</p>
                  </div>
                </div>
              </button>
              {p.fields && p.buildPrompt && expandedIndex === i && (
                <QuickPromptForm
                  fields={p.fields}
                  onSubmit={(values) => {
                    onSelect(p.buildPrompt!(values), p.agentName);
                    setExpandedIndex(null);
                  }}
                  onCancel={() => setExpandedIndex(null)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
