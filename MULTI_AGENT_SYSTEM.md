# 🤖 SYSTÈMES MULTI-AGENTS - Documentation Technique

## 📋 Table des Matières

1. [Vue d'ensemble](#-vue-densemble)
2. [Mode Autonomous (Classique)](#-mode-autonomous--architecture-orchestrée)
3. [Mode True MAS](#-mode-true-mas--architecture-hiérarchique)
4. [Comparaison](#-comparaison-détaillée)
5. [Architecture Technique](#-architecture-techniques-détaillées)
6. [Outils Partagés](#-outils-déterministes-partagés)
7. [Logging & Monitoring](#-logging--monitoring)
8. [Utilisation & API](#-utilisation--api-clients)

---

## 🎯 Vue d'Ensemble

Le mode **Aventure** du projet Pokédex propose **deux architectures multi-agent complètement différentes** pour explorer les systèmes distribués :

### **À Retenir**
- ✅ **Autonomous** : 4 agents égaux + orchestrateur centralisé (simple & stable)
- ✅ **True MAS** : 1 Generalist + 4 Specialists + message bus (complexe & flexible)
- ✅ **Même expérience utilisateur** mais interactions agents différentes
- ✅ **À choisir dans l'interface** lors du démarrage de l'aventure

---

## ⚡ Mode Autonomous – Architecture Orchestrée

### 📐 Architecture

```
┌────────────────────────────────────────┐
│      Agent Orchestrator (Central)      │
│         Coordonne 4 agents             │
└────────────────────────────────────────┘
         ↓↑      ↓↑      ↓↑      ↓↑
   ┌──────────┐┌──────────┐┌──────────┐┌──────────┐
   │GameMaster││ChoiceAgent││ Guardian ││ Narrator │
   │   🎲     ││    💭     ││   🛡️    ││    📖    │
   └──────────┘└──────────┘└──────────┘└──────────┘
```

### 🤖 Les 4 Agents Autonomes

#### **1. GameMasterAgent** 🎲
| Propriété | Valeur |
|-----------|--------|
| **Rôle** | Architecte de quêtes et narrateur |
| **Expertise** | `quest_design`, `world_building`, `event_generation`, `pacing` |
| **Poids vote** | 1.5 (décisions narratives importantes) |
| **Modèle** | mistral-small-latest (temp: 0.8) |
| **Autonomie** | Peut initier des conversations |

**Capacités** :
- Génère les quêtes initiales et les événements principaux
- Crée des dilemmes narratifs basés sur l'état du jeu
- Vote sur les directions narratives
- Analyse tension et survie de l'équipe

---

#### **2. ChoiceAgent** 💭
| Propriété | Valeur |
|-----------|--------|
| **Rôle** | Designer de choix & analyste d'équipe |
| **Expertise** | `choice_generation`, `tactics`, `team_analysis` |
| **Poids vote** | 1.2 (décisions de contenu modérées) |
| **Modèle** | mistral-small-latest (temp: 0.7) |
| **Autonomie** | Répond principalement aux requêtes |

**Capacités** :
- Génère 2-4 choix tactiques adaptés à l'équipe
- Analyse les meilleurs Pokémon pour chaque situation
- Demande validation au Guardian avant de proposer
- Crée des narrations immersives pour les choix

---

#### **3. GuardianAgent** 🛡️
| Propriété | Valeur |
|-----------|--------|
| **Rôle** | Validateur et analyste de risques |
| **Expertise** | `validation`, `risk_analysis`, `type_effectiveness`, `battle_simulation` |
| **Poids vote** | 1.3 (décisions de sécurité) |
| **Modèle** | mistral-small-latest (temp: 0.3 - analytique) |
| **Autonomie** | Monitore activement, envoie warnings |

**Capacités** :
- Valide la faisabilité des choix proposés
- Simule combats et calcule efficacité des types
- Alerte proactivement en cas de danger critique
- Bloque les choix suicidaires
- Vote puissamment pour la sécurité

---

#### **4. NarratorAgent** 📖
| Propriété | Valeur |
|-----------|--------|
| **Rôle** | Conteur professionnel des résultats |
| **Expertise** | `narration`, `storytelling`, `outcome_description`, `flavor_text` |
| **Poids vote** | 0.8 (décisions créatives) |
| **Modèle** | mistral-small-latest (temp: 0.75) |
| **Autonomie** | Répond aux requêtes de narration |

**Capacités** :
- Narre les résultats avec style et immersion
- Crée des hooks narratifs pour étapes futures
- Maintient cohérence narrative
- Génère textes flavor (descriptions ambiance)

---

### 🔄 Flux de Communication (Autonomous)

```
CLIENT REQUEST
      ↓
ORCHESTRATOR
 ├─→ [1] GameMaster: Génère événement
 │        ↓
 ├─→ [2] ChoiceAgent: Crée choix
 │        ↓
 ├─→ [3] Guardian: Valide
 │        ↓
 ├─→ [4] Narrator: Narre résultat
 │        ↓
 └─→ ORCHESTRATOR: Collect & format réponse
                    ↓
                CLIENT RESPONSE
```

### 🗳️ Système de Vote (Autonomous)

Utilisé pour prises de décision collectives (par ex: intensité d'événement) :

```typescript
// Exemple : Vote sur le type d'événement suivant
const voteRequest = {
  topic: "Quel type d'événement?",
  options: ["wild_battle", "trainer_encounter", "story_twist"],
  context: { difficulty: "normal", teamHP: "good" },
  timeout: 5000
};

// Chaque agent vote :
// - choice : son choix
// - confidence : 0-1 (certitude)
// - reasoning : justification
// - weight : poids automatique

// Résultat du vote :
{
  winner: "trainer_encounter",
  consensus: true,      // majority > 70%
  totalScore: 3.7,      // sum(confidence × weight)
  votes: [
    {
      agent: "GameMaster",
      choice: "trainer_encounter",
      confidence: 0.9,
      weight: 1.5,
      reasoning: "Tension narrative require interaction directe"
    },
    // ... autres votes
  ]
}
```

---

## 🔬 Mode True MAS – Architecture Hiérarchique

Le mode **True MAS** implémente une architecture plus proche de la recherche académique en systèmes multi-agents.

### 📐 Architecture

```
┌──────────────────────────────────────┐
│   GeneralistAgent (Long Reasoning)   │
│      Raisonnement Stratégique        │
│    (mistral-large-latest)            │
└──────────────────────────────────────┘
             ↓↑
        ┌────┴────────────────┐
        ↓         ↓        ↓       ↓
   [Quest]  [Tactics]  [Combat]  [Narration]
   Specialist Specialist Specialist Specialist
   (Short Reasoning - mistral-small)
        ↓         ↓        ↓       ↓
        └────┬────────────────┘
        MESSAGE BUS (Asynchrone)
             ↓↑
        Publish-Subscribe
       Decentralized Comm
```

### 🤖 Les 5 Agents True MAS

#### **Generalist Agent** 🧠
| Propriété | Valeur |
|-----------|--------|
| **Rôle** | Superviseur stratégique |
| **Modèle** | mistral-large-latest |
| **Temperature** | 0.7 |
| **Tokens max** | 2000 (long reasoning) |

**Responsabilités** :
- Raisonnement stratégique long terme
- Supervision des Specialists
- Prise de décision macro
- Adaptation de la difficulté
- Maintien cohérence narrative globale

---

#### **4 Specialist Agents** ⚙️
Chaque Specialist gère un domaine spécifique :

| Specialist | Domaine | Expertise |
|-----------|---------|-----------|
| **QuestSpecialist** | Génération d'événements | `quest_design`, `event_creation` |
| **TacticsSpecialist** | Choix d'actions | `tactics`, `choice_design` |
| **CombatSpecialist** | Simulation combats | `type_effectiveness`, `battle_sim` |
| **NarrationSpecialist** | Storytelling | `narrative`, `flavor_text` |

Chaque Specialist :
- Temperature: 0.5-0.7 (moins créatif que Generalist)
- Tokens max: 500-800 (court & efficace)
- Peut être appelé par Generalist ou directement

---

### 💬 Système de Messages (True MAS)

Le **Message Bus décentralisé** permet communication asynchrone :

```typescript
interface TrueMASMessage {
  id: string;                    // UUID unique
  from: AgentName;              // Expediteur
  to?: AgentName | "broadcast"; // Destinataire
  type: "request" | "response" | "publish" | "subscribe";
  topic: string;                // Sujet du message
  priority: "low" | "medium" | "high" | "critical";
  content: any;                 // Données
  timestamp: number;            // Unix timestamp
}
```

**Flux publier-souscrire** :

```
[Generalist] → pub("strategy_update", {difficulty: 2})
         ↓
    [Message Bus]
         ↓
    [Specialists sub]
├─→ [QuestSpecialist] : Ajuste contenu
├─→ [TacticsSpecialist] : Augmente risques
└─→ [CombatSpecialist] : Plus d'ennemis
```

---

## 📊 Comparaison Détaillée

| Aspect | **Autonomous** | **True MAS** |
|--------|---|---|
| **Architecture** | Orchestrateur centralisé | Hiérarchique + Message bus |
| **Communication** | Appels directs (requis/réponse) | Publish-Subscribe asynchrone |
| **Agents** | 4 autonomes égaux | 1 Généralist + 4 Specialists |
| **Raisonnement** | Court (0.7) contextualisé | Generalist long (0.7), Specialists court (0.5) |
| **Hiérarchie** | Plate | Pyramidale |
| **Orchestration** | Centralisée (orchestrator) | Décentralisée (message bus) |
| **Modèles** | Tous mistral-small | 1 mistral-large + 4 mistral-small |
| **Tokens** | ~500 par agent | ~2000 (Gen) + ~500 (Specs) |
| **Latence** | ✅ Rapide | ⏱️ Plus lent (async) |
| **Scalabilité** | Bonne | Excellente (facile ajouter agents) |
| **Debuggabilité** | ✅ Facile (flux linéaire) | 📊 Complexe (async) |
| **Flexibilité** | Moyenne | ✅ Haute (message bus) |
| **Coût LLM** | Moindre | Plus élevé (mistral-large) |
| **Représentativité MAS** | Arrangé pour UX | ✅ Plus académique |

---

## 🏗️ Architecture Techniques Détaillées

### Structure de Fichiers

```
src/lib/ai/
│
├─ autonomous-agents.ts          # 4 agents autonomes
├─ base-agent.ts                 # Classe abstraite agent
├─ agent-orchestrator.ts          # Orchestrateur central
├─ agent-tools.ts                # 13 outils déterministes
├─ agent-log-collector.ts        # Logging système
├─ multi-agent-system.ts         # API wrapper
│
└─ true-mas/                      # Mode True MAS
   ├─ generalist-agent.ts        # Agent Generalist
   ├─ specialist-agents.ts       # 4 agents Specialists
   ├─ mas-orchestrator.ts        # Orchestrateur True MAS
   └─ message-bus.ts             # Bus de messages
```

### Points d'Entrée API

#### Mode Autonomous
```
POST /api/adventure/start      # Démarrer aventure
POST /api/adventure/event      # Générer événement
POST /api/adventure/resolve    # Résoudre choix utilisateur
GET  /api/adventure/state      # État de jeu
```

#### Mode True MAS
```
POST /api/adventure-mas/start  # Démarrer aventure
POST /api/adventure-mas/event  # Générer événement
POST /api/adventure-mas/resolve # Résoudre choix
```

---

## 🔧 Outils Déterministes Partagés

Tous les agents (Autonomous & True MAS) ont accès aux **13 outils déterministes** :

### Combat & Types
```typescript
1. checkTypeEffectiveness(attackType, defenderTypes)
   → Returns: multiplicateur (0.25 to 4.0)

2. estimateBattleOutcome(pokemon, enemyPower, enemyTypes)
   → Returns: probabilité de victoire (0-1)

3. simulateTurnOutcome(action, pokemon, enemy, risk)
   → Returns: résultat simulé
```

### Équipe & Statut
```typescript
4. getTeamStatus(team: Pokemon[])
   → Returns: { alive: number, totalHP: number, status: string }

5. rankBestPokemonForQuest(team, context)
   → Returns: Pokemon[] trié par pertinence

6. predictTeamSurvival(gameState, stepsRemaining)
   → Returns: probabilité survie (0-1)
```

### Quête & Progression
```typescript
7. calculateQuestProgress(step, total)
   → Returns: { phase: string, percentage: number }

8. generateQuestBranchOptions(questState)
   → Returns: branches narratives possibles

9. computeNarrativeTension(step, wins, losses)
   → Returns: tension level (1-10)
```

### Mémoire & Décisions
```typescript
10. storeAdventureMemory(entry)
    → Stocke événement en mémoire agent

11. retrieveRelevantMemories(query, tags)
    → Retrouve souvenirs pertinents

12. evaluateDecisionQuality(choice, outcome)
    → Returns: qualité de décision (0-1)

13. estimateStepsToFailure(gameState)
    → Returns: steps avant défaite imminente
```

---

## 📊 Logging & Monitoring

### Console Agent en Temps Réel

Pendant une aventure, consultez les logs :

```
Onglet "Agents" :
[GameMaster] Generating quest with difficulty=2
[GameMaster] Quest: "Encounter with Dragonite"
[ChoiceAgent] Generating 3 tactics
[ChoiceAgent] Top picks: Charizard, Pikachu, Venusaur
[Guardian] Validating 3 choices
[Guardian] ✓ All choices valid, win probability > 50%
[Narrator] Narrating: "The sky darkens..."

Onglet "Tools" :
checkTypeEffectiveness(fire, [flying, water])
 → 2.0 (Fire super-effective vs Flying)
simulateTurnOutcome(Charizard.Flare Blitz, Dragonite, {risk: high})
 → Damage: 65%, enemy faints: false

Onglet "Interactions" :
[Orchestrator] Requesting vote: "Next event type?"
[GameMaster] Voted: wild_encounter (conf: 0.85)
[ChoiceAgent] Voted: trainer_battle (conf: 0.60)
[Guardian] Voted: wild_encounter (conf: 0.95)
[Narrator] Voted: wild_encounter (conf: 0.70)
[Orchestrator] Result: wild_encounter (consensus: true)
```

### Métriques Disponibles

```typescript
// Accédez aux métriques depuis l'orchestrateur
const orchestrator = getOrchestrator();

// Historique des messages
const history = orchestrator.getConversationHistory(50);

// Status des agents
const agents = orchestrator.getAgents();
agents.forEach(agent => {
  console.log(`${agent.name}: ${agent.status}`);
  console.log(`  Messages: ${agent.messageCount}`);
  console.log(`  Avg response time: ${agent.avgResponseTime}ms`);
});
```

---

## 💻 Utilisation & API Clients

### 1. Mode Autonomous (Facile)

```typescript
import { 
  gameMasterGenerateQuest,
  choiceAgentGenerateChoices,
  guardianValidateChoices,
  narratorNarrateOutcome
} from "@/lib/ai/multi-agent-system";

// Exemple: Générer événement
const event = await gameMasterGenerateQuest({
  team: [Pokemon, Pokemon, ...],
  difficulty: "normal",
  narrativeStyle: "epic",
  language: "fr"
});

// Exemple: Générer choix
const choices = await choiceAgentGenerateChoices({
  team: [Pokemon, ...],
  event: event,
  teamHP: "good"
});

// Exemple: Valider
const validated = await guardianValidateChoices({
  choices: choices,
  team: [Pokemon, ...],
  danger_level: 2
});

// Exemple: Narrer résultat
const narration = await narratorNarrateOutcome({
  choice: selectedChoice,
  outcome: outcomeData,
  narrative_style: "epic"
});
```

### 2. Mode True MAS (Avancé)

```typescript
import { TrueMASOrchestrator } from "@/lib/ai/true-mas/mas-orchestrator";

const orchestrator = new TrueMASOrchestrator();

const quest = await orchestrator.startAdventure({
  team: [Pokemon, ...],
  narrativeStyle: "epic",
  language: "fr",
  difficulty: "normal"
});

// Boucle principale
while (!quest.completed) {
  const event = await orchestrator.generateEvent();
  const choices = await orchestrator.generateChoices(event);
  
  // Utilisateur choisit...
  const outcome = await orchestrator.resolveChoice(selectedChoice);
  
  // Mise à jour état
  quest = await orchestrator.updateQuestState(outcome);
}
```

---

## 🎓 Conclusion

Ce système propose **deux approches** pour explorer les architectures multi-agent :

✅ **Autonomous** : Simple, stable, rapide - pour l'UX  
✅ **True MAS** : Complexe, flexible, académique - pour la recherche  
✅ **Même API utilisateur** - choisissez votre architecture  
✅ **Outils partagés** - reproductibilité garantie  

**Version** : 2.0 (Two MAS modes)  
**Statut** : Production-Ready ✅  
**Dernière mise à jour** : Février 2026

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
