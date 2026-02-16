"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import useSWR from "swr";
import { generateTeamWithAI, type GeneratedTeam } from "@/lib/ai/team-generator";
import { getPokemon, type PokemonBasicData } from "@/lib/api";
import { TypeBadge } from "@/components/shared";
import { Loader2, AlertCircle } from "lucide-react";

const STYLES_EN = [
  { id: "defensive", label: "Defensive 🛡️", desc: "Strong resistances and support" },
  { id: "offensive", label: "Offensive ⚡", desc: "High damage and type coverage" },
  { id: "balanced", label: "Balanced ⚖️", desc: "Mix of offense and defense" },
  { id: "special", label: "Special 🎯", desc: "Support and status strategies" },
] as const;

const STYLES_FR = [
  { id: "defensive", label: "Défensive 🛡️", desc: "Résistances et support" },
  { id: "offensive", label: "Offensive ⚡", desc: "Attaque puissante et couverture" },
  { id: "balanced", label: "Équilibrée ⚖️", desc: "Mélange attaque/défense" },
  { id: "special", label: "Spéciale 🎯", desc: "Stratégies de support" },
] as const;

const ALL_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

const TYPE_NAMES_FR: Record<string, string> = {
  normal: "Normal",
  fire: "Feu",
  water: "Eau",
  electric: "Électrique",
  grass: "Plante",
  ice: "Glace",
  fighting: "Combat",
  poison: "Poison",
  ground: "Sol",
  flying: "Vol",
  psychic: "Psy",
  bug: "Insecte",
  rock: "Roche",
  ghost: "Spectre",
  dragon: "Dragon",
  dark: "Ténèbres",
  steel: "Acier",
  fairy: "Fée",
};

const TYPE_NAMES_EN: Record<string, string> = {
  normal: "Normal",
  fire: "Fire",
  water: "Water",
  electric: "Electric",
  grass: "Grass",
  ice: "Ice",
  fighting: "Fighting",
  poison: "Poison",
  ground: "Ground",
  flying: "Flying",
  psychic: "Psychic",
  bug: "Bug",
  rock: "Rock",
  ghost: "Ghost",
  dragon: "Dragon",
  dark: "Dark",
  steel: "Steel",
  fairy: "Fairy",
};

interface AITeamGeneratorProps {
  pokemonList: PokemonBasicData[];
  language: "en" | "fr";
  onTeamGenerated: (team: GeneratedTeam) => void;
}

export function AITeamGenerator({
  pokemonList,
  language,
  onTeamGenerated,
}: AITeamGeneratorProps) {
  const [style, setStyle] = useState<"defensive" | "offensive" | "balanced" | "special">(
    "balanced"
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTeam, setGeneratedTeam] = useState<GeneratedTeam | null>(null);

  // Fetch Pokemon types
  const uniqueIds = useMemo(() => pokemonList.map(p => p.id), [pokemonList]);
  
  const { data: pokemonWithTypes } = useSWR(
    `pokemon-with-types-${uniqueIds.join(",")}`,
    async () => {
      const pokemonData = await Promise.all(
        uniqueIds.map(async (id) => {
          const pokemon = await getPokemon(id);
          return {
            id: pokemon.id,
            name: pokemon.name,
            types: pokemon.types.map(t => t.type.name),
          };
        })
      );
      return pokemonData;
    },
    { revalidateOnFocus: false }
  );

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const generateTeam = async () => {
    if (!pokemonWithTypes || pokemonWithTypes.length === 0) {
      setError(language === "fr" ? "Liste de Pokémon vide" : "Empty Pokémon list");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const team = await generateTeamWithAI({
        style,
        favoriteTypes: selectedTypes,
        pokemonList: pokemonWithTypes,
        language,
      });

      setGeneratedTeam(team);
      onTeamGenerated(team);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate team";
      setError(message);
      console.error("Team generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (generatedTeam) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setGeneratedTeam(null)}
          className="text-xs font-pixel text-muted-foreground hover:text-foreground underline"
        >
          ← {language === "fr" ? "Retour" : "Back"}
        </button>

        <div className="bg-secondary/30 p-3 retro-border-inset space-y-2">
          <h3 className="font-pixel text-sm">
            {language === "fr" ? "Stratégie" : "Strategy"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {generatedTeam.strategy}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-500/20 p-2 retro-border-inset">
            <p className="font-pixel text-xs text-green-700 dark:text-green-400 mb-1">
              {language === "fr" ? "Forces" : "Strengths"}
            </p>
            <ul className="text-xs space-y-1">
              {generatedTeam.strengths.map((s, i) => (
                <li key={i} className="text-muted-foreground">
                  • {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-500/20 p-2 retro-border-inset">
            <p className="font-pixel text-xs text-red-700 dark:text-red-400 mb-1">
              {language === "fr" ? "Faiblesses" : "Weaknesses"}
            </p>
            <ul className="text-xs space-y-1">
              {generatedTeam.weaknesses.map((w, i) => (
                <li key={i} className="text-muted-foreground">
                  • {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-secondary/20 p-3 retro-border-inset space-y-3">
          <h3 className="font-pixel text-sm">
            {language === "fr" ? "Équipe suggérée" : "Suggested Team"}
          </h3>
          <div className="space-y-2">
            {generatedTeam.team.map((member) => (
              <div key={member.id} className="border-l-4 border-primary p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-pixel text-sm text-primary">
                      {member.name}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {member.types.map((type) => (
                        <div key={type} className="transform scale-75 origin-left">
                          <TypeBadge type={type} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {member.reasoning}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="font-pixel text-xs">{language === "fr" ? "Style" : "Style"}</p>
        <div className="grid grid-cols-2 gap-2">
          {(language === "fr" ? STYLES_FR : STYLES_EN).map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id as typeof style)}
              className={`p-2 text-xs font-pixel retro-border transition-colors ${
                style === s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <div>{s.label}</div>
              <div className="text-xs opacity-75">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-pixel text-xs">
          {language === "fr" ? "Types favoris (optionnel)" : "Favorite types (optional)"}
        </p>
        <div className="grid grid-cols-3 gap-1">
          {ALL_TYPES.map((type) => {
            const displayName = language === "fr" ? TYPE_NAMES_FR[type] : TYPE_NAMES_EN[type];
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`p-1 text-xs font-pixel retro-border transition-colors ${
                  selectedTypes.includes(type)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {displayName.substring(0, 4).toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border-l-4 border-red-500 p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-pixel text-xs text-red-700 dark:text-red-400">
              {language === "fr" ? "Erreur" : "Error"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      )}

      <button
        onClick={generateTeam}
        disabled={isLoading || !pokemonWithTypes}
        className="w-full py-2 px-3 bg-primary text-primary-foreground font-pixel text-sm btn-press retro-border disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {language === "fr" ? "Générer une équipe" : "Generate Team"}
      </button>
    </div>
  );
}
