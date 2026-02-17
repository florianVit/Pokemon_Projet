// Base architecture for autonomous multi-agent system

import { TeamPokemon, Quest } from "@/types/adventure";

/**
 * Message structure for inter-agent communication
 */
export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: "request" | "response" | "broadcast" | "negotiation" | "vote";
  content: any;
  timestamp: number;
  priority: "low" | "medium" | "high" | "critical";
  requiresResponse?: boolean;
  inReplyTo?: string;
}

/**
 * Agent perception - what the agent observes
 */
export interface AgentPerception {
  gameState: {
    team: TeamPokemon[];
    currentStep: number;
    totalScore: number;
    quest?: Quest;
  };
  messages: AgentMessage[];
  context: Record<string, any>;
}

/**
 * Agent action - what the agent can do
 */
export interface AgentAction {
  type: "generate" | "validate" | "message" | "vote" | "wait";
  data: any;
  confidence: number; // 0-1
  reasoning: string;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  name: string;
  role: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  expertise: string[]; // Domaines d'expertise
  canInitiate: boolean; // Peut initier des conversations
  votingWeight: number; // Poids dans les décisions collectives
}

/**
 * Base autonomous agent with perception-reasoning-action loop
 */
export abstract class BaseAgent {
  protected config: AgentConfig;
  protected memory: AgentMessage[] = [];
  protected internalState: Record<string, any> = {};
  protected isActive: boolean = true;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * PERCEIVE: Observe the environment and incoming messages
   */
  perceive(perception: AgentPerception): void {
    // Store new messages
    const newMessages = perception.messages.filter(
      (msg) =>
        (msg.to === this.config.name || msg.to === "all") &&
        !this.memory.find((m) => m.id === msg.id)
    );
    
    this.memory.push(...newMessages);
    
    // Keep only last 50 messages
    if (this.memory.length > 50) {
      this.memory = this.memory.slice(-50);
    }

    // Update internal state
    this.internalState = {
      ...this.internalState,
      lastPerception: perception,
      lastPerceptionTime: Date.now(),
    };
  }

  /**
   * REASON: Decide what action to take based on perception
   * This is agent-specific and must be implemented
   */
  abstract reason(): Promise<AgentAction | null>;

  /**
   * ACT: Execute the decided action
   */
  abstract act(action: AgentAction): Promise<any>;

  /**
   * Main autonomous loop
   */
  async run(perception: AgentPerception): Promise<AgentAction | null> {
    if (!this.isActive) return null;

    // 1. Perceive
    this.perceive(perception);

    // 2. Reason
    const action = await this.reason();

    // 3. Act (if action decided)
    if (action && action.type !== "wait") {
      await this.act(action);
    }

    return action;
  }

  /**
   * Send message to another agent
   */
  protected createMessage(
    to: string,
    type: AgentMessage["type"],
    content: any,
    priority: AgentMessage["priority"] = "medium",
    requiresResponse: boolean = false
  ): AgentMessage {
    return {
      id: `${this.config.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: this.config.name,
      to,
      type,
      content,
      timestamp: Date.now(),
      priority,
      requiresResponse,
    };
  }

  /**
   * Get messages addressed to this agent
   */
  protected getUnreadMessages(): AgentMessage[] {
    return this.memory.filter((msg) => !msg.content?.read);
  }

  /**
   * Mark message as read
   */
  protected markAsRead(messageId: string): void {
    const msg = this.memory.find((m) => m.id === messageId);
    if (msg) {
      msg.content = { ...msg.content, read: true };
    }
  }

  /**
   * Get agent info
   */
  getInfo(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Check if agent should respond to a message
   */
  protected shouldRespond(message: AgentMessage): boolean {
    // Always respond to direct requests
    if (message.to === this.config.name && message.requiresResponse) {
      return true;
    }

    // Respond if it's in our expertise domain
    if (message.type === "broadcast" && message.content?.domain) {
      return this.config.expertise.includes(message.content.domain);
    }

    return false;
  }

  /**
   * Stop the agent
   */
  stop(): void {
    this.isActive = false;
  }

  /**
   * Restart the agent
   */
  start(): void {
    this.isActive = true;
  }
}

/**
 * Voting mechanism for consensus
 */
export interface Vote {
  agentName: string;
  choice: string;
  confidence: number;
  reasoning: string;
  weight: number;
}

export interface VotingResult {
  winner: string;
  votes: Vote[];
  totalConfidence: number;
  consensus: boolean; // true if >70% agreement
  reasoningSummary: string;
}

/**
 * Calculate voting result with weighted confidence
 */
export function calculateVotingResult(votes: Vote[]): VotingResult {
  if (votes.length === 0) {
    return {
      winner: "none",
      votes: [],
      totalConfidence: 0,
      consensus: false,
      reasoningSummary: "No votes received",
    };
  }

  // Group by choice
  const grouped = new Map<string, { totalWeight: number; totalConfidence: number; votes: Vote[] }>();
  
  for (const vote of votes) {
    const existing = grouped.get(vote.choice) || { totalWeight: 0, totalConfidence: 0, votes: [] };
    existing.totalWeight += vote.weight;
    existing.totalConfidence += vote.confidence * vote.weight;
    existing.votes.push(vote);
    grouped.set(vote.choice, existing);
  }

  // Find winner
  let maxScore = 0;
  let winner = "none";
  let winnerVotes: Vote[] = [];

  for (const [choice, data] of grouped.entries()) {
    const score = data.totalConfidence;
    if (score > maxScore) {
      maxScore = score;
      winner = choice;
      winnerVotes = data.votes;
    }
  }

  // Calculate consensus (>70% weighted agreement)
  const totalWeight = votes.reduce((sum, v) => sum + v.weight, 0);
  const winnerWeight = grouped.get(winner)?.totalWeight || 0;
  const consensus = (winnerWeight / totalWeight) > 0.7;

  const reasoningSummary = winnerVotes
    .map((v) => `${v.agentName}: ${v.reasoning}`)
    .join("; ");

  return {
    winner,
    votes,
    totalConfidence: maxScore,
    consensus,
    reasoningSummary,
  };
}
