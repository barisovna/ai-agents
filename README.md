# AI Multi-Agent

Персональная мульти-агентная AI-система: чат-интерфейс, в котором LLM-оркестратор автоматически определяет тип запроса и маршрутизирует его к одному из 7 специализированных агентов. Ориентирован на российский рынок (VK, Яндекс, Telegram).

**Production:** [ai-agents-seven-gray.vercel.app](https://ai-agents-seven-gray.vercel.app)

---

## Агенты

| Агент      | Специализация                                       |
| ---------- | --------------------------------------------------- |
| Coder      | Код, дебаг, архитектура, code-review                |
| Writer     | Копирайтинг, редактура, переводы                    |
| Marketer   | VK, Telegram, Яндекс Директ, воронки продаж         |
| Targeting  | Рекламные кабинеты VK/Яндекс/myTarget, ОРД          |
| Analyst    | Данные, Метрика, исследования, сравнения            |
| Strategist | Бизнес-анализ, УТП, фреймворки                      |
| Assistant  | Fallback для всего остального                       |

---

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Переменные окружения

Создай файл `.env.local` в корне проекта:

```env
# Обязательно — LLM провайдер
DEEPSEEK_API_KEY=sk-...

# Опционально — веб-поиск (без него агенты работают без актуальных данных)
TAVILY_API_KEY=tvly-...
```

### 3. Запуск в режиме разработки

```bash
npm run dev
```

Приложение запустится на <http://localhost:3000>

### 4. Сборка для продакшена

```bash
npm run build
npm start
```

---

## Архитектура

```text
POST /api/chat
    │
    ▼
Фаза 1 — Маршрутизация (deepseek-chat, 10с таймаут)
    │  Если QuickPrompt — пропускается (agentName передаётся напрямую)
    ▼
Фаза 2 — Веб-поиск (Tavily, 8с таймаут, только для marketer/targeting/analyst/strategist/assistant)
    │
    ▼
Фаза 3 — Стриминг ответа (deepseek-chat или deepseek-reasoner)
```

**Хранилище:** вся история чатов — только в `localStorage` браузера. Серверной БД нет.

---

## Структура проекта

```text
src/
  app/
    api/chat/route.ts      — единственная серверная точка входа
    page.tsx               — главная страница, весь UI state
  agents/
    registry.ts            — реестр агентов (единственный источник конфигурации)
    *.ts                   — реализации агентов
  lib/
    prompts.ts             — все системные промпты
    constants.ts           — MODEL_NAME, температуры
    deepseek.ts            — DeepSeek клиент
    web-search.ts          — Tavily API
    chat-store.ts          — CRUD для localStorage
  components/
    chat/                  — UI чата (MessageList, ArtifactPanel, QuickPrompts…)
    layout/                — Header, Sidebar

marketing-assistant/       — отдельный PHP-проект для reg.ru
```

---

## Деплой

### Основное приложение → Vercel (автоматически)

```powershell
npm run build              # убедиться что нет ошибок TypeScript
git add <файлы>
git commit -m "feat: ..."
git push origin master:main
```

Vercel подхватывает push в `main` и деплоит автоматически (~1–2 мин).

### Marketing Assistant → reg.ru (вручную)

Загрузить изменённые файлы из `marketing-assistant/` через файловый менеджер reg.ru.

---

## Защита /api/chat

Middleware (`src/middleware.ts`) уже задеплоен. Для активации добавь переменную `CHAT_API_KEY` в Vercel → Settings → Environment Variables.

---

## Стек

- **Next.js 16** (App Router + Turbopack)
- **React 19** + TypeScript 5.9
- **Vercel AI SDK 6** + `@ai-sdk/react` 3
- **DeepSeek** (`deepseek-chat` / `deepseek-reasoner`)
- **Tailwind CSS v4** + shadcn/ui
- **`@tanstack/react-virtual` 3** — виртуализация списка сообщений
