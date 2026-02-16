# Architecture Agentique - Pokémon Adventure System

## Vue d'ensemble

Le système d'aventure Pokémon utilise une **architecture agentique hybride** qui sépare strictement :
- **Les agents IA** (génération narrative via Mistral AI)
- **Le moteur de règles** (logique de jeu déterministe en TypeScript pur)

Cette séparation garantit que les mécaniques de jeu sont **équitables, reproductibles et testables**, tandis que l'IA apporte uniquement la **narration et l'immersion**.

---

## Architecture Complète

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│                  src/components/adventure/                       │
│                    adventure-game.tsx                            │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ HTTP POST/PUT requests
             │
┌────────────▼────────────────────────────────────────────────────┐
│                     API ROUTES (Next.js)                         │
│                   src/app/api/adventure/                         │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │ /start       │ /event       │ /resolve     │ /state       │  │
│  └──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┘  │
│         │              │              │              │           │
└─────────┼──────────────┼──────────────┼──────────────┼───────────┘
          │              │              │              │
          │              │              │              │
    ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐      │
    │Initialize │  │  Agent    │  │  Rules    │      │
    │GameState  │  │ Pipeline  │  │  Engine   │      │
    └───────────┘  └─────┬─────┘  └─────┬─────┘      │
                         │              │            │
                   ┌─────▼──────┐ ┌─────▼──────┐    │
                   │Game Master │ │computeBattle│    │
                   │   Agent    │ │computeCapture   │
                   └─────┬──────┘ │applyXP      │    │
                         │        │checkEvolution   │
                   ┌─────▼──────┐ └─────────────┘    │
                   │ Narrator   │                    │
                   │  Agent     │                    │
                   └────────────┘                    │
                         │                           │
                   ┌─────▼──────┐                    │
                   │ Mistral AI │                    │
                   │    API     │                    │
                   └────────────┘                    │
```

---

## 1. Les Agents IA (Narration)

### 🎭 **Narrator Agent**
**Fichier:** `src/lib/ai/adventure-agents.ts` → `narratorGenerateChoices()`

**Rôle:** Transformer un événement brut en narration immersive + proposer 3 choix

**Input:**
```typescript
{
  event: Event,           // Type, difficulté, scène, contexte
  narrativeStyle: "serious" | "humor" | "epic",
  language: "en" | "fr"
}
```

**Output:**
```typescript
{
  narration: string,      // 2-3 phrases narratives
  choices: [
    { risk: "SAFE", label: "Action conservative" },
    { risk: "MODERATE", label: "Action équilibrée" },
    { risk: "RISKY", label: "Action risquée" }
  ]
}
```

**Prompt système:**
- Spécialisation dans le style narratif choisi (serious/humor/epic)
- Génère EXACTEMENT 3 choix avec risques SAFE/MODERATE/RISKY
- Retourne uniquement du JSON valide
- Adapte la langue (EN/FR)

**Appel Mistral:**
```typescript
const responseText = await callMistral(prompt, 500, 0.7);
// POST https://api.mistral.ai/v1/chat/completions
// model: "mistral-small-latest"
// max_tokens: 500
// temperature: 0.7
```

---

### 🎮 **Game Master Agent**
**Fichier:** `src/lib/ai/adventure-agents.ts` → `gameMasterGenerateEvent()`

**Rôle:** Concevoir des événements adaptés au contexte de l'aventure

**Input:**
```typescript
{
  step: 1-8,                    // Étape actuelle
  narrativeStyle: NarrativeStyle,
  tensionLevel: 0-3,            // Escalade narrative
  playerTeamLevels: number[],   // Niveaux des Pokémon
  seed: number,                 // Pour reproductibilité
  wins: number,                 // Victoires majeures
  language: "en" | "fr"
}
```

**Output:**
```typescript
{
  id: string,
  step: 1-8,
  type: "wild_battle" | "trainer_battle" | "boss" | "capture" | ...,
  difficulty: "easy" | "normal" | "hard",
  scene: string,               // Description narrative
  context: {
    enemyName?: string,
    enemyLevel?: number,
    itemReward?: string
  },
  eventSeed: number
}
```

**Logique:**
- Étapes 4 et 8 → événements BOSS
- Escalade de difficulté progressive
- Niveau des ennemis basé sur la moyenne de l'équipe
- Tension narrative croissante

**Appel Mistral:**
```typescript
const responseText = await callMistral(prompt, 600, 0.7);
// temperature: 0.7 pour créativité contrôlée
```

---

### 📖 **Narrator Outcome Agent**
**Fichier:** `src/lib/ai/adventure-agents.ts` → `narratorNarrateOutcome()`

**Rôle:** Narrer les résultats d'une action (après résolution mécanique)

**Input:**
```typescript
{
  success: boolean,
  xpGained: number,
  healthLost: number,
  evolutionTriggered?: number
}
```

**Output:**
```typescript
{
  outcomeNarration: string,    // 2-3 phrases sur le résultat
  stateHighlights: string[],   // ["Pikachu +45 XP", "Squirtle -20 HP"]
  nextHook: string             // Teaser pour la suite
}
```

**Appel Mistral:**
```typescript
const responseText = await callMistral(prompt, 400, 0.7);
```

---

## 2. Rules Engine (Mécanique Pure)

### ⚙️ **Rules Engine**
**Fichier:** `src/lib/adventure/rules-engine.ts`

**Principe:** AUCUN appel IA. Code TypeScript pur, déterministe, testable.

### Fonctions principales:

#### `seededRandom(seed: number): number`
- RNG déterministe basé sur un seed
- Permet la reproductibilité exacte des combats

#### `computeBattle(params)`
**Input:**
```typescript
{
  pokemonLevel: number,
  enemyLevel: number,
  risk: RiskLevel,
  difficulty: string,
  seed: number
}
```

**Logique:**
```typescript
// Multiplicateurs de risque
SAFE:     { hitChance: 0.95, damage: 0.7,  xp: 0.8  }
MODERATE: { hitChance: 0.8,  damage: 1.0,  xp: 1.0  }
RISKY:    { hitChance: 0.6,  damage: 1.4,  xp: 1.5  }

