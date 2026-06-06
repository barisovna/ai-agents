# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**AI Multi-Agent** — персональная мульти-агентная AI-система: чат-интерфейс, в котором LLM-оркестратор автоматически определяет тип запроса и маршрутизирует его к одному из 7 специализированных агентов. Ориентирован на российский рынок (VK, Яндекс, Telegram).

В репозитории находятся **два независимых проекта:**

1. **Основное приложение** (`/src/`, Next.js + TypeScript) — деплоится на **Vercel** автоматически из ветки `main`
   - Production URL: `https://ai-agents-seven-gray.vercel.app`
   - GitHub: `https://github.com/barisovna/ai-agents`

2. **Marketing Assistant** (`/marketing-assistant/`, PHP + HTML) — деплоится **вручную на reg.ru** через FTP/файловый менеджер
   - Хостинг: reg.ru (PHP-хостинг, домен vitafort.ru)
   - Файлы загружаются вручную через файловый менеджер reg.ru

---

## Режимы работы

### /mode:fix — Дебаг и фикс
Ты senior full-stack разработчик (Next.js / TypeScript / PHP).
ПЕРЕД любым изменением: прочитай файл целиком.
ПОСЛЕ фикса: скажи точно какие файлы затронуты и как задеплоить (git push или reg.ru).
Ищи побочные эффекты на соседние модули.

### /mode:build — Новая фича
Ты tech lead. Перед реализацией задай 3 уточняющих вопроса если задача неоднозначна.
Соблюдай: все промпты только в `src/lib/prompts.ts`, все температуры только в `src/lib/constants.ts`, новые агенты регистрировать в `src/agents/registry.ts`.

### /mode:audit — Проверка качества
Ты опытный фаундер. Смотри на задачу глазами пользователя.
Что сломается при нагрузке? Что не очевидно? Дай оценку 1-10 и конкретный список что не хватает до десятки.

### /mode:security
Ты пентестер. Ищи: открытые endpoints без auth, утечки API-ключей, отсутствие rate-limit, XSS через innerHTML, CORS-проблемы.

### /mode:agents — Работа с агентами
Ты архитектор мульти-агентных систем. При добавлении агента: создай файл в `src/agents/`, добавь промпт в `src/lib/prompts.ts`, добавь температуру в `src/lib/constants.ts`, зарегистрируй в `src/agents/registry.ts` (AGENT_NAMES, AGENT_CONFIGS и при необходимости AUTO_SEARCH_AGENTS — всё здесь). Не дублируй промпты и температуры в `route.ts` — он читает их из реестра.

---

## Запуск проекта

```bash
# Установка зависимостей
npm install

# Разработка (Next.js + Turbopack)
npm run dev

# Сборка для продакшена
npm run build

# Запуск продакшен-сервера
npm start

# Линтинг
npm run lint
```

Приложение запускается на `http://localhost:3000`

---

## Переменные окружения

Создай файл `.env.local` в корне проекта:

```env
# Обязательно — LLM провайдер
DEEPSEEK_API_KEY=sk-...

# Опционально — веб-поиск (без него агенты работают без актуальных данных)
TAVILY_API_KEY=tvly-...
```

На Vercel переменные добавлены в Settings → Environment Variables.
На reg.ru для marketing-assistant: скопировать `config.example.php` → `config.php`, вписать ключ DeepSeek.

---

## Деплой и проверка — стандартный workflow

### Основное приложение (Vercel) — пошагово

**Шаг 1. Сборка и проверка TypeScript (ВСЕГДА перед git push):**
```powershell
npm run build
```
Ожидаемый результат — все зелёные галочки:
```
✓ Compiled successfully
✓ Finished TypeScript
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```
Если `Failed to compile` — НЕ деплоить, сначала починить.

**Шаг 2. Добавить изменённые файлы:**
```powershell
git add имя_файла1 имя_файла2
```
Никогда не использовать `git add .` — можно случайно добавить `.env.local` с секретами.

**Шаг 3. Коммит:**
```powershell
git commit -m "тип: краткое описание"
```
Типы: `feat:` (новая фича), `fix:` (исправление), `refactor:` (рефакторинг).

**Шаг 4. Push на GitHub:**
```powershell
git push origin master:main
```
Успех выглядит так: `master -> main`

**Шаг 5. Проверить деплой на Vercel:**
1. Открыть `https://vercel.com/allayudaevas-projects/ai-agents` → вкладка **Deployments**
2. Подождать пока статус станет **Ready** (1–2 минуты)
3. Открыть `https://ai-agents-seven-gray.vercel.app`
4. Написать тестовое сообщение в чат — агент должен ответить

