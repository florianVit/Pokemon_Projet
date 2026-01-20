"use client"

import { statNames, type PokemonStat } from "@/lib/pokeapi"
import { useLanguage } from "./language-provider"

interface StatBarsProps {
  stats: PokemonStat[]
}

const MAX_STAT = 255 // Max possible base stat value

export function StatBars({ stats }: StatBarsProps) {
  const { language } = useLanguage()
  
  const total = stats.reduce((sum, s) => sum + s.base_stat, 0)

  return (
    <div className="space-y-3">
      {stats.map((stat) => {
        const statName = statNames[stat.stat.name]?.[language] || stat.stat.name
        const percentage = (stat.base_stat / MAX_STAT) * 100
        const barColor = getStatColor(stat.base_stat)

        return (
          <div key={stat.stat.name} className="flex items-center gap-3">
            {/* Stat name */}
            <span className="w-20 font-pixel text-xs text-muted-foreground uppercase">
              {statName}
            </span>

            {/* Stat value */}
            <span className="w-10 font-retro text-lg text-right">
              {stat.base_stat}
            </span>

            {/* Bar */}
            <div className="flex-1 h-4 bg-secondary retro-border-inset">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: barColor,
                  boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.2)"
                }}
                role="progressbar"
                aria-valuenow={stat.base_stat}
                aria-valuemin={0}
                aria-valuemax={MAX_STAT}
                aria-label={`${statName}: ${stat.base_stat}`}
              />
            </div>
          </div>
        )
      })}

      {/* Total */}
      <div className="flex items-center gap-3 pt-2 border-t-2 border-border">
        <span className="w-20 font-pixel text-xs text-muted-foreground uppercase">
          TOTAL
        </span>
        <span className="w-10 font-retro text-lg text-right font-bold">
          {total}
        </span>
        <div className="flex-1" />
      </div>
    </div>
  )
}

function getStatColor(value: number): string {
  if (value < 50) return "#ef4444" // red
  if (value < 80) return "#f97316" // orange
  if (value < 100) return "#eab308" // yellow
  if (value < 120) return "#84cc16" // lime
  return "#22c55e" // green
}