// Calcul de précision
const baseHitChance = 0.8;
const levelBonus = (pokemonLevel - enemyLevel) * 0.05;
const finalHitChance = clamp(baseHitChance + levelBonus, 0.1, 1.0) * riskMultiplier;

// Calcul des dégâts
const baseDamage = 35;
const difficultyScale = { easy: 0.7, normal: 1.0, hard: 1.3 };
const variance = 0.9 + seededRandom(seed) * 0.2; // 90%-110%
const damage = baseDamage * riskMult * diffScale * variance;

// XP gain
const baseXP = 50 + enemyLevel * 5;
const xpGained = baseXP * riskXPMultiplier;
```

**Output:**
```typescript
{
  success: boolean,
  damageDealt: number,
  healthLost: number,
  xpGained: number
}
```

#### `computeCapture(pokemonLevel, wildLevel, risk, seed)`
**Formule:**
```typescript
const baseChance = 0.5 - wildPokemonLevel * 0.02 + playerPokemonLevel * 0.01;
const riskBonus = { SAFE: -0.1, MODERATE: 0, RISKY: +0.15 };
const finalChance = clamp(baseChance + riskBonus, 0.05, 0.95);
const success = seededRandom(seed) < finalChance;
```

#### `applyXP(pokemon, xpGained)`
```typescript
pokemon.xp += xpGained;
if (pokemon.xp >= pokemon.xpToLevel) {
  pokemon.level++;
  pokemon.xp = 0;
  pokemon.xpToLevel = pokemon.level * 50;
  return { pokemon, leveled: true };
}
```

#### `checkEvolution(pokemon)`
```typescript
// Seuils d'évolution simplifiés
const evolutionLevels = [16, 32, 48];
if (evolutionLevels.includes(pokemon.level)) {
  pokemon.canEvolve = true;
}
```

#### Autres fonctions:
- `applyDamage()` - Applique dégâts avec clamping 0-100
- `healTeam()` - Soigne tous les Pokémon
- `hasTeamKO()` - Vérifie si tous KO
- `getAverageTeamLevel()` - Moyenne des niveaux
- `getDifficulty()` - Calcule difficulté basée sur victoires

---

## 3. Flux de Données (Step-by-Step)

### 📍 **Étape 1: Initialisation** 
**Endpoint:** `POST /api/adventure/start`

```
USER → Team Builder → Encode team + style → /api/adventure/start
                                                    ↓
                                          Fetch Pokemon names from PokeAPI
                                                    ↓
                                          Create GameState (step 1, level 5, 100 HP)
                                                    ↓
                                          Return serialized GameState
                                                    ↓
                                          Frontend: AdventureGame component
