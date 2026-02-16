// Shared utilities for AI agents

import { Choice, GameState, Outcome, Quest, TeamPokemon } from "@/types/adventure";

export const AGENT_TOOL_DESCRIPTIONS = `
Available Tools (deterministic TypeScript):
1. checkTypeEffectiveness(attackType, defenderTypes)
2. estimateBattleOutcome(pokemon, enemyPower, enemyTypes)
3. getTeamStatus(team)
4. calculateQuestProgress(currentStep, totalSteps)
5. simulateTurnOutcome(action, pokemon, enemy, risk)
6. rankBestPokemonForQuest(team, questContext)
7. predictTeamSurvival(gameState, stepsRemaining)
8. computeNarrativeTension(step, victories, failures)
9. generateQuestBranchOptions(mainQuestState)
10. storeAdventureMemory(eventSummary)
11. retrieveRelevantMemories(context)
12. evaluateDecisionQuality(choice, outcome)
13. estimateStepsToFailure(gameState)
`;

/**
 * Check type effectiveness between attack and defender types
 * Returns multiplier: 0 (immune), 0.25, 0.5, 1, 2, 4
 */
export function checkTypeEffectiveness(
  attackType: string,
  defenderTypes: string[]
): { multiplier: number; description: string } {
  const typeChart: { [key: string]: { [key: string]: number } } = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
  };

  let totalMultiplier = 1;

  for (const defType of defenderTypes) {
    const effectiveness = typeChart[attackType.toLowerCase()]?.[defType.toLowerCase()] ?? 1;
    totalMultiplier *= effectiveness;
  }

  let description = "Normal damage";
  if (totalMultiplier === 0) description = "No effect!";
  else if (totalMultiplier >= 4) description = "Super effective! (4x)";
  else if (totalMultiplier >= 2) description = "Super effective! (2x)";
  else if (totalMultiplier <= 0.25) description = "Not very effective... (0.25x)";
  else if (totalMultiplier <= 0.5) description = "Not very effective... (0.5x)";

  return { multiplier: totalMultiplier, description };
}

/**
 * Estimate battle outcome between player Pokemon and enemy
 */
export function estimateBattleOutcome(params: {
  playerPokemon: TeamPokemon;
  enemyPower: number;
  enemyTypes?: string[];
}): {
  winProbability: number;
  recommendedAction: string;
  reasoning: string;
} {
  const { playerPokemon, enemyPower, enemyTypes = ["normal"] } = params;

  // Power difference factor
  const playerPower = Math.max(1, Math.round(playerPokemon.maxHp / 20));
  const levelDiff = playerPower - enemyPower;
  let baseProbability = 0.5;

  if (levelDiff >= 5) baseProbability = 0.8;
  else if (levelDiff >= 2) baseProbability = 0.65;
  else if (levelDiff <= -5) baseProbability = 0.2;
  else if (levelDiff <= -2) baseProbability = 0.35;

  // HP factor
  const hpPercent = playerPokemon.currentHp / playerPokemon.maxHp;
  if (hpPercent < 0.3) baseProbability *= 0.6;
  else if (hpPercent < 0.5) baseProbability *= 0.8;

  // Type advantage
  let typeAdvantage = 0;
  for (const playerType of playerPokemon.types) {
    const effectiveness = checkTypeEffectiveness(playerType, enemyTypes);
    if (effectiveness.multiplier > 1) typeAdvantage += 0.1;
    if (effectiveness.multiplier < 1) typeAdvantage -= 0.1;
  }

  baseProbability = Math.max(0.05, Math.min(0.95, baseProbability + typeAdvantage));

  let recommendedAction: string;
  let reasoning: string;

  if (baseProbability >= 0.7) {
    recommendedAction = "ATTACK";
    reasoning = `Strong advantage (${Math.round(baseProbability * 100)}% win chance)`;
  } else if (baseProbability >= 0.4) {
    recommendedAction = "MODERATE";
    reasoning = `Even match (${Math.round(baseProbability * 100)}% win chance)`;
  } else {
    recommendedAction = "DEFEND";
    reasoning = `Risky battle (${Math.round(baseProbability * 100)}% win chance) - consider switching`;
  }

  return {
    winProbability: baseProbability,
    recommendedAction,
    reasoning,
  };
}

