# 🤖 SYSTÈME MULTI-AGENT AUTONOME - POKÉMON ADVENTURE

## 🎯 Architecture

Ce système implémente une **véritable architecture multi-agent** avec :

### ✅ Caractéristiques d'un vrai système multi-agent

1. **Agents autonomes** avec boucle Perceive-Reason-Act
2. **Communication asynchrone** inter-agents via messages
3. **Négociation et consensus** via système de vote pondéré
4. **Spécialisation par agent** (rôles, expertise, poids de vote)
5. **Mémoire individuelle** par agent (50 derniers messages)
6. **Orchestrateur central** pour faciliter la collaboration

---

## 🏗️ Structure des fichiers

```
src/lib/ai/
├── base-agent.ts              # Classe abstraite BaseAgent + système de messages
├── agent-orchestrator.ts      # Orchestrateur multi-agent
├── autonomous-agents.ts       # 4 agents spécialisés autonomes
├── multi-agent-system.ts      # Wrapper de compatibilité API
├── agent-tools.ts            # Outils déterministes partagés
└── adventure-agents.ts       # ANCIEN système (conservé pour référence)
```

---

## 🤖 Les 4 Agents

### 1. **GameMasterAgent** 🎲
- **Rôle** : Architecte de quêtes et générateur d'événements
- **Expertise** : `quest_design`, `world_building`, `event_generation`, `pacing`
- **Poids vote** : 1.5 (décisions narratives)
- **Autonomie** : Peut initier des conversations
- **Modèle** : Mistral Small (temp: 0.8)

**Capacités** :
- Génère les quêtes principales
- Crée des événements liés à la quête
- Vote sur les directions narratives
- Analyse la tension et la survie de l'équipe

---

### 2. **ChoiceAgent** 💭
- **Rôle** : Designer de choix tactiques et narrateur
- **Expertise** : `choice_generation`, `tactics`, `team_analysis`
- **Poids vote** : 1.2
- **Autonomie** : Répond aux requêtes, participe aux votes
- **Modèle** : Mistral Small (temp: 0.7)

**Capacités** :
- Génère 2-4 choix personnalisés à l'équipe
- Analyse les meilleurs Pokémon pour chaque situation
- Demande validation au Guardian
- Crée des narrations immersives

---

### 3. **GuardianAgent** 🛡️
- **Rôle** : Validateur tactique et analyste de risques
- **Expertise** : `validation`, `risk_analysis`, `type_effectiveness`, `battle_simulation`
- **Poids vote** : 1.3 (décisions de sécurité)
- **Autonomie** : Monitore activement l'état de l'équipe
- **Modèle** : Mistral Small (temp: 0.3 - analytique)

**Capacités** :
- Valide la faisabilité des choix
- Analyse l'efficacité des types
- Simule les combats
- Alerte en cas de danger critique
- Envoie des warnings proactifs

---

### 4. **NarratorAgent** 📖
- **Rôle** : Conteur d'issues et chroniqueur
- **Expertise** : `narration`, `storytelling`, `outcome_description`
- **Poids vote** : 0.8 (décisions créatives)
- **Autonomie** : Répond aux requêtes de narration
- **Modèle** : Mistral Small (temp: 0.75)

**Capacités** :
- Narre les résultats d'actions
- Crée des teasers pour la suite
- Maintient la cohérence narrative

---

## 🔄 Flux de communication

### Mode Pipeline (séquentiel avec contexte partagé)
```
System → GameMaster → ChoiceAgent → Guardian → Narrator
         ↓            ↓             ↓           ↓
      [Event]    [Choices]    [Validation] [Narration]
```

### Mode Collaboratif (parallèle avec vote)
```
            Orchestrator
           /    |    \    \
    GameMaster  Choice  Guardian  Narrator
           \    |    /    /
            [Vote Result]
           ↓
        [Consensus]
```

### Mode Négociation (itératif)
```
Round 1: Agents proposent
      ↓
Round 2: Agents critiquent et révisent
      ↓
Round 3: Convergence vers consensus
      ↓
   [Decision finale]
```

---

## 📡 Système de messages

### Types de messages
```typescript
type MessageType = 
  | "request"      // Demande d'action à un agent
  | "response"     // Réponse à une demande
  | "broadcast"    // Message à tous
  | "negotiation"  // Proposition/révision
  | "vote"         // Vote sur une décision
```

### Priorités
```typescript
type Priority = "low" | "medium" | "high" | "critical"
```

