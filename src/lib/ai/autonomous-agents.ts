// Autonomous agents with perception-reasoning-action loops

import {
  BaseAgent,
  AgentAction,
  AgentPerception,
  AgentConfig,
  AgentMessage,
} from "./base-agent";
import {
  Event,
  Quest,
  TeamPokemon,
  NarrativeStyle,
  Choice,
  RiskLevel,
  Outcome,
} from "@/types/adventure";
import {
  getTeamStatus,
  calculateQuestProgress,
  rankBestPokemonForQuest,
  generateQuestBranchOptions,
  computeNarrativeTension,
  predictTeamSurvival,
  checkTypeEffectiveness,
  estimateBattleOutcome,
  simulateTurnOutcome,
} from "@/lib/ai/agent-tools";
import { logCollector } from "./agent-log-collector";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

/**
 * Call Mistral API
 */
async function callMistral(
  prompt: string,
  modelName: string = "mistral-small-latest",
  maxTokens: number = 500,
  temperature: number = 0.7
) {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not defined in environment variables");
  }

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
 * GAME MASTER AGENT - Autonomous quest and event generator
 */
export class GameMasterAgent extends BaseAgent {
  constructor() {
    super({
      name: "GameMaster",
      role: "Quest architect and world builder",
      modelName: "mistral-small-latest",
      temperature: 0.8,
      maxTokens: 700,
      expertise: ["quest_design", "world_building", "event_generation", "pacing"],
      canInitiate: true,
      votingWeight: 1.5, // Higher weight for narrative decisions
    });
  }

  /**
   * REASON: Decide if we need to generate quest/event
   */
  async reason(): Promise<AgentAction | null> {
    const perception = this.internalState.lastPerception as AgentPerception;
    if (!perception) return null;

    const unreadMessages = this.getUnreadMessages();

    // Check if someone is requesting quest generation
    const questRequest = unreadMessages.find(
      (msg) =>
        msg.type === "request" &&
        (msg.content?.action === "generate_quest" ||
          msg.content?.action === "generate_event")
    );

    if (questRequest) {
      this.markAsRead(questRequest.id);

      if (questRequest.content.action === "generate_quest") {
        return {
          type: "generate",
          data: { requestType: "quest", request: questRequest },
          confidence: 0.9,
          reasoning: "Received quest generation request",
        };
      } else if (questRequest.content.action === "generate_event") {
        return {
          type: "generate",
          data: { requestType: "event", request: questRequest },
          confidence: 0.9,
          reasoning: "Received event generation request",
        };
      }
    }

    // Check if we're in a voting session about narrative direction
    const voteRequest = unreadMessages.find(
      (msg) =>
        msg.type === "broadcast" &&
        msg.content?.domain === "decision" &&
        msg.content?.sessionId
    );

    if (voteRequest) {
      return {
        type: "vote",
        data: { voteRequest },
        confidence: 0.8,
        reasoning: "Participating in narrative decision vote",
      };
    }

    return { type: "wait", data: {}, confidence: 1, reasoning: "No action needed" };
  }

  /**
   * ACT: Generate quest or event
   */
  async act(action: AgentAction): Promise<any> {
    if (action.type === "generate") {
      if (action.data.requestType === "quest") {
        return await this.generateQuest(action.data.request.content);
      } else if (action.data.requestType === "event") {
        return await this.generateEvent(action.data.request.content);
      }
    } else if (action.type === "vote") {
      return await this.castVote(action.data.voteRequest);
    }

    return null;
  }

