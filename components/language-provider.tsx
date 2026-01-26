"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type Language = "en" | "fr"

interface Translations {
  [key: string]: {
    en: string
    fr: string
  }
}

const translations: Translations = {
  search: { en: "Search by name or number...", fr: "Rechercher par nom ou numéro..." },
  filter: { en: "Filter", fr: "Filtrer" },
  sort: { en: "Sort", fr: "Trier" },
  allTypes: { en: "All Types", fr: "Tous les types" },
  byNumber: { en: "By Number", fr: "Par numéro" },
  byName: { en: "By Name", fr: "Par nom" },
  height: { en: "Height", fr: "Taille" },
  weight: { en: "Weight", fr: "Poids" },
  abilities: { en: "Abilities", fr: "Talents" },
  stats: { en: "Stats", fr: "Stats" },
  moves: { en: "Moves", fr: "Attaques" },
  evolution: { en: "Evolution", fr: "Évolution" },
  info: { en: "Info", fr: "Info" },
  loadMore: { en: "Load More", fr: "Charger plus" },
  loading: { en: "Loading...", fr: "Chargement..." },
  error: { en: "Error loading data", fr: "Erreur de chargement" },
  retry: { en: "Retry", fr: "Réessayer" },
  selectPokemon: { en: "Select a Pokémon", fr: "Sélectionnez un Pokémon" },
  selectPrompt: { en: "Choose a Pokémon from the list to view details", fr: "Choisissez un Pokémon dans la liste pour voir les détails" },
  noResults: { en: "No Pokémon found", fr: "Aucun Pokémon trouvé" },
  cached: { en: "Cached", fr: "En cache" },
  fetching: { en: "Fetching", fr: "Récupération" },
  generation: { en: "Generation", fr: "Génération" },
  allGenerations: { en: "All Generations", fr: "Toutes les générations" },
  kanto: { en: "Kanto (Gen I)", fr: "Kanto (Gen I)" },
  back: { en: "Back", fr: "Retour" },
  shiny: { en: "Shiny", fr: "Shiny" },
  normal: { en: "Normal", fr: "Normal" },
  front: { en: "Front", fr: "Face" },
  backSprite: { en: "Back", fr: "Dos" },
  evolvesTo: { en: "Evolves to", fr: "Évolue en" },
  evolvesFrom: { en: "Evolves from", fr: "Évolue de" },
  noEvolution: { en: "Does not evolve", fr: "N'évolue pas" },
  base: { en: "Base", fr: "Base" },
  power: { en: "Power", fr: "Puissance" },
  accuracy: { en: "Accuracy", fr: "Précision" },
  pp: { en: "PP", fr: "PP" },
  hp: { en: "HP", fr: "PV" },
  attack: { en: "Attack", fr: "Attaque" },
  defense: { en: "Defense", fr: "Défense" },
  spAttack: { en: "Sp. Atk", fr: "Atq. Spé" },
  spDefense: { en: "Sp. Def", fr: "Déf. Spé" },
  speed: { en: "Speed", fr: "Vitesse" },
  total: { en: "Total", fr: "Total" },
  crtMode: { en: "CRT Mode", fr: "Mode CRT" },
  pixelGrid: { en: "Pixel Grid", fr: "Grille pixel" },
  cry: { en: "Cry", fr: "Cri" },
  loadingMore: { en: "Loading more...", fr: "Chargement..." },
  openPokedex: { en: "Open Pokédex", fr: "Ouvrir le Pokédex" },
  closePokedex: { en: "Close Pokédex", fr: "Fermer le Pokédex" },
  tapToOpen: { en: "Tap to open", fr: "Appuyez pour ouvrir" },
  description: { en: "Description", fr: "Description" },
  comparison: { en: "Comparison", fr: "Comparaison" },
  compare: { en: "Compare", fr: "Comparer" },
  selectPokemonFirst: { en: "Select a Pokémon first", fr: "Sélectionnez d'abord un Pokémon" },
  selectSecondPokemon: { en: "Select a second Pokémon", fr: "Sélectionnez un second Pokémon" },
  statsComparison: { en: "Stats Comparison", fr: "Comparaison des stats" },
  startComparison: { en: "Start Comparison", fr: "Lancer la comparaison" },
  searchPokemon: { en: "Search Pokémon...", fr: "Rechercher un Pokémon..." },
  teamBuilder: { en: "Team Builder", fr: "Créateur d'équipe" },
  boosterLab: { en: "Booster Lab", fr: "Ouverture de boosters" },
  boosters: { en: "Boosters", fr: "Boosters" },
  boosterRandom: { en: "Pure Random", fr: "Aléatoire pur" },
  boosterRarity: { en: "Rarity Weighted", fr: "Pondéré par rareté" },
  boosterBalanced: { en: "Balanced Pack", fr: "Pack équilibré" },
  boosterDescription: { en: "Open booster packs with different rules", fr: "Ouvre des boosters avec des règles différentes" },
  boosterShinyOdds: { en: "Shiny odds: 1/4096", fr: "Chance de shiny : 1/4096" },
  boosterOpen: { en: "Open booster", fr: "Ouvrir un booster" },
  boosterOpening: { en: "Opening...", fr: "Ouverture..." },
  boosterEmpty: { en: "Open a pack to see results", fr: "Ouvre un booster pour voir les résultats" },
  boosterBalancedDetail: { en: "3 commons, 1 rare, 1 high-roll slot", fr: "3 communs, 1 rare, 1 slot jackpot" },
  boosterRarityDetail: { en: "Base forms are common, evolved and legendary are rarer", fr: "Les formes de base sont communes, les évolutions et légendaires sont plus rares" },
  boosterRandomDetail: { en: "Uniform draw across the Pokédex", fr: "Tirage uniforme sur tout le Pokédex" },
  boosterCardCommon: { en: "Common", fr: "Commun" },
  boosterCardRare: { en: "Rare", fr: "Rare" },
  boosterCardLegendary: { en: "Legendary", fr: "Légendaire" },
  boosterShinyTag: { en: "Shiny", fr: "Shiny" },
  myTeam: { en: "My Team", fr: "Mon équipe" },
  addToTeam: { en: "Add to Team", fr: "Ajouter à l'équipe" },
  removeFromTeam: { en: "Remove", fr: "Retirer" },
  teamFull: { en: "Team is full (6/6)", fr: "Équipe complète (6/6)" },
  emptySlot: { en: "Empty slot", fr: "Emplacement vide" },
  typeAnalysis: { en: "Type Analysis", fr: "Analyse des types" },
  weaknesses: { en: "Weaknesses", fr: "Faiblesses" },
  resistances: { en: "Resistances", fr: "Résistances" },
  offensiveCoverage: { en: "Offensive Coverage", fr: "Couverture offensive" },
  suggestions: { en: "Suggestions", fr: "Suggestions" },
  missingType: { en: "Missing", fr: "Manquant" },
  veryWeak: { en: "Very Weak", fr: "Très faible" },
  weak: { en: "Weak", fr: "Faible" },
  resistant: { en: "Resistant", fr: "Résistant" },
  goodCoverage: { en: "Good Coverage", fr: "Bonne couverture" },
  poorCoverage: { en: "Poor Coverage", fr: "Mauvaise couverture" },
  typeAdvantage: { en: "Type Advantage", fr: "Avantage de type" },
  hasTypeAdvantage: { en: "has the type advantage", fr: "a l'avantage de type" },
  typeMatchupNeutral: { en: "Neutral type matchup", fr: "Matchup neutre" },
  offensive: { en: "Offensive", fr: "Offensif" },
  defensive: { en: "Defensive", fr: "Défensif" },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  const t = useCallback((key: string): string => {
    const translation = translations[key]
    if (!translation) return key
    return translation[language]
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

export function getTypeLabel(typeName: string, language: "en" | "fr"): string {
  const typeTranslations: Record<string, Record<string, string>> = {
    normal: { en: "Normal", fr: "Normal" },
    fire: { en: "Fire", fr: "Feu" },
    water: { en: "Water", fr: "Eau" },
    electric: { en: "Electric", fr: "Électrique" },
    grass: { en: "Grass", fr: "Plante" },
    ice: { en: "Ice", fr: "Glace" },
    fighting: { en: "Fighting", fr: "Combat" },
    poison: { en: "Poison", fr: "Poison" },
    ground: { en: "Ground", fr: "Sol" },
    flying: { en: "Flying", fr: "Vol" },
    psychic: { en: "Psychic", fr: "Psy" },
    bug: { en: "Bug", fr: "Insecte" },
    rock: { en: "Rock", fr: "Roche" },
    ghost: { en: "Ghost", fr: "Spectre" },
    dragon: { en: "Dragon", fr: "Dragon" },
    dark: { en: "Dark", fr: "Ténèbres" },
    steel: { en: "Steel", fr: "Acier" },
    fairy: { en: "Fairy", fr: "Fée" },
  }
  
  return typeTranslations[typeName]?.[language] || typeName
}
