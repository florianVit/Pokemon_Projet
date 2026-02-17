"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdventureGame } from "@/components/adventure";
import { GameState } from "@/types/adventure";
import { Loader2, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdventurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  const [missionDifficulty, setMissionDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  const [estimatedSteps, setEstimatedSteps] = useState(8);
  const [team, setTeam] = useState<any[] | null>(null);
  const [narrativeStyle, setNarrativeStyle] = useState("serious");
  const [language, setLanguage] = useState<"en" | "fr">("en");

  const startAdventure = async (
    difficultyLevel: "easy" | "normal" | "hard",
    missionDiff: "easy" | "normal" | "hard",
    steps: number
  ) => {
    if (!team) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/adventure/start", {
        method: "POST",
        body: JSON.stringify({
          team,
          narrativeStyle,
          language,
          difficulty: missionDiff,
          estimatedSteps: steps,
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

      setGameState(data.gameState);
      setShowSettings(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error starting adventure:", message);
      setError(`Failed to start adventure: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const teamJson = searchParams.get("team");
      const style = searchParams.get("style") || "serious";
      const lang = (searchParams.get("language") || "en") as "en" | "fr";

      if (!teamJson) {
        setError("No team provided - go back to Team Builder and create a team first");
        setLoading(false);
        setShowSettings(false);
        return;
      }

      let parsedTeam;
      try {
        parsedTeam = JSON.parse(decodeURIComponent(teamJson));
      } catch (e) {
        console.error("Failed to parse team JSON:", e);
        setError("Invalid team data");
        setLoading(false);
        setShowSettings(false);
        return;
      }

      if (!Array.isArray(parsedTeam) || parsedTeam.length === 0) {
        setError("Team is empty - go back to Team Builder and create a team first");
        setLoading(false);
        setShowSettings(false);
        return;
      }

      setTeam(parsedTeam);
      setNarrativeStyle(style);
      setLanguage(lang);
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error starting adventure:", message);
      setError(`Failed to start adventure: ${message}`);
      setLoading(false);
      setShowSettings(false);
    }
  }, [searchParams]);

  if (showSettings && team && !gameState) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-red-700 to-black flex items-center justify-center p-4 z-50">
        <Card className="p-8 max-w-2xl w-full retro-border bg-gray-900 border-4 border-yellow-400">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-8 h-8 text-yellow-300" />
            <h2 className="font-pixel text-3xl text-yellow-300">
              {language === "fr" ? "Paramètres de l'aventure" : "Adventure Settings"}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Game Difficulty */}
            <div>
              <label className="font-pixel text-yellow-200 block mb-3">
                {language === "fr" ? "Difficulté du jeu" : "Game Difficulty"}
              </label>
              <div className="flex gap-2">
                {(["easy", "normal", "hard"] as const).map((diff) => (
                  <Button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`flex-1 font-pixel ${
                      difficulty === diff
                        ? "bg-yellow-500 text-black border-yellow-700"
                        : "bg-gray-700 text-white border-gray-900 hover:bg-gray-600"
                    } border-2`}
                  >
                    {language === "fr"
                      ? diff === "easy"
                        ? "Facile"
                        : diff === "normal"
                        ? "Normal"
                        : "Difficile"
                      : diff === "easy"
                      ? "Easy"
                      : diff === "normal"
                      ? "Normal"
                      : "Hard"}
                  </Button>
                ))}
              </div>
            </div>

            {/* Mission Difficulty */}
            <div>
              <label className="font-pixel text-yellow-200 block mb-3">
                {language === "fr" ? "Difficulté de la mission" : "Mission Difficulty"}
              </label>
              <div className="flex gap-2">
                {(["easy", "normal", "hard"] as const).map((diff) => (
                  <Button
                    key={diff}
                    onClick={() => setMissionDifficulty(diff)}
                    className={`flex-1 font-pixel ${
                      missionDifficulty === diff
                        ? "bg-yellow-500 text-black border-yellow-700"
                        : "bg-gray-700 text-white border-gray-900 hover:bg-gray-600"
                    } border-2`}
                  >
                    {language === "fr"
                      ? diff === "easy"
                        ? "Facile"
                        : diff === "normal"
                        ? "Normal"
                        : "Complexe"
                      : diff === "easy"
                      ? "Easy"
                      : diff === "normal"
                      ? "Normal"
                      : "Complex"}
                  </Button>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div>
              <label className="font-pixel text-yellow-200 block mb-3">
                {language === "fr" ? "Nombre d'étapes" : "Number of Steps"}: {estimatedSteps}
              </label>
              <input
                type="range"
                min="4"
                max="16"
                value={estimatedSteps}
                onChange={(e) => setEstimatedSteps(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer border-2 border-yellow-400"
              />
              <div className="flex justify-between text-xs font-pixel text-gray-400 mt-2">
                <span>4</span>
                <span>16</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <Button
              onClick={() => router.back()}
              className="flex-1 font-pixel text-lg py-3 bg-red-600 hover:bg-red-700 text-white border-2 border-black"
            >
              {language === "fr" ? "Retour" : "Back"}
            </Button>
            <Button
              onClick={() => startAdventure(difficulty, missionDifficulty, estimatedSteps)}
              className="flex-1 font-pixel text-lg py-3 bg-yellow-500 hover:bg-yellow-600 text-black border-2 border-yellow-700"
            >
              {language === "fr" ? "Commencer →" : "Start →"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-red-700 to-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-16 h-16 animate-spin text-yellow-400" />
          <p className="font-pixel text-2xl text-white">
            {language === "fr" ? "Initialisation..." : "Initializing Adventure..."}
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
            {language === "fr" ? "Retour" : "Back"}
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
