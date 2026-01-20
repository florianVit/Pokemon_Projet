"use client"

import React from "react"

import { useState, useMemo } from "react"
import { useLanguage } from "./language-provider"
import { PokemonListItem, PokemonListItemSkeleton } from "./pokemon-list-item"
import { typeColors, generations, TOTAL_POKEMON, type PokemonBasicData } from "@/lib/pokeapi"

interface PokemonListProps {
  pokemon: PokemonBasicData[]
  isLoading: boolean
  selectedId: number | null
  onSelect: (id: number) => void
}

type SortOption = "number" | "name"

export function PokemonList({ pokemon, isLoading, selectedId, onSelect }: PokemonListProps) {
  const { t, language } = useLanguage()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [generationFilter, setGenerationFilter] = useState<number>(0) // 0 = all
  const [sortBy, setSortBy] = useState<SortOption>("number")

  // Get unique types from pokemon
  const availableTypes = useMemo(() => {
    const types = new Set<string>()
    for (const p of pokemon) {
      for (const t of p.types) {
        types.add(t)
      }
    }
    return Array.from(types).sort()
  }, [pokemon])

  // Filter and sort pokemon
  const filteredPokemon = useMemo(() => {
    let result = [...pokemon]

    // Search filter (search in both EN and FR names)
    if (search) {
      const searchLower = search.toLowerCase()
      const searchNum = parseInt(search)
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.nameFr.toLowerCase().includes(searchLower) ||
          p.id === searchNum ||
          String(p.id).padStart(3, "0").includes(search)
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((p) => p.types.includes(typeFilter))
    }

    // Generation filter
    if (generationFilter !== 0) {
      result = result.filter((p) => p.generation === generationFilter)
    }

    // Sort (use localized name for sorting)
    if (sortBy === "name") {
      result.sort((a, b) => {
        const nameA = language === "fr" ? a.nameFr : a.name
        const nameB = language === "fr" ? b.nameFr : b.name
        return nameA.localeCompare(nameB)
      })
    } else {
      result.sort((a, b) => a.id - b.id)
    }

    return result
  }, [pokemon, search, typeFilter, generationFilter, sortBy, language])

  return (
    <div className="flex flex-col h-full">
      {/* Search and filters */}
      <div className="p-3 space-y-2 bg-secondary/50 border-b-4 border-border">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          className="w-full px-3 py-2 bg-input border-2 border-border font-retro text-lg placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          aria-label={t("search")}
        />

        {/* Filters row 1 - Generation */}
        <select
          value={generationFilter}
          onChange={(e) => setGenerationFilter(Number(e.target.value))}
          className="w-full px-2 py-1.5 bg-input border-2 border-border font-retro text-base focus:outline-none focus:border-primary"
          aria-label={t("generation")}
        >
          <option value={0}>{t("allGenerations")}</option>
          {generations.map((gen) => (
            <option key={gen.id} value={gen.id}>
              {language === "fr" ? gen.nameFr : gen.nameEn}
            </option>
          ))}
        </select>

        {/* Filters row 2 - Type and Sort */}
        <div className="flex gap-2">
          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-input border-2 border-border font-retro text-base focus:outline-none focus:border-primary capitalize"
            aria-label={t("filter")}
          >
            <option value="all">{t("allTypes")}</option>
            {availableTypes.map((type) => (
              <option key={type} value={type} style={{ color: typeColors[type] }}>
                {type}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="flex-1 px-2 py-1.5 bg-input border-2 border-border font-retro text-base focus:outline-none focus:border-primary"
            aria-label={t("sort")}
          >
            <option value="number">{t("byNumber")}</option>
            <option value="name">{t("byName")}</option>
          </select>
        </div>
      </div>

      {/* Pokemon list */}
      <div
        className="flex-1 overflow-y-auto p-2 space-y-1"
        role="listbox"
        aria-label="Pokemon list"
      >
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 10 }).map((_, i) => (
            <PokemonListItemSkeleton key={i} />
          ))
        ) : filteredPokemon.length === 0 ? (
          // No results
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="font-pixel text-sm">{t("noResults")}</p>
          </div>
        ) : (
          // Pokemon items
          filteredPokemon.map((p) => (
            <PokemonListItem
              key={p.id}
              id={p.id}
              name={language === "fr" ? p.nameFr : p.name}
              sprite={p.sprite}
              types={p.types}
              isSelected={p.id === selectedId}
              onSelect={() => onSelect(p.id)}
            />
          ))
        )}
      </div>

      {/* Count */}
      <div className="px-3 py-2 bg-secondary/50 border-t-4 border-border">
        <p className="font-pixel text-xs text-muted-foreground text-center">
          {filteredPokemon.length} / {pokemon.length}
          {pokemon.length < TOTAL_POKEMON && (
            <span className="ml-2 text-primary animate-pulse">
              ({t("loadingMore")} {Math.round((pokemon.length / TOTAL_POKEMON) * 100)}%)
            </span>
          )}
        </p>
      </div>
    </div>
  )
}