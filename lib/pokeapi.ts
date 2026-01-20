// PokéAPI Types
export interface PokemonListItem {
  name: string
  url: string
}

export interface PokemonListResponse {
  count: number
  results: PokemonListItem[]
}

export interface PokemonSprites {
  front_default: string | null
  back_default: string | null
  front_shiny: string | null
  back_shiny: string | null
  other?: {
    "official-artwork"?: {
      front_default: string | null
      front_shiny: string | null
    }
  }
}

export interface PokemonType {
  slot: number
  type: {
    name: string
    url: string
  }
}

export interface PokemonAbility {
  ability: {
    name: string
    url: string
  }
  is_hidden: boolean
  slot: number
}

export interface PokemonStat {
  base_stat: number
  effort: number
  stat: {
    name: string
    url: string
  }
}

export interface PokemonMove {
  move: {
    name: string
    url: string
  }
}

export interface Pokemon {
  id: number
  name: string
  height: number
  weight: number
  sprites: PokemonSprites
  types: PokemonType[]
  abilities: PokemonAbility[]
  stats: PokemonStat[]
  moves: PokemonMove[]
}

export interface FlavorTextEntry {
  flavor_text: string
  language: {
    name: string
    url: string
  }
  version: {
    name: string
    url: string
  }
}

export interface EvolutionChainLink {
  species: {
    name: string
    url: string
  }
  evolves_to: EvolutionChainLink[]
  evolution_details: {
    min_level: number | null
    trigger: {
      name: string
    }
    item: { name: string } | null
  }[]
}

export interface EvolutionChain {
  id: number
  chain: EvolutionChainLink
}

export interface PokemonName {
  name: string
  language: {
    name: string
    url: string
  }
}

export interface PokemonSpecies {
  id: number
  name: string
  names: PokemonName[]
  flavor_text_entries: FlavorTextEntry[]
  evolution_chain: {
    url: string
  }
  evolves_from_species: {
    name: string
    url: string
  } | null
}

export interface MoveDetails {
  id: number
  name: string
  accuracy: number | null
  power: number | null
  pp: number
  type: {
    name: string
  }
  damage_class: {
    name: string
  }
}

// Generation data
export const generations = [
  { id: 1, name: "Kanto", nameEn: "Gen I - Kanto", nameFr: "Gen I - Kanto", range: [1, 151] },
  { id: 2, name: "Johto", nameEn: "Gen II - Johto", nameFr: "Gen II - Johto", range: [152, 251] },
  { id: 3, name: "Hoenn", nameEn: "Gen III - Hoenn", nameFr: "Gen III - Hoenn", range: [252, 386] },
  { id: 4, name: "Sinnoh", nameEn: "Gen IV - Sinnoh", nameFr: "Gen IV - Sinnoh", range: [387, 493] },
  { id: 5, name: "Unova", nameEn: "Gen V - Unova", nameFr: "Gen V - Unova", range: [494, 649] },
  { id: 6, name: "Kalos", nameEn: "Gen VI - Kalos", nameFr: "Gen VI - Kalos", range: [650, 721] },
  { id: 7, name: "Alola", nameEn: "Gen VII - Alola", nameFr: "Gen VII - Alola", range: [722, 809] },
  { id: 8, name: "Galar", nameEn: "Gen VIII - Galar", nameFr: "Gen VIII - Galar", range: [810, 905] },
  { id: 9, name: "Paldea", nameEn: "Gen IX - Paldea", nameFr: "Gen IX - Paldea", range: [906, 1025] },
] as const

export type Generation = typeof generations[number]

export function getGenerationForPokemon(id: number): number {
  for (const gen of generations) {
    if (id >= gen.range[0] && id <= gen.range[1]) {
      return gen.id
    }
  }
  return 1
}

export const TOTAL_POKEMON = 1025

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 1000 * 60 * 30 // 30 minutes

export type FetchStatus = "idle" | "fetching" | "cached" | "error"