  /**
   * Generate quest using tools and LLM
   */
  private async generateQuest(params: any): Promise<Quest> {
    const { team, narrativeStyle, language, difficulty, estimatedSteps } = params;
    const style = narrativeStyle as NarrativeStyle;

    // Use tools to analyze team
    const teamStatus = getTeamStatus(team);
    const teamSummary = team.map((p: TeamPokemon) => `${p.name} (${p.types.join("/")})`).join(", ");

    console.log(
      `[GameMaster] Generating quest for team: ${teamSummary} (health: ${teamStatus.healthStatus})`
    );

    const styleGuides: Record<NarrativeStyle, string> = {
      serious: "Create a dramatic, high-stakes quest with real consequences",
      humor: "Create a lighthearted, quirky quest with comedic situations",
      epic: "Create a grandiose, legendary quest of epic proportions",
    };

    const prompt = `You are a Pokémon Quest Master designing a coherent adventure.

TEAM: ${teamSummary}
STYLE: ${narrativeStyle} - ${styleGuides[style]}
DIFFICULTY: ${difficulty}
ESTIMATED STEPS: ${estimatedSteps}

YOUR MISSION:
Design a compelling main quest line (${estimatedSteps} steps) that is NOT about the Pokémon League.

The quest should fit the ${narrativeStyle} narrative style and match the ${difficulty} difficulty level.

${language === "fr" ? "Réponds EN FRANÇAIS uniquement" : "Respond ONLY in ENGLISH"}

RESPOND WITH THIS JSON (no markdown):
{
  "title": "<Quest title>",
  "description": "<2-3 sentence description>",
  "objective": "<Clear goal>",
  "difficulty": "${difficulty}",
  "estimatedSteps": ${estimatedSteps}
}`;

    try {
      const responseText = await callMistral(
        prompt,
        this.config.modelName!,
        this.config.maxTokens!,
        this.config.temperature!
      );

      let jsonText = responseText.trim();
      if (jsonText.includes("```json")) {
        jsonText = jsonText.split("```json")[1].split("```")[0].trim();
      } else if (jsonText.includes("```")) {
        jsonText = jsonText.split("```")[1].split("```")[0].trim();
      }

      const quest = JSON.parse(jsonText);

      // Broadcast quest to all agents
      const message = this.createMessage(
        "all",
        "broadcast",
        {
          domain: "quest_generated",
          quest,
        },
        "high"
      );

      return quest;
    } catch (error) {
      console.error("[GameMaster] Quest generation failed:", error);
      throw error;
    }
  }

  /**
   * Generate event using tools and LLM
   */
  private async generateEvent(params: any): Promise<Event> {
    const { quest, currentStep, team, narrativeStyle, language, memoryContext } = params;

    // Use tools to analyze situation
    const teamStatus = getTeamStatus(team);
    const questProgress = calculateQuestProgress(currentStep, quest.estimatedSteps);
    const branchOptions = generateQuestBranchOptions({
      quest,
      currentStep,
      difficulty: quest.difficulty,
    });

    const faintedCount = team.filter((p: TeamPokemon) => p.currentHp === 0).length;
    const victories = Math.max(0, currentStep - 1);
    const tensionInsight = computeNarrativeTension(currentStep, victories, faintedCount);

    const survival = predictTeamSurvival(
      { team } as any,
      questProgress.stepsRemaining
    );

    console.log(
      `[GameMaster] Generating event - Step ${currentStep}/${quest.estimatedSteps}, tension: ${tensionInsight.tensionLevel}, survival: ${Math.round(survival.survivalProbability * 100)}%`
    );

    const avgPower = Math.max(
      1,
      Math.round(team.reduce((sum: number, p: TeamPokemon) => sum + p.maxHp, 0) / team.length / 20)
    );

    const prompt = `You are a Pokémon Game Master creating quest-driven events.

QUEST: "${quest.title}" - ${quest.objective}
PROGRESS: Step ${currentStep}/${quest.estimatedSteps} (${questProgress.phase})
TEAM STATUS: ${teamStatus.healthStatus} (${teamStatus.alive}/${team.length} alive)
TENSION: ${tensionInsight.tensionLevel}/3 - suggested: ${tensionInsight.recommendedEvent}
SURVIVAL: ${Math.round(survival.survivalProbability * 100)}%

Generate an event that ADVANCES THE QUEST and fits the ${narrativeStyle} narrative style.

${language === "fr" ? "Réponds EN FRANÇAIS uniquement" : "Respond ONLY in ENGLISH"}

OUTPUT ONLY THIS JSON (no markdown):
{
  "eventType": "wild_battle|trainer_battle|capture|poke_center|narrative_choice|boss",
  "difficulty": "easy|normal|hard",
  "scene": "<4-6 sentences connecting to quest>",
  "context": {
    "enemyName": "<name if battle>",
    "enemyLevel": ${avgPower},
    "enemyTypes": ["<type>"],
    "location": "<specific place>",
    "questRelevance": "<how this connects to quest>",
    "missionCritical": ${currentStep >= quest.estimatedSteps}
  }
}`;

    try {
      const responseText = await callMistral(
        prompt,
        this.config.modelName!,
        this.config.maxTokens!,
        this.config.temperature!
      );

      let jsonText = responseText.trim();
      if (jsonText.includes("```json")) {
        jsonText = jsonText.split("```json")[1].split("```")[0].trim();
      }

      const raw = JSON.parse(jsonText);

      const event: Event = {
        id: `evt_${currentStep}_${Date.now()}`,
        step: currentStep as any,
        type: raw.eventType,
        difficulty: raw.difficulty || "normal",
        scene: raw.scene,
        context: raw.context || {},
        eventSeed: Date.now(),
        generatedAt: new Date(),
      };

      // Broadcast event to all agents
      const message = this.createMessage(
        "all",
        "broadcast",
        {
          domain: "event_generated",
          event,
        },
        "high"
      );

      return event;
    } catch (error) {
      console.error("[GameMaster] Event generation failed:", error);
      throw error;
    }
  }

