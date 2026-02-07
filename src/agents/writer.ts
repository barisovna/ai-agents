import { createSpecialistAgent } from './create-agent';
import { WRITER_PROMPT } from '@/lib/prompts';

export const runWriterAgent = createSpecialistAgent({
  systemPrompt: WRITER_PROMPT,
  temperature: 0.8,
});