let fetchStatus: FetchStatus = "idle"
const statusListeners = new Set<(status: FetchStatus) => void>()

export function subscribeFetchStatus(listener: (status: FetchStatus) => void) {
  statusListeners.add(listener)
  return () => statusListeners.delete(listener)
}

function setFetchStatus(status: FetchStatus) {
  fetchStatus = status
  for (const listener of statusListeners) {
    listener(status)
  }
}

export function getFetchStatus() {
  return fetchStatus
}

async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = cache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    setFetchStatus("cached")
    return cached.data as T
  }

  setFetchStatus("fetching")
  const response = await fetch(url, {
    next: { revalidate: 3600 } // Cache on server for 1 hour
  })

  if (!response.ok) {
    setFetchStatus("error")
    throw new Error(`Failed to fetch: ${url}`)
  }

  const data = await response.json()
  cache.set(url, { data, timestamp: Date.now() })
  setFetchStatus("cached")
  return data as T
}

// API Functions
const BASE_URL = "https://pokeapi.co/api/v2"

export async function getPokemonList(limit = 151, offset = 0): Promise<PokemonListResponse> {
  return fetchWithCache<PokemonListResponse>(
    `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`
  )
}

export async function getPokemon(idOrName: string | number): Promise<Pokemon> {
  return fetchWithCache<Pokemon>(`${BASE_URL}/pokemon/${idOrName}`)
}

export async function getPokemonSpecies(idOrName: string | number): Promise<PokemonSpecies> {
  return fetchWithCache<PokemonSpecies>(`${BASE_URL}/pokemon-species/${idOrName}`)
}

export async function getEvolutionChain(url: string): Promise<EvolutionChain> {
  return fetchWithCache<EvolutionChain>(url)
}

export async function getMoveDetails(url: string): Promise<MoveDetails> {
  return fetchWithCache<MoveDetails>(url)
}

// Fast initial data - uses predictable sprite URLs and minimal API calls
export interface PokemonBasicData {
  id: number
  name: string
  nameFr: string
  sprite: string
  types: string[]
  generation: number
}

