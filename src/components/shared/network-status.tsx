"use client"

import { useState, useEffect } from "react"
import { subscribeFetchStatus, type FetchStatus } from "@/lib/api"
import { useLanguage } from "./language-provider"

export function NetworkStatus() {
  const [status, setStatus] = useState<FetchStatus>("idle")
  const { t } = useLanguage()

  useEffect(() => {
    return subscribeFetchStatus(setStatus)
  }, [])

  if (status === "idle") return null

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1 bg-secondary rounded text-xs font-pixel"
      aria-live="polite"
    >
      <span 
        className={`w-2 h-2 rounded-full ${
          status === "fetching" 
            ? "bg-yellow-400 animate-pulse" 
            : status === "cached" 
            ? "bg-green-400" 
            : "bg-red-400"
        }`}
        aria-hidden="true"
      />
      <span className="uppercase">
        {status === "fetching" ? t("fetching") : status === "cached" ? t("cached") : "Error"}
      </span>
    </div>
  )
}
