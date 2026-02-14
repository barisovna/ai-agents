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
import { type AgentName } from '@/agents/registry';
import {
  CODER_PROMPT,
  WRITER_PROMPT,
  MARKETER_PROMPT,
  TARGETING_PROMPT,
  ANALYST_PROMPT,
  ASSISTANT_PROMPT,
  STRATEGIST_PROMPT,
} from '@/lib/prompts';
import { AGENT_TEMPERATURES, MODEL_NAME, MAX_OUTPUT_TOKENS } from '@/lib/constants';
import { searchWeb } from '@/lib/web-search';

export const maxDuration = 300;

const AGENT_PROMPTS: Record<AgentName, string> = {
  coder: CODER_PROMPT,
  writer: WRITER_PROMPT,
  marketer: MARKETER_PROMPT,
  targeting: TARGETING_PROMPT,
  analyst: ANALYST_PROMPT,
  assistant: ASSISTANT_PROMPT,
  strategist: STRATEGIST_PROMPT,
};

// Agents that benefit from web search
const AUTO_SEARCH_AGENTS: Set<AgentName> = new Set([
  'marketer',
  'targeting',
  'analyst',
  'assistant',
  'strategist',
]);

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

export async function POST(req: Request) {
  try {
    const { messages: rawMessages }: { messages: UIMessage[] } = await req.json();
    const messages = trimMessages(rawMessages);

    // Phase 1: Classify intent (non-streaming, fast) — 10s timeout
    let selectedAgent: AgentName = 'assistant';

    try {
      const routingResult = await withTimeout(
        generateText({
          model: deepseek('deepseek-chat'),
          system: ORCHESTRATOR_PROMPT,
          messages: await convertToModelMessages(messages),
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
    const dateContext = `\n\n## Текущая дата:\nСегодня: ${dateStr}. Рынок: Россия.\n`;

    const basePrompt = AGENT_PROMPTS[selectedAgent] + dateContext;
    const systemPrompt = searchContext ? `${basePrompt}\n${searchContext}` : basePrompt;

    const modelMessages = await convertToModelMessages(messages);

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        try {
          writer.write({
            type: 'data-agent' as const,
            data: JSON.stringify({ agentName: selectedAgent }),
          });

          const result = streamText({
            model: deepseek(MODEL_NAME),
            system: systemPrompt,
            messages: modelMessages,
            temperature: AGENT_TEMPERATURES[selectedAgent] ?? 0.6,
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
