# 🎮 Pokédex - Plateforme Interactive de Découverte Pokémon

## 🎯 Principe du Projet

Ce projet est réalisé entièrement via des **prompts AI** en utilisant GitHub Copilot dans l'IDE, démontrant les capacités de l'IA dans le développement logiciel moderne.

---

## 📖 Description

**Pokédex** est une application web moderne construite avec **Next.js 15** permettant d'explorer tous les Pokémon avec des informations détaillées, un mode aventure multi-agent, et des outils avancés d'analyse d'équipe.

---

## ✨ Fonctionnalités

### 1. **Pokédex Interactive**
- Liste complète de 1025+ Pokémon (toutes générations)
- Chargement rapide des 151 premiers (Kanto)
- Recherche multilingue (FR/EN) par nom ou ID
- Fiches détaillées avec stats, attaques, évolutions
- Sprites normaux et shiny avec cris audio

### 2. **Mode Aventure Multi-Agent 🤖**
- Système d'aventure narrative avec 4 agents IA autonomes
- Génération dynamique de quêtes et événements
- Choix tactiques personnalisés à votre équipe
- Système de combat avec règles déterministes
- **Agents autonomes** :
  - **GameMaster** : Génère quêtes et événements
  - **ChoiceAgent** : Crée les options tactiques
  - **GuardianAgent** : Valide cohérence et sécurité
  - **NarratorAgent** : Narre les issues
- **Logs en temps réel** : Visualisez les interactions entre agents
- Communication inter-agents avec votes et consensus
- _(Voir MULTI_AGENT_SYSTEM.md pour détails)_

### 3. **Comparateur VS**
- Comparaison côte à côte de deux Pokémon
- Analyse des statistiques avec indicateurs visuels
- Matrice d'efficacité des types

### 4. **Team Builder**
- Construction d'équipes jusqu'à 6 Pokémon
- Analyse automatique :
  - Faiblesses défensives
  - Résistances
  - Couverture offensive
- Suggestions intelligentes
- Prévention des doublons

### 5. **Professor Chen Multi-Agent 👨‍🔬**
- Analyse d'équipe par système multi-agent
- 3 agents spécialisés sans appels IA (outils déterministes)
- Conseils stratégiques personnalisés
- _(Voir PROFESSOR_CHEN_MULTIAGENT.md pour détails)_

### 6. **Booster Lab** 
- Simulation d'ouverture de boosters
- Collection de cartes avec compteurs

### 7. **Support Multilingue**
- Interface EN/FR
- Noms de Pokémon traduits
- Recherche dans les deux langues

### 8. **Interface Moderne**
- Design responsif (mobile/tablette/desktop)
- Thème clair/sombre avec persistence
- Components UI professionnels (Radix UI)
- Animations fluides

---

## 🛠️ Stack Technologique

### Frontend
- **Next.js 15** - Framework React avec App Router
- **React 19** - Bibliothèque UI
- **TypeScript** - Typage strict
- **Tailwind CSS** - Framework CSS
- **Radix UI** - Composants accessibles

### IA & Agents
- **Mistral AI API** - Modèle LLM pour agents autonomes
- **Architecture Multi-Agent** - Système P-R-A (Perceive-Reason-Act)
- **Orchestrateur** - Gestion des communications inter-agents
- **Voting System** - Consensus et négociation

### API & Données
- **PokéAPI** - Base de données Pokémon complète
- **SWR** - Gestion des données côté client

### Build
- **pnpm** - Gestionnaire de paquets
- **ESLint** - Qualité du code

---

## 📁 Structure

```
Pokemon_Projet/
├── src/
│   ├── app/                     # Pages Next.js
│   │   ├── page.tsx            # Accueil avec liste
│   │   ├── adventure/          # Mode aventure
│   │   ├── pokemon/[id]/       # Détails Pokémon
│   │   └── api/                # Routes API
│   │       └── adventure/      # API multi-agent
│   ├── components/
│   │   ├── pokemon/            # Composants Pokédex
│   │   ├── adventure/          # UI mode aventure
│   │   ├── team-builder/       # Créateur d'équipe
│   │   ├── comparison/         # Comparateur
│   │   ├── booster/            # Lab boosters
│   │   └── ui/                 # Composants génériques
│   ├── lib/
│   │   ├── ai/                 # Système multi-agent
│   │   │   ├── base-agent.ts           # Classe abstraite
│   │   │   ├── agent-orchestrator.ts   # Orchestrateur
│   │   │   ├── autonomous-agents.ts    # 4 agents
│   │   │   ├── multi-agent-system.ts   # API wrapper
│   │   │   ├── agent-log-collector.ts  # Logs UI
│   │   │   ├── agent-tools.ts          # Outils déterministes
│   │   │   └── professor-Chen-agents.ts # Agents Chen
│   │   ├── adventure/          # Règles de jeu
│   │   └── api/                # Utilitaires API
│   ├── types/                  # Types TypeScript
│   └── hooks/                  # Hooks personnalisés
├── public/                     # Assets statiques
├── README.md                   # Ce fichier
├── MULTI_AGENT_SYSTEM.md      # Doc système multi-agent
└── PROFESSOR_CHEN_MULTIAGENT.md # Doc agents Chen
```

