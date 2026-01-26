"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PokedexShell } from "@/components/pokedex-shell"
import { PokemonList } from "@/components/pokemon-list"
import { PokemonDetails } from "@/components/pokemon-details"
import { PokemonComparison } from "@/components/pokemon-comparison"
import { TeamBuilder } from "@/components/team-builder"
import { BoosterLab } from "@/components/booster-lab"
import { getAllPokemonFast, loadRemainingPokemon, TOTAL_POKEMON, type PokemonBasicData } from "@/lib/pokeapi"
import Loading from "./loading"

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pokemon, setPokemon] = useState<PokemonBasicData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [teamBuilderMode, setTeamBuilderMode] = useState(false)
  const [boosterMode, setBoosterMode] = useState(false)

  // Initialize selected ID from URL params
  useEffect(() => {
    const idParam = searchParams.get("id")
    if (idParam) {
      const id = parseInt(idParam)
      if (id >= 1 && id <= TOTAL_POKEMON) {
        setSelectedId(id)
      }
    }
  }, [searchParams])

  // Fetch Pokemon - fast initial load, then progressive background loading
  useEffect(() => {
    async function fetchPokemon() {
      try {
        setIsLoading(true)
        
        // Fast load first 151 Pokemon with pre-computed data
        const kantoData = await getAllPokemonFast()
        setPokemon(kantoData)
        setIsLoading(false)
        
        // Load remaining Pokemon in background
        loadRemainingPokemon((newPokemon, progress) => {
          setPokemon(prev => [...prev.slice(0, 151), ...newPokemon])
          setLoadingProgress(progress)
        })
      } catch (error) {
        console.error("[v0] Failed to fetch Pokemon:", error)
        setIsLoading(false)
      }
    }

    fetchPokemon()
  }, [])

  // Update URL when selection changes
  const handleSelect = (id: number) => {
    setSelectedId(id)
    // Update URL without full page reload
    const params = new URLSearchParams(searchParams.toString())
    params.set("id", String(id))
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const openComparison = () => {
    setCompareMode(true)
    setTeamBuilderMode(false)
    setBoosterMode(false)
  }

  const openTeamBuilder = () => {
    setTeamBuilderMode(true)
    setCompareMode(false)
    setBoosterMode(false)
  }

  const openBoosterLab = () => {
    setBoosterMode(true)
    setCompareMode(false)
    setTeamBuilderMode(false)
  }

  return (
    <Suspense fallback={<Loading />}>
      <PokedexShell
        leftPanel={
          <PokemonList
            pokemon={pokemon}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        }
        rightPanel={
          teamBuilderMode ? (
            <TeamBuilder
              onClose={() => setTeamBuilderMode(false)}
              pokemonList={pokemon}
            />
          ) : boosterMode ? (
            <BoosterLab
              onClose={() => setBoosterMode(false)}
              pokemonList={pokemon}
            />
          ) : compareMode ? (
            <PokemonComparison
              pokemon1Id={selectedId}
              pokemon2Id={null}
              onClose={() => setCompareMode(false)}
              onSelectPokemon={handleSelect}
              pokemonList={pokemon}
            />
          ) : (
            <PokemonDetails pokemonId={selectedId} onSelectPokemon={handleSelect} />
          )
        }
        selectedPokemonId={selectedId}
        onCompare={openComparison}
        compareMode={compareMode}
        onTeamBuilder={openTeamBuilder}
        teamBuilderMode={teamBuilderMode}
        onBooster={openBoosterLab}
        boosterMode={boosterMode}
      />
    </Suspense>
  )
}
