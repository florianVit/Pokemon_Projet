"use client"

import { typeColors } from "@/lib/pokeapi"
import { getTypeLabel } from "./language-provider"

interface TypeBadgeProps {
  type: string
  size?: "sm" | "md" | "lg"
  language?: "en" | "fr"
}

export function TypeBadge({ type, size = "md", language = "en" }: TypeBadgeProps) {
  const color = typeColors[type] || "#888888"
  const displayName = getTypeLabel(type, language)
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base"
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-pixel uppercase tracking-wider ${sizeClasses[size]}`}
      style={{
        backgroundColor: color,
        color: getContrastColor(color),
        boxShadow: `
          inset -2px -2px 0 0 rgba(0,0,0,0.3),
          inset 2px 2px 0 0 rgba(255,255,255,0.2)
        `,
        textShadow: "1px 1px 0 rgba(0,0,0,0.3)"
      }}
      aria-label={`Type: ${type}`}
    >
      {displayName}
    </span>
  )
}

function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.5 ? "#1a1a1a" : "#ffffff"
}
