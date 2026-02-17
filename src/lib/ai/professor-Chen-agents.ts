// Multi-Agent System for Professor Chen Team Review
// Orchestrates specialized agents for comprehensive team analysis

import { checkTypeEffectiveness } from "@/lib/ai/agent-tools";

export interface PokemonInfo {
  id: number;
  name: string;
  types: string[];
}

export interface TeamAnalysis {
  composition: CompositionAnalysis;
  strategy: StrategyAnalysis;
  weaknesses: WeaknessAnalysis;
  finalAdvice: string;
}

interface CompositionAnalysis {
  typeDistribution: Record<string, number>;
  coverage: string;
  balance: string;
  diversity: string;
}

interface StrategyAnalysis {
  offensiveScore: number;
  defensiveScore: number;
  strategyType: string;
  synergy: string;
}

interface WeaknessAnalysis {
  primaryWeaknesses: string[];
  recommendations: string[];
  improvements: string[];
}

// ============================================================================
// TOOL: Analyze Team Composition
// ============================================================================
function analyzeTeamComposition(team: PokemonInfo[]): CompositionAnalysis {
  const typeDistribution: Record<string, number> = {};
  
  team.forEach(pokemon => {
    pokemon.types.forEach(type => {
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });
  });

  // Type coverage evaluation
  const allTypes = Object.keys(typeDistribution);
  const typeCount = allTypes.length;
  let coverage = "Close to ideal (6-8 types)";
  if (typeCount < 4) coverage = "Limited coverage (less than 4 types)";
  else if (typeCount < 6) coverage = "Good coverage (4-5 types)";
  else if (typeCount > 9) coverage = "Over-specialized (more than 9 types)";

  // Balance evaluation
  const avgTypeCount = team.length > 0 ? allTypes.length / team.length : 0;
  let balance = "Well balanced";
  if (avgTypeCount > 1.5) balance = "Diverse type distribution";
  if (avgTypeCount < 1) balance = "Not very diverse";

  // Diversity scoring
  const uniqueTypes = new Set(team.flatMap(p => p.types)).size;
  let diversity = `${uniqueTypes} unique types found`;

  return {
    typeDistribution,
    coverage,
    balance,
    diversity,
  };
}

// ============================================================================
// TOOL: Evaluate Team Strategy
// ============================================================================
function evaluateTeamStrategy(team: PokemonInfo[]): StrategyAnalysis {
  let offensiveScore = 0;
  let defensiveScore = 0;
  let strategyType = "Balanced";

  // Simplified scoring based on type patterns
  const aggressiveTypes = ["fire", "electric", "psychic", "dragon", "dark"];
  const defensiveTypes = ["normal", "steel", "water", "poison", "rock"];
  const balancedTypes = ["grass", "flying", "fighting", "ground", "ghost"];

  team.forEach(pokemon => {
    pokemon.types.forEach(type => {
      if (aggressiveTypes.includes(type.toLowerCase())) offensiveScore++;
      if (defensiveTypes.includes(type.toLowerCase())) defensiveScore++;
    });
  });

  if (offensiveScore > defensiveScore * 1.3) strategyType = "Offensive";
  else if (defensiveScore > offensiveScore * 1.3) strategyType = "Defensive";
  else strategyType = "Balanced";

  // Synergy evaluation (teams with similar types)
  const typeFrequencies = Object.values(
    team.reduce<Record<string, number>>((acc, pokemon) => {
      pokemon.types.forEach(type => {
        acc[type] = (acc[type] || 0) + 1;
      });
      return acc;
    }, {})
  );

  const avgFrequency = typeFrequencies.reduce((a, b) => a + b, 0) / typeFrequencies.length;
  const synergy = avgFrequency > 1.2 ? "High team synergy" : "Diverse team composition";

  return {
    offensiveScore: Math.min(offensiveScore, 10),
    defensiveScore: Math.min(defensiveScore, 10),
    strategyType,
    synergy,
  };
}

