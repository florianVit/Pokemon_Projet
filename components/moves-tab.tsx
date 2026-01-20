"use client"

import { useState } from "react"
import { useMoves, type PokemonMove } from "@/hooks/use-pokemon"
import { useLanguage } from "./language-provider"
import { TypeBadge } from "./type-badge"

interface MovesTabProps {
  moves: PokemonMove[]
}

const MOVES_PER_PAGE = 10

export function MovesTab({ moves }: MovesTabProps) {
  const { t } = useLanguage()
  const [limit, setLimit] = useState(MOVES_PER_PAGE)
  
  const moveUrls = moves.map((m) => m.move.url)
  const { data: moveDetails, isLoading, error } = useMoves(moveUrls, limit)

  const hasMore = limit < moves.length

  if (error) {
    return (
      <div className="p-4 text-center text-destructive-foreground">
        <p className="font-pixel text-sm">{t("error")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Moves list */}
      <div className="space-y-1">
        {isLoading && !moveDetails ? (
          // Loading skeletons
          Array.from({ length: MOVES_PER_PAGE }).map((_, i) => (
            <div key={i} className="h-12 bg-secondary animate-pulse" />
          ))
        ) : (
          moveDetails?.map((move) => (
            <div
              key={move.id}
              className="flex items-center gap-2 p-2 bg-secondary/50 retro-border-inset"
            >
              {/* Move name */}
              <span className="flex-1 font-retro text-lg capitalize">
                {move.name.replace("-", " ")}
              </span>

              {/* Type */}
              <TypeBadge type={move.type.name} size="sm" />

              {/* Power */}
              <div className="w-12 text-center">
                <span className="font-pixel text-xs text-muted-foreground block">
                  {t("power")}
                </span>
                <span className="font-retro text-base">
                  {move.power || "-"}
                </span>
              </div>

              {/* Accuracy */}
              <div className="w-12 text-center">
                <span className="font-pixel text-xs text-muted-foreground block">
                  ACC
                </span>
                <span className="font-retro text-base">
                  {move.accuracy || "-"}
                </span>
              </div>

              {/* PP */}
              <div className="w-10 text-center">
                <span className="font-pixel text-xs text-muted-foreground block">
                  PP
                </span>
                <span className="font-retro text-base">{move.pp}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more button */}
      {hasMore && (
        <button
          onClick={() => setLimit((prev) => prev + MOVES_PER_PAGE)}
          disabled={isLoading}
          className="w-full py-2 bg-primary text-primary-foreground font-pixel text-xs btn-press retro-border-red disabled:opacity-50"
        >
          {isLoading ? t("loading") : `${t("loadMore")} (${limit}/${moves.length})`}
        </button>
      )}

      {/* Count */}
      <p className="text-center font-pixel text-xs text-muted-foreground">
        {t("moves")}: {moves.length}
      </p>
    </div>
  )
}
