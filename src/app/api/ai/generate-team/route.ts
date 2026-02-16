import { NextRequest, NextResponse } from "next/server";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

interface TeamGenerationRequest {
  style: "defensive" | "offensive" | "balanced" | "special";
  favoriteTypes: string[];
  pokemonList: Array<{
    id: number;
    name: string;
    types: string[];
  }>;
  language: "en" | "fr";
}

export async function POST(request: NextRequest) {
  try {
    if (!MISTRAL_API_KEY) {
      return NextResponse.json(
        { message: "MISTRAL_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body: TeamGenerationRequest = await request.json();

    const prompt = buildPrompt(body);

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        max_tokens: 1024,
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
      return NextResponse.json(
        { message: `Mistral API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the response
    const team = parseTeamResponse(content, body);

    return NextResponse.json(team);
  } catch (error) {
    console.error("Team generation error:", error);
    return NextResponse.json(
      { message: "Failed to generate team" },
      { status: 500 }
    );
  }
}

function buildPrompt(request: TeamGenerationRequest): string {
  const { style, favoriteTypes, pokemonList, language } = request;

  const styleDescriptions = {
    defensive:
      language === "fr"
        ? "défensive (résistances, bon support en défense)"
        : "defensive (resistances, good defensive support)",
    offensive:
      language === "fr"
        ? "offensive (attaques puissantes, couverture de type)"
        : "offensive (powerful attacks, type coverage)",
    balanced:
      language === "fr"
        ? "équilibrée (mélange d'attaque et défense)"
        : "balanced (mix of attack and defense)",
    special:
      language === "fr"
        ? "spéciale (stratégies de support, set de status)"
        : "special (support strategies, status moves)",
  };

  const pokemonOptions = pokemonList
    .slice(0, 50)
    .map((p) => `${p.name} (${p.types.join("/")})`);

  return `Tu es un expert en stratégie Pokémon. ${
    language === "fr"
      ? `Génère une équipe Pokémon de 6 membres avec un style ${styleDescriptions[style]}. 
         Pokémon favoris (si applicable): ${favoriteTypes.length > 0 ? favoriteTypes.join(", ") : "aucune préférence"}
         
         Tu dois choisir EXACTEMENT 6 Pokémon parmi cette liste:
         ${pokemonOptions.join(", ")}
         
         Réponds en JSON valide avec cette structure exacte (sans markdown, juste le JSON):
         {
           "team": [
             {
               "name": "NomPokemon",
               "reasoning": "Courte explication en français pourquoi ce Pokémon"
             },
             ...
           ],
           "strategy": "Description générale de la stratégie de l'équipe",
           "strengths": ["Force 1", "Force 2", "Force 3"],
           "weaknesses": ["Faiblesse 1", "Faiblesse 2"]
         }`
      : `Generate a 6-member Pokémon team with a ${styleDescriptions[style]} style.
         Favorite types (if applicable): ${favoriteTypes.length > 0 ? favoriteTypes.join(", ") : "no preference"}
         
         You must choose EXACTLY 6 Pokémon from this list:
         ${pokemonOptions.join(", ")}
         
         Respond with valid JSON with this exact structure (no markdown, just JSON):
         {
           "team": [
             {
               "name": "PokemonName",
               "reasoning": "Brief explanation in English why this Pokémon"
             },
             ...
           ],
           "strategy": "Overall team strategy description",
           "strengths": ["Strength 1", "Strength 2", "Strength 3"],
           "weaknesses": ["Weakness 1", "Weakness 2"]
         }`
  }`;
}

function parseTeamResponse(
  content: string,
  request: TeamGenerationRequest
): any {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    if (content.includes("```json")) {
      jsonStr = content
        .split("```json")[1]
        .split("```")[0]
        .trim();
    } else if (content.includes("```")) {
      jsonStr = content
        .split("```")[1]
        .split("```")[0]
        .trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Map names to IDs
    const pokemonMap = new Map(
      request.pokemonList.map((p) => [p.name.toLowerCase(), p])
    );

    const team = parsed.team.map(
      (member: { name: string; reasoning: string }, index: number) => {
        const pokemonData = pokemonMap.get(member.name.toLowerCase());
        if (!pokemonData) {
          // Fallback: find similar name
          const found = request.pokemonList.find((p) =>
            p.name.toLowerCase().includes(member.name.toLowerCase())
          );
          if (found) {
            return {
              id: found.id,
              name: found.name,
              types: found.types,
              reasoning: member.reasoning,
            };
          }
          // Last resort: use first available
          return {
            id: request.pokemonList[index]?.id || 1,
            name: request.pokemonList[index]?.name || "Pikachu",
            types: request.pokemonList[index]?.types || ["electric"],
            reasoning: member.reasoning,
          };
        }

        return {
          id: pokemonData.id,
          name: pokemonData.name,
          types: pokemonData.types,
          reasoning: member.reasoning,
        };
      }
    );

    return {
      team: team.slice(0, 6),
      strategy: parsed.strategy || "",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    };
  } catch (error) {
    console.error("Failed to parse team response:", error);
    throw new Error("Invalid response from AI");
  }
}
