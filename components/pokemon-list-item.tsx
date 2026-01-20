"use client"

import Image from "next/image"
import { TypeBadge } from "./type-badge"

interface PokemonListItemProps {
  id: number
  name: string
  sprite: string | null
  types: string[]
  isSelected: boolean
  onSelect: () => void
}

export function PokemonListItem({
  id,
  name,
  sprite,
  types,
  isSelected,
  onSelect,
}: PokemonListItemProps) {
  const formattedId = String(id).padStart(3, "0")

  return (
    <button
      onClick={onSelect}
      className={`
        w-full flex items-center gap-3 p-2 transition-all btn-press
        ${isSelected 
          ? "bg-primary text-primary-foreground retro-border-red" 
          : "bg-card hover:bg-secondary retro-border-inset"
        }
      `}
      aria-label={`${name}, number ${id}`}
      aria-selected={isSelected}
      role="option"
    >
      {/* Pokemon sprite */}
      <div className="w-12 h-12 flex-shrink-0 bg-secondary/50 flex items-center justify-center">
        {sprite ? (
          <Image
            src={sprite || "/placeholder.svg"}
            alt=""
            width={48}
            height={48}
            className="pixelated"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <div className="w-8 h-8 bg-muted animate-pulse" />
        )}
      </div>

      {/* Pokemon info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className={`font-pixel text-xs ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            #{formattedId}
          </span>
          <span className="font-retro text-lg capitalize truncate">
            {name}
          </span>
        </div>
        <div className="flex gap-1 mt-1">
          {types.map((type) => (
            <TypeBadge key={type} type={type} size="sm" />
          ))}
        </div>
      </div>
    </button>
  )
}

// Skeleton for loading state
export function PokemonListItemSkeleton() {
  return (
    <div className="w-full flex items-center gap-3 p-2 bg-card retro-border-inset animate-pulse">
      <div className="w-12 h-12 flex-shrink-0 bg-secondary" />
      <div className="flex-1">
        <div className="h-4 w-24 bg-secondary mb-2" />
        <div className="flex gap-1">
          <div className="h-5 w-12 bg-secondary" />
          <div className="h-5 w-12 bg-secondary" />
        </div>
      </div>
    </div>
  )
}
