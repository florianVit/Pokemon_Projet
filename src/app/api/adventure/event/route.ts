// Generate event for current step

import { NextRequest, NextResponse } from "next/server";
import { gameMasterGenerateQuestEvent, choiceAgentGenerateChoices } from "@/lib/ai/adventure-agents";
import { retrieveRelevantMemories, storeAdventureMemory } from "@/lib/ai/agent-tools";
import { GameState } from "@/types/adventure";

export async function POST(request: NextRequest) {
  try {
    // Validate API key is available
    if (!process.env.MISTRAL_API_KEY) {
      console.error("MISTRAL_API_KEY not found in environment");
      return NextResponse.json(
        { 
          error: "Configuration error", 
          details: "Mistral API key not configured. Please check your .env.local file." 
        },
        { status: 500 }
      );
    }

    const gameState: GameState = await request.json();

    // Validate game state
    if (!gameState || !gameState.team || !Array.isArray(gameState.team)) {
      return NextResponse.json(
        { error: "Invalid game state", details: "Missing or invalid team data" },
        { status: 400 }
      );
    }

    if (gameState.team.length === 0) {
      return NextResponse.json(
        { error: "Invalid game state", details: "Team is empty" },
        { status: 400 }
      );
    }

    if (!gameState.quest) {
      return NextResponse.json(
        { error: "Invalid game state", details: "Missing quest data" },
        { status: 400 }
      );
    }

    // Increment step for new event
    const currentStep = gameState.currentStep + 1;

    console.log(`Generating quest event: step ${currentStep}/${gameState.quest.estimatedSteps} for quest "${gameState.quest.title}"`);

    const memoryEntries = retrieveRelevantMemories({
      sessionId: gameState.sessionId,
      tags: [gameState.quest.title],
      limit: 5,
    });
    const memoryContext = memoryEntries.map((m) => `Step ${m.step}: ${m.summary}`);

    // Generate quest-based event from Game Master
    const event = await gameMasterGenerateQuestEvent({
      quest: gameState.quest,
      currentStep,
      team: gameState.team,
      tensionLevel: gameState.tensionLevel,
      narrativeStyle: gameState.narrativeStyle,
      language: gameState.language,
      memoryContext,
    });

    console.log(`Event generated: ${event.type} (${event.difficulty})`);

    // Generate team-aware choices from Narrator
    const narratorResponse = await choiceAgentGenerateChoices({
      event,
      team: gameState.team,
      quest: gameState.quest,
      currentStep,
      narrativeStyle: gameState.narrativeStyle,
      language: gameState.language,
      memoryContext,
    });

    console.log(`Choices generated: ${narratorResponse.choices.length} options`);

    const location = event.context?.location ? ` at ${event.context.location}` : "";
    const relevance = event.context?.questRelevance ? ` | ${event.context.questRelevance}` : "";
    storeAdventureMemory({
      sessionId: gameState.sessionId,
      step: currentStep,
      tags: [gameState.quest.title, event.type],
      summary: `${event.type}${location}: ${event.scene.slice(0, 120)}${relevance}`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      event,
      narration: narratorResponse.narration,
      choices: narratorResponse.choices,
      questProgress: narratorResponse.questProgress,
      currentStep, // Return updated step
      agentLogs: [
        {
          source: "GM",
          message: `Event generated: ${event.type} (${event.difficulty})`,
          data: event.context?.questRelevance || "Quest-related encounter",
          timestamp: new Date().toISOString(),
        },
        {
          source: "Choice Agent",
          message: "Choices generated with team context",
          data: narratorResponse.choices.map((c) => `${c.label} [${c.risk}]`).join(" | "),
          timestamp: new Date().toISOString(),
        },
        {
          source: "Memory",
          message: `Loaded ${memoryEntries.length} memories`,
          data: memoryContext.join(" | ") || "None",
          timestamp: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating event:", errorMessage);
    console.error("Full error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to generate event", 
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
