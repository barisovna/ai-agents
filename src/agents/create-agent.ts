import { deepseek } from '@/lib/deepseek';
import { streamText, type UIMessage, convertToModelMessages } from 'ai';
import { MODEL_NAME, MAX_OUTPUT_TOKENS } from '@/lib/constants';

interface AgentConfig {
  systemPrompt: string;
  temperature: number;
}

export function createSpecialistAgent(config: AgentConfig) {
  return async function run(messages: UIMessage[]) {
    return streamText({
      model: deepseek(MODEL_NAME),
      system: config.systemPrompt,
      messages: await convertToModelMessages(messages),
      temperature: config.temperature,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
  };
}