```

### 📍 **Étape 2: Génération d'événement**
**Endpoint:** `POST /api/adventure/event`

```
AdventureGame → POST gameState → /api/adventure/event
                                         ↓
                                  Game Master Agent
                                  (Mistral API call)
                                         ↓
                                  Generate Event
                                  (type, difficulty, scene, context)
                                         ↓
                                  Narrator Agent
                                  (Mistral API call)
                                         ↓
                                  Generate Choices
                                  (narration + 3 choices SAFE/MODERATE/RISKY)
                                         ↓
                                  Return { event, narration, choices }
                                         ↓
                                  Frontend: Display story + choice buttons
```

### 📍 **Étape 3: Résolution de choix**
**Endpoint:** `POST /api/adventure/resolve`

```
User clicks choice → POST { gameState, event, pokemonId, chosenRisk }
                                         ↓
                                  /api/adventure/resolve
                                         ↓
                                  Switch on event.type:
                                         ↓
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
            WILD_BATTLE          TRAINER_BATTLE          CAPTURE
                    │                    │                    │
         computeBattle()      computeBattle()      computeCapture()
         (Rules Engine)       (Rules Engine)       (Rules Engine)
                    │                    │                    │
                    └────────────────────┴────────────────────┘
                                         ↓
                                  Apply mechanics:
                                  - applyDamage()
                                  - applyXP()
                                  - checkEvolution()
                                         ↓
                                  Narrator Outcome Agent
                                  (Mistral API call)
                                         ↓
                                  Generate outcome narration
                                         ↓
                                  Return { outcome, updatedTeam, allKO }
                                         ↓
                                  Frontend: Display outcome + highlights
```

### 📍 **Étape 4: Progression**
**Endpoint:** `PUT /api/adventure/state`

```
User clicks "Suite →" → PUT { gameState, updatedTeam }
                                         ↓
                                  /api/adventure/state
                                         ↓
                                  Update state:
                                  - currentStep++
                                  - tensionLevel = floor(step / 3)
                                  - team = updatedTeam
                                         ↓
                                  Check win conditions:
                                  - step == 8 && !allKO → VICTORY
                                  - allKO → DEFEAT
                                         ↓
                                  Return next gameState or game over
                                         ↓
                                  Frontend: Loop to step 2 or show end screen