/**
 * Get team status summary
 */
export function getTeamStatus(team: TeamPokemon[]): {
  alive: number;
  totalHp: number;
  maxTotalHp: number;
  avgLevel: number;
  healthStatus: "critical" | "low" | "good" | "excellent";
} {
  const alive = team.filter(p => p.currentHp > 0).length;
  const totalHp = team.reduce((sum, p) => sum + p.currentHp, 0);
  const maxTotalHp = team.reduce((sum, p) => sum + p.maxHp, 0);
  const avgLevel = Math.max(1, Math.round(team.reduce((sum, p) => sum + p.maxHp, 0) / team.length / 20));

  const hpPercent = totalHp / maxTotalHp;
  let healthStatus: "critical" | "low" | "good" | "excellent";

  if (hpPercent < 0.25 || alive <= 1) healthStatus = "critical";
  else if (hpPercent < 0.5 || alive <= 2) healthStatus = "low";
  else if (hpPercent < 0.75) healthStatus = "good";
  else healthStatus = "excellent";

  return { alive, totalHp, maxTotalHp, avgLevel, healthStatus };
}

/**
 * Calculate quest progress percentage
 */
export function calculateQuestProgress(currentStep: number, totalSteps: number): {
  percent: number;
  phase: "early" | "middle" | "late" | "final";
  stepsRemaining: number;
} {
  const percent = Math.round((currentStep / totalSteps) * 100);
  const stepsRemaining = totalSteps - currentStep;

  let phase: "early" | "middle" | "late" | "final";
  if (currentStep === totalSteps) phase = "final";
  else if (currentStep >= totalSteps * 0.75) phase = "late";
  else if (currentStep >= totalSteps * 0.4) phase = "middle";
  else phase = "early";

  return { percent, phase, stepsRemaining };
}

export type SimulatedTurnOutcome = {
  winProbability: number;
  expectedDamage: number;
  koRisk: number;
  scoreExpected: number;
  xpExpected: number;
};

export type QuestContext = {
  objective?: string;
  enemyTypes?: string[];
  requiredRole?: "attack" | "defense" | "support" | "utility";
};

export type RankedPokemon = {
  id: number;
  name: string;
  score: number;
  reasons: string[];
};

export type SurvivalPrediction = {
  survivalProbability: number;
  expectedKOs: number;
  healPriority: number[];
  recommendation: string;
};

export type NarrativeTension = {
  tensionLevel: 0 | 1 | 2 | 3;
  recommendedEvent: "wild_battle" | "trainer_battle" | "capture" | "poke_center" | "narrative_choice" | "boss";
  note: string;
};

export type QuestBranchOption = {
  title: string;
  description: string;
  difficulty: "easy" | "normal" | "hard";
  reward: string;
  riskLevel: "low" | "medium" | "high";
};

export type MemoryEntry = {
  sessionId: string;
  step: number;
  tags: string[];
  summary: string;
  timestamp: string;
};

export type DecisionQuality = {
  score: number;
  strategyScore: number;
  narrativeScore: number;
  riskAlignment: "good" | "neutral" | "bad";
  reasons: string[];
};

export type FailureEstimate = {
  stepsUntilFailure: number;
  dangerLevel: "low" | "medium" | "high" | "critical";
  recommendation: string;
};

const memoryStore = new Map<string, MemoryEntry[]>();

