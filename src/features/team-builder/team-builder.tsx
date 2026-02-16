"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import useSWR from "swr"
import { usePokemon, usePokemonSpecies } from "@/hooks/use-pokemon"
import { useLanguage } from "@/components/shared"
import { TypeBadge } from "@/components/shared"
import { getLocalizedName, getPokemonSpecies, type PokemonBasicData } from "@/lib/api"
import { getCombinedDefensiveEffectiveness, getOffensiveCoverage, ALL_TYPES } from "@/lib/data"
import { AITeamGenerator } from "./ai-team-generator"
import { generateProfChenReview } from "@/lib/ai/team-generator"
import { Loader2 } from "lucide-react"

interface TeamMember {
  id: number
  types: string[]
}

interface TeamBuilderProps {
  onClose: () => void
  pokemonList?: PokemonBasicData[]
}

export function TeamBuilder({ onClose, pokemonList = [] }: TeamBuilderProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [team, setTeam] = useState<TeamMember[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSelectingPokemon, setIsSelectingPokemon] = useState(false)
  const [displayLimit, setDisplayLimit] = useState(100)
  const [mode, setMode] = useState<"manual" | "ai">("manual")
  const [profChenReview, setProfChenReview] = useState<string | null>(null)
  const [isLoadingReview, setIsLoadingReview] = useState(false)
  const [narrativeStyle, setNarrativeStyle] = useState<"serious" | "humor" | "epic">("serious")

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

  const addToTeam = (id: number, types: string[]) => {
    if (team.length >= 6) return
    if (team.some(member => member.id === id)) return
    setTeam([...team, { id, types }])
    setIsSelectingPokemon(false)
    setProfChenReview(null) // Reset review when team changes
  }

  const removeFromTeam = (id: number) => {
    setTeam(team.filter(member => member.id !== id))
    setProfChenReview(null) // Reset review when team changes
  }

  // Team analysis
  const teamAnalysis = useMemo(() => {
    if (team.length === 0) {
      return { weaknesses: {}, resistances: {}, offensiveCoverage: new Set<string>() }
    }

    // Calculate defensive weaknesses
    const weaknessCount: Record<string, number> = {}
    const resistanceCount: Record<string, number> = {}

    team.forEach(member => {
      const effectiveness = getCombinedDefensiveEffectiveness(member.types)
      Object.entries(effectiveness).forEach(([type, multiplier]) => {
        if (multiplier > 1) {
          weaknessCount[type] = (weaknessCount[type] || 0) + 1
        } else if (multiplier < 1) {
          resistanceCount[type] = (resistanceCount[type] || 0) + 1
        }
      })
    })

    // Calculate offensive coverage
    const offensiveCoverage = new Set<string>()
    team.forEach(member => {
      member.types.forEach(type => {
        const coverage = getOffensiveCoverage(type)
        Object.entries(coverage).forEach(([defendingType, multiplier]) => {
          if (multiplier >= 2) {
            offensiveCoverage.add(defendingType)
          }
        })
      })
    })

    return { weaknesses: weaknessCount, resistances: resistanceCount, offensiveCoverage }
  }, [team])

  // Generate suggestions
  const suggestions = useMemo(() => {
    const sug: string[] = []
    
    if (team.length === 0) {
      return [t("selectPokemonFirst") || "Add Pokémon to your team to get suggestions"]
    }

    // Find most common weaknesses
    const sortedWeaknesses = Object.entries(teamAnalysis.weaknesses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    sortedWeaknesses.forEach(([type, count]) => {
      if (count >= team.length / 2) {
        sug.push(`${language === "fr" ? "Ton équipe est très faible face au type" : "Your team is very weak to"} ${type.toUpperCase()} (${count}/${team.length})`)
      }
    })

    // Find missing offensive types
    const missingTypes = ALL_TYPES.filter(type => !teamAnalysis.offensiveCoverage.has(type))
    if (missingTypes.length > 0 && missingTypes.length <= 5) {
      const typesList = missingTypes.slice(0, 3).map(t => t.toUpperCase()).join(", ")
      sug.push(`${language === "fr" ? "Il te manque une couverture contre :" : "Missing coverage against:"} ${typesList}`)
    }

    if (team.length < 6) {
      sug.push(`${language === "fr" ? "Ajoute encore" : "Add"} ${6 - team.length} ${language === "fr" ? "Pokémon pour compléter ton équipe" : "more Pokémon to complete your team"}`)
    }

    return sug.length > 0 ? sug : [`${language === "fr" ? "Ton équipe est équilibrée !" : "Your team is balanced!"}`]
  }, [team, teamAnalysis, language, t])

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="bg-primary p-3 border-b-4 border-border flex items-center justify-between">
        <h2 className="font-pixel text-primary-foreground text-xs md:text-sm">
          {t("teamBuilder")}
        </h2>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-secondary/30 p-1 rounded">
            <button
              onClick={() => setMode("manual")}
              className={`px-2 py-1 text-xs font-pixel transition-colors ${
                mode === "manual"
                  ? "bg-primary text-primary-foreground"
                  : "text-secondary-foreground hover:bg-secondary/50"
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setMode("ai")}
              className={`px-2 py-1 text-xs font-pixel transition-colors ${
                mode === "ai"
                  ? "bg-primary text-primary-foreground"
                  : "text-secondary-foreground hover:bg-secondary/50"
              }`}
            >
              AI ✨
            </button>
            {team.length > 0 && (
              <>
                <select
                  value={narrativeStyle}
                  onChange={(e) => setNarrativeStyle(e.target.value as "serious" | "humor" | "epic")}
                  className="px-2 py-1 text-xs font-pixel bg-secondary text-secondary-foreground border border-primary rounded"
                >
                  <option value="serious">{language === "fr" ? "Sérieux" : "Serious"}</option>
                  <option value="humor">{language === "fr" ? "Humour" : "Humor"}</option>
                  <option value="epic">{language === "fr" ? "Épique" : "Epic"}</option>
                </select>
                <button
                  onClick={() => {
                    const teamParam = encodeURIComponent(JSON.stringify(team))
                    router.push(
                      `/adventure?team=${teamParam}&style=${narrativeStyle}&language=${language}`
                    )
                  }}
                  className="px-2 py-1 text-xs font-pixel bg-yellow-500 hover:bg-yellow-600 text-black border border-yellow-700 font-bold"
                >
                  🎮 {language === "fr" ? "Aventure" : "Adventure"}
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 font-pixel text-xs bg-secondary text-secondary-foreground btn-press"
          >
            X
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Generator Mode */}
        {mode === "ai" && (
          <AITeamGenerator
            pokemonList={pokemonList}
            language={language as "en" | "fr"}
            onTeamGenerated={(generatedTeam) => {
              // Add generated team members to the team
              const newTeam: TeamMember[] = generatedTeam.team.map(member => ({
                id: member.id,
                types: member.types,
              }))
              setTeam(newTeam)
              setProfChenReview(null) // Reset review for new team
              setMode("manual") // Switch back to manual mode to show the team
            }}
          />
        )}

        {/* Manual Builder Mode */}
        {mode === "manual" && (
          <>
            {/* Team Slots */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-pixel text-sm">{t("myTeam")} ({team.length}/6)</h3>
                <button
                  onClick={() => setIsSelectingPokemon(true)}
                  disabled={team.length >= 6}
                  className="px-3 py-1 bg-primary text-primary-foreground font-pixel text-xs btn-press retro-border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + {t("addToTeam")}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <TeamSlot
                    key={index}
                    member={team[index]}
                    onRemove={removeFromTeam}
                    language={language}
                    t={t}
                  />
                ))}
              </div>

              {/* Prof Chen Review Button */}
              {team.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={async () => {
                      setIsLoadingReview(true)
                      try {
                        const review = await generateProfChenReview(
                          team,
                          language as "en" | "fr"
                        )
                        setProfChenReview(review)
                      } catch (error) {
                        console.error("Failed to get Prof Chen review:", error)
                      } finally {
                        setIsLoadingReview(false)
                      }
                    }}
                    disabled={isLoadingReview}
                    className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-pixel text-xs btn-press retro-border disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoadingReview && <Loader2 className="w-3 h-3 animate-spin" />}
                    {language === "fr" ? "✨ Avis du Prof. Chen" : "✨ Prof. Chen's Review"}
                  </button>
                </div>
              )}

              {/* Prof Chen Review Display */}
              {profChenReview && (
                <div className="bg-purple-500/20 p-4 retro-border mb-4 space-y-2">
                  <p className="font-pixel text-sm text-purple-700 dark:text-purple-300">
                    {language === "fr" ? "💬 Prof. Chen dit:" : "💬 Prof. Chen says:"}
                  </p>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    "{profChenReview}"
                  </p>
                </div>
              )}
            </div>

            {/* Type Analysis */}
            {team.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-pixel text-sm">{t("typeAnalysis")}</h3>

                {/* Weaknesses */}
                <div className="bg-secondary/30 p-3 retro-border-inset">
                  <p className="font-pixel text-xs text-muted-foreground mb-2">{t("weaknesses")}</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(teamAnalysis.weaknesses)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center gap-1">
                          <div className="transform scale-75 origin-center">
                            <TypeBadge type={type} language={language as "en" | "fr"} />
                          </div>
                          <span className="font-pixel text-xs text-red-400">×{count}</span>
                        </div>
                      ))}
                    {Object.keys(teamAnalysis.weaknesses).length === 0 && (
                      <span className="font-retro text-sm text-muted-foreground">{t("goodCoverage")}</span>
                    )}
                  </div>
                </div>

                {/* Resistances */}
                <div className="bg-secondary/30 p-3 retro-border-inset">
                  <p className="font-pixel text-xs text-muted-foreground mb-2">{t("resistances")}</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(teamAnalysis.resistances)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center gap-1">
                          <div className="transform scale-75 origin-center">
                            <TypeBadge type={type} language={language as "en" | "fr"} />
                          </div>
                          <span className="font-pixel text-xs text-green-400">×{count}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Offensive Coverage */}
                <div className="bg-secondary/30 p-3 retro-border-inset">
                  <p className="font-pixel text-xs text-muted-foreground mb-2">
                    {t("offensiveCoverage")} ({teamAnalysis.offensiveCoverage.size}/{ALL_TYPES.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(teamAnalysis.offensiveCoverage).slice(0, 12).map(type => (
                      <div key={type} className="transform scale-75 origin-center">
                        <TypeBadge type={type} language={language as "en" | "fr"} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                <div className="bg-accent/20 p-3 retro-border">
                  <p className="font-pixel text-xs text-accent-foreground mb-2">{t("suggestions")}</p>
                  <ul className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="font-retro text-sm flex items-start gap-2">
                        <span className="text-accent-foreground">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pokemon Selection Modal */}
      {isSelectingPokemon && (
        <div className="absolute inset-0 bg-card z-20 flex flex-col p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-pixel text-sm">{t("addToTeam")}</h3>
            <button
              onClick={() => setIsSelectingPokemon(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder={t("searchPokemon")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-2 py-1 mb-3 bg-input text-foreground font-retro text-sm retro-border"
          />

          {/* Pokemon List */}
          <div className="flex-1 overflow-y-auto retro-border-inset bg-secondary/20">
            {filteredPokemon.map((p) => (
              <PokemonSelectButton
                key={p.id}
                pokemon={p}
                onSelect={addToTeam}
                isInTeam={team.some(member => member.id === p.id)}
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
        </div>
      )}
    </div>
  )
}

interface TeamSlotProps {
  member?: TeamMember
  onRemove: (id: number) => void
  language: string
  t: (key: string) => string
}

function TeamSlot({ member, onRemove, language, t }: TeamSlotProps) {
  const { data: pokemon } = usePokemon(member?.id || null)
  const { data: species } = usePokemonSpecies(member?.id || null)
  const name = species ? getLocalizedName(species, language as "en" | "fr") : pokemon?.name || ""

  if (!member || !pokemon) {
    return (
      <div className="bg-secondary/30 p-2 retro-border text-center aspect-square flex items-center justify-center">
        <span className="font-pixel text-xs text-muted-foreground">{t("emptySlot")}</span>
      </div>
    )
  }

  return (
    <div className="bg-primary/10 p-2 retro-border text-center relative group">
      <button
        onClick={() => onRemove(member.id)}
        className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
      <div className="w-20 h-20 mx-auto mb-1 flex items-center justify-center">
        <Image
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${member.id}.png`}
          alt={name}
          width={80}
          height={80}
          className="pixelated"
        />
      </div>
      <p className="font-pixel text-xs text-muted-foreground mb-1">#{String(member.id).padStart(3, "0")}</p>
      <p className="font-retro text-xs capitalize truncate">{name}</p>
      <div className="flex gap-1 justify-center mt-1 flex-wrap">
        {member.types.slice(0, 2).map(type => (
          <div key={type} className="transform scale-75 origin-center">
            <TypeBadge type={type} language={language as "en" | "fr"} />
          </div>
        ))}
      </div>
    </div>
  )
}

interface PokemonSelectButtonProps {
  pokemon: PokemonBasicData
  onSelect: (id: number, types: string[]) => void
  isInTeam: boolean
  language: string
}

function PokemonSelectButton({ pokemon, onSelect, isInTeam, language }: PokemonSelectButtonProps) {
  const { data: fullPokemon } = usePokemon(pokemon.id)
  const { data: species } = usePokemonSpecies(pokemon.id)
  const types = fullPokemon?.types.map(t => t.type.name) || []
  const displayName = species ? getLocalizedName(species, language as "en" | "fr") : pokemon.name

  return (
    <button
      onClick={() => onSelect(pokemon.id, types)}
      disabled={isInTeam}
      className={`w-full p-2 flex items-center gap-2 hover:bg-secondary/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
        isInTeam ? "bg-secondary/30" : ""
      }`}
    >
      <Image
        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
        alt={displayName}
        width={32}
        height={32}
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
      {isInTeam && <span className="text-primary">✓</span>}
    </button>
  )
}
