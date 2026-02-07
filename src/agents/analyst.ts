import { createSpecialistAgent } from './create-agent';
import { ANALYST_PROMPT } from '@/lib/prompts';

export const runAnalystAgent = createSpecialistAgent({
  systemPrompt: ANALYST_PROMPT,
  temperature: 0.4,
});
