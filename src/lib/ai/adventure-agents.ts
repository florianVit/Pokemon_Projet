// Agent-based narrative generation for adventure

import {
  Event,
  NarratorResponse,
  Choice,
  RiskLevel,
  NarrativeStyle,
  Outcome,
  Quest,
  TeamPokemon,
  EventType,
  StepRange,
  GameState,
} from "@/types/adventure";
import {
  AGENT_TOOL_DESCRIPTIONS,
  calculateQuestProgress,
  checkTypeEffectiveness,
  estimateBattleOutcome,
  generateQuestBranchOptions,
  getTeamStatus,
  predictTeamSurvival,
  rankBestPokemonForQuest,
  simulateTurnOutcome,
} from "@/lib/ai/agent-tools";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "mistral-small-latest";


// Call Mistral API directly
async function callMistral(prompt: string, maxTokens: number = 500, temperature: number = 0.7) {
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      "MISTRAL_API_KEY is not defined in environment variables. Please check your .env.local file."
    );
  }

  const response = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mistral API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * GAME MASTER AGENT - Generates the main quest
 */
export async function gameMasterGenerateQuest(params: {
  team: TeamPokemon[];
  narrativeStyle: NarrativeStyle;
  language: "en" | "fr";
  seed: number;
}): Promise<Quest> {
  const { team, narrativeStyle, language, seed } = params;

  const teamSummary = team.map(p => `${p.name} (${p.types.join("/")})`).join(", ");

  const styleGuides = {
    serious: "Create a dramatic, high-stakes quest with real consequences",
    humor: "Create a lighthearted, quirky quest with comedic situations",
    epic: "Create a grandiose, legendary quest of epic proportions"
  };

  const prompt = `You are a Pokémon Quest Master designing a coherent adventure in the Pokémon universe.

TEAM: ${teamSummary}
STYLE: ${narrativeStyle} - ${styleGuides[narrativeStyle]}
SEED: ${seed}

YOUR MISSION:
Design a compelling main quest line (8 steps) that is NOT about the Pokémon League. Be creative!

Quest ideas:
- Deliver urgent medicine to a remote village
- Investigate mysterious disappearances in a forest
- Stop a villain from awakening an ancient Pokémon
- Rescue a kidnapped professor
- Find a legendary artifact
- Prevent a natural disaster
- Uncover a conspiracy
- Help reunite separated Pokémon families

The quest should:
1. Be coherent with the Pokémon world (regions, trainers, wildlife, towns, lore)
2. Keep a clear central objective that guides the whole adventure
3. Be achievable in 8 steps
4. Fit the ${narrativeStyle} narrative style
5. Be specific and engaging

${language === "fr" ? "Réponds EN FRANÇAIS uniquement" : "Respond ONLY in ENGLISH"}

RESPOND WITH THIS JSON (no markdown):
{
  "title": "<Quest title>",
  "description": "<2-3 sentence description>",
  "objective": "<Clear goal>",
  "difficulty": "easy|normal|hard",
  "estimatedSteps": 8
}`;

  try {
    const responseText = await callMistral(prompt, 400, 0.8);
    let jsonText = responseText.trim();
    
    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }

    const quest = JSON.parse(jsonText);
    
    return {
      title: quest.title || "Adventure Quest",
      description: quest.description || "A mysterious adventure awaits...",
      objective: quest.objective || "Complete the journey",
      difficulty: quest.difficulty || "normal",
      estimatedSteps: 8
    };
  } catch (error) {
    console.error("Quest generation failed:", error);
    throw new Error(`Quest generation error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * CHOICE AGENT - Generates scene narration and team-specific choices
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
  const { event, team, quest, currentStep, narrativeStyle, language, memoryContext } = params;

  const teamSummary = team.map(p => 
    `${p.name} (${p.types.join("/")}, ${p.currentHp}/${p.maxHp} HP)`
  ).join(", ");

  const teamIds = team.map(p => p.id);
  const teamStatus = getTeamStatus(team);
  const questProgress = calculateQuestProgress(currentStep, quest.estimatedSteps);
  const ranked = rankBestPokemonForQuest(team, {
    objective: quest.objective,
    enemyTypes: event.context.enemyTypes,
  });
  const topPicks = ranked.slice(0, 2).map((p) => `${p.name} (${p.score.toFixed(0)})`).join(", ");

  const styleDescriptions = {
    serious: "serious, strategic, tense. Focus on danger and consequences",
    humor: "humorous, lighthearted, witty. Include jokes and funny observations",
    epic: "grandiose, dramatic, heroic. Make every moment feel momentous",
  };

  const firstStepInstruction = currentStep === 1
    ? "For step 1, end the narration with a direct player question (e.g., \"What do you want to do?\", \"Will you fight, negotiate, or retreat?\")."
    : "";

  const prompt = `You are the Choice Agent for a Pokémon quest.

QUEST: ${quest.title}
Objective: ${quest.objective}
Progress: Step ${currentStep}/${quest.estimatedSteps}

CURRENT SCENE:
Type: ${event.type}
Difficulty: ${event.difficulty}
${event.scene}
Context: ${JSON.stringify(event.context)}

PLAYER'S TEAM: ${teamSummary}

TEAM STATUS: ${teamStatus.healthStatus} (alive ${teamStatus.alive}/${team.length})
TOP PICKS: ${topPicks || "N/A"}
QUEST PHASE: ${questProgress.phase} (${questProgress.percent}%)

MEMORY CONTEXT:
${memoryContext && memoryContext.length > 0 ? memoryContext.map((m) => `- ${m}`).join("\n") : "- None"}

YOUR MISSION:
1. Write engaging narration (3-4 sentences, ${styleDescriptions[narrativeStyle]} style)
  - Include a concrete detail (location, NPC, or item)
  - If MEMORY CONTEXT exists, reference at least one specific prior detail to maintain continuity
  - ${firstStepInstruction}
2. Create between 2 and 4 choices that are SPECIFIC to this team:
   - Mention actual Pokémon names from the team
   - Each choice should specify which Pokémon are involved
  - Consider team composition (types, HP)
  - Each choice should include a clear immediate action and a tangible consequence
   
   RISK LEVELS:
   - SAFE: Low risk, mentions defensive/support Pokémon, careful strategy
   - MODERATE: Balanced risk, uses team synergy
   - RISKY: High risk/reward, aggressive approach, may endanger multiple Pokémon

3. Relate choices to the quest objective and current step

${AGENT_TOOL_DESCRIPTIONS}

${language === "fr" ? "Réponds EN FRANÇAIS uniquement" : "Respond ONLY in ENGLISH"}

CRITICAL: Output ONLY valid JSON (no markdown):
{
  "narration": "<scene narration>",
  "questProgress": "<how this relates to quest>",
  "choices": [
    {
      "risk": "SAFE|MODERATE|RISKY",
      "label": "<short title>",
      "description": "<what happens, which pokemon do what>",
      "affectedPokemon": [<pokemon IDs from team: ${teamIds.join(", ")}>],
      "potentialConsequences": "<brief risk description>"
    }
  ]
}`;

  try {
    const responseText = await callMistral(prompt, 800, 0.7);
    let jsonText = responseText.trim();

    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }

    let response: any;
    try {
      response = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse narrator JSON:", jsonText);
      throw new Error(`Narrator JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    // Validate and normalize choices
    if (!response.choices || !Array.isArray(response.choices) || response.choices.length < 2 || response.choices.length > 4) {
      throw new Error(`Invalid choices count: expected 2-4, got ${response.choices?.length || 0}`);
    }

    const riskMap: { [key: string]: RiskLevel } = {
      "safe": RiskLevel.SAFE,
      "moderate": RiskLevel.MODERATE,
      "risky": RiskLevel.RISKY,
    };

    const expectedRisks = ["safe", "moderate", "risky", "safe"];

    const normalizedChoices: Choice[] = [];

    for (let i = 0; i < response.choices.length; i++) {
      const choice = response.choices[i];
      if (!choice || typeof choice !== "object") {
        throw new Error(`Invalid choice at index ${i}`);
      }

      const riskKey = (choice.risk || "").toLowerCase();

      normalizedChoices.push({
        risk: riskMap[riskKey] || riskMap[expectedRisks[i]],
        label: (choice.label || "").trim() || `${riskKey} approach`,
        description: (choice.description || "").trim() || "Unknown action",
        affectedPokemon: Array.isArray(choice.affectedPokemon) ? choice.affectedPokemon : [],
        potentialConsequences: (choice.potentialConsequences || "").trim(),
      });
    }

    return {
      narration: (response.narration || "").trim() || event.scene,
      choices: normalizedChoices,
      questProgress: (response.questProgress || "").trim(),
    };
  } catch (error) {
    console.error("Narrator generation failed:", error);
    throw new Error(
      `Narrator error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Guardian Agent - Validates choice coherence and feasibility
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
  const { choice, team, currentStep, event } = params;
  
  const warnings: string[] = [];
  
  // Validate affected Pokemon exist and are alive
  const aliveTeamIds = team.filter(p => p.currentHp > 0).map(p => p.id);
  const invalidPokemon = choice.affectedPokemon.filter(id => !aliveTeamIds.includes(id));
  
  if (invalidPokemon.length > 0) {
    warnings.push(`Cannot use fainted Pokémon: ${invalidPokemon.join(", ")}`);
  }
  
  // Validate risk level matches consequences
  if (choice.risk === RiskLevel.RISKY && choice.affectedPokemon.length === 0) {
    warnings.push("Risky choice should involve at least one Pokémon");
  }
  
  // Check if team has enough HP for risky actions
  const affectedPokemon = team.filter(p => choice.affectedPokemon.includes(p.id));
  const lowHpPokemon = affectedPokemon.filter(p => p.currentHp < p.maxHp * 0.3);
  
  if (choice.risk === RiskLevel.RISKY && lowHpPokemon.length > 0) {
    const pokemonNames = lowHpPokemon.map(p => p.name).join(", ");
    warnings.push(`Warning: ${pokemonNames} has low HP (risky action may result in fainting)`);
  }
  
  // Validate choice makes sense at current quest step
  if (currentStep === 0 && choice.risk === RiskLevel.RISKY) {
    warnings.push("Starting with a risky choice may endanger the quest early");
  }

  // Type coherence checks for battles
  let typeAdvantage: "advantage" | "disadvantage" | "neutral" = "neutral";
  let koRiskHigh = false;
  let winChanceLow = false;

  if (event && event.context?.enemyTypes && event.context.enemyTypes.length > 0) {
    let hasAdvantage = false;
    let hasDisadvantage = false;

    for (const pokemon of affectedPokemon) {
      for (const type of pokemon.types) {
        const effectiveness = checkTypeEffectiveness(type, event.context.enemyTypes);
        if (effectiveness.multiplier > 1) hasAdvantage = true;
        if (effectiveness.multiplier > 0 && effectiveness.multiplier < 1) hasDisadvantage = true;
        if (effectiveness.multiplier === 0) hasDisadvantage = true;
      }
    }

    if (hasAdvantage && !hasDisadvantage) {
      typeAdvantage = "advantage";
      warnings.push("Good type match-up detected (bonus)");
    } else if (hasDisadvantage && !hasAdvantage) {
      typeAdvantage = "disadvantage";
      warnings.push("Poor type match-up detected (malus)");
    }
  }

  if (event && affectedPokemon.length > 0) {
    const primary = affectedPokemon[0];
    const enemyPower = Math.max(1, Math.round((event.context.enemyLevel || 10) / 2));
    const enemyTypes = event.context.enemyTypes || ["normal"];
    const action = choice.risk === RiskLevel.SAFE ? "defend" : choice.risk === RiskLevel.RISKY ? "attack" : "support";

    const sim = simulateTurnOutcome(action, primary, { power: enemyPower, types: enemyTypes }, choice.risk);
    const estimate = estimateBattleOutcome({
      playerPokemon: primary,
      enemyPower,
      enemyTypes,
    });
    if (sim.koRisk > 0.7) {
      koRiskHigh = true;
      warnings.push(`High KO risk detected (${Math.round(sim.koRisk * 100)}%)`);
    }
    if (sim.winProbability < 0.35) {
      winChanceLow = true;
      warnings.push(`Low win probability (${Math.round(sim.winProbability * 100)}%)`);
    }
    warnings.push(`Estimate: ${estimate.recommendedAction} (${Math.round(estimate.winProbability * 100)}%)`);
  }
  
  return {
    isValid: typeAdvantage === "advantage" || (!koRiskHigh && !winChanceLow && typeAdvantage !== "disadvantage"),
    warnings,
    adjustedConsequences: warnings.length > 0 
      ? `${choice.potentialConsequences || ""}\n${warnings.join("; ")}`
      : choice.potentialConsequences,
  };
}

/**
 * Narrator Agent - Narrate outcome of resolved event with quest context
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
  const {
    outcome,
    chosenAction,
    eventScene,
    eventType,
    eventContext,
    affectedPokemon,
    quest,
    currentStep,
    narrativeStyle,
    language,
  } = params;
  
  const styleDescriptions = {
    serious: "serious and consequential",
    humor: "humorous and witty",
    epic: "dramatic and grandiose",
  };

  const pokemonNames = affectedPokemon.map(p => p.name).join(", ");
  const locationText = eventContext?.location ? `Location: ${eventContext.location}` : "Location: unspecified";
  const npcText = eventContext?.npcName ? `NPC: ${eventContext.npcName}` : "NPC: none";
  const relevanceText = eventContext?.questRelevance ? `Quest link: ${eventContext.questRelevance}` : "Quest link: ongoing";
  const actionLabel = chosenAction?.label ? `Chosen action: ${chosenAction.label}` : "Chosen action: none";
  const actionDesc = chosenAction?.description ? `Action detail: ${chosenAction.description}` : "Action detail: none";
  const actionRisk = chosenAction?.risk ? `Risk: ${chosenAction.risk}` : "Risk: unknown";
  const sceneText = eventScene ? `Scene: ${eventScene}` : "Scene: unspecified";
  const progressPercent = Math.round((currentStep / quest.estimatedSteps) * 100);

  const prompt = `You are a Pokémon adventure narrator in ${styleDescriptions[narrativeStyle]} style.

QUEST CONTEXT:
- Quest: "${quest.title}"
- Objective: "${quest.objective}"
- Progress: Step ${currentStep}/${quest.estimatedSteps} (${progressPercent}%)

EVENT TYPE: ${eventType}
POKEMON INVOLVED: ${pokemonNames}
${locationText}
${npcText}
${relevanceText}
${sceneText}
${actionLabel}
${actionDesc}
${actionRisk}

OUTCOME:
- Success: ${outcome.success}
- Score Delta: ${outcome.scoreDelta}
- Total Score: ${outcome.totalScore}
- Health Lost: ${outcome.healthLost}

YOUR TASK:
1. Write a 3-4 sentence narration of the outcome (${narrativeStyle} tone), explicitly reflecting the chosen action and the scene
2. List 2-3 bullet-point state highlights (e.g., "Score +20", "Squirtle -30 HP")
3. Write how this outcome affects quest progress (1 sentence)
4. Write a 1-2 sentence teaser for what comes next in the quest

CRITICAL: Respond with ONLY valid JSON, no extra text, no triple backticks:
{
  "outcomeNarration": "<narrative mentioning pokemon>",
  "stateHighlights": ["<highlight1>", "<highlight2>"],
  "questProgress": "<how this advances or hinders the quest>",
  "nextHook": "<teaser relating to quest>"
}

${language === "fr" ? "Réponds EN FRANÇAIS uniquement" : "Respond ONLY in ENGLISH"}`;

  try {
    const responseText = await callMistral(prompt, 500, 0.7);
    let jsonText = responseText.trim();
    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }

    let response: any;
    try {
      response = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse outcome JSON:", jsonText);
      throw new Error(`JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    return {
      outcomeNarration: (response.outcomeNarration || "The action concludes...").trim(),
      stateHighlights: Array.isArray(response.stateHighlights)
        ? response.stateHighlights.map((h: any) => String(h).trim()).filter(Boolean)
        : [
            `Score ${outcome.scoreDelta >= 0 ? "+" : ""}${outcome.scoreDelta}`,
            `HP lost: ${outcome.healthLost}`,
          ],
      questProgress: (response.questProgress || "The quest continues...").trim(),
      nextHook: (response.nextHook || "The adventure continues...").trim(),
    };
  } catch (error) {
    console.error("Outcome narration failed:", error);
    throw new Error(
      `Outcome narration error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Game Master Agent - Generate quest-based event
 * This is the NEW quest-aware event generator
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
  const { quest, currentStep, team, tensionLevel, narrativeStyle, language, memoryContext } = params;
  
  const avgPower = Math.max(1, Math.round(team.reduce((sum, p) => sum + p.maxHp, 0) / team.length / 20));
  const totalSteps = quest.estimatedSteps;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);
  const teamStatus = getTeamStatus(team);
  const questProgress = calculateQuestProgress(currentStep, totalSteps);
  const branchOptions = generateQuestBranchOptions({
    quest,
    currentStep,
    difficulty: quest.difficulty,
  });
  const survival = predictTeamSurvival({
    ...({} as GameState),
    team,
  } as GameState, questProgress.stepsRemaining);
  
  const styleDescriptions = {
    serious: "serious and dramatic",
    humor: "light-hearted and playful",
    epic: "grand and legendary",
  };

  const prompt = `You are a Pokémon Game Master creating quest-driven events.

QUEST CONTEXT:
- Title: "${quest.title}"
- Objective: "${quest.objective}"
- Difficulty: ${quest.difficulty}
- Progress: Step ${currentStep}/${totalSteps} (${progressPercent}%)

TEAM CONTEXT:
- Average Power: ${avgPower}
- Team Size: ${team.length}
- Names: ${team.map(p => p.name).join(", ")}

NARRATIVE SETTINGS:
- Style: ${narrativeStyle} (${styleDescriptions[narrativeStyle]})
- Tension Level: ${tensionLevel}/3

TEAM STATUS:
- Alive: ${teamStatus.alive}/${team.length}
- Health: ${teamStatus.healthStatus}
- Avg Power: ${teamStatus.avgLevel}

QUEST PHASE:
- Phase: ${questProgress.phase}
- Steps Remaining: ${questProgress.stepsRemaining}

SURVIVAL ESTIMATE:
- Probability: ${Math.round(survival.survivalProbability * 100)}%
- Recommendation: ${survival.recommendation}

BRANCH OPTIONS (use as inspiration):
${branchOptions.map((opt) => `- ${opt.title}: ${opt.description} (${opt.difficulty})`).join("\n")}

MEMORY CONTEXT (recent events):
${memoryContext && memoryContext.length > 0 ? memoryContext.map((m) => `- ${m}`).join("\n") : "- None"}

YOUR TASK:
Generate an event that ADVANCES THE QUEST toward "${quest.objective}" and feels consistent with prior events.

EVENT TYPE OPTIONS (choose one that fits quest):
- wild_battle: Encounter blocking path to quest objective
- trainer_battle: Character who can help/hinder quest
- capture: Rare Pokémon related to quest
- poke_center: Safe haven to heal
- narrative_choice: Story decision affecting quest outcome
- boss: Major quest obstacle or villain (use at steps ${Math.floor(totalSteps * 0.5)} or ${totalSteps})

GUIDELINES:
1. EVENT must relate DIRECTLY to quest objective
2. SCENE must reference quest context (4-6 sentences, ${narrativeStyle} tone)
  - Include a clear location, a concrete obstacle, and a clue or item tied to the quest
  - If MEMORY CONTEXT exists, reference at least one specific prior detail to maintain continuity
3. DIFFICULTY escalates: early steps easier, final steps harder
4. Enemy power: ${avgPower - 1} to ${avgPower + 3 + (currentStep > totalSteps * 0.6 ? 2 : 0)}
5. Mark key moments with missionCritical: true (boss or decisive choice)

CRITICAL: Output ONLY valid JSON, no markdown:
{
  "eventType": "<type from list above>",
  "difficulty": "easy" | "normal" | "hard",
  "scene": "<4-6 sentences connecting to quest: ${quest.title}>",
  "context": {
    "enemyName": "<name if battle/boss>",
    "enemyLevel": <power if applicable>,
    "enemyTypes": ["<type>", "<optional second type>"] ,
    "itemReward": "<optional: quest-related item>",
    "location": "<specific place: town, route, landmark>",
    "npcName": "<optional NPC name>",
    "questRelevance": "<how this event connects to quest objective>",
    "missionCritical": true|false
  }
}

${language === "fr" ? "Réponds EN FRANÇAIS uniquement" : "Respond ONLY in ENGLISH"}`;

  try {
    const responseText = await callMistral(prompt, 700, 0.75);
    let jsonText = responseText.trim();
    
    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }

    let raw: any;
    try {
      raw = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse quest event JSON:", jsonText);
      throw new Error(`Quest event JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    // Normalize and validate
    let normalizedType = (raw.eventType || "").toLowerCase().trim().replace(/\s+/g, "_");
    const validTypes = ["wild_battle", "trainer_battle", "capture", "poke_center", "narrative_choice", "evolution", "boss"];
    if (!validTypes.includes(normalizedType)) {
      console.warn(`Invalid event type "${raw.eventType}", defaulting to "narrative_choice"`);
      normalizedType = "narrative_choice";
    }

    const validDifficulties = ["easy", "normal", "hard"];
    let finalDifficulty = (raw.difficulty || "normal").toLowerCase();
    if (!validDifficulties.includes(finalDifficulty)) {
      finalDifficulty = "normal";
    }

    if (typeof raw.scene !== "string" || raw.scene.trim().length === 0) {
      raw.scene = `An event unfolds on your quest: ${quest.title}`;
    }

    if (typeof raw.context !== "object" || !raw.context) {
      raw.context = {};
    }
    if (!raw.context.questRelevance) {
      raw.context.questRelevance = "Part of the quest journey";
    }

    if (!Array.isArray(raw.context.enemyTypes) || raw.context.enemyTypes.length === 0) {
      raw.context.enemyTypes = ["normal"];
    }

    if (typeof raw.context.location !== "string" || raw.context.location.trim().length === 0) {
      raw.context.location = "a remote route";
    }

    if (raw.context.npcName && typeof raw.context.npcName !== "string") {
      raw.context.npcName = String(raw.context.npcName);
    }

    if (typeof raw.context.missionCritical !== "boolean") {
      raw.context.missionCritical = currentStep >= totalSteps;
    }

    if (raw.context.enemyLevel !== undefined) {
      raw.context.enemyLevel = Math.max(1, Math.min(100, parseInt(raw.context.enemyLevel) || avgPower));
    }

    return {
      id: `qevt_${currentStep}_${Date.now()}`,
      step: currentStep as StepRange,
      type: normalizedType as EventType,
      difficulty: finalDifficulty as "easy" | "normal" | "hard",
      scene: raw.scene.trim(),
      context: raw.context,
      eventSeed: Date.now(),
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error("Quest event generation failed:", error);
    throw new Error(
      `Quest event error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Game Master Agent - Generate raw event (LEGACY - kept for compatibility)
 * Consider using gameMasterGenerateQuestEvent for quest-based adventures
 */
export async function gameMasterGenerateEvent(params: {
  step: number;
  narrativeStyle: NarrativeStyle;
  tensionLevel: number;
  playerTeamLevels: number[];
  seed: number;
  wins: number;
  language: "en" | "fr";
}): Promise<Event> {
  const { step, narrativeStyle, tensionLevel, playerTeamLevels, seed, wins, language } = params;
  const avgLevel = Math.floor(playerTeamLevels.reduce((a, b) => a + b, 0) / playerTeamLevels.length);
  const difficulty = wins < 2 ? "easy" : wins < 5 ? "normal" : "hard";

  const prompt = `You are a Pokémon Game Master designing epic 8-step adventures.

ADVENTURE CONTEXT:
- Current Step: ${step}/8
- Average Team Level: ${avgLevel}
- Wins So Far: ${wins}
- Difficulty: ${difficulty}
- Tension Level: ${tensionLevel}/3
- Narrative Style: ${narrativeStyle}

YOUR TASK:
1. Choose an EVENT TYPE (must be one of): wild_battle, trainer_battle, capture, poke_center, narrative_choice, evolution, boss
2. Set DIFFICULTY: easy, normal, or hard
3. Write a compelling SCENE (3-4 sentences that draws player in)
4. Provide CONTEXT with relevant details

CRITICAL RULES:
- ALWAYS respond with ONLY valid JSON, no extra text
- Step 4 and 8 should feature BOSS encounters
- Escalate difficulty and stakes as steps progress
- Suggest enemy level between ${avgLevel - 2} and ${avgLevel + 5 + (difficulty === "hard" ? 3 : 0)}

${language === "fr" ? "Réponds EN FRANÇAIS uniquement" : "Respond ONLY in ENGLISH"}

OUTPUT ONLY THIS JSON (no markdown, no triple backticks):
{
  "eventType": "<event_type>",
  "difficulty": "<difficulty>",
  "scene": "<narrative scene>",
  "context": {
    "enemyName": "<name if battle/boss>",
    "enemyLevel": <level if applicable>,
    "itemReward": "<optional reward>"
  }
}`;

  try {
    const responseText = await callMistral(prompt, 600, 0.7);
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }

    // Parse and validate
    let raw: any;
    try {
      raw = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse JSON:", jsonText);
      throw new Error(`JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    // Normalize event type (handle spaces, case variations)
    let normalizedType = (raw.eventType || "").toLowerCase().trim();
    normalizedType = normalizedType.replace(/\s+/g, "_");

    // Validate event type
    const validTypes = ["wild_battle", "trainer_battle", "capture", "poke_center", "narrative_choice", "evolution", "boss"];
    if (!validTypes.includes(normalizedType)) {
      console.warn(`Invalid event type "${raw.eventType}", using "wild_battle" as fallback`);
      normalizedType = "wild_battle";
    }

    // Ensure we have valid difficulty
    const validDifficulties = ["easy", "normal", "hard"];
    let finalDifficulty = (raw.difficulty || "normal").toLowerCase();
    if (!validDifficulties.includes(finalDifficulty)) {
      finalDifficulty = "normal";
    }

    // Ensure scene is string
    if (typeof raw.scene !== "string" || raw.scene.trim().length === 0) {
      raw.scene = `A wild encounter appears at step ${step}!`;
    }

    // Ensure context is object
    if (typeof raw.context !== "object" || !raw.context) {
      raw.context = {};
    }

    // Ensure enemy level is reasonable number
    if (raw.context.enemyLevel !== undefined) {
      raw.context.enemyLevel = Math.max(1, Math.min(100, parseInt(raw.context.enemyLevel) || avgLevel));
    }

    return {
      id: `evt_${step}_${Date.now()}`,
      step: step as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
      type: normalizedType as any,
      difficulty: finalDifficulty as "easy" | "normal" | "hard",
      scene: raw.scene.trim(),
      context: raw.context || {},
      eventSeed: seed,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error("Game Master generation failed:", error);
    throw new Error(
      `Game Master error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

