// Resolve a player choice - RULES ENGINE applies here

import { NextRequest, NextResponse } from "next/server";
import {
  computeBattle,
  computeCapture,
  applyDamage,
} from "@/lib/adventure/rules-engine";
import { guardianValidateChoice, narratorNarrateOutcome } from "@/lib/ai/adventure-agents";
import { evaluateDecisionQuality, storeAdventureMemory } from "@/lib/ai/agent-tools";
import {
  GameState,
  Event,
  RiskLevel,
  Outcome,
  EventType,
  Choice,
} from "@/types/adventure";

export async function POST(request: NextRequest) {
  try {
    const {
      gameState,
      event,
      chosenRisk,
      choice,
    }: {
      gameState: GameState;
      event: Event;
      chosenRisk: RiskLevel;
      choice?: Choice;
    } = await request.json();

    const normalizedChoice: Choice = {
      risk: choice?.risk || chosenRisk,
      label: choice?.label || "Player choice",
      description: choice?.description || "Player action",
      affectedPokemon: (choice?.affectedPokemon?.length ? choice.affectedPokemon : []).filter(Boolean),
      potentialConsequences: choice?.potentialConsequences,
    };

    const aliveTeam = gameState.team.filter((p) => p.currentHp > 0);
    const fallbackPokemon = aliveTeam[0];
    if (!fallbackPokemon && normalizedChoice.affectedPokemon.length === 0) {
      return NextResponse.json(
        { error: "No available Pokémon" },
        { status: 400 }
      );
    }

    const affectedIds = normalizedChoice.affectedPokemon.length > 0
      ? normalizedChoice.affectedPokemon
      : [fallbackPokemon.id];

    const primaryPokemon = gameState.team.find((p) => p.id === affectedIds[0]) || fallbackPokemon;
    const playerPower = Math.max(1, Math.round(primaryPokemon.maxHp / 20));
    const enemyPower = Math.max(1, Math.round((event.context.enemyLevel || 10) / 2));

    let mechanicalOutcome: {
      success: boolean;
      damageDealt: number;
      scoreDelta: number;
      healthLost?: number;
    };

    // Apply Rules Engine based on event type
    switch (event.type) {
      case EventType.WILD_BATTLE:
      case EventType.TRAINER_BATTLE:
      case EventType.BOSS:
        const battleResult = computeBattle(
          playerPower,
          enemyPower,
          chosenRisk,
          event.eventSeed,
          event.difficulty
        );
        mechanicalOutcome = {
          success: battleResult.success,
          damageDealt: battleResult.damageDealt,
          scoreDelta: battleResult.scoreDelta,
          healthLost: battleResult.damageDealt,
        };
        break;

      case EventType.CAPTURE:
        const captureResult = computeCapture(
          enemyPower,
          playerPower,
          chosenRisk,
          event.eventSeed
        );
        mechanicalOutcome = {
          success: captureResult.success,
          damageDealt: 0,
          scoreDelta: captureResult.scoreDelta,
          healthLost: 0,
        };
        break;

      case EventType.POKE_CENTER:
        mechanicalOutcome = {
          success: true,
          damageDealt: 0,
          scoreDelta: 5,
          healthLost: 0,
        };
        break;

      case EventType.NARRATIVE_CHOICE:
        mechanicalOutcome = {
          success: chosenRisk !== RiskLevel.RISKY || Math.random() > 0.5,
          damageDealt: chosenRisk === RiskLevel.RISKY ? 30 : 0,
          scoreDelta: chosenRisk === RiskLevel.RISKY ? 25 : 15,
          healthLost: chosenRisk === RiskLevel.RISKY ? 30 : 0,
        };
        break;

      default:
        mechanicalOutcome = {
          success: true,
          damageDealt: 0,
          scoreDelta: 10,
          healthLost: 0,
        };
    }

    // Guardian validation for coherent choices
    const guardianResult = await guardianValidateChoice({
      choice: normalizedChoice,
      team: gameState.team,
      quest: gameState.quest,
      currentStep: gameState.currentStep,
      event,
    });

    const guardianScoreDelta = guardianResult.isValid ? 10 : -10;
    const guardianDamageDelta = guardianResult.isValid ? -5 : 5;

    mechanicalOutcome.scoreDelta += guardianScoreDelta;
    if (mechanicalOutcome.healthLost !== undefined) {
      mechanicalOutcome.healthLost = Math.max(0, mechanicalOutcome.healthLost + guardianDamageDelta);
    }

    // Apply mechanics to pokemon
    const perPokemonDamage = mechanicalOutcome.healthLost && affectedIds.length > 0
      ? Math.ceil(mechanicalOutcome.healthLost / affectedIds.length)
      : 0;

    let updatedTeam = gameState.team.map((p) => {
      if (affectedIds.includes(p.id)) {
        if (perPokemonDamage > 0) {
          p = applyDamage(p, perPokemonDamage);
        }
      }

      return p;
    });

    // Get affected Pokemon for narration
    const affectedPokemon = updatedTeam.filter(p => affectedIds.includes(p.id));

    // Get narrator narration with quest context
    const narratedOutcome = await narratorNarrateOutcome({
      outcome: {
        success: mechanicalOutcome.success,
        scoreDelta: mechanicalOutcome.scoreDelta,
        totalScore: gameState.score + mechanicalOutcome.scoreDelta,
        healthLost: mechanicalOutcome.healthLost || 0,
      },
      chosenAction: {
        label: normalizedChoice.label,
        description: normalizedChoice.description,
        risk: normalizedChoice.risk,
      },
      eventScene: event.scene,
      eventType: event.type,
      eventContext: {
        location: event.context?.location,
        npcName: event.context?.npcName,
        questRelevance: event.context?.questRelevance,
      },
      affectedPokemon,
      quest: gameState.quest,
      currentStep: gameState.currentStep,
      narrativeStyle: gameState.narrativeStyle,
      language: gameState.language,
    });

    // Check game over
    const allKO = updatedTeam.every((p) => p.currentHp === 0);
    const missionFailed = Boolean(event.context.missionCritical) && !mechanicalOutcome.success;

    const outcome: Outcome = {
      success: mechanicalOutcome.success,
      scoreDelta: mechanicalOutcome.scoreDelta,
      totalScore: gameState.score + mechanicalOutcome.scoreDelta,
      healthLost: mechanicalOutcome.healthLost || 0,
      missionFailed,
      outcomeNarration: narratedOutcome.outcomeNarration,
      stateHighlights: narratedOutcome.stateHighlights,
      nextHook: narratedOutcome.nextHook,
      isGameOver: allKO || missionFailed,
    };

    const decisionQuality = evaluateDecisionQuality(normalizedChoice, outcome);

    const location = event.context?.location ? ` at ${event.context.location}` : "";
    const relevance = event.context?.questRelevance ? ` | ${event.context.questRelevance}` : "";
    storeAdventureMemory({
      sessionId: gameState.sessionId,
      step: gameState.currentStep,
      tags: [gameState.quest.title, event.type, normalizedChoice.risk],
      summary: `${normalizedChoice.label}${location} -> ${mechanicalOutcome.success ? "success" : "failure"} (score ${mechanicalOutcome.scoreDelta})${relevance}`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      outcome,
      updatedTeam,
      allKO,
      updatedScore: gameState.score + mechanicalOutcome.scoreDelta,
      agentLogs: [
        {
          source: "Guardian",
          message: guardianResult.isValid
            ? "Choice coherence validated. Bonus applied."
            : "Choice coherence warning. Malus applied.",
          data: guardianResult.warnings.join("; "),
          timestamp: new Date().toISOString(),
        },
        {
          source: "Evaluator",
          message: `Decision quality: ${decisionQuality.score}/100 (${decisionQuality.riskAlignment})`,
          data: decisionQuality.reasons.join("; "),
          timestamp: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    console.error("Error resolving event:", error);
    return NextResponse.json(
      { error: "Failed to resolve event", details: String(error) },
      { status: 500 }
    );
  }
}
