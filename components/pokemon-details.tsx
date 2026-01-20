"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePokemon, usePokemonSpecies } from "@/hooks/use-pokemon"
import { useLanguage } from "./language-provider"
import { TypeBadge } from "./type-badge"
import { StatBars } from "./stat-bars"
import { MovesTab } from "./moves-tab"
import { EvolutionChainDisplay } from "./evolution-chain"
import { AbilityPopup } from "./ability-popup"
import { getFlavorText, getLocalizedName, getPokemonCryUrl } from "@/lib/pokeapi"

interface PokemonDetailsProps {
  pokemonId: number | null
  showBackButton?: boolean
}

type Tab = "info" | "stats" | "moves" | "evolution"

export function PokemonDetails({ pokemonId, showBackButton = false }: PokemonDetailsProps) {
  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState<Tab>("info")
  const [spriteVariant, setSpriteVariant] = useState<"front" | "back">("front")
  const [isShiny, setIsShiny] = useState(false)
  const [isPlayingCry, setIsPlayingCry] = useState(false)

  // Play Pokemon cry
  const playCry = () => {
    if (!pokemonId || isPlayingCry) return
    setIsPlayingCry(true)
    const audio = new Audio(getPokemonCryUrl(pokemonId))
    audio.volume = 0.3
    audio.play().catch(() => {})
    audio.onended = () => setIsPlayingCry(false)
    audio.onerror = () => setIsPlayingCry(false)
  }

  const { data: pokemon, isLoading: pokemonLoading, error: pokemonError } = usePokemon(pokemonId)
  const { data: species, isLoading: speciesLoading, error: speciesError } = usePokemonSpecies(pokemonId)

  // Empty state
  if (!pokemonId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 mb-4 opacity-30">
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" />
            <circle cx="50" cy="50" r="15" />
            <line x1="5" y1="50" x2="35" y2="50" strokeWidth="6" stroke="currentColor" />
            <line x1="65" y1="50" x2="95" y2="50" strokeWidth="6" stroke="currentColor" />
          </svg>
        </div>
        <h2 className="font-pixel text-sm text-muted-foreground mb-2">
          {t("selectPokemon")}
        </h2>
        <p className="font-retro text-lg text-muted-foreground">
          {t("selectPrompt")}
        </p>
      </div>
    )
  }

  // Loading state
  if (pokemonLoading || speciesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-md p-8">
          <div className="w-32 h-32 bg-secondary mx-auto" />
          <div className="h-8 bg-secondary w-48 mx-auto" />
          <div className="h-4 bg-secondary w-full" />
          <div className="h-4 bg-secondary w-3/4" />
        </div>
      </div>
    )
  }

  // Error state
  if (pokemonError || speciesError || !pokemon) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <p className="font-pixel text-sm text-destructive-foreground mb-4">
          {t("error")}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground font-pixel text-xs btn-press"
        >
          {t("retry")}
        </button>
      </div>
    )
  }

  const formattedId = String(pokemon.id).padStart(3, "0")
  const flavorText = species ? getFlavorText(species, language) : ""
  const displayName = species ? getLocalizedName(species, language) : pokemon.name

  // Get sprite URL based on variant and shiny state
  const getSpriteUrl = () => {
    const sprites = pokemon.sprites
    if (isShiny) {
      return spriteVariant === "front" ? sprites.front_shiny : sprites.back_shiny
    }
    return spriteVariant === "front" ? sprites.front_default : sprites.back_default
  }

  const spriteUrl = getSpriteUrl()
  const officialArtwork = pokemon.sprites.other?.["official-artwork"]?.front_default

  const tabs: { key: Tab; label: string }[] = [
    { key: "info", label: t("info") },
    { key: "stats", label: t("stats") },
    { key: "moves", label: t("moves") },
    { key: "evolution", label: t("evolution") },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with sprite and basic info */}
      <div className="bg-secondary/30 p-4 border-b-4 border-border">
        {showBackButton && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-primary text-primary-foreground font-pixel text-xs btn-press"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
            {t("back")}
          </Link>
        )}

        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Sprite area */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-panel-screen/20 retro-border-inset flex items-center justify-center">
              {spriteUrl ? (
                <Image
                  src={spriteUrl || "/placeholder.svg"}
                  alt={pokemon.name}
                  width={160}
                  height={160}
                  className="pixelated pokemon-bounce"
                  style={{ imageRendering: "pixelated" }}
                  priority
                />
              ) : officialArtwork ? (
                <Image
                  src={officialArtwork || "/placeholder.svg"}
                  alt={pokemon.name}
                  width={160}
                  height={160}
                  className="object-contain pokemon-bounce"
                  priority
                />
              ) : (
                <div className="w-20 h-20 bg-muted animate-pulse" />
              )}
            </div>

            {/* Sprite controls */}
            <div className="flex justify-center gap-2 mt-2">
              <button
                onClick={() => setSpriteVariant("front")}
                className={`px-2 py-1 font-pixel text-xs btn-press ${
                  spriteVariant === "front"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
                aria-pressed={spriteVariant === "front"}
              >
                {t("front")}
              </button>
              <button
                onClick={() => setSpriteVariant("back")}
                className={`px-2 py-1 font-pixel text-xs btn-press ${
                  spriteVariant === "back"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
                aria-pressed={spriteVariant === "back"}
              >
                {t("backSprite")}
              </button>
              <button
                onClick={() => setIsShiny(!isShiny)}
                className={`px-2 py-1 font-pixel text-xs btn-press ${
                  isShiny
                    ? "bg-yellow-500 text-black"
                    : "bg-secondary text-secondary-foreground"
                }`}
                aria-pressed={isShiny}
              >
                {isShiny ? "★" : t("shiny")}
              </button>
              <button
                onClick={playCry}
                disabled={isPlayingCry}
                className={`px-2 py-1 font-pixel text-xs btn-press ${
                  isPlayingCry
                    ? "bg-primary/50 text-primary-foreground animate-pulse"
                    : "bg-primary text-primary-foreground"
                }`}
                aria-label={t("cry")}
              >
                {isPlayingCry ? "♪" : "🔊"}
              </button>
            </div>
          </div>

          {/* Basic info */}
          <div className="flex-1 text-center md:text-left">
            <p className="font-pixel text-sm text-muted-foreground">
              #{formattedId}
            </p>
            <h2 className="font-pixel text-xl md:text-2xl capitalize mb-3">
              {displayName}
            </h2>

            {/* Types */}
            <div className="flex gap-2 justify-center md:justify-start mb-3">
              {pokemon.types.map((t) => (
                <TypeBadge key={t.type.name} type={t.type.name} size="md" />
              ))}
            </div>

            {/* Height/Weight */}
            <div className="flex gap-6 justify-center md:justify-start text-sm">
              <div>
                <span className="font-pixel text-xs text-muted-foreground block">
                  {t("height")}
                </span>
                <span className="font-retro text-lg">
                  {(pokemon.height / 10).toFixed(1)} m
                </span>
              </div>
              <div>
                <span className="font-pixel text-xs text-muted-foreground block">
                  {t("weight")}
                </span>
                <span className="font-retro text-lg">
                  {(pokemon.weight / 10).toFixed(1)} kg
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-4 border-border bg-secondary/30">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 font-pixel text-xs transition-colors btn-press ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary"
            }`}
            aria-selected={activeTab === tab.key}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "info" && (
          <div className="space-y-4 slide-up">
            {/* Description */}
            <div className="bg-secondary/30 p-4 retro-border-inset">
              <p className="font-retro text-lg leading-relaxed">
                {flavorText}
              </p>
            </div>

            {/* Abilities */}
            <div>
              <h3 className="font-pixel text-sm mb-2">{t("abilities")}</h3>
              <div className="flex flex-wrap gap-2">
                {pokemon.abilities.map((a) => (
                  <AbilityPopup
                    key={a.ability.name}
                    abilityUrl={a.ability.url}
                    abilityName={a.ability.name}
                    isHidden={a.is_hidden}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="slide-up">
            <StatBars stats={pokemon.stats} />
          </div>
        )}

        {activeTab === "moves" && (
          <div className="slide-up">
            <MovesTab moves={pokemon.moves} />
          </div>
        )}

        {activeTab === "evolution" && species && (
          <div className="slide-up">
            <EvolutionChainDisplay
              evolutionChainUrl={species.evolution_chain.url}
              currentPokemonId={pokemon.id}
            />
          </div>
        )}
      </div>
    </div>
  )
}
