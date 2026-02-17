/**
 * Specialist Agents with Short Reasoning
 * Each responds to directives from Generalist
 */

import { messageBus, TrueMASMessage } from "./message-bus";
import { Event, Choice, RiskLevel, Quest, TeamPokemon, NarrativeStyle } from "@/types/adventure";
import {
  getTeamStatus,
  calculateQuestProgress,
  rankBestPokemonForQuest,
  checkTypeEffectiveness,
  estimateBattleOutcome,
  simulateTurnOutcome,
} from "@/lib/ai/agent-tools";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

async function callMistral(
  prompt: string,
  modelName: string = "mistral-small-latest",
  maxTokens: number = 500,
  temperature: number = 0.7
) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY not defined");

  const response = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mistral API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Safe JSON parsing with aggressive reconstruction
 */
function parseJSONSafely(jsonText: string): any {
  // Step 0: Remove markdown and extract JSON
  let text = jsonText.replace(/\r\n/g, "\n").trim();
  
  if (text.includes("```")) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1);
      console.log("[parseJSON] Extracted JSON, length:", text.length);
    }
  }

  // Step 1: Try direct parse
  try {
    return JSON.parse(text);
  } catch (e1: any) {
    console.log("[parseJSON] Direct parse failed");
  }

  // Step 2: Fix unclosed strings by closing them before the next structural character
  try {
    let result = "";
    let inString = false;
    let escaped = false;
    let stringStart = -1;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }
      
      if (char === "\\" && inString) {
        result += char;
        escaped = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        if (inString) {
          stringStart = i;
        }
        result += char;
        continue;
      }
      
      // If we're in a string with newline, escape it
      if (inString && (char === "\n" || char === "\r" || char === "\t")) {
        switch (char) {
          case "\n": result += "\\n"; break;
          case "\r": result += "\\r"; break;
          case "\t": result += "\\t"; break;
        }
        continue;
      }
      
      result += char;
    }
    
    // If string is still open at the end, close it
    if (inString) {
      result += '"';
    }
    
    console.log("[parseJSON] After string closure attempt...");
    return JSON.parse(result);
  } catch (e2: any) {
    console.log("[parseJSON] String closure failed");
  }

  // Step 3: Try truncating to last complete structure
  try {
    // Smart truncation: find the last complete object/array
    let depth = 0;
    let inString2 = false;
    let escaped2 = false;
    let lastGoodPos = -1;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (escaped2) {
        escaped2 = false;
        continue;
      }
      
      if (char === "\\" && inString2) {
        escaped2 = true;
        continue;
      }
      
      if (char === '"') {
        inString2 = !inString2;
        continue;
      }
      
      if (!inString2) {
        if (char === "{" || char === "[") {
          depth++;
        } else if (char === "}" || char === "]") {
          depth--;
          if (depth === 0) {
            lastGoodPos = i;
          }
        }
      }
    }
    
    if (lastGoodPos > 10) {
      const truncated = text.substring(0, lastGoodPos + 1);
      console.log("[parseJSON] Truncated to position:", lastGoodPos);
      return JSON.parse(truncated);
    }
  } catch (e3: any) {
    console.log("[parseJSON] Smart truncation failed");
  }

  // Step 4: Try closing incomplete structures
  try {
    let fixed = text;
    
    // Count unclosed braces and brackets
    let braceDepth = 0;
    let bracketDepth = 0;
    let inString4 = false;
    let escaped4 = false;
    
    for (let i = 0; i < fixed.length; i++) {
      const char = fixed[i];
      
      if (escaped4) {
        escaped4 = false;
        continue;
      }
      
      if (char === "\\" && inString4) {
        escaped4 = true;
        continue;
      }
      
      if (char === '"') {
        inString4 = !inString4;
        continue;
      }
      
      if (!inString4) {
        if (char === "{") braceDepth++;
        else if (char === "}") braceDepth--;
        else if (char === "[") bracketDepth++;
        else if (char === "]") bracketDepth--;
      }
    }
    
    // Close any open structures
    for (let i = 0; i < braceDepth; i++) fixed += "}";
    for (let i = 0; i < bracketDepth; i++) fixed += "]";
    
    console.log("[parseJSON] Closed structures, trying parse...");
    return JSON.parse(fixed);
  } catch (e4: any) {
    console.log("[parseJSON] Structure closure failed");
  }

  // All failed - provide error
  console.error("[parseJSON] FAILED - all 4 strategies unsuccessful. Length:", text.length);
  throw new Error(
    `Failed to parse JSON. Length: ${text.length}. ` +
    `Start: ${text.substring(0, 60)}...`
  );
}