---

## 🚀 Installation

### Prérequis
- Node.js 18.17+
- pnpm 9+
- Clé API Mistral (pour mode aventure)

### Étapes

1. **Cloner le projet**
   ```bash
   cd Pokemon_Projet
   ```

2. **Installer les dépendances**
   ```bash
   pnpm install
   ```

3. **Configuration**
   
   Créer `.env.local` :
   ```env
   MISTRAL_API_KEY=votre_cle_api_ici
   ```
   
   _Obtenez une clé gratuite sur https://console.mistral.ai/_

4. **Lancer le dev server**
   ```bash
   pnpm dev
   ```

5. **Accéder à l'app**
   ```
   http://localhost:3000
   ```

### Scripts

```bash
pnpm dev      # Développement
pnpm build    # Build production
pnpm start    # Serveur production
pnpm lint     # Vérification code
```

---

## 💡 Utilisation

### Pokédex Classique
1. Parcourez la liste sur la page d'accueil
2. Utilisez la recherche (nom FR/EN ou ID)
3. Cliquez sur un Pokémon pour voir ses détails
4. Explorez évolutions, stats, attaques

### Mode Aventure Multi-Agent
1. Accédez via le bouton **ADVENTURE** dans l'en-tête
2. Sélectionnez 3-6 Pokémon pour votre équipe
3. Choisissez style narratif et langue
4. Lancez l'aventure
5. Prenez des décisions tactiques
6. Consultez les **logs** pour voir les agents interagir
   - Onglet **Agents** : Actions des agents
   - Onglet **Tools** : Appels d'outils
   - Onglet **Interactions** : Communications inter-agents (🔄💬🗳️🚨)

### Team Builder
1. Cliquez sur **TEAM** dans l'en-tête
2. Ajoutez jusqu'à 6 Pokémon
3. Consultez l'analyse de couverture
4. Suivez les suggestions

### Comparateur VS
1. Cliquez sur **VS** dans l'en-tête
2. Sélectionnez 2 Pokémon
3. Comparez stats et types

---

## 🤖 Architecture Multi-Agent

Le mode aventure utilise un **véritable système multi-agent** avec :

- **Agents autonomes** avec boucle Perceive-Reason-Act
- **Communication asynchrone** via messages
- **Vote et consensus** pondéré (>70% pour décision)
- **Négociation** sur plusieurs rounds
- **Mémoire individuelle** par agent
- **Orchestrateur** pour coordination

**Détails complets** : Voir [MULTI_AGENT_SYSTEM.md](MULTI_AGENT_SYSTEM.md)

---

## 👨‍🔬 Professor Chen Multi-Agent

Système d'analyse d'équipe avec 3 agents spécialisés :
- **Composition Analyzer** : Analyse diversité des types
- **Strategy Evaluator** : Évalue stratégie offensive/défensive
- **Weakness Identifier** : Identifie vulnérabilités

Utilise **outils déterministes** (aucun appel IA), calculs en TypeScript pur.

**Détails complets** : Voir [PROFESSOR_CHEN_MULTIAGENT.md](PROFESSOR_CHEN_MULTIAGENT.md)

---

## 📊 Données

- **1025+ Pokémon** (toutes générations)
- **Stats complètes** (HP, Att, Def, SpA, SpD, Spe)
- **800+ Attaques** avec traductions
- **200+ Capacités** avec traductions
- **Chaînes d'évolution** complètes
- **Types et efficacités** (18 types)

Source : **PokéAPI** (https://pokeapi.co/)

---

## 🎯 Points Forts

### Performance
- Chargement initial < 1s (151 Pokémon)
- Chargement progressif arrière-plan
- Cache intelligent avec SWR
- Optimisation images Next.js

### UX/UI
- Responsive tous devices
- Thème clair/sombre
- Animations fluides
- Composants accessibles (WCAG)

### Architecture
- TypeScript strict
- Composants modulaires
- Séparation client/serveur
- API routes optimisées

### Innovation IA
- **Multi-agent autonome** véritable
- **Logs en temps réel** des interactions
- **Consensus et négociation**
- Analyse déterministe (Professor Chen)

---

## 📚 Documentation

- **README.md** : Ce fichier (vue d'ensemble)
- **MULTI_AGENT_SYSTEM.md** : Système multi-agent mode aventure
- **PROFESSOR_CHEN_MULTIAGENT.md** : Agents Professor Chen

---

## 🔗 Ressources

- **PokéAPI** : https://pokeapi.co/
- **Mistral AI** : https://mistral.ai/
- **Next.js Docs** : https://nextjs.org/docs
- **Radix UI** : https://www.radix-ui.com/

---

## 📝 Notes

- Projet réalisé via **prompts AI** (GitHub Copilot)
- Architecture **production-ready**
- Code **bien typé et commenté**
- **Backward compatible** (anciens systèmes conservés)

---

## 🎓 Apprentissages Clés

Ce projet démontre :
- Développement piloté par IA
- Architecture multi-agent avancée
- Intégration LLM dans applications web
- Systèmes de consensus et négociation
- Outils déterministes vs. génératifs
- Performance et UX modernes

---

**Bon jeu et bonne exploration ! 🎮✨**
