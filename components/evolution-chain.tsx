"use client"

import Image from "next/image"
import Link from "next/link"
import useSWR from "swr"
import { useEvolutionChain } from "@/hooks/use-pokemon"
import { parseEvolutionChain, getPokemonSpecies, getLocalizedName, type EvolutionStep } from "@/lib/pokeapi"
import { useLanguage } from "./language-provider"

interface EvolutionChainProps {
  evolutionChainUrl: string
  currentPokemonId: number
  onSelectPokemon?: (id: number) => void
}

export function EvolutionChainDisplay({ evolutionChainUrl, currentPokemonId, onSelectPokemon }: EvolutionChainProps) {
  const { t, language } = useLanguage()
  const { data: evolutionChain, isLoading, error } = useEvolutionChain(evolutionChainUrl)
  
  // Parse evolution chain if available
  const evolutionPaths = evolutionChain ? parseEvolutionChain(evolutionChain.chain) : []
  
  // Get all Pokemon IDs from evolution chain to fetch their localized names
  const uniqueIds = [...new Set(evolutionPaths.flatMap(path => path.map(step => step.id)))]
  
  // Fetch species data for all Pokemon in the evolution chain
  const { data: speciesMap } = useSWR(
    uniqueIds.length > 0 ? `evolution-species-${uniqueIds.join(",")}-${language}` : null,
    async () => {
      const speciesList = await Promise.all(uniqueIds.map(id => getPokemonSpecies(id)))
      const map = new Map<number, string>()
      for (const species of speciesList) {
        map.set(species.id, getLocalizedName(species, language))
      }
      return map
    },
    { revalidateOnFocus: false }
  )

  if (isLoading) {
    return (
      <div className="flex justify-center gap-4 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-20 h-20 bg-secondary animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !evolutionChain) {
    return (
      <p className="text-center font-pixel text-xs text-muted-foreground">
        {t("error")}
      </p>
    )
  }

  // If only one stage, show "does not evolve"
  if (evolutionPaths[0]?.length === 1) {
    return (
      <p className="text-center font-pixel text-xs text-muted-foreground py-4">
        {t("noEvolution")}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {evolutionPaths.map((path, pathIndex) => (
        <div key={pathIndex} className="flex items-center justify-center gap-2 flex-wrap">
          {path.map((step, stepIndex) => (
            <EvolutionStepItem
              key={step.id}
              step={step}
              localizedName={speciesMap?.get(step.id) || step.name}
              isCurrentPokemon={step.id === currentPokemonId}
              showArrow={stepIndex < path.length - 1}
              nextStep={path[stepIndex + 1]}
              onSelectPokemon={onSelectPokemon}
              language={language as "en" | "fr"}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface EvolutionStepItemProps {
  step: EvolutionStep
  localizedName: string
  isCurrentPokemon: boolean
  showArrow: boolean
  nextStep?: EvolutionStep
  onSelectPokemon?: (id: number) => void
  language: "en" | "fr"
}

function EvolutionStepItem({ step, localizedName, isCurrentPokemon, showArrow, nextStep, onSelectPokemon, language }: EvolutionStepItemProps) {
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${step.id}.png`

  const handleClick = (e: React.MouseEvent) => {
    if (onSelectPokemon) {
      e.preventDefault()
      onSelectPokemon(step.id)
    }
  }

  const commonClassName = `
    flex flex-col items-center gap-1 p-2 transition-all cursor-pointer
    ${isCurrentPokemon 
      ? "bg-primary/20 border-2 border-primary" 
      : "bg-secondary/50 hover:bg-secondary border-2 border-transparent"
    }
  `

  const contentNode = (
    <>
      <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
        <Image
          src={spriteUrl || "/placeholder.svg"}
          alt={localizedName}
          width={80}
          height={80}
          className="pixelated"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <span className="font-pixel text-xs text-muted-foreground">
        #{String(step.id).padStart(3, "0")}
      </span>
      <span className="font-retro text-base capitalize">
        {localizedName}
      </span>
    </>
  )

  return (
    <>
      {onSelectPokemon ? (
        <button
          onClick={handleClick}
          className={commonClassName}
        >
          {contentNode}
        </button>
      ) : (
        <Link
          href={`/pokemon/${step.id}`}
          className={commonClassName}
        >
          {contentNode}
        </Link>
      )}

      {showArrow && nextStep && (
        <div className="flex flex-col items-center gap-1 px-2">
          <svg
            className="w-6 h-6 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth={3}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="font-pixel text-xs text-muted-foreground text-center">
            {formatRequirement(nextStep, language)}
          </span>
        </div>
      )}
    </>
  )
}

function formatRequirement(nextStep: EvolutionStep, language: "en" | "fr"): string {
  const levelLabel = language === "fr" ? "Niv." : "Lv."
  if (nextStep.minLevel) return `${levelLabel}${nextStep.minLevel}`
  if (nextStep.item) return nextStep.item.replace(/-/g, " ")
  if (nextStep.trigger && nextStep.trigger !== "base") {
    const triggerLabels: Record<string, { en: string; fr: string }> = {
      trade: { en: "Trade", fr: "Échange" },
      "use-item": { en: "Use item", fr: "Objet" },
      "level-up": { en: "Level", fr: "Niveau" },
      spin: { en: "Spin", fr: "Rotation" },
      shed: { en: "Shed", fr: "Mue" },
      "three-critical-hits": { en: "3 crits", fr: "3 coups critiques" },
      "tower-of-darkness": { en: "Tower of Darkness", fr: "Tour des ténèbres" },
      "tower-of-waters": { en: "Tower of Waters", fr: "Tour des eaux" },
    }
    const label = triggerLabels[nextStep.trigger]?.[language]
    return label || nextStep.trigger.replace(/-/g, " ")
  }
  return ""
}
