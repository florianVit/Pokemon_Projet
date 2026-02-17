// Multi-agent orchestrator with async communication and consensus

import {
  BaseAgent,
  AgentMessage,
  AgentPerception,
  AgentAction,
  Vote,
  VotingResult,
  calculateVotingResult,
} from "./base-agent";
import { TeamPokemon, Quest } from "@/types/adventure";
import { logCollector } from "./agent-log-collector";

/**
 * Orchestrator manages multiple agents, message passing, and consensus
 */
export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private messageQueue: AgentMessage[] = [];
  private conversationHistory: AgentMessage[] = [];
  private votingSessions: Map<string, { votes: Vote[]; deadline: number }> = new Map();

  /**
   * Register an agent with the orchestrator
   */
  registerAgent(agent: BaseAgent): void {
    const info = agent.getInfo();
    this.agents.set(info.name, agent);
    console.log(`[Orchestrator] Registered agent: ${info.name} (${info.role})`);
  }

  /**
   * Send a message between agents
   */
  sendMessage(message: AgentMessage): void {
    this.messageQueue.push(message);
    this.conversationHistory.push(message);

    // Keep history manageable
    if (this.conversationHistory.length > 200) {
      this.conversationHistory = this.conversationHistory.slice(-200);
    }

    // Enhanced logging with visual indicators
    const icon = message.type === "broadcast" ? "📢" : 
                 message.type === "request" ? "📨" :
                 message.type === "response" ? "✉️" :
                 message.type === "vote" ? "🗳️" : "💬";
    
    const priorityIcon = message.priority === "critical" ? "🚨" :
                         message.priority === "high" ? "⚡" :
                         message.priority === "medium" ? "📋" : "📄";
    
    console.log(`${icon} [ORCHESTRATOR] ${message.from} → ${message.to}`);
    console.log(`   Type: ${message.type} | Priority: ${priorityIcon} ${message.priority}`);
    if (message.content?.action) {
      console.log(`   Action: ${message.content.action}`);
    }

    // Capture log for UI display
    const messageType = message.type === "broadcast" ? "broadcast" : 
                       message.type === "vote" ? "vote" : 
                       message.type === "negotiation" ? "negotiation" : "message";
    
    const contentString = typeof message.content === "string" 
      ? message.content 
      : message.content?.action || JSON.stringify(message.content);

    if (message.type === "broadcast") {
      logCollector.logBroadcast(message.from, contentString, message.priority, message.content);
    } else if (message.type === "vote") {
      // Vote will be logged separately in requestVote
    } else {
      logCollector.logMessage(message.from, message.to, contentString, message.priority, message.content);
    }
  }

  /**
   * Broadcast message to all agents
   */
  broadcast(from: string, content: any, priority: AgentMessage["priority"] = "medium"): void {
    const message: AgentMessage = {
      id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from,
      to: "all",
      type: "broadcast",
      content,
      timestamp: Date.now(),
      priority,
    };

    console.log(`\n📢 [BROADCAST] ${from} → ALL AGENTS`);
    console.log(`   Domain: ${content.domain || "general"}`);
    console.log(`   Priority: ${priority}`);
    console.log(`   Recipients: ${this.agents.size} agents will receive this`);

    this.sendMessage(message);
  }

  /**
   * Get messages for a specific agent
   */
  private getMessagesForAgent(agentName: string): AgentMessage[] {
    return this.messageQueue.filter(
      (msg) => msg.to === agentName || msg.to === "all"
    );
  }

  /**
   * Run a single agent's perception-reasoning-action loop
   */
  private async runAgent(
    agentName: string,
    gameState: {
      team: TeamPokemon[];
      currentStep: number;
      totalScore: number;
      quest?: Quest;
    },
    context: Record<string, any>
  ): Promise<AgentAction | null> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      console.warn(`[Orchestrator] Agent not found: ${agentName}`);
      return null;
    }

    // Build perception
    const perception: AgentPerception = {
      gameState,
      messages: this.getMessagesForAgent(agentName),
      context,
    };

    // Run agent
    const action = await agent.run(perception);

    // If agent produced a message action, send it
    if (action && action.type === "message" && action.data?.message) {
      this.sendMessage(action.data.message);
    }

    return action;
  }

  /**
   * Run all agents in parallel (async collaboration)
   */
  async runAllAgents(
    gameState: {
      team: TeamPokemon[];
      currentStep: number;
      totalScore: number;
      quest?: Quest;
    },
    context: Record<string, any>
  ): Promise<Map<string, AgentAction | null>> {
    const results = new Map<string, AgentAction | null>();

    // Run all agents concurrently
    const promises = Array.from(this.agents.keys()).map(async (agentName) => {
      const action = await this.runAgent(agentName, gameState, context);
      results.set(agentName, action);
    });

    await Promise.all(promises);

    // Clear processed messages
    this.messageQueue = [];

    return results;
  }

  /**
   * Run agents sequentially (pipeline mode)
   */
  async runPipeline(
    agentNames: string[],
    gameState: {
      team: TeamPokemon[];
      currentStep: number;
      totalScore: number;
      quest?: Quest;
    },
    context: Record<string, any>
  ): Promise<Map<string, AgentAction | null>> {
    const results = new Map<string, AgentAction | null>();

    for (const agentName of agentNames) {
      // Pass results from previous agents in context
      const enrichedContext = {
        ...context,
        previousResults: Object.fromEntries(results),
      };

      const action = await this.runAgent(agentName, gameState, enrichedContext);
      results.set(agentName, action);

      // If agent requests to stop pipeline
      if (action?.data?.stopPipeline) {
        console.log(`[Orchestrator] Pipeline stopped by ${agentName}`);
        break;
      }
    }

    // Clear processed messages
    this.messageQueue = [];

    return results;
  }

  /**
   * Request voting from multiple agents on a decision
   */
  async requestVote(
    initiator: string,
    question: string,
    options: string[],
    context: any,
    timeout: number = 5000
  ): Promise<VotingResult> {
    const sessionId = `vote_${Date.now()}`;
    const deadline = Date.now() + timeout;

    this.votingSessions.set(sessionId, {
      votes: [],
      deadline,
    });

    // Broadcast vote request
    this.broadcast(
      initiator,
      {
        sessionId,
        question,
        options,
        context,
        domain: "decision",
      },
      "high"
    );

    console.log(`\n🗳️  [VOTING SESSION STARTED]`);
    console.log(`   Question: "${question}"`);
    console.log(`   Options: ${options.join(", ")}`);
    console.log(`   Timeout: ${timeout}ms`);
    console.log(`   Waiting for ${this.agents.size} agents to vote...\n`);

    // Wait for votes (with timeout)
    const votes: Vote[] = [];
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      // Check for vote messages
      const voteMessages = this.messageQueue.filter(
        (msg) =>
          msg.type === "vote" &&
          msg.content?.sessionId === sessionId &&
          !votes.find((v) => v.agentName === msg.from)
      );

      for (const msg of voteMessages) {
        const agent = this.agents.get(msg.from);
        if (agent) {
          votes.push({
            agentName: msg.from,
            choice: msg.content.choice,
            confidence: msg.content.confidence,
            reasoning: msg.content.reasoning,
            weight: agent.getInfo().votingWeight,
          });

          const confidenceBar = "█".repeat(Math.round(msg.content.confidence * 10));
          console.log(`   🗳️  ${msg.from}: ${msg.content.choice}`);
          console.log(`      Confidence: ${confidenceBar} ${(msg.content.confidence * 100).toFixed(0)}%`);
          console.log(`      Reasoning: ${msg.content.reasoning}`);

          // Log vote for UI
          logCollector.logVote(
            msg.from,
            msg.content.choice,
            msg.content.confidence,
            msg.content.reasoning
          );
        }
      }

      // If all agents voted, break early
      if (votes.length === this.agents.size) {
        break;
      }

      // Small delay before checking again
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Calculate result
    const result = calculateVotingResult(votes);

    console.log(`\n🏆 [VOTING RESULT]`);
    console.log(`   Winner: ${result.winner}`);
    console.log(`   Consensus: ${result.consensus ? "✅ YES (>70%)" : "❌ NO (<70%)"}`);
    console.log(`   Total votes: ${votes.length}/${this.agents.size}`);
    console.log(`   Confidence: ${(result.totalConfidence / votes.length * 100).toFixed(0)}%`);
    console.log(`   Reasoning: ${result.reasoningSummary.substring(0, 100)}...\n`);

    // Clean up
    this.votingSessions.delete(sessionId);

    return result;
  }

  /**
   * Facilitate negotiation between agents until consensus
   */
  async negotiateUntilConsensus(
    participants: string[],
    topic: string,
    initialProposals: Map<string, any>,
    maxRounds: number = 3
  ): Promise<{ consensus: any; rounds: number; agreed: boolean }> {
    console.log(`\n🤝 [NEGOTIATION STARTED]`);
    console.log(`   Topic: "${topic}"`);
    console.log(`   Participants: ${participants.join(", ")}`);
    console.log(`   Max rounds: ${maxRounds}\n`);

    // Log negotiation start for UI
    logCollector.logSystem(`Negotiation started: ${topic}`, {
      participants,
      maxRounds,
      proposalsCount: initialProposals.size,
    });

    let currentProposals = initialProposals;
    let round = 0;

    while (round < maxRounds) {
      round++;
      console.log(`\n💬 [NEGOTIATION ROUND ${round}/${maxRounds}]`);

      // Log negotiation round
      logCollector.logNegotiation(
        round,
        participants,
        topic,
        { proposalsCount: currentProposals.size }
      );

      // Each participant reviews others' proposals
      const reviews = new Map<string, any>();

      for (const agentName of participants) {
        // Send proposals to agent for review
        const reviewMessage: AgentMessage = {
          id: `negotiation_${round}_${agentName}_${Date.now()}`,
          from: "orchestrator",
          to: agentName,
          type: "negotiation",
          content: {
            round,
            topic,
            proposals: Object.fromEntries(currentProposals),
          },
          timestamp: Date.now(),
          priority: "high",
          requiresResponse: true,
        };

        this.sendMessage(reviewMessage);

        // Run agent to get response
        const agent = this.agents.get(agentName);
        if (agent) {
          const action = await this.runAgent(
            agentName,
            {} as any,
            { negotiationRound: round }
          );

          if (action && action.type === "generate") {
            reviews.set(agentName, action.data);
          }
        }
      }

      // Check for consensus
      const agreements = Array.from(reviews.values()).filter(
        (r) => r.agrees === true
      ).length;

      const consensusReached = agreements >= participants.length * 0.7;

      if (consensusReached) {
        // Find most agreed proposal
        const proposalScores = new Map<string, number>();

        for (const [agentName, review] of reviews.entries()) {
          if (review.preferredProposal) {
            const current = proposalScores.get(review.preferredProposal) || 0;
            proposalScores.set(review.preferredProposal, current + 1);
          }
        }

        const winner = Array.from(proposalScores.entries()).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0];

        const consensus = winner ? currentProposals.get(winner) : null;

        console.log(`\n✅ [CONSENSUS REACHED!]`);
        console.log(`   Round: ${round}/${maxRounds}`);
        console.log(`   Winner: ${winner}`);
        console.log(`   Agreement: ${agreements}/${participants.length} agents (${Math.round(agreements/participants.length*100)}%)`);

        // Log consensus for UI
        logCollector.logSystem(`Consensus reached: ${winner}`, {
          round,
          winner,
          agreements,
          total: participants.length,
          percentage: Math.round(agreements/participants.length*100),
        });

        return { consensus, rounds: round, agreed: true };
      }

      // Update proposals based on feedback
      for (const [agentName, review] of reviews.entries()) {
        if (review.revisedProposal) {
          currentProposals.set(agentName, review.revisedProposal);
        }
      }
    }

    console.log(`\n❌ [NO CONSENSUS]`);
    console.log(`   Completed: ${maxRounds} rounds`);
    console.log(`   Using fallback proposal\n`);

    // Return most popular proposal
    const fallback = Array.from(currentProposals.values())[0];

    return { consensus: fallback, rounds: maxRounds, agreed: false };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(limit: number = 50): AgentMessage[] {
    return this.conversationHistory.slice(-limit);
  }

  /**
   * Get all registered agents
   */
  getAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Clear all messages and reset
   */
  reset(): void {
    this.messageQueue = [];
    this.conversationHistory = [];
    this.votingSessions.clear();
    console.log("[Orchestrator] Reset complete");
  }
}