// ============================================================================
// TOOL: Identify Weaknesses
// ============================================================================
function identifyWeaknesses(team: PokemonInfo[]): WeaknessAnalysis {
  const allDefenseTypes = new Set<string>();
  team.forEach(p => p.types.forEach(t => allDefenseTypes.add(t.toLowerCase())));

  const allTypes = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting", 
    "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", 
    "dragon", "dark", "steel", "fairy"
  ];

  // Find weaknesses (types that can hit the team super-effectively)
  const primaryWeaknesses: string[] = [];
  const typeWeakCount: Record<string, number> = {};

  allTypes.forEach(attackType => {
    let weakCount = 0;
    const defenseArray = Array.from(allDefenseTypes);
    
    defenseArray.forEach(defType => {
      const effectiveness = checkTypeEffectiveness(attackType, [defType]);
      if (effectiveness.multiplier >= 2) weakCount++;
    });

    typeWeakCount[attackType] = weakCount;
  });

  // Top 3 weaknesses
  const sortedWeaknesses = Object.entries(typeWeakCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type);

  primaryWeaknesses.push(...sortedWeaknesses);

  // Generate recommendations
  const recommendations: string[] = [];
  if (primaryWeaknesses.length > 0) {
    recommendations.push(`Watch out for ${primaryWeaknesses.join(", ")} type moves`);
  }

  // Suggest improvements
  const improvements: string[] = [];
  if (team.length < 6) {
    improvements.push(`Fill your team to 6 members`);
  }

  const offensiveTypes = new Set<string>();
  team.forEach(p => p.types.forEach(t => offensiveTypes.add(t.toLowerCase())));
  if (offensiveTypes.size < 5) {
    improvements.push(`Consider adding Pokémon with diverse offensive coverage`);
  }

  return {
    primaryWeaknesses,
    recommendations,
    improvements,
  };
}

// ============================================================================
// MULTI-AGENT ORCHESTRATOR
// ============================================================================
export async function professorsChendozes(
  team: PokemonInfo[],
  language: "en" | "fr"
): Promise<{ analysis: TeamAnalysis; advice: string }> {
  // Agent 1: Composition Analyzer
  const composition = analyzeTeamComposition(team);

  // Agent 2: Strategy Evaluator
  const strategy = evaluateTeamStrategy(team);

  // Agent 3: Weakness Identifier
  const weaknesses = identifyWeaknesses(team);

  // Orchestrator: Build final advice from agent outputs
  const advice = buildProfChenAdvice({
    team,
    composition,
    strategy,
    weaknesses,
    language,
  });

  return {
    analysis: {
      composition,
      strategy,
      weaknesses,
      finalAdvice: advice,
    },
    advice,
  };
}

// ============================================================================
// ADVICE BUILDER (Orchestrator Output)
// ============================================================================
function buildProfChenAdvice(params: {
  team: PokemonInfo[];
  composition: CompositionAnalysis;
  strategy: StrategyAnalysis;
  weaknesses: WeaknessAnalysis;
  language: "en" | "fr";
}): string {
  const { team, composition, strategy, weaknesses, language } = params;

  if (language === "fr") {
    return `Intéressante équipe que tu as là. ${
      strategy.strategyType === "Offensive"
        ? "Tu as clairement privilégié l'attaque - c'est agressif et créatif."
        : strategy.strategyType === "Defensive"
        ? "Tu as misé sur une défense solide - très prudent et responsable."
        : "Tu as trouvé un bon équilibre entre attaque et défense."
    } 
${strategy.synergy === "High team synergy" ? "L'équipe montre une bonne synergie." : "L'équipe est bien diversifiée."}
${
  weaknesses.primaryWeaknesses.length > 0
    ? `Attention aux Pokémon de type ${weaknesses.primaryWeaknesses[0]} qui pourraient te poser des problèmes.`
    : "Pas de faiblesse majeure qui saute aux yeux."
} Continue à travailler - tu as du potentiel!`;
  } else {
    return `You have an interesting team there. ${
      strategy.strategyType === "Offensive"
        ? "You've clearly favored offense - that's aggressive and creative."
        : strategy.strategyType === "Defensive"
        ? "You've built a solid defense - very careful and responsible."
        : "You've found a good balance between offense and defense."
    } 
${strategy.synergy === "High team synergy" ? "Your team shows good synergy." : "Your team is nicely diverse."}
${
  weaknesses.primaryWeaknesses.length > 0
    ? `Watch out for ${weaknesses.primaryWeaknesses[0]}-type Pokémon that could give you trouble.`
    : "No major weaknesses stand out."
} Keep training - you have real potential!`;
  }
}
