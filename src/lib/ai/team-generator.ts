// AI Team Generation Service

export interface TeamGenerationRequest {
  style: "defensive" | "offensive" | "balanced" | "special";
  favoriteTypes: string[];
  pokemonList: Array<{
    id: number;
    name: string;
    types: string[];
  }>;
  language: "en" | "fr";
}

export interface TeamMember {
  id: number;
  name: string;
  types: string[];
  reasoning: string;
}

export interface GeneratedTeam {
  team: TeamMember[];
  strategy: string;
  strengths: string[];
  weaknesses: string[];
}

export async function generateTeamWithAI(
  request: TeamGenerationRequest
): Promise<GeneratedTeam> {
  const response = await fetch("/api/ai/generate-team", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to generate team");
  }

  return response.json();
}

export async function generateProfChenReview(
  team: Array<{
    id: number;
    name: string;
    types: string[];
  }>,
  language: "en" | "fr"
): Promise<string> {
  const response = await fetch("/api/ai/professor-review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ team, language }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to generate review");
  }

  const data = await response.json();
  return data.review;
}
