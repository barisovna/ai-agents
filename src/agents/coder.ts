import { createSpecialistAgent } from './create-agent';
import { CODER_PROMPT } from '@/lib/prompts';

export const runCoderAgent = createSpecialistAgent({
  systemPrompt: CODER_PROMPT,
  temperature: 0.3,
});
