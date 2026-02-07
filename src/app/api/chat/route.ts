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

// Agents that benefit from web search
const SEARCH_ENABLED_AGENTS: Set<AgentName> = new Set([
  'marketer',
  'analyst',
  'assistant',
  'writer',
]);

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

  // Phase 2: Stream specialist response with agent metadata + web search tool
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // Send agent name as a custom data part
      writer.write({
        type: 'data-agent' as const,
        data: JSON.stringify({ agentName: selectedAgent }),
      });

      const hasSearch = SEARCH_ENABLED_AGENTS.has(selectedAgent) && !!process.env.TAVILY_API_KEY;

      const result = streamText({
        model: deepseek(MODEL_NAME),
        system: AGENT_PROMPTS[selectedAgent],
        messages: await convertToModelMessages(messages),
        temperature: AGENT_TEMPERATURES[selectedAgent] ?? 0.6,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        ...(hasSearch
          ? {
              tools: {
                searchWeb: tool({
                  description:
                    'Search the web for current, up-to-date information. Use this when you need: latest news, current prices, recent platform updates, fresh statistics, trending topics, or any information that might have changed after your training data cutoff. Always search when the user asks about current events or recent changes.',
                  inputSchema: z.object({
                    query: z
                      .string()
                      .describe('Search query in the language most relevant to the topic'),
                  }),
                  execute: async ({ query }) => {
                    return await searchWeb(query);
                  },
                }),
              },
              maxSteps: 3,
            }
          : {}),
      });

      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}