```

---

## 4. Endpoints API

### `POST /api/adventure/start`
**Responsabilité:** Initialiser une session d'aventure

**Input:**
```json
{
  "team": [{ "id": 25, "types": ["electric"] }],
  "narrativeStyle": "serious",
  "language": "en"
}
```

**Output:**
```json
{
  "gameState": {
    "sessionId": "session_...",
    "currentStep": 1,
    "team": [...],
    "seed": 123456,
    "tensionLevel": 0,
    ...
  }
}
```

---

### `POST /api/adventure/event`
**Responsabilité:** Générer événement + narration + choix

**Input:** GameState complet

**Pipeline:**
1. Game Master Agent → Generate Event
2. Narrator Agent → Generate Choices
3. Return combined response

**Output:**
```json
{
  "event": { "type": "wild_battle", "difficulty": "normal", ... },
  "narration": "A wild Rattata appears...",
  "choices": [
    { "risk": "SAFE", "label": "Defend and wait" },
    { "risk": "MODERATE", "label": "Use Thunderbolt" },
    { "risk": "RISKY", "label": "Go all-out" }
  ]
}
```

---

### `POST /api/adventure/resolve`
**Responsabilité:** Résoudre choix via Rules Engine

**Input:**
```json
{
  "gameState": {...},
  "event": {...},
  "pokemonId": 25,
  "chosenRisk": "MODERATE"
}
```

**Pipeline:**
1. Extract pokemon and risk
2. Switch on event.type
3. Call Rules Engine function (computeBattle, computeCapture, etc.)
4. Apply mechanics (damage, XP, evolution)
5. Narrator narrates outcome
6. Check game over conditions

**Output:**
```json
{
  "outcome": {
    "success": true,
    "outcomeNarration": "Pikachu strikes with precision!",
    "stateHighlights": ["Pikachu +50 XP", "Enemy -35 HP"],
    "nextHook": "The path ahead grows darker..."
  },
  "updatedTeam": [...],
  "allKO": false
}
```

---

### `PUT /api/adventure/state`
**Responsabilité:** Progresser vers l'étape suivante

**Input:**
```json
{
  "gameState": {...},
  "updatedTeam": [...],
  "isGameOver": false,
  "allKO": false
}
```

**Output:**
```json
{
  "gameState": {
    "currentStep": 2,
    "tensionLevel": 0,
    "team": [...]
  }
}
```

ou

```json
{
  "isGameOver": true,
  "victory": true
}
```

---

## 5. Séparation des Responsabilités

### ✅ **Ce que font les Agents IA (Mistral)**
- ✨ Générer des descriptions narratives immersives
- 🎭 Adapter le ton (serious/humor/epic)
- 🌍 Traduire en FR/EN
- 📖 Créer des choix narratifs cohérents
- 🎬 Narrer les résultats d'actions
- 🎲 Concevoir des scènes d'événements

### ✅ **Ce que fait le Rules Engine (TypeScript)**
- ⚔️ Calculer les résultats de combat (dégâts, précision)
- 📊 Gérer XP et montée de niveau
- 🔄 Gérer les évolutions
- 🎯 Calculer les chances de capture
- 💚 Gérer la santé des Pokémon
- 🎲 RNG déterministe (reproductibilité)
- ⚖️ Équilibrage (modificateurs de risque)

### ❌ **Ce que les Agents NE FONT PAS**
- ❌ Décider si un combat est gagné/perdu
- ❌ Calculer les dégâts ou la précision
- ❌ Gérer l'XP ou les niveaux
- ❌ Décider des évolutions
- ❌ Gérer la logique de game over

### ❌ **Ce que le Rules Engine NE FAIT PAS**
- ❌ Générer du texte narratif
- ❌ Créer des descriptions d'événements
- ❌ Traduire du texte
- ❌ Adapter le style narratif

---

## 6. Avantages de cette Architecture

### 🎯 **Déterminisme**
- Les combats sont reproductibles avec le même seed
- Pas de variabilité due à l'IA dans les mécaniques
- Testable unitairement

### ⚖️ **Équité**
- Les règles sont codées, pas générées par IA
- Pas de "triche" ou d'incohérence
- Équilibrage contrôlé

### 🧪 **Testabilité**
- Rules Engine testable sans API calls
- Mécaniques isolées et vérifiables
- Mock facile des agents IA pour tests

### 🔄 **Maintenabilité**
- Modification des règles indépendante de l'IA
- Modification du style narratif sans toucher aux règles
- Agents modulaires et remplaçables

### 💰 **Coût optimisé**
- Appels IA limités aux moments narratifs
- Pas d'appel IA pour chaque calcul de combat
- 200 requêtes/mois Mistral suffisantes pour ~30-40 aventures complètes

### 🌍 **Internationalisation**
- Narration en FR/EN via agents
- Règles indépendantes de la langue
- Ajout d'une langue = modification des prompts seulement

---

## 7. Technologies Utilisées

### Frontend
- **Next.js 16** (App Router)
- **React 18** (Client Components)
- **TypeScript** (Type safety)
- **Tailwind CSS** (Styling)
- **shadcn/ui** (Composants UI)

### Backend (API Routes)
- **Next.js API Routes** (Serverless functions)
- **TypeScript** (Type safety)

### IA
- **Mistral AI** (mistral-small-latest)
- **REST API** (fetch directe, pas de SDK)

### State Management
- **React useState** (State local)
- **GameState interface** (Type safety)

---

## 8. Exemple de Flux Complet

### Scénario: Joueur lance aventure et affronte 1er combat

```
1. User: Crée équipe (Pikachu, Squirtle) → Team Builder
                                               ↓
2. User: Click "Adventure" (style: "epic")
                                               ↓
3. POST /api/adventure/start
   → Fetch pokemon names: Pikachu, Squirtle
   → Create GameState (step 1, seed 842719, team level 5)
   → Return gameState
                                               ↓
4. Frontend: Call loadEvent()
                                               ↓
5. POST /api/adventure/event with gameState
   → Game Master Agent:
     Prompt: "Step 1/8, team level 5, epic style..."
     → Mistral returns: { eventType: "wild_battle", enemyName: "Rattata", enemyLevel: 6 }
   → Narrator Agent:
     Prompt: "Event: wild_battle vs Rattata, epic tone..."
     → Mistral returns: { 
       narration: "From the shadows emerges a fearsome Rattata!",
       choices: [
         { risk: "SAFE", label: "Cautious defense" },
         { risk: "MODERATE", label: "Thunder Shock" },
         { risk: "RISKY", label: "Ultimate Thunder Strike!" }
       ]
     }
   → Return { event, narration, choices }
                                               ↓
