"use client"

import { useState } from "react"
import { useAbilityDetails } from "@/hooks/use-pokemon"
import { useLanguage } from "@/components/shared"
import { getAbilityName } from "@/lib/data"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel } from "@/components/ui/alert-dialog"

interface AbilityPopupProps {
  abilityUrl: string
  abilityName: string
  isHidden: boolean
}

export function AbilityPopup({ abilityUrl, abilityName, isHidden }: AbilityPopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: abilityDetails, isLoading } = useAbilityDetails(isOpen ? abilityUrl : null)
  const { t, language } = useLanguage()

  const description = abilityDetails?.effect_entries
    ?.find((entry) => entry.language.name === language)
    ?.effect || 
    abilityDetails?.effect_entries?.[0]?.effect ||
    "No description available"

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`px-3 py-1 font-retro text-base capitalize transition-opacity hover:opacity-80 cursor-pointer ${
          isHidden
            ? "bg-accent/50 text-accent-foreground"
            : "bg-secondary"
        }`}
      >
          {getAbilityName(abilityName, language)}
        {isHidden && (
          <span className="ml-1 font-pixel text-xs">(H)</span>
        )}
      </button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-retro text-lg capitalize">
              {getAbilityName(abilityName, language)}
              {isHidden && (
                <span className="ml-2 font-pixel text-xs">(Hidden)</span>
              )}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription className="font-retro text-base leading-relaxed">
            {isLoading ? (
              <span>{t("loading")}</span>
            ) : (
              description
            )}
          </AlertDialogDescription>
          <div className="flex justify-end gap-2 pt-4">
            <AlertDialogCancel className="font-pixel">
              {t("back")}
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
