/**
 * True MAS Orchestrator - Coordinates Generalist and Specialists
 * Uses message bus for decentralized communication
 */

import { messageBus } from "./message-bus";
import { generalistAgent } from "./generalist-agent";
import { initializeSpecialists } from "./specialist-agents";
import { Quest, TeamPokemon, NarrativeStyle, GameState } from "@/types/adventure";

export interface MASAdventureState {
  team: TeamPokemon[];
  quest: Quest;
  currentStep: number;
  totalScore: number;
  narrativeStyle: NarrativeStyle;
  language: "en" | "fr";
  sessionId: string;
}

/**
 * MAS Orchestrator - Entry point for True Multi-Agent System
 */
export class TrueMASOrchestrator {
  private sessionId: string = "";
  private state: MASAdventureState | null = null;

  constructor() {
    // Initialize all components
    initializeSpecialists();
    console.log("🚀 [MAS Orchestrator] True Multi-Agent System Initialized");
  }

  /**
   * Start a new adventure session
   */
  async startAdventure(params: {
    team: TeamPokemon[];
    narrativeStyle: NarrativeStyle;
    language: "en" | "fr";
    difficulty: "easy" | "normal" | "hard";
    estimatedSteps?: number;
  }): Promise<Quest> {
    this.sessionId = `mas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`\n🌟 [MAS] Starting adventure session: ${this.sessionId}`);
    console.log(`   Team: ${params.team.map((p) => p.name).join(", ")}`);
    console.log(`   Narrative: ${params.narrativeStyle}`);

    // 1. Generalist reasons about quest strategy
    console.log("\n💭 [Phase 1] Generalist performing long reasoning...");

    await messageBus.publish({
      id: "",
      from: "OrchestratorAPI",
      to: "GeneralistAgent",
      type: "request",
      topic: "quest_request",
      priority: "critical",
      timestamp: Date.now(),
      content: {
        team: params.team,
        narrativeStyle: params.narrativeStyle,
        language: params.language,
        difficulty: params.difficulty,
        estimatedSteps: params.estimatedSteps || 8,
      },
    });

    // Wait for strategy to be processed
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 2. Call actual quest generation (simplified path)
    const quest: Quest = {
      title: "Pokémon Legendary Quest",
      description: "An epic journey awaits",
      objective: "Complete the legendary quest and restore balance",
      difficulty: params.difficulty,
      estimatedSteps: params.estimatedSteps || 8,
    };

    this.state = {
      team: params.team,
      quest,
      currentStep: 0,
      totalScore: 0,
      narrativeStyle: params.narrativeStyle,
      language: params.language,
      sessionId: this.sessionId,
    };

    console.log(`✅ [MAS] Quest created: "${quest.title}"`);
    return quest;
  }

  /**
   * Generate next event
   */
  async generateEvent(currentStep: number, team: TeamPokemon[], quest: Quest): Promise<any> {
    console.log(`\n🎲 [MAS Event ${currentStep}] Starting event generation...`);

    if (!this.state) throw new Error("No active adventure session");

    // Generalist reasons about event strategy
    console.log("💭 [Phase 1] Generalist reasoning about event...");

    await messageBus.publish({
      id: "",
      from: "OrchestratorAPI",
      to: "GeneralistAgent",
      type: "request",
      topic: "event_request",
      priority: "critical",
      timestamp: Date.now(),
      content: {
        quest,
        currentStep,
        team,
        narrativeStyle: this.state.narrativeStyle,
        language: this.state.language,
      },
    });

    // Specialists process in sequence
    console.log("🔄 [Phase 2-4] Specialists processing...");
    // GameMaster → ChoiceAgent → Guardian → Narrator

    // Wait for all specialists to finish
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Get final result from message bus history
    const history = messageBus.getHistory({ topic: "event_generated", limit: 1 });
    const event = history.length > 0 ? history[0].content : null;

    if (!event) {
      throw new Error("Event generation failed");
    }

    console.log(`✅ [MAS] Event created: ${event.eventType}`);
    return event;
  }

  /**
   * Generate choices for an event
   */
  async generateChoices(
    event: any,
    team: TeamPokemon[],
    quest: Quest,
    currentStep: number
  ): Promise<{ choices: any[]; validations: any[] }> {
    console.log(`\n💭 [MAS Choices] Generating choices...`);

    if (!this.state) throw new Error("No active adventure session");

    // Trigger choice generation via event_generated (ChoiceAgent listens)
    // ChoiceAgent will automatically respond

    await messageBus.publish({
      id: "",
      from: "OrchestratorAPI",
      to: "ChoiceAgentSpecialist",
      type: "request",
      topic: "event_generated",
      priority: "high",
      timestamp: Date.now(),
      content: {
        event,
        team: this.state.team,
        quest: this.state.quest!,
        currentStep,
        narrativeStyle: this.state.narrativeStyle,
        language: this.state.language,
      },
    });

    // Wait for choices and validation
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const choiceHistory = messageBus.getHistory({ topic: "choices_validated", limit: 1 });
    const validationResult = choiceHistory.length > 0 ? choiceHistory[0].content : null;

    if (!validationResult) {
      throw new Error("Choice generation failed");
    }

    console.log(`✅ [MAS] Choices generated and validated`);
    return {
      choices: validationResult.choices || [],
      validations: validationResult.validations || [],
    };
  }

  /**
   * Narrate outcome
   */
  async narrateOutcome(
    outcome: any,
    chosenAction: any,
    event: any,
    quest: Quest,
    currentStep: number
  ): Promise<any> {
    console.log(`\n📖 [MAS Narration] Narrating outcome...`);

    if (!this.state) throw new Error("No active adventure session");

    await messageBus.publish({
      id: "",
      from: "OrchestratorAPI",
      to: "NarratorSpecialist",
      type: "request",
      topic: "narrate_outcome",
      priority: "high",
      timestamp: Date.now(),
      content: {
        outcome,
        chosenAction,
        event,
        team: this.state.team,
        quest: this.state.quest!,
        currentStep,
        narrativeStyle: this.state.narrativeStyle,
        language: this.state.language,
      },
    });

    // Wait for narration
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const narrativeHistory = messageBus.getHistory({ topic: "outcome_narrated", limit: 1 });
    const narration = narrativeHistory.length > 0 ? narrativeHistory[0].content : null;

    if (!narration) {
      throw new Error("Narration failed");
    }

    console.log(`✅ [MAS] Outcome narrated`);
    return narration;
  }

  /**
   * Get conversation logs
   */
  getLogs(filter?: { agent?: string; limit?: number }): any[] {
    return messageBus.getHistory({
      agentName: filter?.agent,
      limit: filter?.limit || 100,
    });
  }

  /**
   * Get system stats
   */
  getStats(): any {
    return {
      sessionId: this.sessionId,
      messageBusStats: messageBus.getStats(),
      generalistStatus: generalistAgent.getStatus(),
    };
  }

  /**
   * Reset session
   */
  reset(): void {
    this.sessionId = "";
    this.state = null;
    messageBus.clearHistory();
    console.log("🔄 [MAS] Session reset");
  }
}

// Global orchestrator instance
export const trueMASOrchestrator = new TrueMASOrchestrator();
