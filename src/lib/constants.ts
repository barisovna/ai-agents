export const MODEL_NAME = 'deepseek-chat';
export const MAX_OUTPUT_TOKENS = 8192;

export const AGENT_TEMPERATURES: Record<string, number> = {
  coder: 0.3,
  writer: 0.8,
  marketer: 0.6,
  targeting: 0.5,
  analyst: 0.4,
  assistant: 0.6,
};