/**
 * GameMaster Specialist - Event Generator
 */
export class GameMasterSpecialist {
  private name = "GameMasterSpecialist";
  private memory: TrueMASMessage[] = [];

  constructor() {
    messageBus.subscribe(
      this.name,
      ["event_strategy_directive", "event_request"],
      (msg) => this.handleMessage(msg)
    );
    console.log("🎲 [GameMaster Specialist] Initialized");
  }

  private async handleMessage(message: TrueMASMessage): Promise<void> {
    this.memory.push(message);
    if (this.memory.length > 50) this.memory = this.memory.slice(-50);

    if (message.topic === "event_strategy_directive") {
      await this.generateEventFromDirective(message.content);
    }
  }

  private async generateEventFromDirective(content: any): Promise<void> {
    const { eventStrategy, quest, currentStep, team, narrativeStyle, language } = content;

    const teamStatus = getTeamStatus(team);
    const avgPower = Math.max(
      1,
      Math.round(team.reduce((sum: number, p: TeamPokemon) => sum + p.maxHp, 0) / team.length / 20)
    );

    console.log("🎯 [GM Specialist] Generating event from strategy...");

    const prompt = `You are creating a Pokémon adventure event.

STRATEGY GUIDANCE:
${eventStrategy.strategic_direction}
Type: ${eventStrategy.suggested_event_type}
Difficulty: ${eventStrategy.difficulty_recommendation}

QUEST: "${quest.title}" - Step ${currentStep}/${quest.estimatedSteps}
TEAM: ${team.map((p: TeamPokemon) => p.name).join(", ")}
STATUS: ${teamStatus.healthStatus}
STYLE: ${narrativeStyle}

Create immersive event scene (5-6 sentences).

${language === "fr" ? "Réponds EN FRANÇAIS" : "Respond in ENGLISH"}

OUTPUT JSON (no markdown):
{
  "eventType": "wild_battle|trainer_battle|narrative_choice|boss|poke_center",
  "difficulty": "easy|normal|hard",
  "scene": "<vivid scene description>",
  "context": {
    "enemyName": "<if battle>",
    "enemyLevel": ${avgPower},
    "enemyTypes": ["<type>"],
    "location": "<specific place>",
    "questRelevance": "<connection to quest>"
  }
}`;

    try {
      const responseText = await callMistral(prompt, "mistral-small-latest", 600, 0.8);
      const eventData = parseJSONSafely(responseText);

      // Broadcast event to others
      await messageBus.publish({
        id: "",
        from: this.name,
        to: "all",
        type: "broadcast",
        topic: "event_generated",
        priority: "high",
        timestamp: Date.now(),
        content: eventData,
      });

      console.log("📢 [GM Specialist] Event created and broadcasted");
    } catch (error) {
      console.error("[GM Specialist] Event generation failed:", error);
    }
  }
}

/**
 * ChoiceAgent Specialist - Choice Generator
 */
export class ChoiceAgentSpecialist {
  private name = "ChoiceAgentSpecialist";
  private memory: TrueMASMessage[] = [];

  constructor() {
    messageBus.subscribe(
      this.name,
      ["event_generated", "choice_request"],
      (msg) => this.handleMessage(msg)
    );
    console.log("💭 [Choice Specialist] Initialized");
  }

  private async handleMessage(message: TrueMASMessage): Promise<void> {
    this.memory.push(message);
    if (this.memory.length > 50) this.memory = this.memory.slice(-50);

    if (message.topic === "event_generated") {
      await this.generateChoicesForEvent(message.content);
    }
  }