// Pre-computed type data for first 151 pokemon to speed up initial load
const kantoTypes: Record<number, string[]> = {
  1: ["grass", "poison"], 2: ["grass", "poison"], 3: ["grass", "poison"],
  4: ["fire"], 5: ["fire"], 6: ["fire", "flying"],
  7: ["water"], 8: ["water"], 9: ["water"],
  10: ["bug"], 11: ["bug"], 12: ["bug", "flying"],
  13: ["bug", "poison"], 14: ["bug", "poison"], 15: ["bug", "poison"],
  16: ["normal", "flying"], 17: ["normal", "flying"], 18: ["normal", "flying"],
  19: ["normal"], 20: ["normal"],
  21: ["normal", "flying"], 22: ["normal", "flying"],
  23: ["poison"], 24: ["poison"],
  25: ["electric"], 26: ["electric"],
  27: ["ground"], 28: ["ground"],
  29: ["poison"], 30: ["poison"], 31: ["poison", "ground"],
  32: ["poison"], 33: ["poison"], 34: ["poison", "ground"],
  35: ["fairy"], 36: ["fairy"],
  37: ["fire"], 38: ["fire"],
  39: ["normal", "fairy"], 40: ["normal", "fairy"],
  41: ["poison", "flying"], 42: ["poison", "flying"],
  43: ["grass", "poison"], 44: ["grass", "poison"], 45: ["grass", "poison"],
  46: ["bug", "grass"], 47: ["bug", "grass"],
  48: ["bug", "poison"], 49: ["bug", "poison"],
  50: ["ground"], 51: ["ground"],
  52: ["normal"], 53: ["normal"],
  54: ["water"], 55: ["water"],
  56: ["fighting"], 57: ["fighting"],
  58: ["fire"], 59: ["fire"],
  60: ["water"], 61: ["water"], 62: ["water", "fighting"],
  63: ["psychic"], 64: ["psychic"], 65: ["psychic"],
  66: ["fighting"], 67: ["fighting"], 68: ["fighting"],
  69: ["grass", "poison"], 70: ["grass", "poison"], 71: ["grass", "poison"],
  72: ["water", "poison"], 73: ["water", "poison"],
  74: ["rock", "ground"], 75: ["rock", "ground"], 76: ["rock", "ground"],
  77: ["fire"], 78: ["fire"],
  79: ["water", "psychic"], 80: ["water", "psychic"],
  81: ["electric", "steel"], 82: ["electric", "steel"],
  83: ["normal", "flying"],
  84: ["normal", "flying"], 85: ["normal", "flying"],
  86: ["water"], 87: ["water", "ice"],
  88: ["poison"], 89: ["poison"],
  90: ["water"], 91: ["water", "ice"],
  92: ["ghost", "poison"], 93: ["ghost", "poison"], 94: ["ghost", "poison"],
  95: ["rock", "ground"],
  96: ["psychic"], 97: ["psychic"],
  98: ["water"], 99: ["water"],
  100: ["electric"], 101: ["electric"],
  102: ["grass", "psychic"], 103: ["grass", "psychic"],
  104: ["ground"], 105: ["ground"],
  106: ["fighting"], 107: ["fighting"],
  108: ["normal"],
  109: ["poison"], 110: ["poison"],
  111: ["ground", "rock"], 112: ["ground", "rock"],
  113: ["normal"],
  114: ["grass"],
  115: ["normal"],
  116: ["water"], 117: ["water"],
  118: ["water"], 119: ["water"],
  120: ["water"], 121: ["water", "psychic"],
  122: ["psychic", "fairy"],
  123: ["bug", "flying"],
  124: ["ice", "psychic"],
  125: ["electric"],
  126: ["fire"],
  127: ["bug"],
  128: ["normal"],
  129: ["water"], 130: ["water", "flying"],
  131: ["water", "ice"],
  132: ["normal"],
  133: ["normal"], 134: ["water"], 135: ["electric"], 136: ["fire"],
  137: ["normal"],
  138: ["rock", "water"], 139: ["rock", "water"],
  140: ["rock", "water"], 141: ["rock", "water"],
  142: ["rock", "flying"],
  143: ["normal"],
  144: ["ice", "flying"], 145: ["electric", "flying"], 146: ["fire", "flying"],
  147: ["dragon"], 148: ["dragon"], 149: ["dragon", "flying"],
  150: ["psychic"], 151: ["psychic"],
}

