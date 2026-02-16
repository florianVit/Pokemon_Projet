// Adventure game types

export enum RiskLevel {
  SAFE = "SAFE",
  MODERATE = "MODERATE",
  RISKY = "RISKY",
}

export enum EventType {
  WILD_BATTLE = "wild_battle",
  TRAINER_BATTLE = "trainer_battle",
  CAPTURE = "capture",
  POKE_CENTER = "poke_center",
  NARRATIVE_CHOICE = "narrative_choice",
  EVOLUTION = "evolution",
  BOSS = "boss",
}

export enum NarrativeStyle {
  SERIOUS = "serious",
  HUMOR = "humor",
  EPIC = "epic",
}

export type StepRange = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface TeamPokemon {
  id: number;
  name: string;
  types: string[];
  currentHp: number; // 0-maxHp
  maxHp: number;
}

export interface Quest {
  title: string;
  description: string;
  objective: string;
  difficulty: "easy" | "normal" | "hard";
  estimatedSteps: number;
}

export interface GameState {
  // Identity
  sessionId: string;
  language: "en" | "fr";
  narrativeStyle: NarrativeStyle;

  // Quest
  quest: Quest;

  // Progression
  currentStep: StepRange;
  completedSteps: StepRange[];
  seed: number; // For replay
  score: number;

  // Team
  team: TeamPokemon[];
  defeatedCount: number;
  capturedCount: number;

  // Narrative flags
  rivalName?: string;
  tensionLevel: 0 | 1 | 2 | 3;
  majorVictories: string[];
  playerChoicesHistory: string[];

  // Metadata
  createdAt: Date;
  lastActionAt: Date;
}

export interface Event {
  id: string;
  step: StepRange;
  type: EventType;
  difficulty: "easy" | "normal" | "hard";

  // Raw narration before choices
  scene: string;
  context: {
    enemyName?: string;
    enemyLevel?: number;
    enemyTypes?: string[];
    itemReward?: string;
    location?: string;
    npcName?: string;
    enemyId?: number;
    questRelevance?: string;
    missionCritical?: boolean;
  };

  // Reproducible seed
  eventSeed: number;

  // Metadata
  generatedAt: Date;
}

export interface Choice {
  risk: RiskLevel;
  label: string;
  description: string; // What happens with this choice
  affectedPokemon: number[]; // IDs of pokemon involved
  potentialConsequences?: string; // Brief hint of risks
}

export interface NarratorResponse {
  narration: string;
  choices: Choice[]; // Between 2 and 4
  questProgress?: string; // How this relates to the quest
}

export interface ResolutionRequest {
  eventId: string;
  chosenRisk: RiskLevel;
  choice: Choice;
  currentState: GameState;
}

export interface Outcome {
  // Mechanical result
  success: boolean;
  scoreDelta: number;
  totalScore: number;
  healthLost: number;
  itemGained?: string;
  missionFailed?: boolean;

  // Narration result
  outcomeNarration: string;
  stateHighlights: string[];
  nextHook: string;

  // Flags
  isGameOver: boolean;
  isVictory?: boolean;
}

export interface GameOverState {
  isGameOver: true;
  victory: boolean;
  finalNarration: string;
  stats: {
    stepsCompleted: number;
    capturedPokemon: number;
    defeatedEnemies: number;
    teamSnapshotAtEnd: TeamPokemon[];
    score?: number;
  };
}
