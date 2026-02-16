"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import useSWR from "swr"
import { usePokemon, usePokemonSpecies } from "@/hooks/use-pokemon"
import { useLanguage, getTypeLabel } from "@/components/shared"
import { TypeBadge } from "@/components/shared"
import { getLocalizedName, getPokemonSpecies, type PokemonBasicData } from "@/lib/api"
import { getCombinedDefensiveEffectiveness, getOffensiveCoverage } from "@/lib/data"

interface PokemonComparisonProps {
  pokemon1Id: number | null
  pokemon2Id: number | null
  onClose: () => void
  onSelectPokemon: (id: number) => void
  pokemonList?: PokemonBasicData[]
}

export function PokemonComparison({ pokemon1Id, pokemon2Id, onClose, onSelectPokemon, pokemonList = [] }: PokemonComparisonProps) {
  const { t, language } = useLanguage()
  const [compareId, setCompareId] = useState<number | null>(pokemon2Id)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSelectingPokemon, setIsSelectingPokemon] = useState(false)
  const [confirmedCompareId, setConfirmedCompareId] = useState<number | null>(null)
  const [displayLimit, setDisplayLimit] = useState(100)

  // Fetch localized names for search
  const uniqueIds = useMemo(() => [...new Set(pokemonList.map(p => p.id))], [pokemonList])
  const { data: nameMap } = useSWR(
    uniqueIds.length > 0 ? `pokemon-names-${uniqueIds.join(",")}-${language}` : null,
    async () => {
      const map = new Map<number, string>()
      const speciesList = await Promise.all(uniqueIds.map(id => getPokemonSpecies(id)))
      for (const species of speciesList) {
        map.set(species.id, getLocalizedName(species, language as "en" | "fr"))
      }
      return map
    },
    { revalidateOnFocus: false }
  )

  // Filter pokemon list based on search with translated names
  const filteredPokemon = useMemo(() => {
    const query = searchQuery.toLowerCase()
    const filtered = !searchQuery 
      ? pokemonList 
      : pokemonList.filter(p => {
          // Search by ID
          if (String(p.id).includes(query)) return true
          // Search by English name
          if (p.name.toLowerCase().includes(query)) return true
          // Search by localized name
          const localizedName = nameMap?.get(p.id)
          if (localizedName?.toLowerCase().includes(query)) return true
          return false
        })
    return filtered.slice(0, displayLimit)
  }, [searchQuery, pokemonList, displayLimit, nameMap, language])

  const { data: pokemon1 } = usePokemon(pokemon1Id)
  const { data: species1 } = usePokemonSpecies(pokemon1Id)
  const { data: pokemon2 } = usePokemon(confirmedCompareId)
  const { data: species2 } = usePokemonSpecies(confirmedCompareId)

  const handleStartComparison = () => {
    if (compareId) {
      setConfirmedCompareId(compareId)
      setIsSelectingPokemon(false)
    }
  }

  const handleSelectFromList = (id: number) => {
    setCompareId(id)
  }

  const name1 = species1 ? getLocalizedName(species1, language as "en" | "fr") : pokemon1?.name || ""
  const name2 = species2 ? getLocalizedName(species2, language as "en" | "fr") : pokemon2?.name || ""

  // Calculate stat comparison
  const getStatComparison = (stat1: number, stat2: number) => {
    if (stat1 > stat2) return "winner"
    if (stat1 < stat2) return "loser"
    return "equal"
  }

  const getTotalStats = (stats: any[]) => {
    return stats.reduce((acc, stat) => acc + stat.base_stat, 0)
  }

  // Calculate type advantages
  const getTypeAdvantage = (attackerTypes: any[], defenderTypes: any[]) => {
    const defenderTypeNames = defenderTypes.map(t => t.type.name)
    const defensiveEffectiveness = getCombinedDefensiveEffectiveness(defenderTypeNames)
    
    let advantage = 0
    attackerTypes.forEach(t => {
      const offensive = getOffensiveCoverage(t.type.name)
      defenderTypeNames.forEach(dType => {
        const multiplier = offensive[dType] || 1
        if (multiplier > 1) advantage += (multiplier - 1)
        else if (multiplier < 1) advantage -= (1 - multiplier)
      })
    })
    return advantage
  }

  const calculateTypeMatchup = (p1Types: any[], p2Types: any[]) => {
    const p1Advantage = getTypeAdvantage(p1Types, p2Types)
    const p2Advantage = getTypeAdvantage(p2Types, p1Types)
    
    return {
      p1: p1Advantage,
      p2: p2Advantage,
      winner: p1Advantage > p2Advantage ? 'p1' : p2Advantage > p1Advantage ? 'p2' : 'draw'
    }
  }

  const typeMatchup = pokemon1 && pokemon2 && confirmedCompareId 
    ? calculateTypeMatchup(pokemon1.types, pokemon2.types)
    : null

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="bg-primary p-3 border-b-4 border-border flex items-center justify-between">
        <h2 className="font-pixel text-primary-foreground text-xs md:text-sm">
          {t("comparison") || "COMPARISON"}
        </h2>
        <button
          onClick={onClose}
          className="px-3 py-1 font-pixel text-xs bg-secondary text-secondary-foreground btn-press"
          aria-label="Close comparison"
        >
          X
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!pokemon1Id ? (
          <div className="text-center py-8">
            <p className="font-pixel text-xs text-muted-foreground">
              {t("selectPokemonFirst") || "Select a Pokémon first"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pokemon Selection */}
            <div className="grid grid-cols-2 gap-4">
              {/* Pokemon 1 */}
              <div className="bg-primary/10 p-4 retro-border text-center">
                {pokemon1 && (
                  <>
                    <div className="w-32 h-32 mx-auto mb-2">
                      <Image
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon1.id}.png`}
                        alt={name1}
                        width={128}
                        height={128}
                        className="pixelated"
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
                    <p className="font-pixel text-xs text-muted-foreground mb-1">
                      #{String(pokemon1.id).padStart(3, "0")}
                    </p>
                    <p className="font-retro text-lg capitalize font-bold mb-2">
                      {name1}
                    </p>
                    <div className="flex gap-1 justify-center">
                      {pokemon1.types.map((t) => (
                        <TypeBadge key={t.type.name} type={t.type.name} language={language as "en" | "fr"} />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Pokemon 2 */}
              <div className="bg-secondary/30 p-4 retro-border text-center relative min-h-96">
                {!isSelectingPokemon && !confirmedCompareId ? (
                  <div className="py-8">
                    <div className="w-24 h-24 mx-auto mb-4 opacity-30 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
                        <text x="50" y="60" fontSize="48" textAnchor="middle" fill="currentColor">?</text>
                      </svg>
                    </div>
                    <h3 className="font-pixel text-sm mb-3 text-foreground">
                      {t("selectSecondPokemon")}
                    </h3>
                    <button
                      onClick={() => setIsSelectingPokemon(true)}
                      className="px-4 py-2 bg-primary text-primary-foreground font-pixel text-xs btn-press retro-border"
                    >
                      {t("selectPokemon")}
                    </button>
                  </div>
                ) : isSelectingPokemon ? (
                  <div className="absolute inset-0 bg-card z-10 p-4 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-pixel text-xs">{t("selectSecondPokemon")}</h3>
                      <button
                        onClick={() => setIsSelectingPokemon(false)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Search input */}
                    <input
                      type="text"
                      placeholder={t("searchPokemon")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-2 py-1 mb-3 bg-input text-foreground font-retro text-sm retro-border"
                    />

                    {/* Pokemon mini list */}
                    <div className="flex-1 overflow-y-auto mb-3 retro-border-inset bg-secondary/20">
                      {filteredPokemon.map((p) => (
                        <PokemonComparisonSelectItem
                          key={p.id}
                          pokemon={p}
                          onSelect={handleSelectFromList}
                          isSelected={compareId === p.id}
                          language={language}
                        />
                      ))}
                      {filteredPokemon.length < pokemonList.length && displayLimit <= pokemonList.length && (
                        <button
                          onClick={() => setDisplayLimit(prev => prev + 100)}
                          className="w-full p-2 text-center font-pixel text-xs text-muted-foreground hover:bg-secondary/50"
                        >
                          {t("loadMore")}
                        </button>
                      )}
                    </div>

                    {/* Validate button */}
                    <button
                      onClick={handleStartComparison}
                      disabled={!compareId}
                      className="w-full px-4 py-2 bg-accent text-accent-foreground font-pixel text-xs btn-press retro-border disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("startComparison")}
                    </button>
                  </div>
                ) : pokemon2 ? (
                  <>
                    <button
                      onClick={() => {
                        setCompareId(null)
                        setConfirmedCompareId(null)
                        setIsSelectingPokemon(true)
                      }}
                      className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                    <div className="w-32 h-32 mx-auto mb-2">
                      <Image
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon2.id}.png`}
                        alt={name2}
                        width={128}
                        height={128}
                        className="pixelated"
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
                    <p className="font-pixel text-xs text-muted-foreground mb-1">
                      #{String(pokemon2.id).padStart(3, "0")}
                    </p>
                    <p className="font-retro text-lg capitalize font-bold mb-2">
                      {name2}
                    </p>
                    <div className="flex gap-1 justify-center">
                      {pokemon2.types.map((t) => (
                        <TypeBadge key={t.type.name} type={t.type.name} language={language as "en" | "fr"} />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Stats Comparison */}
            {pokemon1 && pokemon2 && confirmedCompareId && (
              <div className="space-y-4">
                {/* Type Advantage Section */}
                <div className="bg-primary/5 p-4 retro-border space-y-3">
                  <h3 className="font-pixel text-sm text-center">
                    {t("typeAdvantage") || "TYPE ADVANTAGE"}
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {/* Pokemon 1 Type Advantage */}
                    <div className="bg-primary/20 p-3 retro-border-inset text-center">
                      <p className="font-pixel text-xs text-muted-foreground mb-2">
                        {t("offensive") || "OFFENSIVE"}
                      </p>
                      <div className={`font-retro text-2xl font-bold ${
                        typeMatchup && typeMatchup.p1 > typeMatchup.p2
                          ? "text-green-400" 
                          : typeMatchup && typeMatchup.p1 < typeMatchup.p2
                          ? "text-red-400" 
                          : "text-yellow-400"
                      }`}>
                        {typeMatchup?.p1 || 0}
                      </div>
                    </div>

                    {/* VS */}
                    <div className="flex items-center justify-center">
                      <span className="font-pixel text-xs text-muted-foreground">VS</span>
                    </div>

                    {/* Pokemon 2 Type Advantage */}
                    <div className="bg-secondary/20 p-3 retro-border-inset text-center">
                      <p className="font-pixel text-xs text-muted-foreground mb-2">
                        {t("offensive") || "OFFENSIVE"}
                      </p>
                      <div className={`font-retro text-2xl font-bold ${
                        typeMatchup && typeMatchup.p2 > typeMatchup.p1
                          ? "text-green-400" 
                          : typeMatchup && typeMatchup.p2 < typeMatchup.p1
                          ? "text-red-400" 
                          : "text-yellow-400"
                      }`}>
                        {typeMatchup?.p2 || 0}
                      </div>
                    </div>
                  </div>

                  {/* Winner indicator */}
                  <div className="text-center">
                    <p className="font-pixel text-xs text-muted-foreground mb-2">
                      {typeMatchup?.winner === 'p1' 
                        ? `${name1} ${t("hasTypeAdvantage") || "has the type advantage"}` 
                        : typeMatchup?.winner === 'p2'
                        ? `${name2} ${t("hasTypeAdvantage") || "has the type advantage"}`
                        : t("typeMatchupNeutral") || "Neutral type matchup"}
                    </p>
                  </div>
                </div>

                <h3 className="font-pixel text-sm text-center">
                  {t("statsComparison") || "STATS COMPARISON"}
                </h3>

                {/* Individual Stats */}
                <div className="space-y-2">
                  {pokemon1.stats.map((stat, idx) => {
                    const stat2 = pokemon2.stats[idx]
                    const comparison = getStatComparison(stat.base_stat, stat2.base_stat)
                    
                    return (
                      <div key={stat.stat.name} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-pixel text-xs uppercase w-32">
                            {stat.stat.name.replace("-", " ")}
                          </span>
                          <div className="flex-1 flex gap-2 items-center">
                            <span className={`font-retro text-sm w-12 text-right ${
                              comparison === "winner" ? "text-green-400 font-bold" : 
                              comparison === "loser" ? "text-red-400" : ""
                            }`}>
                              {stat.base_stat}
                            </span>
                            <div className="flex-1 h-4 bg-secondary relative">
                              <div
                                className={`h-full ${
                                  comparison === "winner" ? "bg-green-500" :
                                  comparison === "loser" ? "bg-red-500" : "bg-yellow-500"
                                }`}
                                style={{ width: `${(stat.base_stat / 255) * 100}%` }}
                              />
                            </div>
                            <div className="flex-1 h-4 bg-secondary relative">
                              <div
                                className={`h-full ${
                                  comparison === "loser" ? "bg-green-500" :
                                  comparison === "winner" ? "bg-red-500" : "bg-yellow-500"
                                }`}
                                style={{ width: `${(stat2.base_stat / 255) * 100}%` }}
                              />
                            </div>
                            <span className={`font-retro text-sm w-12 ${
                              comparison === "loser" ? "text-green-400 font-bold" : 
                              comparison === "winner" ? "text-red-400" : ""
                            }`}>
                              {stat2.base_stat}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Total Stats */}
                  <div className="pt-4 border-t-2 border-border">
                    <div className="flex justify-between items-center">
                      <span className="font-pixel text-xs uppercase w-32">TOTAL</span>
                      <div className="flex-1 flex gap-2 items-center justify-center">
                        <span className={`font-retro text-lg w-16 text-right ${
                          getTotalStats(pokemon1.stats) > getTotalStats(pokemon2.stats) 
                            ? "text-green-400 font-bold" : "text-red-400"
                        }`}>
                          {getTotalStats(pokemon1.stats)}
                        </span>
                        <span className="font-pixel text-xs text-muted-foreground">vs</span>
                        <span className={`font-retro text-lg w-16 ${
                          getTotalStats(pokemon2.stats) > getTotalStats(pokemon1.stats) 
                            ? "text-green-400 font-bold" : "text-red-400"
                        }`}>
                          {getTotalStats(pokemon2.stats)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Physical Info Comparison */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-secondary/30 p-3 retro-border-inset">
                    <p className="font-pixel text-xs text-muted-foreground mb-2">
                      {t("height") || "HEIGHT"}
                    </p>
                    <p className="font-retro text-lg">
                      {(pokemon1.height / 10).toFixed(1)} m
                    </p>
                  </div>
                  <div className="bg-secondary/30 p-3 retro-border-inset">
                    <p className="font-pixel text-xs text-muted-foreground mb-2">
                      {t("height") || "HEIGHT"}
                    </p>
                    <p className="font-retro text-lg">
                      {(pokemon2.height / 10).toFixed(1)} m
                    </p>
                  </div>
                  <div className="bg-secondary/30 p-3 retro-border-inset">
                    <p className="font-pixel text-xs text-muted-foreground mb-2">
                      {t("weight") || "WEIGHT"}
                    </p>
                    <p className="font-retro text-lg">
                      {(pokemon1.weight / 10).toFixed(1)} kg
                    </p>
                  </div>
                  <div className="bg-secondary/30 p-3 retro-border-inset">
                    <p className="font-pixel text-xs text-muted-foreground mb-2">
                      {t("weight") || "WEIGHT"}
                    </p>
                    <p className="font-retro text-lg">
                      {(pokemon2.weight / 10).toFixed(1)} kg
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface PokemonComparisonSelectItemProps {
  pokemon: PokemonBasicData
  onSelect: (id: number) => void
  isSelected: boolean
  language: string
}

function PokemonComparisonSelectItem({ pokemon, onSelect, isSelected, language }: PokemonComparisonSelectItemProps) {
  const { data: species } = usePokemonSpecies(pokemon.id)
  const displayName = species ? getLocalizedName(species, language as "en" | "fr") : pokemon.name

  return (
    <button
      onClick={() => onSelect(pokemon.id)}
      className={`w-full p-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left ${
        isSelected ? "bg-primary/20 border-l-2 border-primary" : ""
      }`}
    >
      <Image
        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
        alt={displayName}
        width={48}
        height={48}
        className="pixelated"
      />
      <div className="flex-1">
        <span className="font-pixel text-xs text-muted-foreground">
          #{String(pokemon.id).padStart(3, "0")}
        </span>
        <span className="font-retro text-sm capitalize ml-2">
          {displayName}
        </span>
      </div>
      {isSelected && (
        <span className="text-primary">✓</span>
      )}
    </button>
  )
}