export function simulateTurnOutcome(
  action: "attack" | "defend" | "support",
  pokemon: TeamPokemon,
  enemy: { power: number; types: string[] },
  risk: "SAFE" | "MODERATE" | "RISKY"
): SimulatedTurnOutcome {
  const playerPower = Math.max(1, Math.round(pokemon.maxHp / 20));
  const powerRatio = playerPower / Math.max(1, enemy.power);

  let typeMultiplier = 1;
  for (const t of pokemon.types) {
    const eff = checkTypeEffectiveness(t, enemy.types);
    typeMultiplier = Math.max(typeMultiplier, eff.multiplier);
  }

  let baseWin = 0.45 + (powerRatio - 1) * 0.2 + (typeMultiplier - 1) * 0.2;
  const riskBonus = risk === "RISKY" ? 0.15 : risk === "SAFE" ? -0.1 : 0;
  baseWin = Math.max(0.05, Math.min(0.95, baseWin + riskBonus));

  const actionDamageMod = action === "defend" ? 0.7 : action === "support" ? 0.85 : 1.0;
  const riskDamageMod = risk === "RISKY" ? 1.2 : risk === "SAFE" ? 0.85 : 1.0;
  const expectedDamage = Math.round(enemy.power * 6 * actionDamageMod * riskDamageMod);
  const koRisk = Math.max(0, Math.min(1, expectedDamage / Math.max(1, pokemon.currentHp)));

  const scoreExpected = Math.round(baseWin * 30 + (typeMultiplier > 1 ? 5 : 0) - koRisk * 15);

  return {
    winProbability: baseWin,
    expectedDamage,
    koRisk,
    scoreExpected,
    xpExpected: scoreExpected,
  };
}

