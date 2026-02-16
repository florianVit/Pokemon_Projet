"use client"

import useSWR from "swr"
import {
  getPokemon,
  getPokemonSpecies,
  getEvolutionChain,
  getMoveDetails,
  getAbilityDetails,
  type Pokemon,
  type PokemonSpecies,
  type EvolutionChain,
  type MoveDetails,
  type AbilityDetails,
} from "@/lib/api"

// SWR config for pokemon data
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 1 minute
}

export function usePokemon(idOrName: string | number | null) {
  return useSWR<Pokemon>(
    idOrName ? `pokemon-${idOrName}` : null,
    () => getPokemon(idOrName!),
    swrConfig
  )
}

export function usePokemonSpecies(idOrName: string | number | null) {
  return useSWR<PokemonSpecies>(
    idOrName ? `species-${idOrName}` : null,
    () => getPokemonSpecies(idOrName!),
    swrConfig
  )
}

export function useEvolutionChain(url: string | null) {
  return useSWR<EvolutionChain>(
    url ? `evolution-${url}` : null,
    () => getEvolutionChain(url!),
    swrConfig
  )
}

export function useMoveDetails(url: string | null) {
  return useSWR<MoveDetails>(
    url ? `move-${url}` : null,
    () => getMoveDetails(url!),
    swrConfig
  )
}

// Batch fetch moves with limit
export function useMoves(moveUrls: string[], limit: number) {
  const limitedUrls = moveUrls.slice(0, limit)
  
  return useSWR<MoveDetails[]>(
    limitedUrls.length > 0 ? `moves-${limitedUrls.join(",")}` : null,
    async () => {
      const moves = await Promise.all(
        limitedUrls.map(url => getMoveDetails(url))
      )
      return moves
    },
    swrConfig
  )
}

export function useAbilityDetails(url: string | null) {
  return useSWR<AbilityDetails>(
    url ? `ability-${url}` : null,
    () => getAbilityDetails(url!),
    swrConfig
  )
}
