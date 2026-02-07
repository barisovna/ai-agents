export const MODEL_NAME = 'deepseek-chat';
export const MAX_OUTPUT_TOKENS = 4096;

export const AGENT_TEMPERATURES: Record<string, number> = {
  coder: 0.3,
  writer: 0.8,
  analyst: 0.4,
  assistant: 0.6,
};
