/**
 * True MAS Adventure - Event Generation Route
 * Generalist + Specialists create next event
 */

import { NextRequest, NextResponse } from "next/server";
import { TeamPokemon, Quest } from "@/types/adventure";
import { trueMASOrchestrator } from "@/lib/ai/true-mas";

export async function POST(request: NextRequest) {
  try {
    const { team, quest, currentStep, narrativeStyle, language } = await request.json();

    if (!team || !quest || currentStep === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: team, quest, currentStep" },
        { status: 400 }
      );
    }

    console.log(`\n🎲 [API-MAS] Generating event - Step ${currentStep}/${quest.estimatedSteps}`);
    console.log(`   Using True MAS: Generalist → GameMaster Specialist`);

    // 🧠 GENERALIST DOES LONG REASONING
    // 🎲 GAMEMASTER SPECIALIST GENERATES EVENT
    const event = await trueMASOrchestrator.generateEvent(
      currentStep,
      team as TeamPokemon[],
      quest as Quest
    );

    if (!event) {
      throw new Error("Event generation failed - no event returned");
    }

    const response = {
      success: true,
      event,
      systemInfo: {
        phase: "Generalist reasoned about strategy, GameMaster specialist created event",
        nextPhase: "Choose specialist will create choices",
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[MAS Event] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate event",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
