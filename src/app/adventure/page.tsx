"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdventureGame } from "@/components/adventure";
import { GameState } from "@/types/adventure";
import { Loader2 } from "lucide-react";

export default function AdventurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startAdventure = async () => {
      try {
        const teamJson = searchParams.get("team");
        const narrativeStyle = searchParams.get("style") || "serious";
        const language = (searchParams.get("language") || "en") as "en" | "fr";

        if (!teamJson) {
          setError("No team provided - go back to Team Builder and create a team first");
          setLoading(false);
          return;
        }

        let team;
        try {
          team = JSON.parse(decodeURIComponent(teamJson));
        } catch (e) {
          console.error("Failed to parse team JSON:", e);
          setError("Invalid team data");
          setLoading(false);
          return;
        }

        if (!Array.isArray(team) || team.length === 0) {
          setError("Team is empty - go back to Team Builder and create a team first");
          setLoading(false);
          return;
        }

        console.log("Starting adventure with team:", { teamSize: team.length, narrativeStyle, language });

        // Start adventure session
        const res = await fetch("/api/adventure/start", {
          method: "POST",
          body: JSON.stringify({
            team,
            narrativeStyle,
            language,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          const errorMsg = data.details || data.error || "Failed to start adventure";
          throw new Error(errorMsg);
        }

        if (!data.gameState || !data.gameState.team || data.gameState.team.length === 0) {
          console.error("Invalid game state returned:", data.gameState);
          throw new Error("Server returned empty or invalid game state");
        }

        console.log("Adventure started:", { sessionId: data.gameState.sessionId, teamSize: data.gameState.team.length });
        setGameState(data.gameState);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Error starting adventure:", message);
        setError(`Failed to start adventure: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    startAdventure();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-red-700 to-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-16 h-16 animate-spin text-yellow-400" />
          <p className="font-pixel text-2xl text-white">
            Initializing Adventure...
          </p>
        </div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-red-700 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="font-pixel text-2xl text-red-300 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-pixel border-2 border-black"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdventureGame
      initialGameState={gameState}
      onGameEnd={(victory) => {
        router.push("/");
      }}
    />
  );
}
