"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useLanguage } from "./language-provider"
import { TypeBadge } from "./type-badge"
import { cn } from "@/lib/utils"
import {
  getLocalizedName,
  getPokemon,
  getPokemonSpecies,
  TOTAL_POKEMON,
  type PokemonBasicData,
  type PokemonSpecies,
} from "@/lib/pokeapi"

const PACK_SIZE = 5
const SHINY_ODDS = 4096

type BoosterMode = "random" | "rarity" | "balanced"
type CardRarity = "common" | "rare" | "legendary"

type DesiredTier = "any" | CardRarity | "rareOrLegendary"

interface BoosterCard {
  id: number
  name: string
  nameFr: string
  sprite: string
  spriteShiny?: string
  types: string[]
  rarity: CardRarity
  shiny: boolean
}

interface BoosterLabProps {
  onClose: () => void
  pokemonList?: PokemonBasicData[]
}

const rarityWeights: Record<CardRarity, number> = {
  common: 0.7,
  rare: 0.25,
  legendary: 0.05,
}

function pickWeightedRarity(): CardRarity {
  const roll = Math.random()
  if (roll < rarityWeights.common) return "common"
  if (roll < rarityWeights.common + rarityWeights.rare) return "rare"
  return "legendary"
}

function classifyRarity(species: PokemonSpecies): CardRarity {
  // Legend/Mythical take top priority
  if ((species as unknown as { is_legendary?: boolean }).is_legendary || (species as unknown as { is_mythical?: boolean }).is_mythical) {
    return "legendary"
  }

  // Base forms are considered common, any evolution is rare by default
  return species.evolves_from_species ? "rare" : "common"
}

function buildTiers(mode: BoosterMode): DesiredTier[] {
  if (mode === "random") {
    return Array.from({ length: PACK_SIZE }, () => "any")
  }

  if (mode === "balanced") {
    return ["common", "common", "common", "rare", "rareOrLegendary"]
  }

  // rarity mode
  return Array.from({ length: PACK_SIZE }, () => pickWeightedRarity())
}

