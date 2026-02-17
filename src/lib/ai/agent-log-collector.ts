// Agent Log Collector - Captures multi-agent interactions for frontend display

export interface AgentInteractionLog {
  id: string;
  timestamp: string;
  type: "message" | "broadcast" | "vote" | "negotiation" | "alert" | "system";
  from: string;
  to: string;
  priority: "low" | "medium" | "high" | "critical";
  content: string;
  details?: any;
  icon?: string;
}

/**
 * Centralized log collector for agent interactions
 * Captures all multi-agent communications for UI display
 */
class AgentLogCollector {
  private logs: AgentInteractionLog[] = [];
  private maxLogs = 100;
  private enabled = true;

  /**
   * Enable/disable log collection
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Add an interaction log
   */
  addLog(log: Omit<AgentInteractionLog, "id" | "timestamp">) {
    if (!this.enabled) return;

    const fullLog: AgentInteractionLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };

    this.logs.push(fullLog);

    // Keep only the last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Log a message between agents
   */
  logMessage(from: string, to: string, content: string, priority: AgentInteractionLog["priority"] = "medium", details?: any) {
    this.addLog({
      type: "message",
      from,
      to,
      priority,
      content,
      details,
      icon: "💬",
    });
  }

  /**
   * Log a broadcast to all agents
   */
  logBroadcast(from: string, content: string, priority: AgentInteractionLog["priority"] = "medium", details?: any) {
    this.addLog({
      type: "broadcast",
      from,
      to: "all",
      priority,
      content,
      details,
      icon: "📢",
    });
  }

  /**
   * Log a vote
   */
  logVote(agent: string, choice: string, confidence: number, reasoning: string) {
    this.addLog({
      type: "vote",
      from: agent,
      to: "orchestrator",
      priority: "high",
      content: `Voted for: ${choice}`,
      details: { choice, confidence, reasoning },
      icon: "🗳️",
    });
  }

  /**
   * Log a negotiation round
   */
  logNegotiation(round: number, participants: string[], content: string, details?: any) {
    this.addLog({
      type: "negotiation",
      from: "orchestrator",
      to: participants.join(", "),
      priority: "high",
      content: `Round ${round}: ${content}`,
      details,
      icon: "🤝",
    });
  }

  /**
   * Log an alert/warning
   */
  logAlert(from: string, content: string, severity: "warning" | "critical", details?: any) {
    this.addLog({
      type: "alert",
      from,
      to: "all",
      priority: severity === "critical" ? "critical" : "high",
      content,
      details,
      icon: severity === "critical" ? "🚨" : "⚠️",
    });
  }

  /**
   * Log a system event
   */
  logSystem(content: string, details?: any) {
    this.addLog({
      type: "system",
      from: "system",
      to: "all",
      priority: "low",
      content,
      details,
      icon: "🤖",
    });
  }

  /**
   * Get all logs
   */
  getLogs(): AgentInteractionLog[] {
    return [...this.logs];
  }

  /**
   * Get logs since a specific ID
   */
  getLogsSince(lastId: string): AgentInteractionLog[] {
    const index = this.logs.findIndex((log) => log.id === lastId);
    if (index === -1) return this.logs;
    return this.logs.slice(index + 1);
  }

  /**
   * Get recent logs (last N)
   */
  getRecentLogs(count: number = 20): AgentInteractionLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
  }

  /**
   * Get logs count
   */
  count(): number {
    return this.logs.length;
  }
}

// Singleton instance
const logCollector = new AgentLogCollector();

export { logCollector };
export default logCollector;
