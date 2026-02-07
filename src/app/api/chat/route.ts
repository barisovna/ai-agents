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
  ANALYST_PROMPT,
  ASSISTANT_PROMPT,
} from '@/lib/prompts';
import { AGENT_TEMPERATURES, MODEL_NAME, MAX_OUTPUT_TOKENS } from '@/lib/constants';
import { searchWeb } from '@/lib/web-search';

export const maxDuration = 60;

const AGENT_PROMPTS: Record<AgentName, string> = {
  coder: CODER_PROMPT,
  writer: WRITER_PROMPT,
  marketer: MARKETER_PROMPT,
  analyst: ANALYST_PROMPT,
  assistant: ASSISTANT_PROMPT,
};

// Agents that get automatic web search before responding
const AUTO_SEARCH_AGENTS: Set<AgentName> = new Set([
  'marketer',
  'analyst',
  'assistant',
]);

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

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Phase 1: Classify intent (non-streaming, fast)
  let selectedAgent: AgentName = 'assistant';

  try {
    const routingResult = await generateText({
      model: deepseek('deepseek-chat'),
      system: ORCHESTRATOR_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: {
        routeToAgent: tool({
          description: 'Route the user message to the best specialist agent',
          inputSchema: z.object({
            agentName: z.enum(['coder', 'writer', 'marketer', 'analyst', 'assistant']),
            reasoning: z.string(),
          }),
        }),
      },
      toolChoice: { type: 'tool', toolName: 'routeToAgent' },
      maxOutputTokens: 150,
      temperature: 0.1,
    });

    const call = routingResult.toolCalls[0];
    if (call && 'input' in call) {
      const input = call.input as { agentName: string; reasoning: string };
      selectedAgent = input.agentName as AgentName;
    }
  } catch (error) {
    console.error('Routing failed, falling back to assistant:', error);
  }

  // Phase 2: Auto web search (before streaming, for relevant agents)
  let searchContext = '';
  const tavilyKey = process.env.TAVILY_API_KEY;
  const shouldSearch = AUTO_SEARCH_AGENTS.has(selectedAgent);

  console.log('[Search] Agent:', selectedAgent, '| Should search:', shouldSearch, '| Has Tavily key:', !!tavilyKey, '| Key prefix:', tavilyKey?.slice(0, 8) ?? 'MISSING');

  if (shouldSearch && tavilyKey) {
    const userMessage = getLastUserMessage(messages);
    console.log('[Search] User message:', userMessage.slice(0, 100));
    if (userMessage) {
      try {
        console.log('[Search] Calling Tavily API...');
        const results = await searchWeb(userMessage);
        console.log('[Search] Results length:', results.length, '| First 200 chars:', results.slice(0, 200));
        if (results && !results.includes('не настроен') && !results.includes('Ошибка')) {
          searchContext = `\n\n## Актуальные данные из интернета (используй эту информацию в ответе, ссылайся на источники):\n\n${results}`;
          console.log('[Search] Context injected, length:', searchContext.length);
        } else {
          console.log('[Search] Results filtered out (error or not configured)');
        }
      } catch (error) {
        console.error('[Search] Failed:', error);
      }
    }
  } else {
    console.log('[Search] Skipped. Reason:', !shouldSearch ? 'agent not in auto-search list' : 'no TAVILY_API_KEY');
  }

  // Phase 3: Stream specialist response with fresh web data
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({
        type: 'data-agent' as const,
        data: JSON.stringify({ agentName: selectedAgent }),
      });

      const systemPrompt = searchContext
        ? `${AGENT_PROMPTS[selectedAgent]}\n${searchContext}`
        : AGENT_PROMPTS[selectedAgent];

      const result = streamText({
        model: deepseek(MODEL_NAME),
        system: systemPrompt,
        messages: await convertToModelMessages(messages),
        temperature: AGENT_TEMPERATURES[selectedAgent] ?? 0.6,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}
