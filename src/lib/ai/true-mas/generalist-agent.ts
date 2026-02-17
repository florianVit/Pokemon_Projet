/**
 * Generalist Agent using Long Reasoning LLM
 * Acts as supervisor/coordinator for specialist agents
 * Makes high-level strategic decisions
 */

import { messageBus, TrueMASMessage, MessagePriority } from "./message-bus";
import { Quest, TeamPokemon, NarrativeStyle } from "@/types/adventure";
import {
  getTeamStatus,
  calculateQuestProgress,
  generateQuestBranchOptions,
  computeNarrativeTension,
  predictTeamSurvival,
} from "@/lib/ai/agent-tools";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

async function callMistral(
  prompt: string,
  modelName: string = "mistral-large-latest",
  maxTokens: number = 2000,
  temperature: number = 0.7
) {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not defined");
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
      messages: [{ role: "user", content: prompt }],
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
 * Generalist Agent - Long Reasoning Supervisor
 */
export class GeneralistAgent {
  private name = "GeneralistAgent";
  private memory: TrueMASMessage[] = [];

  constructor() {
    // Subscribe to all important topics
    messageBus.subscribe(
      this.name,
      [
        "quest_request",
        "event_request",
        "conflict_resolution",
        "specialist_proposals",
        "team_status",
      ],
      (msg) => this.handleMessage(msg)
    );

    console.log("✨ [GeneralistAgent] Initialized - Ready for long reasoning");
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(message: TrueMASMessage): Promise<void> {
    this.memory.push(message);
    if (this.memory.length > 100) {
      this.memory = this.memory.slice(-100);
    }

    console.log(`💭 [GeneralistAgent] Received: ${message.topic}`);

    switch (message.topic) {
      case "quest_request":
        await this.reasonAboutQuestStrategy(message);
        break;
      case "event_request":
        await this.reasonAboutEventStrategy(message);
        break;
      case "conflict_resolution":
        await this.resolveSpecialistConflict(message);
        break;
      case "specialist_proposals":
        await this.evaluateProposals(message);
        break;
    }
  }

  /**
   * Long reasoning about quest strategy
   */
  private async reasonAboutQuestStrategy(message: TrueMASMessage): Promise<void> {
    const { team, narrativeStyle, language, difficulty, estimatedSteps } = message.content;

    const teamStatus = getTeamStatus(team);
    const teamSummary = team.map((p: TeamPokemon) => `${p.name} (${p.types.join("/")})`).join(", ");

    console.log("🧠 [Generalist] Long reasoning about quest strategy...");

    const prompt = `You are a strategic supervisor for a Pokémon Adventure system.

TEAM COMPOSITION:
${teamSummary}
Health Status: ${teamStatus.healthStatus}
Average Level: ${teamStatus.avgLevel}

QUEST PARAMETERS:
- Narrative Style: ${narrativeStyle}
- Difficulty: ${difficulty}
- Estimated Steps: ${estimatedSteps}

YOUR TASK - Strategic Planning:
Think deeply about the best overall quest strategy for this team.

Consider:
1. Team strengths and weaknesses
2. Optimal pacing and difficulty curve
3. Narrative arc and player engagement
4. How to leverage each team member
5. Where challenges should peak

Provide comprehensive strategic guidance for the specialists.

${language === "fr" ? "Réponds EN FRANÇAIS" : "Respond ONLY in ENGLISH"}

RETURN ONLY VALID JSON (no markdown, no code blocks, no explanation text):
{
  "overall_strategy": "<comprehensive strategic vision>",
  "recommended_difficulty_curve": "<how difficulty should progress>",
  "team_utilization": "<how to best use this team>",
  "pacing_guide": "<recommended pacing through quest>",
  "key_challenges": "<where challenges should focus>",
  "narrative_focus": "<what narrative elements to emphasize>",
  "specialization_guidance": {
    "event_generation": "<guidance for event creation>",
    "choice_design": "<guidance for choice options>",
    "validation_focus": "<what to prioritize in validation>",
    "narration_style": "<narrative voice guidance>"
  }
}`;

    try {
      const responseText = await callMistral(prompt, "mistral-large-latest", 2000, 0.8);
      console.log("[Quest] Raw response length:", responseText.length, "First 100 chars:", responseText.substring(0, 100));
      
      // Debug: Show the area around position 7702
      if (responseText.length > 7702) {
        const debugStart = Math.max(0, 7702 - 100);
        const debugEnd = Math.min(responseText.length, 7702 + 100);
        console.log("[Quest] Context around position 7702:", JSON.stringify(responseText.substring(debugStart, debugEnd)));
      }
      
      const strategy = parseJSONSafely(responseText);

      // Broadcast strategy to all specialists
      await messageBus.publish({
        id: "",
        from: this.name,
        to: "all",
        type: "broadcast",
        topic: "quest_strategy",
        priority: "high",
        timestamp: Date.now(),
        content: {
          strategy,
        },
      });

      console.log("📢 [Generalist] Strategy broadcasted to specialists");
    } catch (error) {
      console.error("[Generalist] Strategy reasoning failed:", error);
    }
  }

  /**
   * Long reasoning about event strategy
   */
  private async reasonAboutEventStrategy(message: TrueMASMessage): Promise<void> {
    const { quest, currentStep, team, narrativeStyle } = message.content;

    const teamStatus = getTeamStatus(team);
    const questProgress = calculateQuestProgress(currentStep, quest.estimatedSteps);
    const branchOptions = generateQuestBranchOptions({
      quest,
      currentStep,
      difficulty: quest.difficulty,
    });
    const tensions = computeNarrativeTension(
      currentStep,
      Math.max(0, currentStep - 1),
      team.filter((p: TeamPokemon) => p.currentHp === 0).length
    );

    console.log("🧠 [Generalist] Deep reasoning about event generation...");

    const prompt = `You are a strategic quest supervisor analyzing the game state.

QUEST: "${quest.title}" - ${quest.objective}
PROGRESS: Step ${currentStep}/${quest.estimatedSteps} (${questProgress.phase})
TEAM: ${team.map((p: TeamPokemon) => p.name).join(", ")}
TEAM STATUS: ${teamStatus.healthStatus}
NARRATIVE STYLE: ${narrativeStyle}
TENSION LEVEL: ${tensions.tensionLevel}/3

PAST OPTIONS:
${branchOptions.map((opt) => `- ${opt.title}: ${opt.description}`).join("\n")}

ANALYZE DEEPLY:
1. Where are we emotionally in the narrative?
2. What type of event would best serve story pacing?
3. Should we escalate tension or provide breathing room?
4. What would be most meaningful for this specific team?
5. How to balance challenge with narrative satisfaction?

Provide strategic direction for event creation.

RETURN ONLY VALID JSON (no markdown, no code blocks, no explanation text):
{
  "strategic_direction": "<overall event strategy>",
  "suggested_event_type": "wild_battle|trainer_battle|narrative_choice|boss|...",
  "difficulty_recommendation": "easy|normal|hard",
  "emotional_arc": "<how this should feel>",
  "team_challenge_fit": "<how this challenges the team>",
  "narrative_significance": "<why this matters to the story>",
  "specialist_instructions": "<specific guidance for specialists>"
}`;

    try {
      const responseText = await callMistral(prompt, "mistral-large-latest", 2000, 0.8);
      const eventStrategy = parseJSONSafely(responseText);

      // Dispatch to event creator (GameMaster specialist)
      await messageBus.publish({
        id: "",
        from: this.name,
        to: "GameMasterSpecialist",
        type: "request",
        topic: "event_strategy_directive",
        priority: "high",
        timestamp: Date.now(),
        content: { eventStrategy, quest, currentStep, team, narrativeStyle },
      });

      console.log("📤 [Generalist] Event strategy directive sent to GameMaster specialist");
    } catch (error) {
      console.error("[Generalist] Event reasoning failed:", error);
    }
  }

  /**
   * Resolve conflicts between specialists
   */
  private async resolveSpecialistConflict(message: TrueMASMessage): Promise<void> {
    const { proposals, conflictType } = message.content;

    console.log(`🧠 [Generalist] Reasoning about ${conflictType} conflict...`);

    const prompt = `You are resolving a conflict between specialist agents.

CONFLICT TYPE: ${conflictType}

PROPOSALS:
${proposals.map((p: any) => `- ${p.agent}: ${p.proposal}`).join("\n")}

Analyze the proposals deeply and determine the best resolution.
Consider:
1. Coherence with overall strategy
2. Team safety and progression
3. Narrative quality
4. Specialist expertise

RETURN ONLY VALID JSON (no markdown, no code blocks):
{
  "resolution": "<chosen resolution>",
  "reasoning": "<why this is best>",
  "feedback_to_agents": {
    "winner": "<feedback for winning approach>",
    "others": "<feedback for other approaches>"
  }
}`;

    try {
      const responseText = await callMistral(prompt, "mistral-large-latest", 1000, 0.8);
      const decision = parseJSONSafely(responseText);

      // Broadcast resolution
      await messageBus.publish({
        id: "",
        from: this.name,
        to: "all",
        type: "broadcast",
        topic: "conflict_resolution_result",
        priority: "critical",
        timestamp: Date.now(),
        content: decision,
      });

      console.log("⚖️  [Generalist] Conflict resolved");
    } catch (error) {
      console.error("[Generalist] Conflict resolution failed:", error);
    }
  }

  /**
   * Evaluate specialist proposals
   */
  private async evaluateProposals(message: TrueMASMessage): Promise<void> {
    const { proposals } = message.content;

    console.log("🧠 [Generalist] Evaluating specialist proposals...");

    const prompt = `Evaluate these specialist proposals for coherence and quality.

PROPOSALS:
${proposals.map((p: any) => `${p.agent}: ${JSON.stringify(p.content)}`).join("\n\n")}

Judge on:
1. Narrative coherence
2. Quality
3. Appropriateness
4. Overall strategy alignment

RETURN ONLY VALID JSON (no markdown, no code blocks):
{
  "scores": {"agent": <0-1>},
  "winner": "<best proposal>",
  "feedback": "<overall assessment>"
}`;

    try {
      const responseText = await callMistral(prompt, "mistral-large-latest", 1000, 0.8);
      const evaluation = parseJSONSafely(responseText);

      // Broadcast evaluation
      await messageBus.publish({
        id: "",
        from: this.name,
        to: "all",
        type: "broadcast",
        topic: "proposal_evaluation",
        priority: "high",
        timestamp: Date.now(),
        content: evaluation,
      });

      console.log("✅ [Generalist] Proposals evaluated");
    } catch (error) {
      console.error("[Generalist] Proposal evaluation failed:", error);
    }
  }

  /**
   * Get agent status
   */
  getStatus(): {
    name: string;
    memorySize: number;
    messageBusStats: any;
  } {
    return {
      name: this.name,
      memorySize: this.memory.length,
      messageBusStats: messageBus.getStats(),
    };
  }
}

export const generalistAgent = new GeneralistAgent();