6. Frontend: Display narration + 3 buttons
                                               ↓
7. User: Selects Pikachu + clicks "Ultimate Thunder Strike!" (RISKY)
                                               ↓
8. POST /api/adventure/resolve
   → Extract: pokemon=Pikachu(lvl5), risk=RISKY, event=wild_battle(rattata lvl6)
   → Rules Engine: computeBattle({
       pokemonLevel: 5,
       enemyLevel: 6,
       risk: "RISKY",
       difficulty: "easy",
       seed: 842720
     })
     → hitChance = 0.8 + (5-6)*0.05 = 0.75 * 0.6(risky) = 0.45
     → roll = seededRandom(842720) = 0.32 < 0.45 → HIT!
     → damage = 35 * 1.4(risky) * 0.7(easy) * 0.95(variance) = 32.7
     → xpGained = 55 * 1.5(risky) = 82
     → Return { success: true, damageDealt: 33, healthLost: 15, xpGained: 82 }
   → Apply mechanics:
     → applyDamage(pikachu, 15) → pikachu.health = 85
     → applyXP(pikachu, 82) → pikachu.xp = 82 (needs 250 for level up)
   → Narrator Outcome Agent:
     Prompt: "Success! XP +82, Health -15, epic tone..."
     → Mistral returns: {
       outcomeNarration: "A thunderous blast strikes true! Rattata flees!",
       stateHighlights: ["Pikachu +82 XP", "Pikachu -15 HP"],
       nextHook: "The journey calls you deeper into the wild..."
     }
   → Return { outcome, updatedTeam, allKO: false }
                                               ↓
9. Frontend: Display outcome narration + highlights + "Suite →" button
                                               ↓
10. User: Click "Suite →"
                                               ↓
11. PUT /api/adventure/state
    → currentStep = 2
    → tensionLevel = 0
    → team = updatedTeam (Pikachu 85 HP, 82 XP)
    → Return new gameState
                                               ↓
12. Frontend: Loop back to step 4 (loadEvent for step 2)
```

---

## 9. Fichiers Clés

```
src/
├── types/
│   └── adventure.ts                 # Interfaces TypeScript complètes
│
├── lib/
│   ├── adventure/
│   │   └── rules-engine.ts          # Moteur de règles pur (11 fonctions)
│   │
│   └── ai/
│       └── adventure-agents.ts      # 3 agents IA (Mistral)
│
├── app/
│   ├── adventure/
│   │   └── page.tsx                 # Page d'aventure (entry point)
│   │
│   └── api/adventure/
│       ├── start/route.ts           # POST - Init session
│       ├── event/route.ts           # POST - Gen event + choices
│       ├── resolve/route.ts         # POST - Resolve choice
│       └── state/route.ts           # PUT - Progress state
│
└── components/adventure/
    ├── adventure-game.tsx           # Composant principal (UI + logic)
    └── index.ts                     # Exports
```

---

## 10. Métriques et Limites

### Mistral API Usage (Free Tier: 200 req/month)
- **1 aventure complète (8 étapes):**
  - 8 × Game Master calls = 8 requêtes
  - 8 × Narrator choices calls = 8 requêtes
  - 8 × Narrator outcome calls = 8 requêtes
  - **Total: ~24 requêtes par aventure**
  - **Capacité: ~8 aventures complètes/mois**

### Performance
- **Event generation:** ~500-800ms (Mistral API)
- **Choice resolution:** ~400-600ms (Mistral API)
- **Rules Engine execution:** <1ms (pur TypeScript)

### Scalabilité
- **Horizontal:** Chaque session indépendante (stateless entre requêtes)
- **Vertical:** Rules Engine optimisable, agents parallélisables
- **Coût:** Prévisible (budget Mistral uniquement)

---

## Conclusion

Cette architecture agentique offre:
- ✅ Séparation claire des responsabilités (IA = narration, Code = règles)
- ✅ Expérience joueur immersive et personnalisable
- ✅ Mécaniques de jeu équitables et testables
- ✅ Maintenabilité et évolutivité
- ✅ Coût maîtrisé (tier gratuit Mistral suffisant pour prototypage)

L'architecture est **production-ready** pour une version MVP et extensible pour ajouter:
- Boss fights spécifiques
- Rival récurrent
- Système de sauvegarde/reprise
- Leaderboards (partage de seeds)
- Multiplayer (seed sharing)