  private async generateChoicesForEvent(eventData: any): Promise<void> {
    const { team, quest, currentStep, narrativeStyle, language, event } = eventData;

    const teamStatus = getTeamStatus(team || []);
    const questProgress = calculateQuestProgress(currentStep || 1, quest?.estimatedSteps || 8);
    const ranked = rankBestPokemonForQuest(team || [], {
      objective: quest?.objective || "",
      enemyTypes: event?.context?.enemyTypes || ["normal"],
    });

    const topPicks = ranked.slice(0, 2).map((p) => p.name).join(", ");
    const teamIds = (team || []).map((p: TeamPokemon) => p.id);

    console.log("💭 [Choice Specialist] Generating choices...");

    const prompt = `Create 2-4 tactical choices for a Pokémon scene.

QUEST: "${quest?.title || "Adventure"}" - Step ${currentStep || 1}
SCENE: ${eventData.scene || "A new challenge appears"}
TEAM: ${(team || []).map((p: TeamPokemon) => p.name).join(", ")}
TOP POKEMON: ${topPicks}
STYLE: ${narrativeStyle}

Each choice should mention specific Pokémon by name.
Risk levels: SAFE (defensive), MODERATE (balanced), RISKY (aggressive)

${language === "fr" ? "Réponds EN FRANÇAIS" : "Respond in ENGLISH"}

RETURN ONLY VALID JSON (no markdown, no code blocks):
{
  "choices": [
    {
      "risk": "SAFE|MODERATE|RISKY",
      "label": "<choice title>",
      "description": "<action with pokemon names>",
      "affectedPokemon": [<IDs from ${teamIds.join(",")}>],
      "potentialConsequences": "<risk desc>"
    }
  ]
}`;

    try {
      const responseText = await callMistral(prompt, "mistral-small-latest", 600, 0.7);
      const choicesData = parseJSONSafely(responseText);

      // Map to RiskLevel
      const riskMap = { safe: RiskLevel.SAFE, moderate: RiskLevel.MODERATE, risky: RiskLevel.RISKY };

      const normalizedChoices = choicesData.choices.map((c: any) => ({
        risk: riskMap[c.risk?.toLowerCase() || "moderate"],
        label: c.label,
        description: c.description,
        affectedPokemon: c.affectedPokemon || [],
        potentialConsequences: c.potentialConsequences,
      }));

      // Send to Guardian for validation
      await messageBus.publish({
        id: "",
        from: this.name,
        to: "GuardianSpecialist",
        type: "request",
        topic: "validate_choices",
        priority: "high",
        timestamp: Date.now(),
        content: { choices: normalizedChoices, team, event: eventData },
      });

      console.log("✅ [Choice Specialist] Choices generated, sent to Guardian");
    } catch (error) {
      console.error("[Choice Specialist] Choice generation failed:", error);
    }
  }
}

/**
 * Guardian Specialist - Validator (DETERMINISTIC, no LLM)
 */
export class GuardianSpecialist {
  private name = "GuardianSpecialist";
  private memory: TrueMASMessage[] = [];

  constructor() {
    messageBus.subscribe(
      this.name,
      ["validate_choices"],
      (msg) => this.handleMessage(msg)
    );
    console.log("🛡️  [Guardian Specialist] Initialized (DETERMINISTIC)");
  }

  private async handleMessage(message: TrueMASMessage): Promise<void> {
    this.memory.push(message);
    if (this.memory.length > 50) this.memory = this.memory.slice(-50);

    if (message.topic === "validate_choices") {
      await this.validateChoices(message.content);
    }
  }

