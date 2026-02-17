// Multi-agent system wrapper - Maintains API compatibility
// This file provides the same interface as adventure-agents.ts but uses the multi-agent system

import { AgentOrchestrator } from "./agent-orchestrator";
import {
  GameMasterAgent,
  ChoiceAgent,
  GuardianAgent,
  NarratorAgent,
} from "./autonomous-agents";
import { logCollector } from "./agent-log-collector";
import {
  Event,
  NarratorResponse,
  Quest,
  TeamPokemon,
  NarrativeStyle,
  Choice,
  RiskLevel,
} from "@/types/adventure";

// Singleton orchestrator
let orchestrator: AgentOrchestrator | null = null;
let gameMaster: GameMasterAgent | null = null;
let choiceAgent: ChoiceAgent | null = null;
let guardian: GuardianAgent | null = null;
let narrator: NarratorAgent | null = null;

/**
 * Initialize the multi-agent system (lazy initialization)
 */
function initializeAgentSystem(): AgentOrchestrator {
  if (!orchestrator) {
    console.log("\n" + "=".repeat(60));
    console.log("🤖 [MULTI-AGENT SYSTEM] Initialization");
    console.log("=".repeat(60));
    
    orchestrator = new AgentOrchestrator();
    
    // Create agents
    console.log("\n🔧 Creating autonomous agents...");
    gameMaster = new GameMasterAgent();
    choiceAgent = new ChoiceAgent();
    guardian = new GuardianAgent();
    narrator = new NarratorAgent();
    
    // Register agents
    console.log("📝 Registering agents with orchestrator...");
    orchestrator.registerAgent(gameMaster);
    orchestrator.registerAgent(choiceAgent);
    orchestrator.registerAgent(guardian);
    orchestrator.registerAgent(narrator);
    
    console.log("\n✅ [MULTI-AGENT SYSTEM] Ready!");
    console.log("   • 4 autonomous agents initialized");
    console.log("   • Inter-agent communication enabled");
    console.log("   • Voting & consensus mechanisms active");
    console.log("=".repeat(60) + "\n");
    
    // Log system initialization
    logCollector.logSystem("Multi-agent system initialized", {
      agents: ["GameMaster", "ChoiceAgent", "GuardianAgent", "NarratorAgent"],
      features: ["inter-agent communication", "voting", "consensus"],
    });
  }
  
  return orchestrator;
}

/**
 * Generate quest using multi-agent system
 * API compatible with original gameMasterGenerateQuest
 */
export async function gameMasterGenerateQuest(params: {
  team: TeamPokemon[];
  narrativeStyle: NarrativeStyle;
  language: "en" | "fr";
  seed: number;
  difficulty?: "easy" | "normal" | "hard";
  estimatedSteps?: number;
}): Promise<Quest> {
  const orch = initializeAgentSystem();
  
  console.log("\n🎯 [QUEST GENERATION] Request received");
  console.log(`   Team size: ${params.team.length}`);
  console.log(`   Style: ${params.narrativeStyle}`);
  console.log(`   Difficulty: ${params.difficulty || "normal"}\n`);
  
  // Send request to GameMaster agent
  orch.sendMessage({
    id: `req_quest_${Date.now()}`,
    from: "system",
    to: "GameMaster",
    type: "request",
    content: {
      action: "generate_quest",
      ...params,
    },
    timestamp: Date.now(),
    priority: "high",
    requiresResponse: true,
  });
  
  // Run GameMaster agent
  const results = await orch.runPipeline(
    ["GameMaster"],
    {
      team: params.team,
      currentStep: 0,
      totalScore: 0,
    },
    { params }
  );
  
  const action = results.get("GameMaster");
  
  if (action && action.type === "generate" && action.data) {
    // Extract quest from action data or generate directly
    // For now, we'll call the original generation logic
    return await gameMaster!.act(action);
  }
  
  throw new Error("Quest generation failed");
}

/**
 * Generate event using multi-agent system with voting
 * API compatible with original gameMasterGenerateQuestEvent
 */
