/**
 * True MAS Adventure - Resolve Route
 * Narrator specialist narrates outcome
 */

import { NextRequest, NextResponse } from "next/server";
import { TeamPokemon, Quest } from "@/types/adventure";
import { trueMASOrchestrator } from "@/lib/ai/true-mas";

export async function POST(request: NextRequest) {
  try {
    const { choice, event, team, quest, currentStep, outcome } = await request.json();

    if (!outcome || !quest || currentStep === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: outcome, quest, currentStep" },
        { status: 400 }
      );
    }

    console.log(`\n📖 [API-MAS] Narrating outcome for step ${currentStep}`);
    console.log(`   Using True MAS: Narrator Specialist (creative narration)`);

    // 📖 NARRATOR SPECIALIST NARRATES OUTCOME
    const narration = await trueMASOrchestrator.narrateOutcome(
      outcome,
      choice,
      event,
      quest as Quest,
      currentStep
    );

    if (!narration) {
      throw new Error("Narration failed - no outcome returned");
    }

    const response = {
      success: true,
      ...narration,
      systemInfo: {
        process: "Narrator specialist (short reasoning LLM) creates immersive narration",
        nextStep: currentStep + 1,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[MAS Resolve] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to narrate outcome",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
