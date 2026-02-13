import { Badge } from '@/components/ui/badge';

const AGENT_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  coder: {
    label: 'Coder',
    emoji: '💻',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  writer: {
    label: 'Writer',
    emoji: '✍️',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  marketer: {
    label: 'Marketer',
    emoji: '🎯',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  },
  targeting: {
    label: 'Targeting',
    emoji: '🎪',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  analyst: {
    label: 'Analyst',
    emoji: '📊',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  assistant: {
    label: 'Assistant',
    emoji: '🤖',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
};

export function AgentIndicator({
  agentName,
  className,
}: {
  agentName: string;
  className?: string;
}) {
  const config = AGENT_CONFIG[agentName] ?? AGENT_CONFIG.assistant;
  return (
    <Badge variant="outline" className={`${config.color} ${className ?? ''}`}>
      {config.emoji} {config.label}
    </Badge>
  );
}