export async function gameMasterGenerateQuestEvent(params: {
  quest: Quest;
  currentStep: number;
  team: TeamPokemon[];
  tensionLevel: number;
  narrativeStyle: NarrativeStyle;
  language: "en" | "fr";
  memoryContext?: string[];
}): Promise<Event> {
  const orch = initializeAgentSystem();
  
  console.log("\n🎭 [EVENT GENERATION] Request received");
  console.log(`   Quest: ${params.quest.title}`);
  console.log(`   Step: ${params.currentStep}/${params.quest.estimatedSteps}`);
  console.log(`   Tension: ${params.tensionLevel}/3\n`);
  
  // Log the request
  logCollector.logSystem(`Event generation requested: Step ${params.currentStep}/${params.quest.estimatedSteps}`, {
    quest: params.quest.title,
    tension: params.tensionLevel,
    teamSize: params.team.length,
  });
  
  // Send request to GameMaster
  orch.sendMessage({
    id: `req_event_${Date.now()}`,
    from: "system",
    to: "GameMaster",
    type: "request",
    content: {
      action: "generate_event",
      ...params,
    },
    timestamp: Date.now(),
    priority: "high",
    requiresResponse: true,
  });
  
  // Run GameMaster with context
  const results = await orch.runPipeline(
    ["GameMaster"],
    {
      team: params.team,
      currentStep: params.currentStep,
      totalScore: 0,
      quest: params.quest,
    },
    { params }
  );
  
  const action = results.get("GameMaster");
  
  if (action && action.type === "generate") {
    return await gameMaster!.act(action);
  }
  
  throw new Error("Event generation failed");
}

/**
 * Generate choices using multi-agent collaboration (ChoiceAgent + Guardian validation)
 * API compatible with original choiceAgentGenerateChoices
 */
export async function choiceAgentGenerateChoices(params: {
  event: Event;
  team: TeamPokemon[];
  quest: Quest;
  currentStep: number;
  narrativeStyle: NarrativeStyle;
  language: "en" | "fr";
  memoryContext?: string[];
}): Promise<NarratorResponse> {
  const orch = initializeAgentSystem();
  
  console.log("\n💭 [CHOICE GENERATION] Request received");
  console.log(`   Event type: ${params.event.type}`);
  console.log(`   Collaborative validation: YES (Guardian will validate)\n`);
  
  // Log the request
  logCollector.logSystem(`Choice generation requested for ${params.event.type}`, {
    eventType: params.event.type,
    teamSize: params.team.length,
    step: params.currentStep,
  });
  
  // Send request to ChoiceAgent
  orch.sendMessage({
    id: `req_choices_${Date.now()}`,
    from: "system",
    to: "ChoiceAgent",
    type: "request",
    content: {
      action: "generate_choices",
      ...params,
    },
    timestamp: Date.now(),
    priority: "high",
    requiresResponse: true,
  });
  
  // Run ChoiceAgent first, then Guardian will validate automatically
  const results = await orch.runPipeline(
    ["ChoiceAgent", "Guardian"],
    {
      team: params.team,
      currentStep: params.currentStep,
      totalScore: 0,
      quest: params.quest,
    },
    { params, event: params.event }
  );
  
  const choiceAction = results.get("ChoiceAgent");
  const guardianAction = results.get("Guardian");
  
  if (choiceAction && choiceAction.type === "generate") {
    const choicesResult = await choiceAgent!.act(choiceAction);
    
    // If Guardian provided validation, log it
    if (guardianAction && guardianAction.type === "validate") {
      const validations = await guardian!.act(guardianAction);
      console.log(`[Multi-Agent] Guardian validated choices:`, validations);
      
      // Optionally: request consensus vote if validation has warnings
      const hasWarnings = validations.some((v: any) => v.warnings.length > 0);
      
      if (hasWarnings) {
        console.log("\n⚠️  [COLLABORATION] Warnings detected in validation");
        console.log("   Agents are now aware and can adjust their approach");
        
        // Could initiate a vote here if needed
        // const voteResult = await orch.requestVote(...)
      }
    }
    
    return choicesResult;
  }
  
  throw new Error("Choice generation failed");
}

/**
 * Validate choice using Guardian agent
 * API compatible with original guardianValidateChoice
 */
export async function guardianValidateChoice(params: {
  choice: Choice;
  team: TeamPokemon[];
  quest: Quest;
  currentStep: number;
  event?: Event;
}): Promise<{
  isValid: boolean;
  warnings: string[];
  adjustedConsequences?: string;
}> {
  const orch = initializeAgentSystem();
  
  console.log("[Multi-Agent] Choice validation requested");
  
  // Log the request
  logCollector.logSystem(`Guardian validation requested for choice: ${params.choice.label}`, {
    choiceRisk: params.choice.risk,
    teamSize: params.team.length,
    step: params.currentStep,
  });
  
  // Send validation request to Guardian
  orch.sendMessage({
    id: `req_validate_${Date.now()}`,
    from: "system",
    to: "Guardian",
    type: "request",
    content: {
      action: "validate_choices",
      choices: [params.choice],
      team: params.team,
      event: params.event,
    },
    timestamp: Date.now(),
    priority: "high",
    requiresResponse: true,
  });
  
  // Run Guardian agent
  const results = await orch.runPipeline(
    ["Guardian"],
    {
      team: params.team,
      currentStep: params.currentStep,
      totalScore: 0,
      quest: params.quest,
    },
    { params }
  );
  
  const action = results.get("Guardian");
  
  if (action && action.type === "validate") {
    const validations = await guardian!.act(action);
    
    if (validations && validations.length > 0) {
      const validation = validations[0];
      return {
        isValid: validation.isValid,
        warnings: validation.warnings,
        adjustedConsequences: validation.warnings.join("; "),
      };
    }
  }
  
  return {
    isValid: true,
    warnings: [],
  };
}

