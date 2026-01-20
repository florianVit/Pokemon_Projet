import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { PokemonDetailPageClient } from "./client"
import { getPokemon, TOTAL_POKEMON } from "@/lib/pokeapi"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const pokemonId = parseInt(id)

  if (Number.isNaN(pokemonId) || pokemonId < 1 || pokemonId > TOTAL_POKEMON) {
    return {
      title: "Not Found - Pokédex",
    }
  }

  try {
    const pokemon = await getPokemon(pokemonId)
    const capitalizedName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)

    return {
      title: `${capitalizedName} #${String(pokemonId).padStart(4, "0")} - Pokédex`,
      description: `View details about ${capitalizedName}, including stats, moves, and evolution chain.`,
    }
  } catch {
    return {
      title: "Not Found - Pokédex",
    }
  }
}

export default async function PokemonDetailPage({ params }: PageProps) {
  const { id } = await params
  const pokemonId = parseInt(id)

  if (Number.isNaN(pokemonId) || pokemonId < 1 || pokemonId > TOTAL_POKEMON) {
    notFound()
  }

  return <PokemonDetailPageClient pokemonId={pokemonId} />
}

// Generate static params for all Pokemon
export function generateStaticParams() {
  return Array.from({ length: TOTAL_POKEMON }, (_, i) => ({
    id: String(i + 1),
  }))
}