  private async validateChoices(content: any): Promise<void> {
    const { choices, team, event } = content;

    console.log("🛡️  [Guardian Specialist] Validating choices...");

    const validations = choices.map((choice: Choice) => {
      const warnings: string[] = [];
      const aliveTeamIds = (team || [])
        .filter((p: TeamPokemon) => p.currentHp > 0)
        .map((p: TeamPokemon) => p.id);

      // Check affected Pokemon are alive
      const invalidPokemon = choice.affectedPokemon.filter((id) => !aliveTeamIds.includes(id));
      if (invalidPokemon.length > 0) {
        warnings.push(`Cannot use fainted Pokémon`);
      }

      // Check HP for risky actions
      const affectedPokemon = (team || []).filter((p: TeamPokemon) =>
        choice.affectedPokemon.includes(p.id)
      );
      const lowHpPokemon = affectedPokemon.filter((p: TeamPokemon) => p.currentHp < p.maxHp * 0.3);

      if (choice.risk === RiskLevel.RISKY && lowHpPokemon.length > 0) {
        warnings.push(`Low HP Pokémon in risky action`);
      }

      // Type effectiveness
      if (event?.context?.enemyTypes && affectedPokemon.length > 0) {
        const primary = affectedPokemon[0];
        for (const type of primary.types) {
          const effectiveness = checkTypeEffectiveness(type, event.context.enemyTypes);
          if (effectiveness.multiplier > 1) {
            warnings.push(`Type advantage: ${effectiveness.description}`);
          } else if (effectiveness.multiplier < 1) {
            warnings.push(`Type disadvantage: ${effectiveness.description}`);
          }
        }
      }

      const isValid = warnings.every((w) => !w.includes("Cannot") && !w.includes("disadvantage"));

      return { choice, isValid, warnings };
    });

    // Broadcast validation
    await messageBus.publish({
      id: "",
      from: this.name,
      to: "NarratorSpecialist",
      type: "response",
      topic: "choices_validated",
      priority: "high",
      timestamp: Date.now(),
      content: { validations, choices },
    });

    console.log("✅ [Guardian Specialist] Validation complete");
  }
}

/**
 * Narrator Specialist - Outcome Narrator
 */
export class NarratorSpecialist {
  private name = "NarratorSpecialist";
  private memory: TrueMASMessage[] = [];

  constructor() {
    messageBus.subscribe(
      this.name,
      ["choices_validated", "narrate_outcome"],
      (msg) => this.handleMessage(msg)
    );
    console.log("📖 [Narrator Specialist] Initialized");
  }

  private async handleMessage(message: TrueMASMessage): Promise<void> {
    this.memory.push(message);
    if (this.memory.length > 50) this.memory = this.memory.slice(-50);

    if (message.topic === "narrate_outcome") {
      await this.narrateOutcome(message.content);
    }
  }

  private async narrateOutcome(content: any): Promise<void> {
    const { outcome, chosenAction, event, quest, currentStep, narrativeStyle, language } = content;

    console.log("📖 [Narrator Specialist] Narrating outcome...");

    const prompt = `Narrate the outcome of a Pokémon action.

ACTION: ${chosenAction?.label || "An action was taken"}
DESCRIPTION: ${chosenAction?.description || ""}
SUCCESS: ${outcome?.success || false}
SCORE: ${outcome?.scoreDelta || 0}

QUEST: "${quest?.title || "Adventure"}"
STYLE: ${narrativeStyle}

Write 3-4 sentences narrating the outcome vividly.
${language === "fr" ? "Réponds EN FRANÇAIS" : "Respond in ENGLISH"}

RETURN ONLY VALID JSON (no markdown, no code blocks):
{
  "narration": "<outcome narration>",
  "stateHighlights": ["<highlight1>", "<highlight2>"],
  "nextHook": "<teaser for next>"
}`;

    try {
      const responseText = await callMistral(prompt, "mistral-small-latest", 400, 0.7);
      const narratedOutcome = parseJSONSafely(responseText);

      // Broadcast final result
      await messageBus.publish({
        id: "",
        from: this.name,
        to: "all",
        type: "broadcast",
        topic: "outcome_narrated",
        priority: "high",
        timestamp: Date.now(),
        content: narratedOutcome,
      });

      console.log("📖 [Narrator Specialist] Narration created");
    } catch (error) {
      console.error("[Narrator Specialist] Narration failed:", error);
    }
  }
}

// Initialize all specialists
export function initializeSpecialists() {
  new GameMasterSpecialist();
  new ChoiceAgentSpecialist();
  new GuardianSpecialist();
  new NarratorSpecialist();
  console.log("🤖 [Specialists] All 4 specialists initialized");
}
