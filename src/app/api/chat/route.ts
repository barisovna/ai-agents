import {
  generateText,
  streamText,
  tool,
  type UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from 'ai';
import { deepseek } from '@/lib/deepseek';
import { z } from 'zod';
import { ORCHESTRATOR_PROMPT } from '@/lib/prompts';
import { type AgentName, AGENT_NAMES, AGENT_CONFIGS, AUTO_SEARCH_AGENTS } from '@/agents/registry';
import { MODEL_NAME, MAX_OUTPUT_TOKENS } from '@/lib/constants';
import { searchWeb } from '@/lib/web-search';

export const maxDuration = 300;

// Short messages that don't need web search
const MIN_SEARCH_LENGTH = 15;

// Keep conversation focused
const MAX_MESSAGES = 30;

function trimMessages(messages: UIMessage[]): UIMessage[] {
  if (messages.length <= MAX_MESSAGES) return messages;

  const first = messages.slice(0, 2);
  const recent = messages.slice(-(MAX_MESSAGES - 2));

  const skipped = messages.length - MAX_MESSAGES;
  const noteText = `[Системная заметка: пропущено ${skipped} сообщений из середины диалога. Первые сообщения и последние ${MAX_MESSAGES - 2} сообщений сохранены.]`;
  const summaryMessage: UIMessage = {
    id: 'context-note',
    role: 'user' as const,
    parts: [{ type: 'text' as const, text: noteText }],
  };

  return [...first, summaryMessage, ...recent];
}

function getLastUserMessage(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return (
        messages[i].parts
          ?.filter((p) => p.type === 'text')
          .map((p) => p.text)
          .join('') ?? ''
      );
    }
  }
  return '';
}

// Timeout wrapper for any async operation
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// Strip messages to only text parts — prevents convertToModelMessages errors
// on data-agent/tool-call parts stored in localStorage from previous sessions
function sanitizeMessages(messages: UIMessage[]): UIMessage[] {
  return messages
    .map((m) => ({
      ...m,
      parts: (m.parts ?? []).filter(
        (p): p is { type: 'text'; text: string } =>
          p.type === 'text' && typeof (p as { type: string; text?: string }).text === 'string',
      ),
    }))
    .filter((m) => m.parts.length > 0);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawMessages: UIMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const forceAgent: string | undefined = body?.forceAgent;

    const messages = trimMessages(rawMessages);

    // Phase 1: Classify intent (non-streaming, fast) — 10s timeout
    // Skip if client already knows the target agent (e.g. QuickPrompts direct routing)
    let selectedAgent: AgentName = 'assistant';

    if (forceAgent && AGENT_NAMES.includes(forceAgent as AgentName)) {
      selectedAgent = forceAgent as AgentName;
    } else try {
      const routingResult = await withTimeout(
        generateText({
          model: deepseek('deepseek-chat'),
          system: ORCHESTRATOR_PROMPT,
          messages: await convertToModelMessages(sanitizeMessages(messages)),
          tools: {
            routeToAgent: tool({
              description: 'Route the user message to the best specialist agent',
              inputSchema: z.object({
                agentName: z.enum(['coder', 'writer', 'marketer', 'targeting', 'analyst', 'assistant', 'strategist']),
                reasoning: z.string(),
              }),
            }),
          },
          toolChoice: { type: 'tool', toolName: 'routeToAgent' },
          maxOutputTokens: 150,
          temperature: 0.1,
        }),
        10000,
        null,
      );

      if (routingResult) {
        const call = routingResult.toolCalls[0];
        if (call && 'input' in call) {
          const input = call.input as { agentName: string; reasoning: string };
          selectedAgent = input.agentName as AgentName;
        }
      }
    } catch (error) {
      console.error('Routing failed, falling back to assistant:', error);
    }

    // Phase 2: Web search (only for relevant agents + long enough queries) — 8s timeout
    let searchContext = '';
    const tavilyKey = process.env.TAVILY_API_KEY;
    const userMessage = getLastUserMessage(messages);
    const shouldSearch = AUTO_SEARCH_AGENTS.has(selectedAgent) && tavilyKey && userMessage.length >= MIN_SEARCH_LENGTH;

    if (shouldSearch) {
      try {
        const results = await withTimeout(searchWeb(userMessage), 8000, '');
        if (results && !results.includes('не настроен') && !results.includes('Ошибка') && results.length > 20) {
          searchContext = `\n\n## Актуальные данные из интернета (используй в ответе, ссылайся на источники):\n\n${results}`;
        }
      } catch (error) {
        console.error('[Search] Failed:', error);
      }
    }

    // Phase 3: Stream response
    const now = new Date();
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    const dateStr = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()} года, ${dayNames[now.getDay()]}`;
    const dateContext = `\n\n## КРИТИЧЕСКИ ВАЖНО — Текущая дата: ${dateStr}
- Сейчас ${now.getFullYear()} год. ЗАПРЕЩЕНО ссылаться на данные прошлых лет как на актуальные.
- Если у тебя нет свежих данных за ${now.getFullYear()} год — так и скажи: "точных данных за ${now.getFullYear()} у меня нет, рекомендую проверить на официальном сайте".
- НИКОГДА не пиши "актуально на 2024 год" или любой прошлый год. Либо даёшь свежее, либо честно говоришь что не знаешь.
- Если в контексте есть данные из веб-поиска — используй ТОЛЬКО их, а не свои старые знания.
- Рынок: Россия (основной фокус).
\n`;

    const basePrompt = AGENT_CONFIGS[selectedAgent].systemPrompt + dateContext;
    const systemPrompt = searchContext ? `${basePrompt}\n${searchContext}` : basePrompt;

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        try {
          writer.write({
            type: 'data-agent' as const,
            data: JSON.stringify({ agentName: selectedAgent }),
          });

          const modelMessages = await convertToModelMessages(sanitizeMessages(messages));

          const result = streamText({
            model: deepseek(MODEL_NAME),
            system: systemPrompt,
            messages: modelMessages,
            temperature: AGENT_CONFIGS[selectedAgent].temperature,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
          });

          writer.merge(result.toUIMessageStream());
        } catch (error) {
          console.error('[Stream] Error:', error);
          writer.write({
            type: 'error' as const,
            errorText: 'Ошибка генерации ответа. Попробуйте ещё раз.',
          });
        }
      },
      onError: (error) => {
        console.error('[Stream onError]:', error);
        return 'Ошибка при генерации ответа. Попробуйте отправить сообщение ещё раз.';
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error('[POST] Top-level error:', error);
    return new Response(
      JSON.stringify({ error: 'Внутренняя ошибка сервера. Попробуйте ещё раз.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
