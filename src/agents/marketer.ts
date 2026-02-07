import { createSpecialistAgent } from './create-agent';
import { MARKETER_PROMPT } from '@/lib/prompts';

export const runMarketerAgent = createSpecialistAgent({
  systemPrompt: MARKETER_PROMPT,
  temperature: 0.6,
});
