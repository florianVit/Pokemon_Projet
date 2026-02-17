// Pure deterministic game rules engine - NO LLM involved

import { RiskLevel, EventType, TeamPokemon } from "@/types/adventure";

/**
 * Seeded random number generator for reproducibility
 */
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/**
 * Compute battle outcome deterministically
 */
export function computeBattle(
  playerPower: number,
  enemyPower: number,
  riskLevel: RiskLevel,
  seed: number,
  difficulty: "easy" | "normal" | "hard"
): { success: boolean; damageDealt: number; scoreDelta: number } {
  const rng = seededRandom(seed);

  // Base hit chance (harder overall)
  let hitChance = 0.75;
  const levelDiff = playerPower - enemyPower;
  hitChance += levelDiff * 0.05; // ±5% per level difference

  // Risk modifier
  const riskMultiplier = {
    SAFE: { hit: 0.9, damage: 0.75, xp: 0.8 },
    MODERATE: { hit: 0.75, damage: 1.05, xp: 1.0 },
    RISKY: { hit: 0.55, damage: 1.5, xp: 1.5 },
  }[riskLevel];

  hitChance *= riskMultiplier.hit;
  hitChance = Math.max(0.1, Math.min(1, hitChance)); // Clamp 10-100%

  // Difficulty scaling
  const difficultyDamage = { easy: 0.9, normal: 1.15, hard: 1.45 }[difficulty];

  // Damage calculation
  const baseDamage = 20 + playerPower * 1.8;
  const variance = 0.8 + rng() * 0.4; // 80-120% variance
  const actualDamage = Math.floor(
    baseDamage * riskMultiplier.damage * difficultyDamage * variance
  );

  // Roll hit
  const hit = rng() < hitChance;
  const baseScore = 30 * riskMultiplier.xp;
  const scoreDelta = Math.max(0, Math.floor(baseScore - (1 - hitChance) * 10));

  return {
    success: hit,
    damageDealt: hit ? actualDamage : 0,
    scoreDelta: hit ? scoreDelta : 5,
  };
}

/**
 * Compute capture outcome deterministically
 */
export function computeCapture(
  pokemonLevel: number,
  playerLevel: number,
  riskLevel: RiskLevel,
  seed: number
): { success: boolean; description: string; scoreDelta: number } {
  const rng = seededRandom(seed);

  let baseChance = 0.45;
  baseChance -= pokemonLevel * 0.02;
  baseChance += playerLevel * 0.01;

  const riskModifier = {
    SAFE: 0.25,
    MODERATE: 0.45,
    RISKY: 0.7,
  }[riskLevel];

  const finalChance = Math.min(1, Math.max(0.05, baseChance * riskModifier));
  const success = rng() < finalChance;

  return {
    success,
    description: success ? `Pokémon captured!` : `Pokémon broke free!`,
    scoreDelta: success ? 40 : 10,
  };
}

/**
 * Apply damage to pokemon health
 */
export function applyDamage(pokemon: TeamPokemon, damage: number): TeamPokemon {
  const newHealth = Math.max(0, pokemon.currentHp - damage);
  return { ...pokemon, currentHp: newHealth };
}

/**
 * Heal all pokemon in team to full HP
 */
export function healTeam(team: TeamPokemon[]): TeamPokemon[] {
  return team.map((p) => ({ ...p, currentHp: p.maxHp }));
}

/**
 * Check if any pokemon is KO'd
 */
export function hasTeamKO(team: TeamPokemon[]): boolean {
  return team.every((p) => p.currentHp === 0);
}

/**
 * Get average team level
 */
export function getAverageTeamLevel(team: TeamPokemon[]): number {
  if (team.length === 0) return 1;
  return Math.floor(team.reduce((sum, p) => sum + p.maxHp, 0) / team.length / 20);
}

/**
 * Get difficulty based on win count
 */
export function getDifficulty(wins: number): "easy" | "normal" | "hard" {
  if (wins < 2) return "easy";
  if (wins < 5) return "normal";
  return "hard";
}

/**
 * Calculate enemy level based on player average + scaling
 */
export function calculateEnemyLevel(
  playerAvgLevel: number,
  step: number,
  difficulty: "easy" | "normal" | "hard",
  seed: number
): number {
  const rng = seededRandom(seed);
  const difficultyModifier = { easy: 0.5, normal: 2.5, hard: 4 }[difficulty];
  const stepScaling = (step - 1) * 0.7; // Increases with steps
  const variance = Math.floor((rng() - 0.5) * 3); // ±1

  return Math.max(
    playerAvgLevel,
    Math.floor(playerAvgLevel + stepScaling + difficultyModifier + variance)
  );
}

/**
 * Generate random event type based on step
 */
export function selectEventType(
  step: number,
  seed: number
): { type: EventType; isBoss: boolean } {
  const rng = seededRandom(seed);

  // Boss on steps 4 and 8
  if (step === 4 || step === 8) {
    return { type: EventType.BOSS, isBoss: true };
  }

  const rand = rng();
  const eventTypes = [
    EventType.WILD_BATTLE,
    EventType.TRAINER_BATTLE,
    EventType.CAPTURE,
    EventType.POKE_CENTER,
    EventType.NARRATIVE_CHOICE,
  ];

  // Weight by step
  if (step === 1 || step === 2) {
    // Early game = more captures and safe events
    return {
      type: rand < 0.4 ? EventType.WILD_BATTLE : EventType.CAPTURE,
      isBoss: false,
    };
  }

  if (step === 3 || step === 5 || step === 6) {
    // Mid game = varied
    const idx = Math.floor(rand * eventTypes.length);
    return { type: eventTypes[idx], isBoss: false };
  }

  // Late game = more battles
  return {
    type: rand < 0.6 ? EventType.TRAINER_BATTLE : EventType.WILD_BATTLE,
    isBoss: false,
  };
}
