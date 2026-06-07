'use client';

import { useState } from 'react';
import { QuickPromptForm, type PromptField } from './quick-prompt-form';

type PromptDef = {
  emoji: string;
  agentName: string;
  text: string;
  description: string;
  fields: PromptField[];
  buildPrompt: (values: Record<string, string>) => string;
};

const PROMPTS: PromptDef[] = [
  {
    emoji: '💻',
    agentName: 'coder',
    text: 'Напиши функцию сортировки на Python',
    description:
      'Готовый код под вашу задачу — для учебных целей, подготовки к собеседованию или быстрого старта проекта.',
    fields: [
      {
        name: 'data',
        label: 'Что нужно сортировать?',
        type: 'text',
        placeholder: 'список чисел / строки по алфавиту / объекты по дате',
        required: true,
        defaultValue: '',
      },
      {
        name: 'priority',
        label: 'Что важнее?',
        type: 'select',
        defaultValue: 'не важно — покажи стандартный подход',
        options: [
          { value: 'не важно — покажи стандартный подход', label: 'не важно — покажи стандартный подход' },
          { value: 'понятный код для обучения, с пояснениями', label: 'понятный код для обучения, с пояснениями' },
          { value: 'производительность на больших объёмах данных', label: 'производительность на больших объёмах данных' },
          { value: 'стабильность — сохранить порядок одинаковых элементов', label: 'стабильность — сохранить порядок одинаковых элементов' },
        ],
      },
      {
        name: 'style',
        label: 'Формат ответа',
        type: 'select',
        defaultValue: 'с комментариями построчно',
        options: [
          { value: 'с комментариями построчно', label: 'с комментариями построчно' },
          { value: 'компактный код, без пояснений', label: 'компактный код, без пояснений' },
        ],
      },
    ],
    buildPrompt: (v) =>
      `Напиши функцию сортировки на Python со следующими вводными:
— Что сортируем: ${v.data}
— Приоритет: ${v.priority}
— Формат ответа: ${v.style}

Покажи рабочий код, объясни выбор алгоритма и сложность по времени/памяти (Big O).`,
  },
  {
    emoji: '✍️',
    agentName: 'writer',
    text: 'Напиши пост для Telegram-канала про ИИ',
    description:
      'Черновик поста с цепляющим началом и структурой под мобильный экран — останется только проверить и опубликовать.',
    fields: [
      {
        name: 'angle',
        label: 'О чём конкретно пост?',
        type: 'text',
        placeholder:
          'как ИИ меняет работу маркетолога / личный кейс использования ChatGPT / разбор новой нейросети',
        required: true,
        defaultValue: '',
      },
      {
        name: 'tone',
        label: 'Тон поста',
        type: 'select',
        defaultValue: 'нейтрально-информационный',
        options: [
          { value: 'нейтрально-информационный', label: 'нейтрально-информационный' },
          { value: 'экспертный, по делу', label: 'экспертный, по делу' },
          { value: 'лёгкий, разговорный', label: 'лёгкий, разговорный' },
          { value: 'провокационный, с дискуссией в комментариях', label: 'провокационный, с дискуссией в комментариях' },
        ],
      },
      {
        name: 'audience',
        label: 'Аудитория канала (необязательно)',
        type: 'text',
        placeholder: 'предприниматели / разработчики / широкая аудитория без техфона',
        defaultValue: 'широкая аудитория, интересующаяся темой ИИ — пиши без узкого жаргона',
      },
    ],
    buildPrompt: (v) =>
      `Напиши пост для Telegram-канала про ИИ со следующими вводными:
— Тема/угол: ${v.angle}
— Тон: ${v.tone}
— Аудитория канала: ${v.audience}

Сделай пост готовым к публикации: цепляющее начало, структура с абзацами под мобильный экран, естественный призыв к обсуждению в конце.`,
  },
  {
    emoji: '🎯',
    agentName: 'marketer',
    text: 'Составь стратегию продвижения в VK',
    description:
      'Пошаговый план продвижения вместо размытых советов «ведите соцсети активнее» — каналы, форматы, график публикаций.',
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
    description:
      'Настройка рекламного кабинета по шагам — полезно, если запускаете первую кампанию и не хотите слить бюджет на ощупь.',
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
    description:
      'Семантическое ядро с группировкой по «температуре» и минус-словами — экономит часы ручного подбора фраз.',
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
  {
    emoji: '📊',
    agentName: 'analyst',
    text: 'Сравни React, Vue и Svelte',
    description:
      'Структурированное сравнение под вашу конкретную задачу — выбор стека, подготовка к собеседованию или просто разобраться в теме.',
    fields: [
      {
        name: 'purpose',
        label: 'Для чего сравниваете?',
        type: 'text',
        placeholder: 'выбираю стек для нового проекта / готовлюсь к собеседованию / просто интересно, в чём разница',
        required: true,
        defaultValue: '',
      },
      {
        name: 'criteria',
        label: 'Что важнее всего при выборе?',
        type: 'select',
        defaultValue: 'не уточнено — рассмотри все аспекты сбалансированно',
        options: [
          { value: 'не уточнено — рассмотри все аспекты сбалансированно', label: 'не уточнено — рассмотри все аспекты сбалансированно' },
          { value: 'скорость разработки и простота входа', label: 'скорость разработки и простота входа' },
          { value: 'производительность и масштабируемость', label: 'производительность и масштабируемость' },
          { value: 'размер community и доступность вакансий', label: 'размер community и доступность вакансий' },
        ],
      },
      {
        name: 'level',
        label: 'Ваш текущий опыт',
        type: 'select',
        defaultValue: 'не указан',
        options: [
          { value: 'не указан', label: 'не указан' },
          { value: 'начинающий — объясняй термины', label: 'начинающий — объясняй термины' },
          { value: 'есть опыт с одним из фреймворков', label: 'есть опыт с одним из фреймворков' },
          { value: 'опытный разработчик — можно без базовых объяснений', label: 'опытный разработчик — можно без базовых объяснений' },
        ],
      },
    ],
    buildPrompt: (v) =>
      `Сравни React, Vue и Svelte со следующими вводными:
— Цель сравнения: ${v.purpose}
— Что важнее всего: ${v.criteria}
— Мой уровень: ${v.level}

Дай структурированное сравнение по ключевым аспектам и заверши чёткой рекомендацией или выводом, который отвечает именно на цель сравнения — без обтекаемого "оба хороши, зависит от задач".`,
  },
  {
    emoji: '🤖',
    agentName: 'assistant',
    text: 'Составь план на неделю для фрилансера',
    description:
      'План по дням с балансом между текущими проектами и поиском новых клиентов — когда всё горит и непонятно, за что хвататься.',
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
    description:
      'Разбор по фреймворку «4 ПОЧЕМУ» с конкретными точками роста — если продажи не идут, а где затык — непонятно.',
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
                onClick={() => toggleExpand(i)}
                className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{p.emoji}</span>
                  <div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                      {p.text}
                    </p>
                    {expandedIndex !== i && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{p.description}</p>
                    )}
                  </div>
                </div>
              </button>
              {expandedIndex === i && (
                <QuickPromptForm
                  fields={p.fields}
                  onSubmit={(values) => {
                    onSelect(p.buildPrompt(values), p.agentName);
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
