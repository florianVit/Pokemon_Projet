import { NextRequest, NextResponse } from "next/server";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

interface ProfChenReviewRequest {
  team: Array<{
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

    const body: ProfChenReviewRequest = await request.json();

    if (body.team.length === 0) {
      return NextResponse.json(
        { message: "Team cannot be empty" },
        { status: 400 }
      );
    }

    const prompt = buildProfChenPrompt(body);

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        max_tokens: 512,
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
    const review = data.choices[0].message.content;

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Prof Chen review error:", error);
    return NextResponse.json(
      { message: "Failed to generate review" },
      { status: 500 }
    );
  }
}

function buildProfChenPrompt(request: ProfChenReviewRequest): string {
  const { team, language } = request;

  const teamDescription = team
    .map((p, i) => `${i + 1}. ${p.name} (${p.types.join("/")})`);

  return language === "fr"
    ? `Tu es le Professeur Chen, un expert légendaire en stratégie Pokémon.
Un dresseur vient de te montrer son équipe Pokémon. 
Donne-lui un avis court et personnalisé (2-3 phrases max) comme si tu étais vraiment là.
Sois constructif, honnête et inspirant. Utilise un ton bienveillant mais critique.

Équipe présentée:
${teamDescription.join("\n")}

Réponds directement en tant que Prof. Chen (ex: "Intéressante équipe que tu as là..."). 
Ne donne qu'un paragraphe, pas de markdown, juste du texte naturel.`
    : `You are Professor Oak, a legendary expert in Pokémon strategy.
A trainer just showed you their Pokémon team.
Give them a short and personalized review (2-3 sentences max) as if you were really there.
Be constructive, honest, and inspiring. Use a kind but critical tone.

Team presented:
${teamDescription.join("\n")}

Respond directly as Professor Oak (e.g., "You have an interesting team there..."). 
Just one paragraph, no markdown, just natural text.`;
}