  /**
   * Cast vote on narrative decisions
   */
  private async castVote(voteRequest: AgentMessage): Promise<void> {
    const { options, context } = voteRequest.content;

    // Analyze options using tools
    let bestOption = options[0];
    let maxScore = 0;
    let reasoning = "First option by default";

    // Simple heuristic: prefer options that match tension level
    if (context.tensionLevel !== undefined) {
      if (context.tensionLevel >= 2 && options.includes("boss")) {
        bestOption = "boss";
        reasoning = "High tension calls for major encounter";
        maxScore = 0.9;
      } else if (context.tensionLevel <= 1 && options.includes("poke_center")) {
        bestOption = "poke_center";
        reasoning = "Low tension, allow recovery";
        maxScore = 0.8;
      }
    }

    // Send vote
    const voteMessage = this.createMessage(
      "orchestrator",
      "vote",
      {
        sessionId: voteRequest.content.sessionId,
        choice: bestOption,
        confidence: maxScore || 0.5,
        reasoning,
      },
      "high"
    );

    console.log(`[GameMaster] Voted for: ${bestOption} (${reasoning})`);
  }
}

/**
 * CHOICE AGENT - Autonomous choice and narration generator
 */
export class ChoiceAgent extends BaseAgent {
  constructor() {
    super({
      name: "ChoiceAgent",
      role: "Tactical choice designer and narrator",
      modelName: "mistral-small-latest",
      temperature: 0.7,
      maxTokens: 800,
      expertise: ["choice_generation", "tactics", "team_analysis"],
      canInitiate: false,
      votingWeight: 1.2,
    });
  }

  async reason(): Promise<AgentAction | null> {
    const perception = this.internalState.lastPerception as AgentPerception;
    if (!perception) return null;

    const unreadMessages = this.getUnreadMessages();

    // Check for choice generation request
    const choiceRequest = unreadMessages.find(
      (msg) => msg.type === "request" && msg.content?.action === "generate_choices"
    );

    if (choiceRequest) {
      this.markAsRead(choiceRequest.id);
      return {
        type: "generate",
        data: { request: choiceRequest },
        confidence: 0.9,
        reasoning: "Received choice generation request",
      };
    }

    // Participate in validation votes
    const validationVote = unreadMessages.find(
      (msg) =>
        msg.type === "broadcast" &&
        msg.content?.domain === "decision" &&
        msg.content?.question?.includes("choice")
    );

    if (validationVote) {
      return {
        type: "vote",
        data: { voteRequest: validationVote },
        confidence: 0.85,
        reasoning: "Voting on choice validation",
      };
    }

    return { type: "wait", data: {}, confidence: 1, reasoning: "No action needed" };
  }

  async act(action: AgentAction): Promise<any> {
    if (action.type === "generate") {
      return await this.generateChoices(action.data.request.content);
    } else if (action.type === "vote") {
      return await this.castVote(action.data.voteRequest);
    }
    return null;
  }

