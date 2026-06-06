import { type UIMessage } from 'ai';
import { runCoderAgent } from './coder';
import { runWriterAgent } from './writer';
import { runMarketerAgent } from './marketer';
import { runTargetingAgent } from './targeting';
import { runAnalystAgent } from './analyst';
import { runAssistantAgent } from './assistant';
import { runStrategistAgent } from './strategist';
import { AGENT_TEMPERATURES } from '@/lib/constants';
import {
  CODER_PROMPT,
  WRITER_PROMPT,
  MARKETER_PROMPT,
  TARGETING_PROMPT,
  ANALYST_PROMPT,
  ASSISTANT_PROMPT,
  STRATEGIST_PROMPT,
} from '@/lib/prompts';

export const AGENT_NAMES = ['coder', 'writer', 'marketer', 'targeting', 'analyst', 'assistant', 'strategist'] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

export interface AgentConfig {
  systemPrompt: string;
  temperature: number;
}

export const AGENT_CONFIGS: Record<AgentName, AgentConfig> = {
  coder:      { systemPrompt: CODER_PROMPT,      temperature: AGENT_TEMPERATURES.coder },
  writer:     { systemPrompt: WRITER_PROMPT,     temperature: AGENT_TEMPERATURES.writer },
  marketer:   { systemPrompt: MARKETER_PROMPT,   temperature: AGENT_TEMPERATURES.marketer },
  targeting:  { systemPrompt: TARGETING_PROMPT,  temperature: AGENT_TEMPERATURES.targeting },
  analyst:    { systemPrompt: ANALYST_PROMPT,    temperature: AGENT_TEMPERATURES.analyst },
  assistant:  { systemPrompt: ASSISTANT_PROMPT,  temperature: AGENT_TEMPERATURES.assistant },
  strategist: { systemPrompt: STRATEGIST_PROMPT, temperature: AGENT_TEMPERATURES.strategist },
};

export const AUTO_SEARCH_AGENTS: Set<AgentName> = new Set([
  'marketer',
  'targeting',
  'analyst',
  'assistant',
  'strategist',
  'writer',
]);

type AgentRunner = (messages: UIMessage[]) => ReturnType<typeof runCoderAgent>;

const agentMap: Record<AgentName, AgentRunner> = {
  coder:      runCoderAgent,
  writer:     runWriterAgent,
  marketer:   runMarketerAgent,
  targeting:  runTargetingAgent,
  analyst:    runAnalystAgent,
  assistant:  runAssistantAgent,
  strategist: runStrategistAgent,
};

export async function runSpecialistAgent(agentName: AgentName, messages: UIMessage[]) {
  const runner = agentMap[agentName];
  if (!runner) {
    return agentMap.assistant(messages);
  }
  return runner(messages);
}