### Exemple de message
```typescript
{
  id: "msg_12345",
  from: "ChoiceAgent",
  to: "Guardian",
  type: "request",
  content: {
    action: "validate_choices",
    choices: [...],
    team: [...]
  },
  timestamp: 1234567890,
  priority: "high",
  requiresResponse: true
}
```

---

## 🗳️ Système de vote

### Mécanisme
1. **Orchestrateur** envoie une demande de vote (broadcast)
2. Chaque **agent** analyse les options avec ses outils
3. **Agents** votent avec :
   - `choice` : option choisie
   - `confidence` : 0-1
   - `reasoning` : justification
   - `weight` : poids de l'agent (automatique)

4. **Score** = Σ(confidence × weight) par option
5. **Consensus** = true si winner > 70% du poids total

### Exemple
```typescript
const result = await orchestrator.requestVote(
  "GameMaster",
  "What should happen next?",
  ["wild_battle", "poke_center", "trainer_battle"],
  { tensionLevel: 2, teamHP: "low" },
  5000 // timeout ms
);

// Result:
{
  winner: "poke_center",
  consensus: true,
  totalConfidence: 3.2,
  votes: [
    { agentName: "GameMaster", choice: "poke_center", confidence: 0.8, weight: 1.5 },
    { agentName: "Guardian", choice: "poke_center", confidence: 1.0, weight: 1.3 },
    { agentName: "ChoiceAgent", choice: "wild_battle", confidence: 0.6, weight: 1.2 }
  ]
}
```

---

## 🚀 Utilisation

### Mode simple (compatibilité avec ancien système)

```typescript
import {
  gameMasterGenerateQuest,
  choiceAgentGenerateChoices,
  narratorNarrateOutcome
} from "@/lib/ai/multi-agent-system";

// L'API reste identique !
const quest = await gameMasterGenerateQuest({
  team,
  narrativeStyle: "epic",
  language: "fr",
  seed: 12345,
  difficulty: "normal",
  estimatedSteps: 8
});
```

### Mode avancé (collaboration explicite)

```typescript
import { getOrchestrator } from "@/lib/ai/multi-agent-system";

const orchestrator = getOrchestrator();

// Requête collaborative avec vote
const decision = await orchestrator.requestVote(
  "system",
  "Should we increase difficulty?",
  ["yes", "no"],
  { currentStep: 5, teamHealth: "good" },
  5000
);

console.log(`Decision: ${decision.winner} (consensus: ${decision.consensus})`);
```

### Mode négociation

```typescript
import { negotiateDecision } from "@/lib/ai/multi-agent-system";

const proposals = new Map([
  ["GameMaster", { eventType: "boss", difficulty: "hard" }],
  ["ChoiceAgent", { eventType: "poke_center", difficulty: "easy" }],
  ["Guardian", { eventType: "narrative_choice", difficulty: "normal" }]
]);

const result = await negotiateDecision({
  topic: "Next event type",
  initialProposals: proposals,
  maxRounds: 3
});

if (result.agreed) {
  console.log(`Consensus reached in ${result.rounds} rounds:`, result.consensus);
} else {
  console.log(`No consensus after ${result.rounds} rounds, using fallback`);
}
```

---

## 🎛️ Outils partagés (agent-tools.ts)

Tous les agents peuvent utiliser ces **13 outils déterministes** :

### Combat & Types
1. `checkTypeEffectiveness(attackType, defenderTypes)` → multiplicateur
2. `estimateBattleOutcome(pokemon, enemyPower, enemyTypes)` → probabilité
3. `simulateTurnOutcome(action, pokemon, enemy, risk)` → simulation

### Équipe
4. `getTeamStatus(team)` → alive, HP, healthStatus
5. `rankBestPokemonForQuest(team, context)` → classement
6. `predictTeamSurvival(gameState, stepsRemaining)` → survie

### Quête
7. `calculateQuestProgress(step, total)` → phase, %
8. `generateQuestBranchOptions(questState)` → branches
9. `computeNarrativeTension(step, wins, losses)` → tension

### Mémoire
10. `storeAdventureMemory(entry)` → stockage
11. `retrieveRelevantMemories(query, tags)` → récupération
12. `evaluateDecisionQuality(choice, outcome)` → score
13. `estimateStepsToFailure(gameState)` → danger

---

## 🔍 Logs et monitoring

Tous les agents loguent leurs actions :

