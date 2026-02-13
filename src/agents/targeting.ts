import { createSpecialistAgent } from './create-agent';
import { TARGETING_PROMPT } from '@/lib/prompts';

export const runTargetingAgent = createSpecialistAgent({
  systemPrompt: TARGETING_PROMPT,
  temperature: 0.5,
});
