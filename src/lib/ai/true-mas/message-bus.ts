/**
 * Décentralized Message Bus for True Multi-Agent System
 * Agents publish events and subscribe to topics
 */

export type MessagePriority = "low" | "medium" | "high" | "critical";
export type MessageType = "request" | "response" | "event" | "broadcast" | "vote" | "negotiate";

export interface TrueMASMessage {
  id: string;
  from: string; // Agent name
  to: string | string[]; // "all" or specific agents
  type: MessageType;
  topic: string; // Topic/domain
  priority: MessagePriority;
  content: any;
  timestamp: number;
  requiresResponse?: boolean;
  inReplyTo?: string;
}

export interface MessageSubscription {
  agentName: string;
  topics: string[];
  callback: (message: TrueMASMessage) => Promise<void>;
}

/**
 * Decentralized message bus
 * - No central authority
 * - Topic-based pub/sub
 * - Async message handling
 * - Message history for debugging
 */
export class MessageBus {
  private subscriptions: Map<string, MessageSubscription[]> = new Map();
  private messageHistory: TrueMASMessage[] = [];
  private messageQueue: TrueMASMessage[] = [];
  private processing = false;

  /**
   * Subscribe agent to topics
   */
  subscribe(
    agentName: string,
    topics: string[],
    callback: (message: TrueMASMessage) => Promise<void>
  ): void {
    const subscription: MessageSubscription = { agentName, topics, callback };

    for (const topic of topics) {
      if (!this.subscriptions.has(topic)) {
        this.subscriptions.set(topic, []);
      }
      this.subscriptions.get(topic)!.push(subscription);
    }

    console.log(`[Bus] ${agentName} subscribed to: ${topics.join(", ")}`);
  }

  /**
   * Publish message to bus
   */
  async publish(message: TrueMASMessage): Promise<void> {
    message.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    message.timestamp = Date.now();

    // Store in history
    this.messageHistory.push(message);
    if (this.messageHistory.length > 500) {
      this.messageHistory = this.messageHistory.slice(-500);
    }

    // Queue for async processing
    this.messageQueue.push(message);

    // Log
    const icon =
      message.type === "broadcast"
        ? "📢"
        : message.type === "request"
          ? "📨"
          : message.type === "response"
            ? "✉️"
            : message.type === "vote"
              ? "🗳️"
              : "💬";

    console.log(
      `${icon} [Bus] ${message.from} → ${Array.isArray(message.to) ? message.to.join(",") : message.to}`
    );
    console.log(`   Topic: ${message.topic} | Type: ${message.type} | Priority: ${message.priority}`);

    // Process queue
    if (!this.processing) {
      await this.processQueue();
    }
  }

  /**
   * Process queued messages asynchronously
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.messageQueue.length === 0) return;

    this.processing = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;

      // Get subscribers for this topic
      const subscribers = this.subscriptions.get(message.topic) || [];

      // Filter by recipient
      const relevantSubscribers = subscribers.filter((sub) => {
        if (message.to === "all") return true;
        if (Array.isArray(message.to)) return message.to.includes(sub.agentName);
        return message.to === sub.agentName;
      });

      // Deliver to all relevant subscribers (parallel)
      await Promise.all(
        relevantSubscribers.map(async (sub) => {
          try {
            await sub.callback(message);
          } catch (error) {
            console.error(`[Bus] Error in ${sub.agentName} handler:`, error);
          }
        })
      );

      // Small delay to prevent event loop blocking
      await new Promise((resolve) => setImmediate(resolve));
    }

    this.processing = false;
  }

  /**
   * Get messages for debugging
   */
  getHistory(filter?: { agentName?: string; topic?: string; limit?: number }): TrueMASMessage[] {
    let result = this.messageHistory;

    if (filter?.agentName) {
      result = result.filter((m) => m.from === filter.agentName || m.to === filter.agentName);
    }

    if (filter?.topic) {
      result = result.filter((m) => m.topic === filter.topic);
    }

    const limit = filter?.limit || 50;
    return result.slice(-limit);
  }

  /**
   * Clear history (use with caution)
   */
  clearHistory(): void {
    this.messageHistory = [];
    this.messageQueue = [];
  }

  /**
   * Get stats
   */
  getStats(): {
    totalMessages: number;
    topicCount: number;
    subscriptionCount: number;
    queueLength: number;
  } {
    const subscriptionCount = Array.from(this.subscriptions.values()).reduce(
      (sum, subs) => sum + subs.length,
      0
    );

    return {
      totalMessages: this.messageHistory.length,
      topicCount: this.subscriptions.size,
      subscriptionCount,
      queueLength: this.messageQueue.length,
    };
  }
}

// Global message bus instance
export const messageBus = new MessageBus();
