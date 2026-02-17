/**
 * True MAS Adventure - Start Route
 * Initialize a new multi-agent adventure session
 */

import { NextRequest, NextResponse } from "next/server";
import { TeamPokemon, NarrativeStyle } from "@/types/adventure";
import { trueMASOrchestrator } from "@/lib/ai/true-mas";
import { getLocalizedName, getPokemon, getPokemonSpecies } from "@/lib/api/pokeapi";

export async function POST(request: NextRequest) {
  try {
    const { team, narrativeStyle, language, difficulty, estimatedSteps, mode } = await request.json();

    if (!team || !Array.isArray(team) || team.length === 0 || !narrativeStyle) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "Team must be non-empty array, narrativeStyle must be provided",
        },
        { status: 400 }
      );
    }

    // Validate it's requesting MAS mode
    if (mode !== "true-mas") {
      return NextResponse.json(
        { error: "Invalid mode", details: "This route only supports 'true-mas' mode" },
        { status: 400 }
      );
    }

    const normalizedLanguage = (language || "en") as "en" | "fr";
    const missionDifficulty = (difficulty || "normal") as "easy" | "normal" | "hard";
    const questSteps = Math.max(4, Math.min(16, estimatedSteps || 8));

    console.log(`\n🚀 [API] Starting True MAS adventure session`);
    console.log(`   Mode: true-mas (Real Multi-Agent System)`);

    // Fetch full pokemon data
    const adventureTeam: TeamPokemon[] = [];

    for (const p of team) {
      if (!p.id || !p.types) {
        throw new Error(`Invalid pokemon: missing id or types`);
      }

      try {
        const [pokemonData, speciesData] = await Promise.all([
          getPokemon(p.id),
          getPokemonSpecies(p.id),
        ]);
        const localizedName = getLocalizedName(speciesData, normalizedLanguage);

        adventureTeam.push({
          id: p.id,
          name: localizedName.charAt(0).toUpperCase() + localizedName.slice(1),
          types: Array.isArray(p.types) ? p.types : [p.types],
          currentHp: 100,
          maxHp: 100,
        });
      } catch (err) {
        console.error(`Failed to fetch pokemon ${p.id}:`, err);
        throw new Error(`Failed to fetch pokemon data for ID ${p.id}`);
      }
    }

    // 🚀 TRUE MAS SYSTEM - GENERALIST REASONS ABOUT QUEST STRATEGY
    // This is where the long reasoning happens
    const quest = await trueMASOrchestrator.startAdventure({
      team: adventureTeam,
      narrativeStyle: narrativeStyle as NarrativeStyle,
      language: normalizedLanguage,
      difficulty: missionDifficulty,
      estimatedSteps: questSteps,
    });

    // Build the complete GameState object
    const sessionId = `mas_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const gameState = {
      sessionId,
      language: normalizedLanguage,
      narrativeStyle: narrativeStyle as NarrativeStyle,
      quest,
      currentStep: 1 as const,
      completedSteps: [],
      seed: Math.floor(Math.random() * 1000000),
      score: 0,
      team: adventureTeam,
      defeatedCount: 0,
      capturedCount: 0,
      tensionLevel: 1 as const,
      majorVictories: [],
      playerChoicesHistory: [],
      createdAt: new Date(),
      lastActionAt: new Date(),
    };

    const response = {
      success: true,
      mode: "true-mas",
      message: "True Multi-Agent System adventure started",
      gameState,
      systemInfo: {
        generalist: "Using Long Reasoning LLM for strategic decisions",
        specialists: "4 specialists (GM, CA, GU, NA) with short reasoning",
        communication: "Decentralized message bus",
        architecture: "Hierarchical Multi-Agent Model",
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[MAS Start] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to start adventure",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