```
[Orchestrator] Registered agent: GameMaster (Quest architect and world builder)
[Multi-Agent] Quest generation requested
[GameMaster] Generating quest for team: Pikachu (electric), Charizard (fire/flying)
[ChoiceAgent] Generating choices - Top picks: Charizard, Pikachu
[Guardian] Validating 3 choices
[Guardian] Validation complete: 3/3 valid
[Narrator] Narrating outcome - Success: true, Score: +25
```

---

## 🆚 Différences avec l'ancien système

| Aspect | Ancien système | Nouveau système multi-agent |
|--------|---------------|----------------------------|
| **Architecture** | Fonctions isolées | Agents autonomes |
| **Communication** | Aucune | Messages inter-agents |
| **Décision** | LLM seul | Vote + consensus |
| **Autonomie** | Passive (appelé) | Active (boucle P-R-A) |
| **Collaboration** | Séquentielle | Parallèle possible |
| **Négociation** | Non | Oui (multi-rounds) |
| **Mémoire** | Globale | Individuelle par agent |
| **Validation** | Post-génération | Temps réel collaborative |
| **Poids décisions** | Égal | Pondéré par expertise |

---

## 🎨 Personnalisation

### Changer de modèle par agent

```typescript
// Dans autonomous-agents.ts
export class GuardianAgent extends BaseAgent {
  constructor() {
    super({
      name: "Guardian",
      modelName: "mistral-large-latest", // ← Modèle plus puissant
      temperature: 0.2, // ← Plus analytique
      // ...
    });
  }
}
```

### Ajouter un nouvel agent

```typescript
export class StrategyAgent extends BaseAgent {
  constructor() {
    super({
      name: "Strategist",
      role: "Long-term strategy planner",
      modelName: "mistral-large-latest",
      expertise: ["strategy", "planning", "optimization"],
      canInitiate: true,
      votingWeight: 1.4,
    });
  }

  async reason(): Promise<AgentAction | null> {
    // Logique de décision
  }

  async act(action: AgentAction): Promise<any> {
    // Exécution
  }
}

// Enregistrer dans l'orchestrateur
const strategist = new StrategyAgent();
orchestrator.registerAgent(strategist);
```

---

## 🧪 Tests

Pour tester le système :

```typescript
import { getOrchestrator, resetAgentSystem } from "@/lib/ai/multi-agent-system";

// Test de vote
const orch = getOrchestrator();
const result = await orch.requestVote(
  "test",
  "Favorite event type?",
  ["battle", "exploration", "dialogue"],
  { context: "testing" },
  3000
);

console.log("Winner:", result.winner);
console.log("Consensus:", result.consensus);

// Reset
resetAgentSystem();
```

---

## 📊 Métriques

Le système enregistre :
- Temps de réponse par agent
- Taux de consensus
- Nombre de rounds de négociation
- Historique des messages (200 derniers)

Accès via :
```typescript
const history = orchestrator.getConversationHistory(50);
const agents = orchestrator.getAgents();
```

---

## 🔮 Évolutions futures possibles

1. **Apprentissage** : Agents qui s'améliorent avec l'expérience
2. **Émotions** : États internes affectant les décisions
3. **Hiérarchie** : Agent superviseur qui coordonne
4. **Spécialisation** : Modèles différents par domaine
5. **Méta-agent** : Agent qui observe et optimise les autres
6. **Parallelisme** : Exécution vraiment asynchrone
7. **Persistance** : Sauvegarder les mémoires entre sessions

---

## 📝 Migration depuis l'ancien système

**Bonne nouvelle** : Le nouveau système est **rétrocompatible** !

```typescript
// Ancien code (fonctionne toujours)
import { gameMasterGenerateQuest } from "@/lib/ai/adventure-agents";

// Nouveau code (même signature!)
import { gameMasterGenerateQuest } from "@/lib/ai/multi-agent-system";

// Aucun changement nécessaire dans votre code existant
const quest = await gameMasterGenerateQuest(params);
```

Pour utiliser les nouvelles fonctionnalités :

```typescript
// Fonctions BONUS uniquement disponibles dans le nouveau système
import { 
  collaborativeDecision,
  negotiateDecision,
  getOrchestrator 
} from "@/lib/ai/multi-agent-system";
```

---

## 🎯 Conclusion

Ce système transforme votre architecture en **véritable système multi-agent** avec :

✅ Agents autonomes (boucle Perceive-Reason-Act)  
✅ Communication inter-agents asynchrone  
✅ Vote pondéré et consensus  
✅ Négociation multi-rounds  
✅ Mémoire individuelle  
✅ Orchestration intelligente  
✅ Compatibilité API conservée  

**C'est maintenant un vrai système multi-agent ! 🎉**
