"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Trophy } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  GameState,
  Event,
  Choice,
  RiskLevel,
  TeamPokemon,
  Outcome,
} from "@/types/adventure";

interface AdventureGameProps {
  initialGameState: GameState;
  onGameEnd: (victory: boolean) => void;
}

export function AdventureGame({ initialGameState, onGameEnd }: AdventureGameProps) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [event, setEvent] = useState<Event | null>(null);
  const [narration, setNarration] = useState<string>("");
  const [choices, setChoices] = useState<Choice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTaken, setActionTaken] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuestIntro, setShowQuestIntro] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [agentLogs, setAgentLogs] = useState<
    { id: string; source: string; message: string; data?: string; timestamp: string }[]
  >([]);
  const [toolLogs, setToolLogs] = useState<
    { id: string; agent: string; tool: string; message: string; data?: string; timestamp: string }[]
  >([]);
  const [interactionLogs, setInteractionLogs] = useState<
    { id: string; type: string; from: string; to: string; priority: string; content: string; icon?: string; details?: any; timestamp: string }[]
  >([]);

  // Ref to prevent multiple simultaneous API calls
  const loadingRef = useRef(false);

  // Load first event after quest intro
  useEffect(() => {
    if (!showQuestIntro && !loadingRef.current) {
      loadEvent();
    }
  }, [showQuestIntro]);

  const loadEvent = async () => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      console.log("⏳ [Adventure] Event load already in progress, skipping...");
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setActionTaken(false);
    setOutcome(null);

    try {
      const res = await fetch("/api/adventure/event", {
        method: "POST",
        body: JSON.stringify(gameState),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.details || data.error || "Failed to generate event";
        throw new Error(errorMsg);
      }

      if (!data.event || !data.choices) {
        throw new Error("Invalid event response: missing event or choices");
      }

      setEvent(data.event);
      setNarration(data.narration || "An encounter begins...");
      setChoices(data.choices);

      if (data.currentStep) {
        setGameState((prev) => ({ ...prev, currentStep: data.currentStep }));
      }

      if (Array.isArray(data.agentLogs) && data.agentLogs.length > 0) {
        setAgentLogs((prev) => [
          ...prev,
          ...data.agentLogs.map((log: any) => ({
            id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
            source: String(log.source || "System"),
            message: String(log.message || ""),
            data: log.data ? String(log.data) : undefined,
            timestamp: String(log.timestamp || new Date().toISOString()),
          })),
        ]);
      }

      if (Array.isArray(data.toolLogs) && data.toolLogs.length > 0) {
        setToolLogs((prev) => [
          ...prev,
          ...data.toolLogs.map((log: any) => ({
            id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
            agent: String(log.agent || "System"),
            tool: String(log.tool || "Tool"),
            message: String(log.message || ""),
            data: log.data ? String(log.data) : undefined,
            timestamp: String(log.timestamp || new Date().toISOString()),
          })),
        ]);
      }

      if (Array.isArray(data.interactionLogs) && data.interactionLogs.length > 0) {
        setInteractionLogs((prev) => [
          ...prev,
          ...data.interactionLogs.map((log: any) => ({
            id: String(log.id || `${Date.now()}_${Math.random().toString(36).slice(2)}`),
            type: String(log.type || "message"),
            from: String(log.from || "Unknown"),
            to: String(log.to || "Unknown"),
            priority: String(log.priority || "medium"),
            content: String(log.content || ""),
            icon: log.icon ? String(log.icon) : undefined,
            details: log.details,
            timestamp: String(log.timestamp || new Date().toISOString()),
          })),
        ]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Event generation error:", message);
      setError(`Error: ${message}`);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleChoice = async (choice: Choice) => {
    if (!event) return;

    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      console.log("⏳ [Adventure] Choice handling already in progress, skipping...");
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Resolve event through rules engine
      const res = await fetch("/api/adventure/resolve", {
        method: "POST",
        body: JSON.stringify({
          gameState,
          event,
          chosenRisk: choice.risk,
          choice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.details || data.error || "Failed to resolve event";
        throw new Error(errorMsg);
      }

      const { outcome: resolvedOutcome, updatedTeam, allKO } = data;

      setOutcome(resolvedOutcome);
      setActionTaken(true);

      // Check game over
      if (allKO || resolvedOutcome.isGameOver) {
        setGameOver(true);
        setVictory(resolvedOutcome.isVictory || false);
        setShowEndScreen(false);
        return;
      }

      // Update state for next step
      const stateRes = await fetch("/api/adventure/state", {
        method: "PUT",
        body: JSON.stringify({
          gameState,
          updatedTeam,
          isGameOver: resolvedOutcome.isGameOver,
          allKO: allKO,
          updatedScore: data.updatedScore,
          lastOutcomeSuccess: resolvedOutcome.success,
        }),
      });

      const stateData = await stateRes.json();

      if (!stateRes.ok) {
        const errorMsg = stateData.details || stateData.error || "Failed to update state";
        throw new Error(errorMsg);
      }

      if (stateData.isGameOver) {
        setGameOver(true);
        setVictory(stateData.victory);
      } else {
        setGameState(stateData.gameState);
      }

      if (typeof data.updatedScore === "number") {
        setGameState((prev) => ({ ...prev, score: data.updatedScore }));
      }

      if (Array.isArray(data.agentLogs) && data.agentLogs.length > 0) {
        setAgentLogs((prev) => [
          ...prev,
          ...data.agentLogs.map((log: any) => ({
            id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
            source: String(log.source || "System"),
            message: String(log.message || ""),
            data: log.data ? String(log.data) : undefined,
            timestamp: String(log.timestamp || new Date().toISOString()),
          })),
        ]);
      }

      if (Array.isArray(data.toolLogs) && data.toolLogs.length > 0) {
        setToolLogs((prev) => [
          ...prev,
          ...data.toolLogs.map((log: any) => ({
            id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
            agent: String(log.agent || "System"),
            tool: String(log.tool || "Tool"),
            message: String(log.message || ""),
            data: log.data ? String(log.data) : undefined,
            timestamp: String(log.timestamp || new Date().toISOString()),
          })),
        ]);
      }

      if (Array.isArray(data.interactionLogs) && data.interactionLogs.length > 0) {
        setInteractionLogs((prev) => [
          ...prev,
          ...data.interactionLogs.map((log: any) => ({
            id: String(log.id || `${Date.now()}_${Math.random().toString(36).slice(2)}`),
            type: String(log.type || "message"),
            from: String(log.from || "Unknown"),
            to: String(log.to || "Unknown"),
            priority: String(log.priority || "medium"),
            content: String(log.content || ""),
            icon: log.icon ? String(log.icon) : undefined,
            details: log.details,
            timestamp: String(log.timestamp || new Date().toISOString()),
          })),
        ]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Choice handling error:", message);
      setError(`Error: ${message}`);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleNextStep = async () => {
    if (gameOver) {
      onGameEnd(victory);
      return;
    }
    await loadEvent();
  };

  const endingMessage = victory
    ? gameState.language === "fr"
      ? `Contre toute attente, tu as réussi à accomplir ${gameState.quest?.title || "la mission"}. Ton équipe Pokémon a montré un courage et une détermination remarquables. La récompense t'attend!`
      : `Against all odds, you managed to accomplish ${gameState.quest?.title || "the mission"}. Your Pokémon team showed remarkable courage and determination. Your reward awaits!`
    : outcome?.missionFailed
    ? gameState.language === "fr"
      ? `La mission a échoué à cause de ce dernier choix. ${gameState.quest?.title || "L'objectif"} n'a pas pu être atteint. Ton équipe n'a pas tenu bon au moment critique.`
      : `The mission failed because of this final choice. ${gameState.quest?.title || "The objective"} could not be reached. Your team did not hold up at the critical moment.`
    : gameState.language === "fr"
    ? `C'est la fin... Tous tes Pokémon ont été mis KO. Tu n'as pas pu terminer ${gameState.quest?.title || "la mission"}. Réessaye une autre fois!`
    : `It's the end... All your Pokémon have been defeated. You couldn't finish ${gameState.quest?.title || "the mission"}. Try again another time!`;

  if (gameOver && showEndScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-red-700 to-black flex items-center justify-center p-4 z-50">
        <Card className="p-12 max-w-2xl w-full retro-border bg-gray-900 border-4 border-yellow-400 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            {victory ? (
              <>
                <Trophy className="w-20 h-20 text-yellow-400 drop-shadow-lg" />
                <h3 className="font-pixel text-5xl text-white">
                  {gameState.language === "fr" ? "Victoire!" : "Victory!"}
                </h3>
              </>
            ) : (
              <>
                <AlertCircle className="w-20 h-20 text-red-500 drop-shadow-lg" />
                <h3 className="font-pixel text-5xl text-red-500">
                  {gameState.language === "fr" ? "Défaite" : "Defeat"}
                </h3>
              </>
            )}
          </div>

          <p className="text-2xl font-retro mb-4 leading-relaxed text-white">
            {endingMessage}
          </p>
          {gameState.quest?.objective && (
            <p className="text-base font-retro mb-6 leading-relaxed text-yellow-200">
              {gameState.language === "fr" ? "Objectif" : "Objective"}: {gameState.quest.objective}
            </p>
          )}

          <Button
            onClick={() => onGameEnd(victory)}
            className="font-pixel text-2xl px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-black border-2 border-black"
          >
            {gameState.language === "fr" ? "Retour" : "Back"}
          </Button>
        </Card>
      </div>
    );
  }

  if (showQuestIntro) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-red-700 to-black flex items-center justify-center p-4 z-50">
        <Card className="p-8 max-w-2xl w-full retro-border bg-gray-900 border-4 border-yellow-400 text-center">
          <h3 className="font-pixel text-4xl text-yellow-300 mb-4">
            {gameState.language === "fr" ? "Résumé de la quête" : "Quest Summary"}
          </h3>
          <p className="text-xl font-retro text-white mb-4">
            {gameState.quest?.title}
          </p>
          <p className="text-base font-retro text-white mb-4">
            {gameState.quest?.description}
          </p>
          <div className="text-sm font-pixel text-yellow-200 space-y-2 mb-6">
            <div>
              {gameState.language === "fr" ? "Objectif" : "Objective"}: {gameState.quest?.objective}
            </div>
            <div>
              {gameState.language === "fr" ? "Difficulte" : "Difficulty"}: {gameState.quest?.difficulty}
            </div>
            <div>
              {gameState.language === "fr" ? "Etapes estimees" : "Estimated steps"}: {gameState.quest?.estimatedSteps}
            </div>
          </div>
          <Button
            onClick={() => setShowQuestIntro(false)}
            className="font-pixel text-2xl px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-black border-2 border-black"
          >
            {gameState.language === "fr" ? "Commencer →" : "Start →"}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-red-700 to-black flex flex-col z-50">
      {/* Header */}
      <div className="bg-red-600 border-b-4 border-black px-6 py-4 flex justify-between items-center">
        <h2 className="font-pixel text-3xl text-white drop-shadow">
          {gameState.language === "fr" ? "Aventure Pokémon" : "Pokémon Adventure"}
        </h2>
        <div className="flex items-center gap-3">
          <span className="font-pixel text-sm text-yellow-300 drop-shadow border-2 border-black bg-black px-3 py-1">
            {gameState.language === "fr" ? "Score" : "Score"}: {gameState.score}
          </span>
          <Button
            onClick={() => setShowLogs(true)}
            className="font-pixel text-sm px-3 py-2 bg-black text-yellow-300 border-2 border-yellow-400"
          >
            {gameState.language === "fr" ? "Logs" : "Logs"}
          </Button>
          <span className="font-pixel text-xl text-yellow-300 drop-shadow border-2 border-black bg-black px-3 py-1">
            {gameState.currentStep}/{gameState.quest?.estimatedSteps || 8}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex gap-6 p-6 bg-gradient-to-b from-red-700 to-black">
        {/* Team panel */}
        <div className="w-40 flex-shrink-0 flex flex-col space-y-2 overflow-y-auto">
          <p className="font-pixel text-lg text-white sticky top-0 bg-red-600 p-2 rounded border-2 border-black drop-shadow">
            {gameState.language === "fr" ? "Équipe" : "Team"}
          </p>
          {gameState.team && gameState.team.length > 0 ? (
            <div className="space-y-2">
              {gameState.team.map((pokemon) => (
                <Card
                  key={pokemon.id}
                  className={`p-3 transition-colors retro-border text-center ${
                    pokemon.currentHp === 0
                      ? "bg-gray-600 text-white border-black border-2 opacity-50"
                      : "bg-gray-800 text-white border-black border-2"
                  }`}
                >
                  <Image
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                    alt={pokemon.name}
                    width={48}
                    height={48}
                    className="mx-auto"
                  />
                  <div className="text-xs font-pixel font-bold truncate">
                    {pokemon.name}
                  </div>
                  <div className="mt-1 h-2 bg-gray-900 rounded-full overflow-hidden border border-white">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${Math.round((pokemon.currentHp / pokemon.maxHp) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs mt-1 font-pixel">
                    {pokemon.currentHp}/{pokemon.maxHp} HP
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-4 bg-red-900 border-2 border-red-400 text-white font-pixel text-center">
              <p className="text-sm">{gameState.language === "fr" ? "Équipe vide" : "No team"}</p>
            </Card>
          )}
        </div>

        {/* Story + Choices */}
        <div className="flex-1 flex flex-col min-w-0 gap-4">
          {error && (
            <Card className="p-4 retro-border bg-red-900/80 border-red-400 border-2">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-300 flex-shrink-0" />
                <div>
                  <p className="text-base font-pixel text-white">{error}</p>
                  <Button
                    onClick={() => {
                      setError(null);
                      loadEvent();
                    }}
                    className="mt-3 text-sm py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-pixel border border-black"
                  >
                    {gameState.language === "fr" ? "Réessayer" : "Retry"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Narration */}
          {event && !loading && (
            <Card className="p-6 retro-border bg-gray-900 border-white border-2 flex-shrink-0 drop-shadow-lg">
              <p className="text-lg leading-relaxed text-white mb-4 font-retro">
                {narration}
              </p>
            </Card>
          )}

          {/* Outcome */}
          {outcome && actionTaken && (
            <Card className="p-6 retro-border bg-gray-900 border-yellow-400 border-2 flex-shrink-0 drop-shadow-lg">
              <p className="text-lg leading-relaxed text-yellow-300 mb-4 font-retro">
                {outcome.outcomeNarration}
              </p>
              <div className="space-y-2">
                {outcome.stateHighlights.map((highlight, i) => (
                  <div key={i} className="text-sm text-white font-pixel">
                    ⭐ {highlight}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Loading or choices */}
          {loading ? (
            <div className="flex items-center justify-center flex-1 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-yellow-400" />
              <span className="font-pixel text-2xl text-white drop-shadow">
                {gameState.language === "fr" ? "Chargement..." : "Loading..."}
              </span>
            </div>
          ) : actionTaken && outcome ? (
            gameOver ? (
              <Button
                onClick={() => setShowEndScreen(true)}
                className="w-full font-pixel text-lg justify-center h-auto py-4 px-4 retro-border transition-all border-2 bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-700"
              >
                {gameState.language === "fr" ? "Voir la fin →" : "See ending →"}
              </Button>
            ) : (
              <Button
                onClick={handleNextStep}
                className="w-full font-pixel text-lg justify-center h-auto py-4 px-4 retro-border transition-all border-2 bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-700"
              >
                {gameState.language === "fr" ? "Suite →" : "Next →"}
              </Button>
            )
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              {choices.map((choice, i) => (
                <Button
                  key={i}
                  onClick={() => handleChoice(choice)}
                  disabled={loading || actionTaken}
                  className={`w-full font-pixel text-sm text-left h-auto py-3 px-3 retro-border transition-all border-2 whitespace-normal break-words ${
                    choice.risk === "RISKY"
                      ? "bg-red-700 hover:bg-red-800 text-white disabled:bg-red-700/50 border-red-900"
                      : choice.risk === "MODERATE"
                      ? "bg-yellow-500 hover:bg-yellow-600 text-black disabled:bg-yellow-500/50 border-yellow-700"
                      : "bg-gray-700 hover:bg-gray-600 text-white disabled:bg-gray-700/50 border-gray-900"
                  }`}
                >
                  {choice.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showLogs && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="p-6 max-w-3xl w-full retro-border bg-gray-900 border-4 border-yellow-400">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-pixel text-2xl text-yellow-300">
                {gameState.language === "fr" ? "Logs de l'aventure" : "Adventure Logs"}
              </h3>
              <Button
                onClick={() => setShowLogs(false)}
                className="font-pixel text-sm px-3 py-2 bg-red-600 hover:bg-red-700 text-white border-2 border-black"
              >
                {gameState.language === "fr" ? "Fermer" : "Close"}
              </Button>
            </div>
            <Tabs defaultValue="agents" className="gap-3">
              <TabsList className="bg-black/60 border-2 border-yellow-400">
                <TabsTrigger value="agents" className="font-pixel text-xs">
                  {gameState.language === "fr" ? "Agents" : "Agents"}
                </TabsTrigger>
                <TabsTrigger value="tools" className="font-pixel text-xs">
                  {gameState.language === "fr" ? "Outils" : "Tools"}
                </TabsTrigger>
                <TabsTrigger value="interactions" className="font-pixel text-xs">
                  {gameState.language === "fr" ? "Interactions" : "Interactions"}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="agents" className="max-h-[60vh] overflow-y-auto space-y-3">
                {agentLogs.length === 0 ? (
                  <p className="text-sm font-pixel text-white">
                    {gameState.language === "fr"
                      ? "Aucun log pour le moment."
                      : "No logs yet."}
                  </p>
                ) : (
                  agentLogs.map((log) => (
                    <div key={log.id} className="text-xs font-mono text-white border-b border-gray-700 pb-2">
                      <div className="text-yellow-300">{log.timestamp}</div>
                      <div className="text-blue-300">{log.source}</div>
                      <div>{log.message}</div>
                      {log.data && <div className="text-gray-300">{log.data}</div>}
                    </div>
                  ))
                )}
              </TabsContent>
              <TabsContent value="tools" className="max-h-[60vh] overflow-y-auto space-y-3">
                {toolLogs.length === 0 ? (
                  <p className="text-sm font-pixel text-white">
                    {gameState.language === "fr"
                      ? "Aucun appel d'outil pour le moment."
                      : "No tool calls yet."}
                  </p>
                ) : (
                  toolLogs.map((log) => (
                    <div key={log.id} className="text-xs font-mono text-white border-b border-gray-700 pb-2">
                      <div className="text-yellow-300">{log.timestamp}</div>
                      <div className="text-blue-300">{log.agent}</div>
                      <div className="text-green-300">{log.tool}</div>
                      <div>{log.message}</div>
                      {log.data && <div className="text-gray-300">{log.data}</div>}
                    </div>
                  ))
                )}
              </TabsContent>
              <TabsContent value="interactions" className="max-h-[60vh] overflow-y-auto space-y-3">
                {interactionLogs.length === 0 ? (
                  <p className="text-sm font-pixel text-white">
                    {gameState.language === "fr"
                      ? "Aucune interaction agent pour le moment."
                      : "No agent interactions yet."}
                  </p>
                ) : (
                  interactionLogs.map((log) => {
                    const priorityColor = 
                      log.priority === "critical" ? "text-red-400" :
                      log.priority === "high" ? "text-orange-400" :
                      log.priority === "medium" ? "text-yellow-400" : "text-gray-400";
                    
                    const typeColor =
                      log.type === "alert" ? "text-red-300" :
                      log.type === "vote" ? "text-purple-300" :
                      log.type === "negotiation" ? "text-blue-300" :
                      log.type === "broadcast" ? "text-green-300" : "text-white";
                    
                    return (
                      <div key={log.id} className="text-xs font-mono text-white border-b border-gray-700 pb-2">
                        <div className="flex items-center gap-2">
                          {log.icon && <span className="text-base">{log.icon}</span>}
                          <span className="text-yellow-300">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className={priorityColor}>●</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-blue-300 font-bold">{log.from}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-300 font-bold">{log.to}</span>
                        </div>
                        <div className={`mt-1 ${typeColor} font-bold uppercase text-[10px]`}>
                          {log.type}
                        </div>
                        <div className="mt-1">{log.content}</div>
                        {log.details && (
                          <details className="mt-1 text-gray-400">
                            <summary className="cursor-pointer text-[10px]">
                              {gameState.language === "fr" ? "Détails" : "Details"}
                            </summary>
                            <pre className="mt-1 text-[9px] overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      )}
    </div>
  );
}