  private async generateChoices(params: any): Promise<any> {
    const { event, team, quest, currentStep, narrativeStyle, language } = params;
    const style = narrativeStyle as NarrativeStyle;

    // Analyze team with tools
    const teamStatus = getTeamStatus(team);
    const questProgress = calculateQuestProgress(currentStep, quest.estimatedSteps);
    const ranked = rankBestPokemonForQuest(team, {
      objective: quest.objective,
      enemyTypes: event.context.enemyTypes,
    });

    const topPicks = ranked.slice(0, 2).map((p) => `${p.name}`).join(", ");
    const teamIds = team.map((p: TeamPokemon) => p.id);

    console.log(
      `[ChoiceAgent] Generating choices - Top picks: ${topPicks}, Status: ${teamStatus.healthStatus}`
    );

    const styleDescriptions: Record<NarrativeStyle, string> = {
      serious: "serious, strategic, tense",
      humor: "humorous, lighthearted, witty",
      epic: "grandiose, dramatic, heroic",
    };

    const prompt = `You are the Choice Agent for a Pokémon quest.

QUEST: ${quest.title} - Step ${currentStep}/${quest.estimatedSteps}
SCENE: ${event.scene}
TEAM STATUS: ${teamStatus.healthStatus} (${teamStatus.alive}/${team.length} alive)
TOP PICKS: ${topPicks}

Create 2-4 choices (${styleDescriptions[style]} style) that mention specific Pokémon names.

${language === "fr" ? "Réponds EN FRANÇAIS uniquement" : "Respond ONLY in ENGLISH"}

RESPOND WITH JSON (no markdown):
{
  "narration": "<3-4 sentences>",
  "questProgress": "<relation to quest>",
  "choices": [
    {
      "risk": "SAFE|MODERATE|RISKY",
      "label": "<title>",
      "description": "<action with pokemon names>",
      "affectedPokemon": [<IDs from: ${teamIds.join(",")}>],
      "potentialConsequences": "<risk description>"
    }
  ]
}`;

    const responseText = await callMistral(
      prompt,
      this.config.modelName!,
      this.config.maxTokens!,
      this.config.temperature!
    );

    let jsonText = responseText.trim();
    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    }

    const response = JSON.parse(jsonText);

    // Normalize choices
    const riskMap: Record<string, RiskLevel> = {
      safe: RiskLevel.SAFE,
      moderate: RiskLevel.MODERATE,
      risky: RiskLevel.RISKY,
    };

    const normalizedChoices = response.choices.map((choice: any) => ({
      risk: riskMap[choice.risk?.toLowerCase()] || RiskLevel.MODERATE,
      label: choice.label || "Unknown",
      description: choice.description || "Unknown action",
      affectedPokemon: Array.isArray(choice.affectedPokemon) ? choice.affectedPokemon : [],
      potentialConsequences: choice.potentialConsequences || "",
    }));

    const result = {
      narration: response.narration || event.scene,
      choices: normalizedChoices,
      questProgress: response.questProgress || "",
    };

    // Request validation from Guardian
    const message = this.createMessage(
      "Guardian",
      "request",
      {
        action: "validate_choices",
        choices: normalizedChoices,
        team,
        event,
      },
      "high",
      true
    );

    console.log(`[ChoiceAgent] Generated ${normalizedChoices.length} choices, requesting validation`);

    return result;
  }

  private async castVote(voteRequest: AgentMessage): Promise<void> {
    // Simple voting logic based on tactical analysis
    const { options, context } = voteRequest.content;
    
    const bestOption = options[0]; // Could use tools to analyze
    const reasoning = "Tactical preference based on team composition";

    const voteMessage = this.createMessage(
      "orchestrator",
      "vote",
      {
        sessionId: voteRequest.content.sessionId,
        choice: bestOption,
        confidence: 0.7,
        reasoning,
      },
      "medium"
    );

    console.log(`[ChoiceAgent] Voted for: ${bestOption}`);
  }
}

/**
 * GUARDIAN AGENT - Autonomous validator and tactical analyst
 */
