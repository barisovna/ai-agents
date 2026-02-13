import { type UIMessage } from 'ai';
import { runCoderAgent } from './coder';
import { runWriterAgent } from './writer';
import { runMarketerAgent } from './marketer';
import { runTargetingAgent } from './targeting';
import { runAnalystAgent } from './analyst';
import { runAssistantAgent } from './assistant';

export const AGENT_NAMES = ['coder', 'writer', 'marketer', 'targeting', 'analyst', 'assistant'] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

type AgentRunner = (messages: UIMessage[]) => ReturnType<typeof runCoderAgent>;

const agentMap: Record<AgentName, AgentRunner> = {
  coder: runCoderAgent,
  writer: runWriterAgent,
  marketer: runMarketerAgent,
  targeting: runTargetingAgent,
  analyst: runAnalystAgent,
  assistant: runAssistantAgent,
};

export async function runSpecialistAgent(
  agentName: AgentName,
  messages: UIMessage[],
) {
  const runner = agentMap[agentName];
  if (!runner) {
    return agentMap.assistant(messages);
  }
  return runner(messages);
}