/**
 * Narrate outcome using Narrator agent
 * API compatible with original narratorNarrateOutcome
 */
export async function narratorNarrateOutcome(params: {
  outcome: {
    success: boolean;
    scoreDelta: number;
    totalScore: number;
    healthLost: number;
  };
  chosenAction?: {
    label: string;
    description: string;
    risk: RiskLevel;
  };
  eventScene?: string;
  eventType: string;
  eventContext?: {
    location?: string;
    npcName?: string;
    questRelevance?: string;
  };
  affectedPokemon: TeamPokemon[];
  quest: Quest;
  currentStep: number;
  narrativeStyle: NarrativeStyle;
  language: "en" | "fr";
}): Promise<{
  outcomeNarration: string;
  stateHighlights: string[];
  questProgress: string;
  nextHook: string;
}> {
  const orch = initializeAgentSystem();
  
  console.log("[Multi-Agent] Outcome narration requested");
  
  // Log the request
  logCollector.logSystem(`Narrator requested for ${params.outcome.success ? 'successful' : 'failed'} outcome`, {
    eventType: params.eventType,
    scoreDelta: params.outcome.scoreDelta,
    healthLost: params.outcome.healthLost,
  });
  
  // Send request to Narrator
  orch.sendMessage({
    id: `req_narrate_${Date.now()}`,
    from: "system",
    to: "Narrator",
    type: "request",
    content: {
      action: "narrate_outcome",
      ...params,
    },
    timestamp: Date.now(),
    priority: "medium",
    requiresResponse: true,
  });
  
  // Run Narrator agent
  const results = await orch.runPipeline(
    ["Narrator"],
    {
      team: params.affectedPokemon,
      currentStep: params.currentStep,
      totalScore: params.outcome.totalScore,
      quest: params.quest,
    },
    { params }
  );
  
  const action = results.get("Narrator");
  
  if (action && action.type === "generate") {
    return await narrator!.act(action);
  }
  
  throw new Error("Narration failed");
}

/**
 * BONUS: New collaborative decision-making function
 * Use voting mechanism for important narrative choices
 */
export async function collaborativeDecision(params: {
  question: string;
  options: string[];
  context: any;
  team: TeamPokemon[];
  quest?: Quest;
  currentStep?: number;
}): Promise<{
  decision: string;
  confidence: number;
  consensus: boolean;
  reasoning: string;
}> {
  const orch = initializeAgentSystem();
  
  console.log(`[Multi-Agent] Collaborative decision: "${params.question}"`);
  
  // Request vote from all agents
  const voteResult = await orch.requestVote(
    "system",
    params.question,
    params.options,
    {
      ...params.context,
      team: params.team,
      quest: params.quest,
      currentStep: params.currentStep,
    },
    5000 // 5 second timeout
  );
  
  return {
    decision: voteResult.winner,
    confidence: voteResult.totalConfidence / voteResult.votes.length,
    consensus: voteResult.consensus,
    reasoning: voteResult.reasoningSummary,
  };
}

/**
 * BONUS: Negotiate with agents until consensus
 */
export async function negotiateDecision(params: {
  topic: string;
  initialProposals: Map<string, any>;
  maxRounds?: number;
}): Promise<{
  consensus: any;
  rounds: number;
  agreed: boolean;
}> {
  const orch = initializeAgentSystem();
  
  console.log(`[Multi-Agent] Negotiation started: "${params.topic}"`);
  
  return await orch.negotiateUntilConsensus(
    ["GameMaster", "ChoiceAgent", "Guardian"],
    params.topic,
    params.initialProposals,
    params.maxRounds || 3
  );
}

/**
 * Get orchestrator for advanced usage
 */
export function getOrchestrator(): AgentOrchestrator {
  return initializeAgentSystem();
}

/**
 * Reset the multi-agent system
 */
export function resetAgentSystem(): void {
  if (orchestrator) {
    orchestrator.reset();
    console.log("[Multi-Agent] System reset");
  }
}