export class GuardianAgent extends BaseAgent {
  constructor() {
    super({
      name: "Guardian",
      role: "Tactical validator and risk analyst",
      modelName: "mistral-small-latest", // Could use a different analytical model
      temperature: 0.3, // Lower temperature for analytical tasks
      maxTokens: 500,
      expertise: ["validation", "risk_analysis", "type_effectiveness", "battle_simulation"],
      canInitiate: false,
      votingWeight: 1.3, // High weight for safety decisions
    });
  }

  async reason(): Promise<AgentAction | null> {
    const perception = this.internalState.lastPerception as AgentPerception;
    if (!perception) return null;

    const unreadMessages = this.getUnreadMessages();

    // Priority: validation requests
    const validationRequest = unreadMessages.find(
      (msg) => msg.type === "request" && msg.content?.action === "validate_choices"
    );

    if (validationRequest) {
      this.markAsRead(validationRequest.id);
      return {
        type: "validate",
        data: { request: validationRequest },
        confidence: 0.95,
        reasoning: "Received validation request from ChoiceAgent",
      };
    }

    // Monitor for dangerous situations
    const teamStatus = getTeamStatus(perception.gameState.team);
    if (teamStatus.healthStatus === "critical") {
      console.log("\n🚨 [ALERT] Guardian detected CRITICAL situation!");
      console.log("   ❤️  Team health: CRITICAL");
      console.log("   👥 Alive:", teamStatus.alive, "/", perception.gameState.team.length);
      console.log("   📢 Broadcasting warning to all agents...");
      
      // Log critical alert for UI
      logCollector.logAlert(
        "GuardianAgent",
        `Team health CRITICAL: ${teamStatus.alive}/${perception.gameState.team.length} alive`,
        "critical",
        teamStatus
      );
      
      return {
        type: "message",
        data: {
          message: this.createMessage(
            "all",
            "broadcast",
            {
              domain: "warning",
              message: "CRITICAL: Team health is critical. Recommend healing or defensive strategies.",
              teamStatus,
            },
            "critical"
          ),
        },
        confidence: 1.0,
        reasoning: "Team in critical condition, broadcasting warning",
      };
    }

    return { type: "wait", data: {}, confidence: 1, reasoning: "No validation needed" };
  }

  async act(action: AgentAction): Promise<any> {
    if (action.type === "validate") {
      return await this.validateChoices(action.data.request.content);
    } else if (action.type === "message") {
      // Message already created, just log
      console.log(`[Guardian] Broadcasting warning`);
    }
    return null;
  }

  private async validateChoices(params: any): Promise<any> {
    const { choices, team, event } = params;

    console.log(`[Guardian] Validating ${choices.length} choices`);

    const validations = choices.map((choice: Choice) => {
      const warnings: string[] = [];
      const aliveTeamIds = team.filter((p: TeamPokemon) => p.currentHp > 0).map((p: TeamPokemon) => p.id);

      // Check affected Pokemon are alive
      const invalidPokemon = choice.affectedPokemon.filter(
        (id) => !aliveTeamIds.includes(id)
      );
      if (invalidPokemon.length > 0) {
        warnings.push(`Cannot use fainted Pokémon`);
      }

      // Check HP for risky actions
      const affectedPokemon = team.filter((p: TeamPokemon) =>
        choice.affectedPokemon.includes(p.id)
      );
      const lowHpPokemon = affectedPokemon.filter(
        (p: TeamPokemon) => p.currentHp < p.maxHp * 0.3
      );

      if (choice.risk === RiskLevel.RISKY && lowHpPokemon.length > 0) {
        warnings.push(`Low HP Pokémon in risky action`);
      }

      // Type effectiveness analysis
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

        // Battle simulation
        const enemyPower = event.context.enemyLevel || 10;
        const estimate = estimateBattleOutcome({
          playerPokemon: primary,
          enemyPower,
          enemyTypes: event.context.enemyTypes,
        });

        warnings.push(`Win chance: ${Math.round(estimate.winProbability * 100)}%`);
      }

      const isValid = warnings.every((w) => !w.includes("Cannot") && !w.includes("disadvantage"));

      return {
        choice,
        isValid,
        warnings,
      };
    });

