"use client"

import { useState, useEffect, type ReactNode } from "react"
import { useLanguage } from "./language-provider"
import { NetworkStatus } from "./network-status"

interface PokedexShellProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  selectedPokemonId?: number | null
  onCompare?: () => void
  compareMode?: boolean
  onTeamBuilder?: () => void
  teamBuilderMode?: boolean
}

export function PokedexShell({ leftPanel, rightPanel, selectedPokemonId, onCompare, compareMode, onTeamBuilder, teamBuilderMode }: PokedexShellProps) {
  const { language, setLanguage, t } = useLanguage()
  const [showCrt, setShowCrt] = useState(false)
  const [showPixelGrid, setShowPixelGrid] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Load preferences from localStorage
  useEffect(() => {
    const crt = localStorage.getItem("pokedex-crt")
    const grid = localStorage.getItem("pokedex-grid")
    if (crt === "true") setShowCrt(true)
    if (grid === "true") setShowPixelGrid(true)
    // Keep isOpen as false (closed by default)
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

  const toggleOpen = () => {
    const newValue = !isOpen
    setIsOpen(newValue)
    localStorage.setItem("pokedex-open", String(newValue))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-2 md:p-4 pokedex-container">
      {/* CRT overlay */}
      {showCrt && <div className="crt-overlay" aria-hidden="true" />}
      {showPixelGrid && <div className="pixel-grid" aria-hidden="true" />}

      {/* Closed Pokedex Cover */}
      {!isOpen && (
        <div 
          className="w-full max-w-md mx-auto cursor-pointer"
          style={{ height: 'min(70vh, 500px)' }}
          onClick={toggleOpen}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && toggleOpen()}
          aria-label={t("openPokedex")}
        >
          <div className="relative w-full h-full bg-gradient-to-br from-primary via-red-700 to-red-900 retro-border-red flex flex-col items-center justify-center gap-6 transition-transform hover:scale-[1.02] active:scale-[0.98]">
            {/* Decorative border */}
            <div className="absolute inset-3 border-4 border-red-400/20 pointer-events-none" />
            
            {/* Top light */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="w-4 h-4 md:w-6 md:h-6 bg-blue-400 rounded-full border-2 border-blue-600 shadow-lg shadow-blue-400/50 animate-pulse" />
              <div className="w-2 h-2 md:w-3 md:h-3 bg-red-400 rounded-full border border-red-600" />
              <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-400 rounded-full border border-yellow-600" />
            </div>
            
            {/* Pokeball decoration */}
            <div className="pokeball-deco w-24 h-24 md:w-32 md:h-32" />
            
            {/* Title */}
            <h1 className="font-pixel text-white text-sm md:text-lg tracking-wider">
              POKEDEX
            </h1>
            
            {/* Open button */}
            <button
              className="mt-4 px-6 py-3 bg-secondary text-secondary-foreground font-pixel text-xs md:text-sm btn-press retro-border animate-pulse hover:animate-none"
              aria-label={t("openPokedex")}
            >
              {t("tapToOpen")}
            </button>
            
            {/* Bottom screws */}
            <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border border-gray-700" />
            <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border border-gray-700" />
          </div>
        </div>
      )}

      {/* Pokedex Device - Open State */}
      {isOpen && (
        <div 
          className="pokedex-device pokedex-open-anim w-full max-w-6xl"
          style={{ height: 'min(85vh, 700px)' }}
        >
          <div className="relative w-full h-full flex">
            {/* Left Panel with flip animation */}
            <div 
              className="pokedex-left-half pokedex-panel-left-anim relative w-1/2 h-full"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front side - Pokemon list */}
              <div 
                className="absolute inset-0 bg-primary retro-border-red flex flex-col overflow-hidden"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* Header */}
                <header className="bg-primary p-2 md:p-3 border-b-4 border-border flex-shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    {/* LED lights */}
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-400 rounded-full border-2 border-blue-600 shadow-lg animate-pulse" />
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-400 rounded-full border border-red-600" />
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-400 rounded-full border border-yellow-600" />
                    </div>
                    
                    {/* Close button */}
                    <button
                      onClick={toggleOpen}
                      className="px-2 py-1 font-pixel text-xs bg-secondary text-secondary-foreground btn-press"
                      aria-label={t("closePokedex")}
                    >
                      X
                    </button>
                  </div>
                </header>

                {/* Pokemon List */}
                <div className="flex-1 overflow-hidden bg-card">
                  {leftPanel}
                </div>
              </div>

              {/* Back side - Cover */}
              <div 
                className="pokedex-cover absolute inset-0"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                onClick={toggleOpen}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleOpen()}
                aria-label={t("openPokedex")}
              >
                <div className="pokeball-deco" />
                <p className="font-pixel text-white text-xs md:text-sm mt-4 animate-pulse">
                  {t("tapToOpen")}
                </p>
              </div>
            </div>

            {/* Right Panel */}
            <div className="pokedex-right-half pokedex-panel-right-anim w-1/2 h-full bg-primary retro-border-red flex flex-col overflow-hidden">
              {/* Header */}
              <header className="bg-primary p-2 md:p-3 border-b-4 border-border flex-shrink-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h1 className="font-pixel text-primary-foreground text-xs md:text-sm">
                    POKEDEX
                  </h1>

                  {/* Controls */}
                  <div className="flex items-center gap-1 md:gap-2">
                    <NetworkStatus />

                    {/* Language toggle */}
                    <button
                      onClick={() => setLanguage("en")}
                      className={`px-1.5 py-0.5 md:px-2 md:py-1 font-pixel text-xs btn-press ${
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
                      className={`px-1.5 py-0.5 md:px-2 md:py-1 font-pixel text-xs btn-press ${
                        language === "fr"
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                      aria-pressed={language === "fr"}
                    >
                      FR
                    </button>

                    {/* Compare button */}
                    {onCompare && (
                      <button
                        onClick={onCompare}
                        disabled={!selectedPokemonId}
                        className={`px-1.5 py-0.5 md:px-2 md:py-1 font-pixel text-xs btn-press ${
                          compareMode
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary text-secondary-foreground"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={t("compare") || "Compare"}
                      >
                        VS
                      </button>
                    )}

                    {/* Team Builder button */}
                    {onTeamBuilder && (
                      <button
                        onClick={onTeamBuilder}
                        className={`px-1.5 py-0.5 md:px-2 md:py-1 font-pixel text-xs btn-press ${
                          teamBuilderMode
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                        title={t("teamBuilder") || "Team Builder"}
                      >
                        TEAM
                      </button>
                    )}
                  </div>
                </div>
              </header>

              {/* Pokemon Details */}
              <div className="flex-1 overflow-hidden bg-card">
                {rightPanel}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
