import { usePokemonSpecies } from "@/hooks/use-pokemon"
import { getLocalizedName, type PokemonBasicData } from "./pokeapi"

/**
 * Hook pour obtenir le nom traduit d'un Pokémon
 */
export function useLocalizedPokemonName(pokemonId: number | null, language: string) {
  const { data: species } = usePokemonSpecies(pokemonId)
  if (!pokemonId || !species) return null
  return getLocalizedName(species, language)
}

/**
 * Fonction utilitaire pour filtrer les Pokémon avec recherche multilingue
 * Retourne une fonction qui peut être utilisée dans un filter
 */
export function createPokemonSearchFilter(
  searchQuery: string,
  language: string,
  pokemonNameMap?: Map<number, string>
) {
  const query = searchQuery.toLowerCase()
  
  return (pokemon: PokemonBasicData) => {
    // Chercher par ID
    if (String(pokemon.id).includes(query)) return true
    
    // Chercher par nom anglais
    if (pokemon.name.toLowerCase().includes(query)) return true
    
    // Chercher par nom traduit si disponible
    if (pokemonNameMap?.has(pokemon.id)) {
      const localizedName = pokemonNameMap.get(pokemon.id)
      if (localizedName?.toLowerCase().includes(query)) return true
    }
    
    return false
  }
}