### Marketing Assistant (reg.ru)
1. Открыть файловый менеджер reg.ru
2. Загрузить изменённые файлы из `marketing-assistant/` в нужную директорию
3. Убедиться что `config.php` существует (создаётся из `config.example.php`)
4. Проверить через `test-api.php` что всё работает

---

## Как включить защиту /api/chat (middleware)

Middleware уже задеплоен в `src/middleware.ts`. Для активации:
1. Открыть Vercel → **Environment Variables**
2. Добавить переменную: `CHAT_API_KEY` = любая строка (например `moj-kluch-2026`)
3. Сохранить → Vercel задеплоит автоматически
4. Без этой переменной endpoint работает как раньше (защита не активна)

---

## Архитектура: трёхфазная обработка запросов

```
Пользователь отправляет сообщение (POST /api/chat)
        │
        ▼
ФАЗА 1 — МАРШРУТИЗАЦИЯ (таймаут 10 сек)
  deepseek-chat, temperature=0.1, maxTokens=150
  Принудительный tool call: routeToAgent({ agentName, reasoning })
  При ошибке/таймауте → fallback: 'assistant'
        │
        ▼
ФАЗА 2 — ВЕБ-ПОИСК (таймаут 8 сек, опционально)
  Только для: marketer, targeting, analyst, assistant, strategist
  Только если: TAVILY_API_KEY задан + длина запроса >= 15 символов
  Результаты вшиваются в системный промпт: "## Актуальные данные из интернета"
        │
        ▼
ФАЗА 3 — СТРИМИНГ ОТВЕТА
  streamText с промптом агента + текущая дата + контекст поиска
  В поток пишется: { type: 'data-agent', agentName } (до первого токена)
  Клиент отображает бейдж активного агента в реальном времени
```

---

## Агенты

| Агент | Специализация | Температура | Веб-поиск |
|---|---|---|---|
| `coder` | Код, дебаг, архитектура, code-review | 0.3 | Нет |
| `writer` | Копирайтинг, редактура, переводы | 0.8 | Нет |
| `marketer` | VK, Telegram, Яндекс Директ, воронки продаж | 0.6 | Да |
| `targeting` | Рекламные кабинеты VK/Яндекс/myTarget, ОРД | 0.5 | Да |
| `analyst` | Данные, Метрика, исследования, сравнения | 0.4 | Да |
| `strategist` | Бизнес-анализ, УТП, фреймворки "4 ПОЧЕМУ" и "Шахматная доска" | 0.5 | Да |
| `assistant` | Всё остальное (fallback) | 0.6 | Да |

Правила маршрутизации из `ORCHESTRATOR_PROMPT`:
- Рекламные кабинеты, CTR/CPC, пиксели → `targeting`
- Маркетинг-стратегия, SMM, воронки → `marketer`
- Яндекс Метрика → `analyst`
- Анализ проекта/бизнеса, "почему не покупают" → `strategist`
- Код → `coder`, тексты → `writer`, остальное → `assistant`

---

## Добавление нового агента (чек-лист)

1. `src/agents/имя.ts` — создать файл через `createSpecialistAgent({ systemPrompt, temperature })`
2. `src/lib/prompts.ts` — добавить константу `ИМЯ_PROMPT`
3. `src/lib/constants.ts` — добавить температуру в `AGENT_TEMPERATURES`
4. `src/agents/registry.ts` — добавить в `AGENT_NAMES`, `AGENT_CONFIGS`, при необходимости в `AUTO_SEARCH_AGENTS`
5. `src/components/chat/agent-indicator.tsx` — добавить в `AGENT_CONFIG` (emoji + цвет + label)
6. `src/lib/prompts.ts` (ORCHESTRATOR_PROMPT) — добавить описание для оркестратора
7. `src/app/api/chat/route.ts` → инструмент `routeToAgent` z.enum(...) — добавить имя агента в список

> **Важно:** `route.ts` больше не хранит промпты — только z.enum для тайпчека. Температуры и промпты — только через `registry.ts`.

---

## Хранилище данных

Вся история чатов хранится **только в localStorage браузера**. Серверной БД нет.

- `ai-agents-chats` — массив всех чатов (messages + agentMap + метаданные)
- `ai-agents-active-chat` — ID текущего чата

**Следствие:** при очистке localStorage вся история теряется. Чаты не синхронизируются между устройствами.

---

## Архитектурные ловушки (не менять без понимания!)

### registry.ts — теперь единственный источник конфигурации агентов ✅

После рефакторинга (июнь 2026) `registry.ts` экспортирует `AGENT_CONFIGS` и `AUTO_SEARCH_AGENTS`. `route.ts` использует `AGENT_CONFIGS[selectedAgent].systemPrompt` и `.temperature` — больше не держит локальный `AGENT_PROMPTS`.

Файлы `src/agents/coder.ts`, `writer.ts` и др. по-прежнему существуют для прямого вызова через `runSpecialistAgent`, но в production-потоке route.ts их не использует напрямую.

