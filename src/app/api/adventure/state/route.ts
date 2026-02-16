// Update game state and progress to next step

import { NextRequest, NextResponse } from "next/server";
import { GameState } from "@/types/adventure";

export async function PUT(request: NextRequest) {
  try {
    const {
      gameState,
      updatedTeam,
      isGameOver,
      allKO,
      updatedScore,
      lastOutcomeSuccess,
    }: {
      gameState: GameState;
      updatedTeam: any[];
      isGameOver: boolean;
      allKO?: boolean;
      updatedScore?: number;
      lastOutcomeSuccess?: boolean;
    } = await request.json();

    if (allKO) {
      return NextResponse.json({
        isGameOver: true,
        victory: false,
        finalNarration:
          gameState.language === "fr"
            ? "Tous tes Pokémon ont été mis KO... Fin de l'aventure."
            : "All your Pokémon have been knocked out... Adventure over.",
      });
    }

    if (gameState.currentStep >= gameState.quest.estimatedSteps && lastOutcomeSuccess) {
      return NextResponse.json({
        isGameOver: true,
        victory: true,
        finalNarration:
          gameState.language === "fr"
            ? "Mission accomplie! Victoire!"
            : "Mission accomplished! Victory!",
        stats: {
          stepsCompleted: gameState.currentStep,
          capturedPokemon: gameState.capturedCount,
          defeatedEnemies: gameState.defeatedCount,
          teamSnapshotAtEnd: updatedTeam,
          score: updatedScore ?? gameState.score,
        },
      });
    }

    const updatedState: GameState = {
      ...gameState,
      team: updatedTeam,
      currentStep: gameState.currentStep,
      completedSteps: gameState.completedSteps.includes(gameState.currentStep)
        ? gameState.completedSteps
        : [...gameState.completedSteps, gameState.currentStep],
      lastActionAt: new Date(),
      score: typeof updatedScore === "number" ? updatedScore : gameState.score,
      // Increase tension slightly
      tensionLevel: Math.min(
        3,
        Math.floor(gameState.currentStep / 3)
      ) as 0 | 1 | 2 | 3,
    };

    return NextResponse.json({
      isGameOver: false,
      gameState: updatedState,
    });
  } catch (error) {
    console.error("Error updating state:", error);
    return NextResponse.json(
      { error: "Failed to update state" },
      { status: 500 }
    );
  }
}
