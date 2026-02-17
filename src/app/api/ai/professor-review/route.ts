import { NextRequest, NextResponse } from "next/server";
import { professorsChendozes, TeamAnalysis } from "@/lib/ai/professor-Chen-agents";

interface ProfChenReviewRequest {
  team: Array<{
    id: number;
    name: string;
    types: string[];
  }>;
  language: "en" | "fr";
}

interface ProfChenResponse {
  review: string;
  analysis?: {
    composition: {
      typeDistribution: Record<string, number>;
      coverage: string;
      balance: string;
      diversity: string;
    };
    strategy: {
      offensiveScore: number;
      defensiveScore: number;
      strategyType: string;
      synergy: string;
    };
    weaknesses: {
      primaryWeaknesses: string[];
      recommendations: string[];
      improvements: string[];
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ProfChenReviewRequest = await request.json();

    if (body.team.length === 0) {
      return NextResponse.json(
        { message: "Team cannot be empty" },
        { status: 400 }
      );
    }

    // Multi-Agent Orchestrator
    const { analysis, advice } = await professorsChendozes(body.team, body.language);

    const response: ProfChenResponse = {
      review: advice,
      analysis: {
        composition: analysis.composition,
        strategy: analysis.strategy,
        weaknesses: analysis.weaknesses,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Prof Chen review error:", error);
    return NextResponse.json(
      { message: "Failed to generate review" },
      { status: 500 }
    );
  }
}