    // Send response back to ChoiceAgent
    const responseMessage = this.createMessage(
      "ChoiceAgent",
      "response",
      {
        validations,
      },
      "high"
    );

    const validCount = validations.filter((v: any) => v.isValid).length;
    const warningCount = validations.reduce((sum: number, v: any) => sum + v.warnings.length, 0);
    
    console.log("\n🔄 [INTER-AGENT] Guardian → ChoiceAgent");
    console.log("   ✅ Validation complete:", `${validCount}/${validations.length} valid`);
    console.log("   ⚠️  Total warnings:", warningCount);
    if (warningCount > 0) {
      console.log("   📝 Sample warnings:", validations[0]?.warnings.slice(0, 2).join(", "));
    }

    return validations;
  }
}

/**
 * NARRATOR AGENT - Autonomous outcome narrator
 */
export class NarratorAgent extends BaseAgent {
  constructor() {
    super({
      name: "Narrator",
      role: "Outcome storyteller and chronicler",
      modelName: "mistral-small-latest",
      temperature: 0.75, // Creative but controlled
      maxTokens: 500,
      expertise: ["narration", "storytelling", "outcome_description"],
      canInitiate: false,
      votingWeight: 0.8, // Lower weight, mostly creative decisions
    });
  }

  async reason(): Promise<AgentAction | null> {
    const perception = this.internalState.lastPerception as AgentPerception;
    if (!perception) return null;

    const unreadMessages = this.getUnreadMessages();

    const narrateRequest = unreadMessages.find(
      (msg) => msg.type === "request" && msg.content?.action === "narrate_outcome"
    );

    if (narrateRequest) {
      this.markAsRead(narrateRequest.id);
      return {
        type: "generate",
        data: { request: narrateRequest },
        confidence: 0.9,
        reasoning: "Received narration request",
      };
    }

    return { type: "wait", data: {}, confidence: 1, reasoning: "No narration needed" };
  }

  async act(action: AgentAction): Promise<any> {
    if (action.type === "generate") {
      return await this.narrateOutcome(action.data.request.content);
    }
    return null;
  }

  private async narrateOutcome(params: any): Promise<any> {
    const { outcome, chosenAction, eventScene, quest, currentStep, narrativeStyle, language } = params;
    const style = narrativeStyle as NarrativeStyle;

    console.log(
      `[Narrator] Narrating outcome - Success: ${outcome.success}, Score: ${outcome.scoreDelta}`
    );

    const styleDescriptions: Record<NarrativeStyle, string> = {
      serious: "serious and consequential",
      humor: "humorous and witty",
      epic: "dramatic and grandiose",
    };

    const prompt = `You are a Pokémon adventure narrator in ${styleDescriptions[style]} style.

QUEST: "${quest.title}" - Step ${currentStep}
ACTION: ${chosenAction?.label || "Unknown"}
OUTCOME: ${outcome.success ? "Success" : "Failure"} (Score: ${outcome.scoreDelta >= 0 ? "+" : ""}${outcome.scoreDelta})

Write a 3-4 sentence narration of the outcome.

${language === "fr" ? "Réponds EN FRANÇAIS uniquement" : "Respond ONLY in ENGLISH"}

RESPOND WITH JSON (no markdown):
{
  "outcomeNarration": "<narrative>",
  "stateHighlights": ["<highlight1>", "<highlight2>"],
  "questProgress": "<quest impact>",
  "nextHook": "<teaser>"
}`;

    const responseText = await callMistral(
      prompt,
      this.config.modelName!,
      this.config.maxTokens!,
      this.config.temperature!
    );

    let jsonText = responseText.trim();
    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    }

    const response = JSON.parse(jsonText);

    console.log(`[Narrator] Outcome narrated`);

    return {
      outcomeNarration: response.outcomeNarration || "The action concludes...",
      stateHighlights: response.stateHighlights || [`Score ${outcome.scoreDelta >= 0 ? "+" : ""}${outcome.scoreDelta}`],
      questProgress: response.questProgress || "The quest continues...",
      nextHook: response.nextHook || "The adventure continues...",
    };
  }
}