### searchWeb в промптах — декоративная инструкция
Все агентские промпты содержат инструкцию "используй `searchWeb`", но модель не может его вызвать — у неё нет такого tool в `streamText`. Поиск делает `route.ts` до начала стриминга и вшивает результат в системный промпт. Инструкция в промпте — только для описания поведения.

### maxDuration коллизия
В `vercel.json` стоит 60 сек, в `route.ts` экспортируется `export const maxDuration = 300`. Экспорт в коде имеет приоритет. На Vercel Free plan — будет ограничено до 60 сек платформой. На Pro — 300 сек.

### trimMessages — контекст обрезается
При > 30 сообщений в чате: сохраняются первые 2 + последние 28 + системная заметка о пропуске. Это нормальное поведение — не баг.

### ArtifactPanel — вкладки для нескольких артефактов ✅

`ArtifactPanel` принимает `artifacts: Artifact[]`. При 2+ артефактах появляются вкладки-табы. `MessageBubble` передаёт все артефакты из сообщения, пользователь переключается между ними.

### MessageList — виртуализация через @tanstack/react-virtual ✅

`MessageList` использует `useVirtualizer` с `measureElement` (ResizeObserver). Inline-стили обязательны — это требование виртуализатора, не баг. `ScrollArea` от Radix заменена на `div` с `overflow-y-auto` для прямого DOM-доступа.

### QuickPrompts — прямая маршрутизация ✅

При клике на QuickPrompt передаётся `{ body: { forceAgent: 'coder' } }` в `sendMessage`. `route.ts` проверяет `forceAgent` и пропускает фазу 1 (оркестратор). Обычная отправка через ChatInput всегда идёт через оркестратор.

### AGENT_TEMPERATURES дубликат
В `constants.ts` есть `AGENT_TEMPERATURES` — используется в `route.ts`. В каждом файле агента (`coder.ts` и др.) температура прописана отдельно — используется при прямом вызове через `createSpecialistAgent`. Это дублирование: при изменении температуры менять в обоих местах.

---

## Ключевые файлы

| Файл | Назначение |
|---|---|
| `src/app/api/chat/route.ts` | Единственная серверная точка входа — весь pipeline здесь |
| `src/lib/prompts.ts` | Все системные промпты агентов и оркестратора |
| `src/lib/constants.ts` | MODEL_NAME, MAX_OUTPUT_TOKENS, AGENT_TEMPERATURES |
| `src/lib/deepseek.ts` | DeepSeek клиент (читает DEEPSEEK_API_KEY) |
| `src/lib/web-search.ts` | Tavily API интеграция |
| `src/lib/chat-store.ts` | CRUD для localStorage (история чатов) |
| `src/lib/utils.ts` | Утилита `cn()` для слияния Tailwind-классов |
| `src/agents/registry.ts` | Реестр агентов (тип AgentName + runSpecialistAgent) |
| `src/agents/create-agent.ts` | Фабрика агентов `createSpecialistAgent()` |
| `src/app/page.tsx` | Главная страница — весь state UI здесь (useChat, чаты, артефакты) |
| `src/app/layout.tsx` | Root layout (шрифты Geist, lang="ru", metadata) |
| `src/app/globals.css` | Tailwind v4 + shadcn токены (oklch цветовое пространство) |
| `src/components/chat/chat-container.tsx` | Оркестратор UI чата |
| `src/components/chat/artifact-panel.tsx` | Боковая панель кода (Прism, Copy, Download) |
| `src/components/chat/agent-indicator.tsx` | Бейдж активного агента (emoji + цвет) |
| `src/components/chat/message-bubble.tsx` | Рендер одного сообщения (user/assistant) |
| `src/components/chat/markdown-renderer.tsx` | react-markdown + remark-gfm + CodeBlock |
| `src/components/chat/quick-prompts.tsx` | Начальный экран с 8 захардкоженными подсказками |
| `src/components/layout/sidebar.tsx` | История чатов, переключение, удаление |
| `marketing-assistant/api-proxy.php` | PHP-прокси к DeepSeek API (CORS + ключ) |
| `marketing-assistant/config.example.php` | Шаблон конфига — скопировать в config.php |
| `marketing-assistant/marketing-assistant-improved.html` | Актуальный UI маркетингового ассистента |
| `vercel.json` | Vercel конфиг (maxDuration: 60 для /api/chat) |
| `next.config.ts` | Next.js конфиг (Turbopack enabled) |

---

## Безопасность — известные проблемы