export function rankBestPokemonForQuest(
  team: TeamPokemon[],
  questContext: QuestContext
): RankedPokemon[] {
  return team
    .map((p) => {
      const reasons: string[] = [];
      const hpRatio = p.currentHp / Math.max(1, p.maxHp);
      let score = hpRatio * 30;

      if (questContext.enemyTypes && questContext.enemyTypes.length > 0) {
        let typeScore = 0;
        for (const t of p.types) {
          const eff = checkTypeEffectiveness(t, questContext.enemyTypes);
          if (eff.multiplier > 1) typeScore += 20;
          if (eff.multiplier < 1) typeScore -= 10;
        }
        score += typeScore;
        if (typeScore > 0) reasons.push("Type advantage");
      }

      if (questContext.requiredRole === "defense" && hpRatio > 0.7) {
        score += 10;
        reasons.push("High endurance");
      }
      if (questContext.requiredRole === "attack" && p.types.length > 0) {
        score += 5;
        reasons.push("Offensive role");
      }
      if (p.currentHp === 0) {
        score -= 50;
        reasons.push("Fainted");
      }

      return { id: p.id, name: p.name, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export function predictTeamSurvival(gameState: GameState, stepsRemaining: number): SurvivalPrediction {
  const team = gameState.team;
  const alive = team.filter((p) => p.currentHp > 0).length;
  const totalHp = team.reduce((sum, p) => sum + p.currentHp, 0);
  const maxHp = team.reduce((sum, p) => sum + p.maxHp, 0);
  const hpRatio = maxHp > 0 ? totalHp / maxHp : 0;
  const aliveRatio = team.length > 0 ? alive / team.length : 0;

  let survival = 0.2 + hpRatio * 0.6 + aliveRatio * 0.2 - stepsRemaining * 0.05;
  survival = Math.max(0.05, Math.min(0.95, survival));

  const healPriority = [...team]
    .sort((a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp)
    .map((p) => p.id);

  const expectedKOs = Math.max(0, Math.round((1 - hpRatio) * team.length * 0.6));

  const recommendation =
    survival < 0.35 ? "Seek healing or reduce risk" :
    survival < 0.6 ? "Play cautiously" :
    "You can take moderate risks";

  return { survivalProbability: survival, expectedKOs, healPriority, recommendation };
}

export function computeNarrativeTension(step: number, victories: number, failures: number): NarrativeTension {
  const base = Math.round((step / 8) * 3 + failures * 0.6 - victories * 0.3);
  const tension = Math.max(0, Math.min(3, base)) as 0 | 1 | 2 | 3;

  const recommendedEvent = tension >= 3
    ? "boss"
    : tension === 2
    ? "trainer_battle"
    : tension === 1
    ? "wild_battle"
    : "narrative_choice";

  const note = tension >= 3
    ? "High stakes moment"
    : tension === 0
    ? "Give the player breathing room"
    : "Maintain steady pressure";

  return { tensionLevel: tension, recommendedEvent, note };
}

export function generateQuestBranchOptions(mainQuestState: {
  quest: Quest;
  currentStep: number;
  difficulty: "easy" | "normal" | "hard";
}): QuestBranchOption[] {
  const { quest, currentStep, difficulty } = mainQuestState;
  const baseOptions: QuestBranchOption[] = [
    {
      title: "Side Detour",
      description: "Help a local trainer to gain supplies before continuing.",
      difficulty: "easy",
      reward: "Healing items",
      riskLevel: "low",
    },
    {
      title: "Direct Assault",
      description: "Press forward toward the objective without delay.",
      difficulty: difficulty,
      reward: "Time advantage",
      riskLevel: "high",
    },
    {
      title: "Intel Gathering",
      description: "Investigate clues about the mission before engaging.",
      difficulty: "normal",
      reward: "Tactical info",
      riskLevel: "medium",
    },
    {
      title: "Escort Mission",
      description: "Protect a key NPC who can assist the main quest.",
      difficulty: "normal",
      reward: "Alliance support",
      riskLevel: "medium",
    },
  ];

  const startIndex = currentStep % baseOptions.length;
  const selected = [
    baseOptions[startIndex],
    baseOptions[(startIndex + 1) % baseOptions.length],
  ];

  if (currentStep % 2 === 0) {
    selected.push(baseOptions[(startIndex + 2) % baseOptions.length]);
  }

  return selected.map((opt) => ({
    ...opt,
    title: `${opt.title} (${quest.title})`,
  }));
}

export function storeAdventureMemory(entry: MemoryEntry) {
  const existing = memoryStore.get(entry.sessionId) || [];
  const next = [...existing, entry].slice(-50);
  memoryStore.set(entry.sessionId, next);
}

export function retrieveRelevantMemories(params: {
  sessionId: string;
  query?: string;
  tags?: string[];
  limit?: number;
}): MemoryEntry[] {
  const { sessionId, query, tags = [], limit = 5 } = params;
  const entries = memoryStore.get(sessionId) || [];

  const filtered = entries.filter((e) => {
    const matchesTags = tags.length === 0 || tags.some((t) => e.tags.includes(t));
    const matchesQuery = !query || e.summary.toLowerCase().includes(query.toLowerCase());
    return matchesTags && matchesQuery;
  });

  return filtered.slice(-limit);
}

export function evaluateDecisionQuality(choice: Choice, outcome: Outcome): DecisionQuality {
  let strategyScore = 50;
  let narrativeScore = 50;
  const reasons: string[] = [];

  if (choice.risk === "RISKY" && outcome.success) {
    strategyScore += 15;
    narrativeScore += 10;
    reasons.push("High risk paid off");
  } else if (choice.risk === "RISKY" && !outcome.success) {
    strategyScore -= 15;
    reasons.push("High risk failed");
  }

  if (outcome.scoreDelta > 0) {
    strategyScore += Math.min(20, Math.floor(outcome.scoreDelta / 5));
  } else {
    strategyScore += Math.max(-20, Math.floor(outcome.scoreDelta / 5));
  }

  if (outcome.healthLost > 30) {
    narrativeScore += 5;
    reasons.push("Tense moment");
  }

  const score = Math.max(0, Math.min(100, Math.round((strategyScore + narrativeScore) / 2)));
  const riskAlignment = strategyScore >= 55 ? "good" : strategyScore <= 45 ? "bad" : "neutral";

  return { score, strategyScore, narrativeScore, riskAlignment, reasons };
}

export function estimateStepsToFailure(gameState: GameState): FailureEstimate {
  const team = gameState.team;
  const hpRatio = team.reduce((sum, p) => sum + p.currentHp, 0) /
    Math.max(1, team.reduce((sum, p) => sum + p.maxHp, 0));

  const estimated = Math.max(1, Math.round(hpRatio * 6));
  const dangerLevel = hpRatio < 0.25 ? "critical"
    : hpRatio < 0.45 ? "high"
    : hpRatio < 0.7 ? "medium"
    : "low";

  const recommendation = dangerLevel === "critical"
    ? "Urgent healing or avoid combat"
    : dangerLevel === "high"
    ? "Reduce risk and seek recovery"
    : "Stable";

  return { stepsUntilFailure: estimated, dangerLevel, recommendation };
}
