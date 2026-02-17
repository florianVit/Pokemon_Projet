// Multi-Agent System - Main exports
// Use this as the single entry point for the multi-agent system

export {
  // Main API functions (backward compatible)
  gameMasterGenerateQuest,
  gameMasterGenerateQuestEvent,
  choiceAgentGenerateChoices,
  guardianValidateChoice,
  narratorNarrateOutcome,
  
  // New collaborative features
  collaborativeDecision,
  negotiateDecision,
  
  // Advanced access
  getOrchestrator,
  resetAgentSystem,
} from "./multi-agent-system";

export {
  // Base types and classes
  BaseAgent,
  type AgentMessage,
  type AgentPerception,
  type AgentAction,
  type AgentConfig,
  type Vote,
  type VotingResult,
  calculateVotingResult,
} from "./base-agent";

export {
  // Orchestrator
  AgentOrchestrator,
} from "./agent-orchestrator";

export {
  // Specific agents
  GameMasterAgent,
  ChoiceAgent,
  GuardianAgent,
  NarratorAgent,
} from "./autonomous-agents";

export {
  // Agent log collector
  logCollector,
  type AgentInteractionLog,
} from "./agent-log-collector";

export {
  // Shared tools (can be used independently)
  checkTypeEffectiveness,
  estimateBattleOutcome,
  getTeamStatus,
  calculateQuestProgress,
  simulateTurnOutcome,
  rankBestPokemonForQuest,
  predictTeamSurvival,
  computeNarrativeTension,
  generateQuestBranchOptions,
  storeAdventureMemory,
  retrieveRelevantMemories,
  evaluateDecisionQuality,
  estimateStepsToFailure,
  AGENT_TOOL_DESCRIPTIONS,
} from "./agent-tools";

