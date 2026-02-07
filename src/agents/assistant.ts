import { createSpecialistAgent } from './create-agent';
import { ASSISTANT_PROMPT } from '@/lib/prompts';

export const runAssistantAgent = createSpecialistAgent({
  systemPrompt: ASSISTANT_PROMPT,
  temperature: 0.6,
});
