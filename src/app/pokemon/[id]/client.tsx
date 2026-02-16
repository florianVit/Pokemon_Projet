"use client"

import { useEffect, useState } from "react"
import { useLanguage, NetworkStatus } from "@/components/shared"
import { PokemonDetails } from "@/features/pokemon"

interface PokemonDetailPageClientProps {
  pokemonId: number
}

export function PokemonDetailPageClient({ pokemonId }: PokemonDetailPageClientProps) {
  const { language, setLanguage, t } = useLanguage()
  const [showCrt, setShowCrt] = useState(false)
  const [showPixelGrid, setShowPixelGrid] = useState(false)

  // Load preferences from localStorage
  useEffect(() => {
    const crt = localStorage.getItem("pokedex-crt")
    const grid = localStorage.getItem("pokedex-grid")
    if (crt === "true") setShowCrt(true)
    if (grid === "true") setShowPixelGrid(true)
  }, [])

  const toggleCrt = () => {
    const newValue = !showCrt
    setShowCrt(newValue)
    localStorage.setItem("pokedex-crt", String(newValue))
  }

  const togglePixelGrid = () => {
    const newValue = !showPixelGrid
    setShowPixelGrid(newValue)
    localStorage.setItem("pokedex-grid", String(newValue))
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* CRT overlay */}
      {showCrt && <div className="crt-overlay" aria-hidden="true" />}
      {showPixelGrid && <div className="pixel-grid" aria-hidden="true" />}

      {/* Header */}
      <header className="bg-primary p-3 md:p-4 retro-border-red">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Logo and title */}
          <div className="flex items-center gap-3">
            {/* LED lights */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 md:w-5 md:h-5 bg-blue-400 rounded-full border-2 border-blue-600 shadow-lg animate-pulse" />
              <div className="w-2 h-2 md:w-3 md:h-3 bg-red-400 rounded-full border border-red-600" />
              <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-400 rounded-full border border-yellow-600" />
            </div>
            <h1 className="font-pixel text-primary-foreground text-xs md:text-sm lg:text-base">
              POKÉDEX KANTO
            </h1>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <NetworkStatus />

            {/* Language toggle */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLanguage("en")}
                className={`px-2 py-1 font-pixel text-xs btn-press ${
                  language === "en"
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
                aria-pressed={language === "en"}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("fr")}
                className={`px-2 py-1 font-pixel text-xs btn-press ${
                  language === "fr"
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
                aria-pressed={language === "fr"}
              >
                FR
              </button>
            </div>

            {/* Effect toggles */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleCrt}
                className={`px-2 py-1 font-pixel text-xs btn-press ${
                  showCrt
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
                aria-pressed={showCrt}
                title={t("crtMode")}
              >
                CRT
              </button>
              <button
                onClick={togglePixelGrid}
                className={`px-2 py-1 font-pixel text-xs btn-press ${
                  showPixelGrid
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
                aria-pressed={showPixelGrid}
                title={t("pixelGrid")}
              >
                GRID
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full">
        <div className="h-[calc(100vh-80px)] bg-card">
          <PokemonDetails pokemonId={pokemonId} showBackButton />
        </div>
      </main>
    </div>
  )
}
