"use client"

import { useState, useEffect } from "react"

const BOOT_MESSAGES = [
  "INITIALIZING POKÉDEX...",
  "LOADING DATABASE...",
  "CONNECTING TO OAK LAB...",
  "SYSTEM READY",
]

export function BootAnimation() {
  const [isVisible, setIsVisible] = useState(true)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    // Check if boot animation has been shown this session
    const hasBooted = sessionStorage.getItem("pokedex-booted")
    if (hasBooted) {
      setIsVisible(false)
      return
    }

    // Type out current message
    const message = BOOT_MESSAGES[currentMessage]
    if (displayText.length < message.length) {
      const timeout = setTimeout(() => {
        setDisplayText(message.slice(0, displayText.length + 1))
      }, 30)
      return () => clearTimeout(timeout)
    }

    // Move to next message or finish
    if (currentMessage < BOOT_MESSAGES.length - 1) {
      const timeout = setTimeout(() => {
        setCurrentMessage((prev) => prev + 1)
        setDisplayText("")
      }, 400)
      return () => clearTimeout(timeout)
    }

    // Finish boot sequence
    const timeout = setTimeout(() => {
      setIsFading(true)
      setTimeout(() => {
        sessionStorage.setItem("pokedex-booted", "true")
        setIsVisible(false)
      }, 500)
    }, 800)
    return () => clearTimeout(timeout)
  }, [currentMessage, displayText])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0f380f] ${
        isFading ? "boot-fade-out" : ""
      }`}
      aria-live="polite"
      aria-label="Loading Pokédex"
    >
      {/* Retro screen effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#9bbc0f]/5 to-transparent pointer-events-none" />
      
      {/* Main content */}
      <div className="relative flex flex-col items-center gap-8 p-8">
        {/* Pokédex icon */}
        <div className="relative">
          <div className="w-24 h-24 bg-[#DC2626] rounded-lg retro-border-red flex items-center justify-center">
            <div className="w-12 h-12 bg-[#9bbc0f] rounded-full border-4 border-[#0f380f] flex items-center justify-center">
              <div className="w-6 h-6 bg-[#0f380f] rounded-full" />
            </div>
          </div>
          {/* LED lights */}
          <div className="absolute -top-2 -left-2 flex gap-1">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-red-400 rounded-full" />
            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-pixel text-[#9bbc0f] text-lg md:text-xl text-center tracking-wider">
          POKÉDEX 
        </h1>

        {/* Loading message */}
        <div className="min-h-[60px] flex flex-col items-center gap-2">
          <p className="font-pixel text-[#9bbc0f] text-xs md:text-sm text-center">
            {displayText}
            <span className="cursor-blink">_</span>
          </p>
          
          {/* Progress indicator */}
          <div className="w-48 h-4 bg-[#0f380f] border-2 border-[#9bbc0f] mt-4">
            <div 
              className="h-full bg-[#9bbc0f] transition-all duration-300"
              style={{ 
                width: `${((currentMessage + (displayText.length / BOOT_MESSAGES[currentMessage].length)) / BOOT_MESSAGES.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none bg-repeating-linear-gradient opacity-10" 
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
        }}
      />
    </div>
  )
}
