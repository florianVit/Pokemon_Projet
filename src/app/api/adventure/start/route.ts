// Start a new adventure session

import { NextRequest, NextResponse } from "next/server";
import { GameState, NarrativeStyle, TeamPokemon } from "@/types/adventure";
import { getLocalizedName, getPokemon, getPokemonSpecies } from "@/lib/api/pokeapi";
import { gameMasterGenerateQuest } from "@/lib/ai/adventure-agents";

export async function POST(request: NextRequest) {
  try {
    const { team, narrativeStyle, language } = await request.json();

    if (!team || !Array.isArray(team) || team.length === 0 || !narrativeStyle) {
      console.error("Invalid start request:", { team, narrativeStyle, language });
      return NextResponse.json(
        { error: "Missing required fields", details: "Team must be non-empty array, narrativeStyle must be provided" },
        { status: 400 }
      );
    }

    const normalizedLanguage = (language || "en") as "en" | "fr";
    console.log(`Starting adventure with team of ${team.length} Pokémon`, { narrativeStyle, language: normalizedLanguage });

    // Fetch full pokemon data and convert to adventure format
    const adventureTeam: TeamPokemon[] = [];
    
    for (const p of team) {
      if (!p.id || !p.types) {
        console.error("Invalid pokemon in team:", p);
        throw new Error(`Invalid pokemon: missing id or types`);
      }

      try {
        // Fetch pokemon details from PokeAPI to get the full name
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

    if (adventureTeam.length === 0) {
      throw new Error("Team conversion resulted in empty team");
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const seed = Math.floor(Math.random() * 1000000);

    // Generate quest using Game Master agent
    console.log("Generating quest for adventure...");
    const quest = await gameMasterGenerateQuest({
      team: adventureTeam,
      narrativeStyle: narrativeStyle as NarrativeStyle,
      language: normalizedLanguage,
      seed,
    });

    console.log(`Quest generated: "${quest.title}" (${quest.difficulty}, ${quest.estimatedSteps} steps)`);

    const gameState: GameState = {
      sessionId,
      language: normalizedLanguage,
      narrativeStyle: narrativeStyle as NarrativeStyle,
      currentStep: 0,
      completedSteps: [],
      seed,
      score: 0,
      quest,
      team: adventureTeam,
      defeatedCount: 0,
      capturedCount: 0,
      rivalName: undefined,
      tensionLevel: 0,
      majorVictories: [],
      playerChoicesHistory: [],
      createdAt: new Date(),
      lastActionAt: new Date(),
    };

    console.log(`Adventure session created: ${sessionId}`, { 
      teamSize: adventureTeam.length, 
      step: gameState.currentStep, 
      teamNames: adventureTeam.map(p => p.name),
      quest: quest.title
    });

    // Ensure proper JSON serialization
    const serialized = JSON.parse(JSON.stringify(gameState));

    return NextResponse.json({ gameState: serialized });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error starting adventure:", message, error);
    return NextResponse.json(
      { error: "Failed to start adventure", details: message },
      { status: 500 }
    );
  }
}
