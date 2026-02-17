/**
 * True MAS Adventure - Choices Route
 * Specialists create and validate choices
 */

import { NextRequest, NextResponse } from "next/server";
import { TeamPokemon, Quest } from "@/types/adventure";
import { trueMASOrchestrator } from "@/lib/ai/true-mas";

export async function POST(request: NextRequest) {
  try {
    const { event, team, quest, currentStep } = await request.json();

    if (!event || !team || !quest || currentStep === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: event, team, quest, currentStep" },
        { status: 400 }
      );
    }

    console.log(`\n💭 [API-MAS] Generating choices for step ${currentStep}`);
    console.log(
      `   Using True MAS: ChoiceAgent Specialist → Guardian Specialist (validation)`
    );

    // 💭 CHOICE AGENT SPECIALIST GENERATES CHOICES
    // 🛡️  GUARDIAN SPECIALIST VALIDATES (DETERMINISTIC)
    const { choices, validations } = await trueMASOrchestrator.generateChoices(
      event,
      team as TeamPokemon[],
      quest as Quest,
      currentStep
    );

    if (!choices || choices.length === 0) {
      throw new Error("Choices generation failed - no choices returned");
    }

    // Filter to get only valid choices
    const validChoices = validations
      .filter((v) => v.isValid)
      .map((v) => ({ ...v.choice, warnings: v.warnings }));

    const response = {
      success: true,
      choices: validChoices.length > 0 ? validChoices : choices,
      validations,
      systemInfo: {
        choiceCount: choices.length,
        validCount: validChoices.length,
        process: "ChoiceAgent (LLM) → Guardian (deterministic validation)",
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[MAS Choices] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate choices",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