async function rollPokemon(tier: DesiredTier, language: "en" | "fr", seen: Set<number>): Promise<BoosterCard> {
  const attempts = 18
  for (let i = 0; i < attempts; i++) {
    const id = Math.floor(Math.random() * TOTAL_POKEMON) + 1
    if (seen.has(id)) continue

    try {
      const [pokemon, species] = await Promise.all([
        getPokemon(id),
        getPokemonSpecies(id),
      ])

      const rarity = classifyRarity(species)
      const fitsTier =
        tier === "any" ||
        tier === rarity ||
        (tier === "rareOrLegendary" && (rarity === "rare" || rarity === "legendary")) ||
        (tier === "rare" && rarity !== "common")

      if (!fitsTier) continue

      const shiny = Math.random() < 1 / SHINY_ODDS
      const displayName = getLocalizedName(species, language)
      const sprite =
        pokemon.sprites.front_default ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`

      const spriteShiny =
        pokemon.sprites.front_shiny ||
        pokemon.sprites.other?.["official-artwork"]?.front_shiny ||
        sprite

      seen.add(id)

      return {
        id,
        name: pokemon.name,
        nameFr: displayName,
        sprite,
        spriteShiny,
        types: pokemon.types.map(t => t.type.name),
        rarity,
        shiny,
      }
    } catch (error) {
      // If a call fails, try another ID
      // eslint-disable-next-line no-continue
      continue
    }
  }

  // Fallback to a basic entry if all attempts fail
  const fallbackId = Math.floor(Math.random() * TOTAL_POKEMON) + 1
  return {
    id: fallbackId,
    name: `pokemon-${fallbackId}`,
    nameFr: `pokemon-${fallbackId}`,
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${fallbackId}.png`,
    spriteShiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${fallbackId}.png`,
    types: [],
    rarity: "common",
    shiny: false,
  }
}

export function BoosterLab({ onClose, pokemonList = [] }: BoosterLabProps) {
  const { t, language } = useLanguage()
  const [mode, setMode] = useState<BoosterMode>("random")
  const [isOpening, setIsOpening] = useState(false)
  const [cards, setCards] = useState<BoosterCard[]>([])

  const hasShiny = useMemo(() => cards.some(card => card.shiny), [cards])
  // no per-particle overlay anymore; only main burst

  const modeDescription = useMemo(() => {
    if (mode === "random") return t("boosterRandomDetail")
    if (mode === "balanced") return t("boosterBalancedDetail")
    return t("boosterRarityDetail")
  }, [mode, t])

  const openPack = async () => {
    if (isOpening) return
    setIsOpening(true)
    const tiers = buildTiers(mode)
    const seen = new Set<number>()

    const results = await Promise.all(
      tiers.map((tier) => rollPokemon(tier, language as "en" | "fr", seen))
    )

    setCards(results)
    setIsOpening(false)
  }

  return (
    <div className="h-full flex flex-col bg-card relative overflow-hidden">
      <div className="bg-primary p-3 border-b-4 border-border flex items-center justify-between">
        <h2 className="font-pixel text-primary-foreground text-xs md:text-sm">{t("boosterLab")}</h2>
        <button
          onClick={onClose}
          className="px-3 py-1 font-pixel text-xs bg-secondary text-secondary-foreground btn-press"
        >
          X
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        <div className="flex flex-col gap-3">
          <p className="font-retro text-sm text-muted-foreground">{t("boosterDescription")}</p>
          <div className="flex flex-wrap gap-2">
            <ModeButton
              active={mode === "random"}
              label={t("boosterRandom")}
              onClick={() => setMode("random")}
            />
            <ModeButton
              active={mode === "rarity"}
              label={t("boosterRarity")}
              onClick={() => setMode("rarity")}
            />
            <ModeButton
              active={mode === "balanced"}
              label={t("boosterBalanced")}
              onClick={() => setMode("balanced")}
            />
          </div>
          <p className="font-pixel text-xs text-muted-foreground">{modeDescription}</p>
          <p className="font-pixel text-xs text-yellow-300">{t("boosterShinyOdds")}</p>
          <div className="flex gap-2 items-center">
            <button
              onClick={openPack}
              disabled={isOpening}
              className="px-4 py-2 bg-primary text-primary-foreground font-pixel text-xs btn-press disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOpening ? t("boosterOpening") : t("boosterOpen")}
            </button>
            {pokemonList.length < TOTAL_POKEMON && (
              <span className="font-pixel text-[11px] text-muted-foreground">
                {`Loaded ${pokemonList.length}/${TOTAL_POKEMON}`}
              </span>
            )}
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="flex-1 rounded-md border border-dashed border-muted-foreground/40 p-6 text-center flex items-center justify-center">
            <p className="font-retro text-sm text-muted-foreground">{t("boosterEmpty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:grid-cols-3">
            {cards.map((card, index) => (
              <BoosterCardTile
                key={`${card.id}-${card.shiny ? "shiny" : "normal"}-${index}`}
                card={card}
                language={language as "en" | "fr"}
              />
            ))}
          </div>
        )}
      </div>

      {hasShiny && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden flex items-center justify-center">
          <div className="shiny-flash" />
          <div className="shiny-burst" />
          <div className="shiny-banner font-pixel text-xs md:text-sm">✨ SHINY ! ✨</div>
        </div>
      )}

      <style jsx>{`
        @keyframes shinyFlashPulse {
          0% { opacity: 0; transform: scale(0.9); }
          30% { opacity: 0.7; transform: scale(1.05); }
          60% { opacity: 0.9; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.3); }
        }
        @keyframes shinyBurst {
          0% { opacity: 0.6; transform: scale(0.6) rotate(0deg); }
          40% { opacity: 1; transform: scale(1.1) rotate(30deg); }
          100% { opacity: 0; transform: scale(1.4) rotate(60deg); }
        }
        .shiny-flash {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(255,255,200,0.28) 0%, rgba(255,255,200,0) 60%);
          animation: shinyFlashPulse 1200ms ease-out forwards;
        }
        .shiny-burst {
          position: absolute;
          width: 55%;
          max-width: 520px;
          aspect-ratio: 1;
          background: conic-gradient(from 90deg, rgba(255,240,180,0.6), rgba(255,200,80,0.9), rgba(255,240,180,0.6));
          filter: blur(6px);
          border-radius: 50%;
          animation: shinyBurst 1400ms ease-out forwards;
          mix-blend-mode: screen;
        }
        .shiny-banner {
          position: absolute;
          top: 12px;
          padding: 8px 14px;
          background: linear-gradient(90deg, #ffd166, #ffb700, #ffd166);
          color: #2d1600;
          border: 2px solid rgba(0,0,0,0.15);
          border-radius: 999px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.25);
          animation: shinyFlashPulse 1100ms ease-out;
        }
      `}</style>
    </div>
  )
}

interface ModeButtonProps {
  label: string
  active: boolean
  onClick: () => void
}

function ModeButton({ label, active, onClick }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 font-pixel text-xs btn-press",
        active ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}

function BoosterCardTile({ card, language }: { card: BoosterCard; language: "en" | "fr" }) {
  const rarityClass: Record<CardRarity, string> = {
    common: "bg-secondary/40 border-secondary",
    rare: "bg-primary/30 border-primary",
    legendary: "bg-amber-500/20 border-amber-400",
  }

  const rarityLabelKey: Record<CardRarity, string> = {
    common: "boosterCardCommon",
    rare: "boosterCardRare",
    legendary: "boosterCardLegendary",
  }

  const { t } = useLanguage()
  const displayName = language === "fr" ? card.nameFr : card.name
  const displaySprite = card.shiny && card.spriteShiny ? card.spriteShiny : card.sprite

  return (
    <div className={cn("retro-border p-3 flex flex-col gap-2 relative overflow-hidden", rarityClass[card.rarity])}>
      <div className="flex items-center justify-between">
        <span className="font-pixel text-xs text-muted-foreground">#{String(card.id).padStart(3, "0")}</span>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[11px] uppercase">{t(rarityLabelKey[card.rarity])}</span>
          {card.shiny && (
            <span className="px-2 py-0.5 bg-yellow-500 text-black font-pixel text-[11px] rounded-sm">
              {t("boosterShinyTag")}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-20 h-20 bg-panel-screen/30 retro-border-inset flex items-center justify-center relative">
          <Image
            src={displaySprite}
            alt={displayName}
            width={80}
            height={80}
            className="object-contain pixelated"
          />
        </div>
        <div className="flex-1">
          <p className="font-retro text-sm capitalize">{displayName}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {card.types.slice(0, 2).map((type) => (
              <div key={type} className="transform scale-90 origin-left">
                <TypeBadge type={type} language={language} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