| Проблема | Серьёзность | Статус |
|---|---|---|
| `/api/chat` открыт без аутентификации — любой тратит твою квоту DeepSeek | Средняя | ✅ Закрыто — middleware (`src/middleware.ts`), активируется через `CHAT_API_KEY` в Vercel |
| Нет rate limiting на API endpoint | Средняя | Открыто |
| Нет валидации входящих `messages` на сервере (только TypeScript compile-time) | Средняя | Открыто |
| `localStorage` хранит историю чатов в открытом виде | Низкая | Открыто |
| `api-debug.log` в marketing-assistant доступен по прямому URL | Средняя | Отключить логи в prod |
| Нет rate limiting в `api-proxy.php` | Средняя | Открыто |
| XSS в `showToast()` через `innerHTML` без экранирования | Низкая | Открыто |

---

## Marketing Assistant — отдельный PHP-проект

**Стек:** Vanilla HTML5 + PHP 7.4+ + DeepSeek API через CURL

**Функционал:**
- 5 AI-персонажей: маркетолог, аналитик, SEO-специалист, контент-стратег, таргетолог
- 9 российских платформ: VK, Telegram, Яндекс, Авито и др.
- 2 режима: `deepseek-chat` (быстро) и `deepseek-reasoner` (глубокий анализ)
- Калькулятор рекламного бюджета
- История сессий в localStorage (до 10 сессий)
- Экспорт диалога в TXT

**Настройка на reg.ru:**
1. Скопировать `config.example.php` → `config.php`
2. Вписать `deepseek_key` из [platform.deepseek.com](https://platform.deepseek.com/api_keys)
3. Открыть `check-php-limits.php` — убедиться что memory >= 512M, max_execution_time >= 300
4. Открыть `test-api.php` — проверить подключение к DeepSeek
5. Защитить config.php через `.htaccess`:
   ```apache
   <Files "config.php">
       Order allow,deny
       Deny from all
   </Files>
   ```

**Критически важно для PHP-хостинга:**
- Если CURL Error 23 — добавить в `api-proxy.php`: `CURLOPT_NOPROGRESS => true`
- Если большие ответы падают — увеличить `memory_limit` через `.htaccess`: `php_value memory_limit 512M`
- Эндпоинт `v3.2_speciale_expires_on_20251215` истёк — использовать стандартный `v1`

---

## Стек и версии

| Технология | Версия |
|---|---|
| Next.js | 16.1.6 (App Router + Turbopack) |
| React | 19.2.3 |
| TypeScript | 5.9.3 |
| Tailwind CSS | v4 (без tailwind.config.js) |
| Vercel AI SDK | 6.x (`ai`) + 3.x (`@ai-sdk/react`) |
| DeepSeek провайдер | `@ai-sdk/deepseek` ^2.0.18 |
| Zod | v4 (валидация tool schemas) |
| shadcn/ui | поверх Radix UI |
| react-markdown | ^10.1.0 |
| Lucide React | ^0.563.0 |

---

## Бэклог (известные задачи)

| # | Задача | Приоритет | Статус |
|---|---|---|---|
| 1 | Подключить `registry.ts` в `route.ts` — убрать дублирование логики | P2 | ✅ Готово |
| 2 | Добавить аутентификацию на `/api/chat` (middleware) | P1 | ✅ Готово |
| 3 | Поддержка нескольких артефактов на одно сообщение | P2 | ✅ Готово |
| 4 | Виртуализация MessageList (react-virtual) при большой истории | P2 | ✅ Готово |
| 5 | Маршрутизация напрямую из QuickPrompts (без оркестратора) | P3 | ✅ Готово |
| 6 | Стриминг ответов в marketing-assistant (PHP SSE) | P2 | ✅ Готово |
| 7 | Добавить `.env.example` с описанием переменных | P2 | ✅ Готово |
| 8 | Обновить README.md — убрать шаблон create-next-app | P3 | ✅ Готово |
| 9 | Удалить/перенести marketing-assistant в отдельный репозиторий | P3 | ⏳ Осталось |
| 10 | Rate limiting в `api-proxy.php` (marketing-assistant) | P1 | ⏳ Осталось |

---

## Правило самопроверки (перед каждым ответом)

1. **Агенты:** если добавляю/меняю агента — обновил ли все 7 мест из чек-листа?
2. **Промпты:** все промпты только в `src/lib/prompts.ts`, не хардкодить в других файлах
3. **Деплой:** это Vercel (git push) или reg.ru (ручная загрузка файлов)?
4. **Мёртвый код:** не добавляю ли код который не будет вызываться?
5. **Безопасность:** не раскрываю ли API-ключи, не добавляю ли innerHTML без экранирования?

## Мои приоритеты

- Отвечай на русском языке
- После изменений всегда уточняй: `git push` на Vercel или вручную на reg.ru?
- Всегда ищи баги и уязвимости попутно
- Объясняй архитектурные решения — почему так, а не иначе
- Не предлагай решений сложнее необходимого