// French names for first 151 Pokemon (pre-computed for speed)
const kantoNamesFr: Record<number, string> = {
  1: "Bulbizarre", 2: "Herbizarre", 3: "Florizarre",
  4: "Salamèche", 5: "Reptincel", 6: "Dracaufeu",
  7: "Carapuce", 8: "Carabaffe", 9: "Tortank",
  10: "Chenipan", 11: "Chrysacier", 12: "Papilusion",
  13: "Aspicot", 14: "Coconfort", 15: "Dardargnan",
  16: "Roucool", 17: "Roucoups", 18: "Roucarnage",
  19: "Rattata", 20: "Rattatac",
  21: "Piafabec", 22: "Rapasdepic",
  23: "Abo", 24: "Arbok",
  25: "Pikachu", 26: "Raichu",
  27: "Sabelette", 28: "Sablaireau",
  29: "Nidoran♀", 30: "Nidorina", 31: "Nidoqueen",
  32: "Nidoran♂", 33: "Nidorino", 34: "Nidoking",
  35: "Mélofée", 36: "Mélodelfe",
  37: "Goupix", 38: "Feunard",
  39: "Rondoudou", 40: "Grodoudou",
  41: "Nosferapti", 42: "Nosferalto",
  43: "Mystherbe", 44: "Ortide", 45: "Rafflesia",
  46: "Paras", 47: "Parasect",
  48: "Mimitoss", 49: "Aéromite",
  50: "Taupiqueur", 51: "Triopikeur",
  52: "Miaouss", 53: "Persian",
  54: "Psykokwak", 55: "Akwakwak",
  56: "Férosinge", 57: "Colossinge",
  58: "Caninos", 59: "Arcanin",
  60: "Ptitard", 61: "Têtarte", 62: "Tartard",
  63: "Abra", 64: "Kadabra", 65: "Alakazam",
  66: "Machoc", 67: "Machopeur", 68: "Mackogneur",
  69: "Chétiflor", 70: "Boustiflor", 71: "Empiflor",
  72: "Tentacool", 73: "Tentacruel",
  74: "Racaillou", 75: "Gravalanch", 76: "Grolem",
  77: "Ponyta", 78: "Galopa",
  79: "Ramoloss", 80: "Flagadoss",
  81: "Magnéti", 82: "Magnéton",
  83: "Canarticho",
  84: "Doduo", 85: "Dodrio",
  86: "Otaria", 87: "Lamantine",
  88: "Tadmorv", 89: "Grotadmorv",
  90: "Kokiyas", 91: "Crustabri",
  92: "Fantominus", 93: "Spectrum", 94: "Ectoplasma",
  95: "Onix",
  96: "Soporifik", 97: "Hypnomade",
  98: "Krabby", 99: "Krabboss",
  100: "Voltorbe", 101: "Électrode",
  102: "Noeunoeuf", 103: "Noadkoko",
  104: "Osselait", 105: "Ossatueur",
  106: "Kicklee", 107: "Tygnon",
  108: "Excelangue",
  109: "Smogo", 110: "Smogogo",
  111: "Rhinocorne", 112: "Rhinoféros",
  113: "Leveinard",
  114: "Saquedeneu",
  115: "Kangourex",
  116: "Hypotrempe", 117: "Hypocéan",
  118: "Poissirène", 119: "Poissoroy",
  120: "Stari", 121: "Staross",
  122: "M. Mime",
  123: "Insécateur",
  124: "Lippoutou",
  125: "Élektek",
  126: "Magmar",
  127: "Scarabrute",
  128: "Tauros",
  129: "Magicarpe", 130: "Léviator",
  131: "Lokhlass",
  132: "Métamorph",
  133: "Évoli", 134: "Aquali", 135: "Voltali", 136: "Pyroli",
  137: "Porygon",
  138: "Amonita", 139: "Amonistar",
  140: "Kabuto", 141: "Kabutops",
  142: "Ptéra",
  143: "Ronflex",
  144: "Artikodin", 145: "Électhor", 146: "Sulfura",
  147: "Minidraco", 148: "Draco", 149: "Dracolosse",
  150: "Mewtwo", 151: "Mew",
}

// Get sprite URL (predictable pattern)
function getSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

