# 🤖 Architecture Multi-Agent - Avis Professeur Chen

## Vue d'ensemble

Le système d'avis du Professeur Chen a été refactorisé pour utiliser une **architecture multi-agent avec orchestrateur** et **tools déterministes** (sans appels IA supplémentaires).

```
[Requête HTTP]
      ↓
[Orchestrateur Principal]
      ↓
  ├─→ [Agent 1: Composition Analyzer] → analyzeTeamComposition()
  ├─→ [Agent 2: Strategy Evaluator] → evaluateTeamStrategy()
  └─→ [Agent 3: Weakness Identifier] → identifyWeaknesses()
      ↓
[Advice Builder] → Compile réponse finale
      ↓
[API Response]
```

---

## 🔧 Les Agents Spécialisés

### 1️⃣ **Team Composition Analyzer**
**Fichier:** `src/lib/ai/professor-Chen-agents.ts` → `analyzeTeamComposition()`

**Rôle:** Analyser la diversité de type et la couverture de l'équipe

**Inputs:**
- Liste des Pokémon avec leurs types

**Outputs:**
```typescript
{
  typeDistribution: { fire: 2, water: 1, normal: 1, ... },
  coverage: "Good coverage (4-5 types)",
  balance: "Well balanced",
  diversity: "6 unique types found"
}
```

**Logic:**
- Compte la fréquence de chaque type
- Évalue la couverture (4-6 types = idéal)
- Analyse l'équilibre type/pokémon

---

### 2️⃣ **Strategy Evaluator**
**Fichier:** `src/lib/ai/professor-Chen-agents.ts` → `evaluateTeamStrategy()`

**Rôle:** Déterminer le style stratégique global (offensif/défensif/équilibré)

**Outputs:**
```typescript
{
  offensiveScore: 7,          // 0-10
  defensiveScore: 5,          // 0-10
  strategyType: "Offensive",  // "Offensive" | "Defensive" | "Balanced"
  synergy: "High team synergy"
}
```

**Logic:**
- Classifie les types comme agressifs, défensifs ou équilibrés
- Calcule les scores sur 10
- Analyse la synergie (fréquence des types communs)

---

### 3️⃣ **Weakness Identifier**
**Fichier:** `src/lib/ai/professor-Chen-agents.ts` → `identifyWeaknesses()`

**Rôle:** Identifier les faiblesses critiques et proposer améliorations

**Outputs:**
```typescript
{
  primaryWeaknesses: ["fire", "electric"],
  recommendations: ["Watch out for fire-type moves"],
  improvements: ["Fill your team to 6 members"]
}
```

**Logic:**
- Teste toutes les combinaisons types attaquant vs défense équipe
- Classe par efficacité 2x (super-efficace)
- Suggère des améliorations basées sur le contexte

---

## 🎭 Orchestrateur

**Fonction:** `professorsChendozes()`

Coordonne les 3 agents et compile une réponse cohérente:

```typescript
export async function professorsChendozes(
  team: PokemonInfo[],
  language: "en" | "fr"
): Promise<{ analysis: TeamAnalysis; advice: string }>
```

**Workflow:**
1. Exécute `analyzeTeamComposition()`
2. Exécute `evaluateTeamStrategy()`
3. Exécute `identifyWeaknesses()`
4. Appelle `buildProfChenAdvice()` pour compiler
5. Retourne analyse complète + conseil personnalisé

---

## 🛠️ Tools Disponibles (Déterministes)

### ✅ `analyzeTeamComposition(team)`
- Type: Déterministe (pas de API)
- Calcule la distribution des types
- Évalue couverture et diversité

### ✅ `evaluateTeamStrategy(team)`
- Type: Déterministe
- Classifie offense/défense
- Évalue synergies

### ✅ `identifyWeaknesses(team)`
- Type: Déterministe (utilise `checkTypeEffectiveness()`)
- Identifie top 3 faiblesses
- Suggère améliorations

### ✅ `checkTypeEffectiveness(attackType, defenderTypes)`
- Réutilisé depuis `agent-tools.ts`
- Retourne multiplicateur d'efficacité

---

## 📋 Avantages de cette Architecture

| Aspect | Avant | Après |
|--------|-------|-------|
| **Appels IA** | 1 appel Mistral | 0 appels Mistral |
| **Coût** | ⚠️ Nécessite API | ✅ Gratuit (déterministe) |
| **Latence** | ~1-2s (API) | ~5-10ms (local) |
| **Maintenabilité** | Prompt unique | 3 agents modulaires |
| **Extensibilité** | Difficile | Facile (ajouter agents) |
| **Déterminisme** | Non (LLM) | ✅ Oui (logique déterministe) |

---

## 📊 Exemple de Réponse

### Requête:
```json
{
  "team": [
    { "id": 25, "name": "Pikachu", "types": ["electric"] },
    { "id": 4, "name": "Charmander", "types": ["fire"] },
    { "id": 7, "name": "Squirtle", "types": ["water"] }
  ],
  "language": "fr"
}
```

### Réponse:
```json
{
  "review": "Intéressante équipe que tu as là. Tu as clairement privilégié une couverture diverse... Attention aux Pokémon de type eau qui pourraient te poser des problèmes. Continue à travailler!",
  "analysis": {
    "composition": {
      "typeDistribution": { "electric": 1, "fire": 1, "water": 1 },
      "coverage": "Limited coverage (less than 4 types)",
      "balance": "Not very diverse",
      "diversity": "3 unique types found"
    },
    "strategy": {
      "offensiveScore": 5,
      "defensiveScore": 3,
      "strategyType": "Balanced",
      "synergy": "Diverse team composition"
    },
    "weaknesses": {
      "primaryWeaknesses": ["grass", "rock"],
      "recommendations": ["Watch out for grass-type moves"],
      "improvements": ["Fill your team to 6 members"]
    }
  }
}
```

---

## 🚀 Améliorations Futures

1. **Ajouter d'autres agents:**
   - Combat Simulator Agent
   - Type Coverage Optimizer
   - Meta Analysis Agent

2. **Intégrer avec Mistral optionnellement:**
   - Mode "Quick Review" (déterministe)
   - Mode "Detailed Review" (avec IA)

3. **Persistance d'état:**
   - Mémoriser les équipes analysées
   - Suggestions progressives

4. **Améliorer scoring:**
   - Basé sur données réelles Pokémon (stats)
   - Prise en compte des moves
