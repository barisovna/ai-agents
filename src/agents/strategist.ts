import { createSpecialistAgent } from './create-agent';
import { STRATEGIST_PROMPT } from '@/lib/prompts';

export const runStrategistAgent = createSpecialistAgent({
  systemPrompt: STRATEGIST_PROMPT,
  temperature: 0.5,
});