// Get Pokemon cry URL
export function getPokemonCryUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`
}

// Fast initial load - uses pre-computed data for Kanto, loads others progressively
export async function getAllPokemonFast(): Promise<PokemonBasicData[]> {
  const results: PokemonBasicData[] = []
  
  // Instantly load Kanto with pre-computed data
  const list = await getPokemonList(TOTAL_POKEMON)
  
  for (let id = 1; id <= 151; id++) {
    results.push({
      id,
      name: list.results[id - 1].name,
      nameFr: kantoNamesFr[id] || list.results[id - 1].name,
      sprite: getSpriteUrl(id),
      types: kantoTypes[id] || [],
      generation: 1,
    })
  }
  
  return results
}

// Load remaining pokemon in background
export async function loadRemainingPokemon(
  onProgress: (pokemon: PokemonBasicData[], progress: number) => void
): Promise<PokemonBasicData[]> {
  const list = await getPokemonList(TOTAL_POKEMON)
  const results: PokemonBasicData[] = []
  const BATCH_SIZE = 30
  
  for (let i = 151; i < TOTAL_POKEMON; i += BATCH_SIZE) {
    const batchEnd = Math.min(i + BATCH_SIZE, TOTAL_POKEMON)
    const batchPromises = []
    
    for (let j = i; j < batchEnd; j++) {
      const id = j + 1
      batchPromises.push(
        (async () => {
          try {
            const [pokemon, species] = await Promise.all([
              getPokemon(id),
              getPokemonSpecies(id)
            ])
            const frenchName = species.names.find(n => n.language.name === "fr")?.name || pokemon.name
            return {
              id: pokemon.id,
              name: pokemon.name,
              nameFr: frenchName,
              sprite: getSpriteUrl(id),
              types: pokemon.types.map(t => t.type.name),
              generation: getGenerationForPokemon(pokemon.id)
            }
          } catch {
            return {
              id,
              name: list.results[j].name,
              nameFr: list.results[j].name,
              sprite: getSpriteUrl(id),
              types: [],
              generation: getGenerationForPokemon(id)
            }
          }
        })()
      )
    }
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    const progress = Math.round(((i - 151 + BATCH_SIZE) / (TOTAL_POKEMON - 151)) * 100)
    onProgress(results, Math.min(progress, 100))
  }
  
  return results
}

// Get localized name from species
export function getLocalizedName(species: PokemonSpecies, language: "en" | "fr"): string {
  const localizedName = species.names.find(n => n.language.name === language)
  return localizedName?.name || species.name
}

// Get flavor text in preferred language
export function getFlavorText(species: PokemonSpecies, language: "en" | "fr"): string {
  const entries = species.flavor_text_entries
  
  // Try to find text in preferred language (prefer red/blue versions for authenticity)
  const preferredVersions = ["red", "blue", "yellow", "firered", "leafgreen"]
  
  for (const version of preferredVersions) {
    const entry = entries.find(
      e => e.language.name === language && e.version.name === version
    )
    if (entry) {
      return entry.flavor_text.replace(/\f|\n/g, " ")
    }
  }
  
  // Fallback to any entry in preferred language
  const langEntry = entries.find(e => e.language.name === language)
  if (langEntry) {
    return langEntry.flavor_text.replace(/\f|\n/g, " ")
  }
  
  // Fallback to English if French not found
  if (language === "fr") {
    return getFlavorText(species, "en")
  }
  
  // Last resort
  const anyEntry = entries[0]
  return anyEntry?.flavor_text.replace(/\f|\n/g, " ") || "No description available."
}

// Parse evolution chain into flat array
export interface EvolutionStep {
  name: string
  id: number
  minLevel: number | null
  trigger: string
  item: string | null
}

export function parseEvolutionChain(chain: EvolutionChainLink): EvolutionStep[][] {
  const paths: EvolutionStep[][] = []
  
  function traverse(node: EvolutionChainLink, currentPath: EvolutionStep[]) {
    const id = parseInt(node.species.url.split("/").filter(Boolean).pop() || "0")
    const step: EvolutionStep = {
      name: node.species.name,
      id,
      minLevel: node.evolution_details[0]?.min_level || null,
      trigger: node.evolution_details[0]?.trigger?.name || "base",
      item: node.evolution_details[0]?.item?.name || null
    }
    
    const newPath = [...currentPath, step]
    
    if (node.evolves_to.length === 0) {
      paths.push(newPath)
    } else {
      for (const evolution of node.evolves_to) {
        traverse(evolution, newPath)
      }
    }
  }
  
  traverse(chain, [])
  return paths
}

// Stat name mapping
export const statNames: Record<string, { en: string; fr: string }> = {
  hp: { en: "HP", fr: "PV" },
  attack: { en: "Attack", fr: "Attaque" },
  defense: { en: "Defense", fr: "Défense" },
  "special-attack": { en: "Sp. Atk", fr: "Atq. Spé" },
  "special-defense": { en: "Sp. Def", fr: "Déf. Spé" },
  speed: { en: "Speed", fr: "Vitesse" }
}

// Type colors (original-inspired but not copied)
export const typeColors: Record<string, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC"
}
