# 🎮 Pokédex - Plateforme Interactive de Découverte & Aventure Pokémon

## 🎯 Résumé du Projet

**Pokédex** est une application web complète construite avec **Next.js 15** offrant une expérience interactive d'exploration Pokémon. Elle combine un Pokédex classique riche en données avec des systèmes multi-agents IA innovants pour le mode aventure, tout en fournissant des outils d'analyse d'équipe sophistiqués. 

Ce projet démontre les capacités de développement piloté par IA avec GitHub Copilot et implémente une véritable architecture multi-agent avec consensus et négociation.

---

## ✨ Fonctionnalités Principales

### 1. 📚 **Pokédex Interactif**
Explorez 1025+ Pokémon avec des données complètes :
- **Recherche** : Par nom (FR/EN) ou numéro
- **Fiches détaillées** : Stats, attaques, capacités, évolutions
- **Références visuelles** : Sprites normaux/shiny avec cris audio
- **Chargement progressif** : 151 premiers Pokémon au démarrage, cache intelligent

### 2. 🎮 **Mode Aventure Multi-Agent**
Vivre une aventure narrative générée dynamiquement avec deux architectures IA au choix :

#### **Mode Classique (Autonomous)** ⚡
- 4 agents spécialisés avec boucles d'autonomie Perceive-Reason-Act
- **GameMaster** : Génération de quêtes et événements narratifs
- **ChoiceAgent** : Création d'options tactiques adaptées à l'équipe
- **GuardianAgent** : Validation et analyse des risques en temps réel
- **NarratorAgent** : Narration immersive des résultats
- Orchestrateur central pour coordination fluide

#### **Mode True MAS (Multi-Agent System)** 🔬
- **Generalist Agent** : Raisonnement stratégique de haut niveau
- **4 Specialist Agents** : Exécution spécialisée avec courte réflexion
- **Message Bus décentralisé** : Communication asynchrone inter-agents
- Architecture hiérarchique proche de véritables MAS de recherche

**Fonctionnalités communes :**
- Quêtes générées par IA avec progression dynamique
- Choix tactiques adaptés à votre équipe
- Système de combat avec règles déterministes et efficacité des types
- **Console agents en temps réel** : Visualisez les interactions, votes et consensus
- Communication avec négociation multi-rounds et consensus (>70%)

### 3. 🆚 **Team Builder**
Construisez et analysez des équipes optimales :
- Jusqu'à 6 Pokémon avec gestion complète
- **Analyse automatique** : Faiblesses, résistances, couverture offensive
- Suggestions intelligentes basées sur la composition
- Prévention automtique des doublons
- **Intégration IA** : Analyse par agents Professor Chen

### 4. 🔬 **Professor Chen Multi-Agent** 👨‍🔬
Système d'analyse d'équipe 100% déterministe :
- 3 agents spécialisés (sans appels IA)
- **Composition Analyzer** : Diversité et couverture défensive
- **Strategy Evaluator** : Efficacité offensive/défensive
- **Weakness Identifier** : Points faibles et opportunités
- Calculs purs TypeScript pour reproductibilité

### 5. ⚔️ **Comparateur VS**
Analysez deux Pokémon côte à côte :
- Statistiques détaillées avec indicateurs visuels
- Matrice d'efficacité des types
- Avantages et désavantages tactiqueséconomies

### 6. 🎰 **Booster Lab**
Simulation d'ouverture de boosters Pokémon :
- Génération aléatoire de cartes
- Collectionnage avec compteurs
- Interface ludique

### 7. 🌍 **Support Multilingue**
- Interface EN/FR complète
- Noms et descriptions traduits
- Recherche dans les deux langues
- Persistance des préférences

### 8. 🎨 **Interface Moderne**
- Design responsif (mobile/tablette/desktop)
- Thème clair/sombre avec sauvegarde
- Composants UI accessibles (Radix UI)
- Animations fluides et transitions

---

## 🛠️ Stack Technologique

### Frontend
- **Next.js 15** - Framework React avec App Router
- **React 19** - Bibliothèque UI
- **TypeScript** - Typage strict et sécurité
- **Tailwind CSS** - Framework CSS utilitaire
- **Radix UI** - Composants accessibles et professionnels

### IA & Agents
- **Mistral AI API** - Modèles LLM pour génération et raisonnement
- **Architecture Multi-Agent** - Deux systèmes différents
  - **Mode Autonomous** : 4 agents avec orchestrateur central
  - **Mode True MAS** : 1 Generalist + 4 Specialists avec message bus
- **Consensus & Voting** - Système de vote pondéré (>70% pour consensus)
- **Négociation** - Multi-rounds avec révision itérative
- **Logs & Monitoring** - Console temps réel des interactions agents

### API & Données
- **PokéAPI** - Base de données Pokémon (1025+ Pokémon)
- **SWR** - Gestion smart du cache client
- **Next.js API Routes** - Routes serveur TypeScript

### Build & Qualité
- **pnpm** - Gestionnaire de paquets performant
- **ESLint** - Vérification qualité du code
- **TypeScript strict** - Configuration stricte

---

## 📁 Architecture du Projet

```
Pokemon_Projet/
├── src/
│   ├── app/                          # Pages Next.js et API routes
│   │   ├── page.tsx                 # Accueil Pokédex
│   │   ├── adventure/               # Mode aventure (sélection + jeu)
│   │   ├── pokemon/[id]/            # Fiche détails Pokémon
│   │   └── api/
│   │       ├── adventure/           # API Mode Autonomous
│   │       │   ├── start/          # Démarrer aventure
│   │       │   ├── event/          # Génération événement
│   │       │   ├── resolve/        # Résoudre choix
│   │       │   └── state/          # État de jeu
│   │       ├── adventure-mas/       # API Mode True MAS
│   │       │   ├── start/
│   │       │   ├── event/
│   │       │   └── resolve/
│   │       └── ai/                  # Endpoints IA additionnels
│   ├── components/
│   │   ├── pokemon/                 # Pokédex (liste, détails, stats)
│   │   ├── adventure/               # Mode aventure (sélecteur, jeu)
│   │   ├── team-builder/            # Team Builder & analyse
│   │   ├── comparison/              # Comparateur VS
│   │   ├── booster/                 # Booster Lab
│   │   ├── shared/                  # Composants partagés
│   │   └── ui/                      # Composants Radix UI primitifs
│   ├── lib/
│   │   ├── ai/                      # Système multi-agent
│   │   │   ├── autonomous-agents.ts    # 4 agents spécialisés
│   │   │   ├── base-agent.ts           # Classe abstraite agent
│   │   │   ├── agent-orchestrator.ts   # Orchestrateur central
│   │   │   ├── agent-tools.ts          # Outils déterministes
│   │   │   ├── multi-agent-system.ts   # API wrapper compatibilité
│   │   │   ├── true-mas/
│   │   │   │   ├── generalist-agent.ts     # Agent stratégique
│   │   │   │   ├── specialist-agents.ts    # 4 agents spécialisés
│   │   │   │   ├── mas-orchestrator.ts     # Orchestrateur MAS
│   │   │   │   └── message-bus.ts          # Bus messages décentralisé
│   │   │   ├── agent-log-collector.ts      # Logs temps réel
│   │   │   └── professor-Chen-agents.ts    # Agents déterministes
│   │   ├── adventure/               # Règles jeu
│   │   ├── api/                     # Utilitaires API
│   │   └── data/                    # Données statiques
│   ├── types/                       # Types TypeScript
│   └── hooks/                       # Hooks React
├── public/                          # Assets statiques
├── README.md                        # Vue d'ensemble (ce fichier)
├── MULTI_AGENT_SYSTEM.md           # Doc systèmes multi-agent
├── PROFESSOR_CHEN_MULTIAGENT.md    # Doc Professor Chen
├── package.json                     # Dépendances
└── tsconfig.json                    # Config TypeScript
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

## 💡 Utilisation Guide

### 🎲 Pokédex - Exploration Classique
1. **Page d'accueil** : Parcourez les 151 premiers Pokémon
2. **Recherche** : Par nom (FR/EN) ou numéro (#)
3. **Fiche Pokémon** : Stats, attaques, capacités, évolutions, cris audio
4. **Sprites** : Normal et shiny disponibles

### 🎮 Mode Aventure - Deux Architectures IA

Accédez via le bouton **ADVENTURE** dans l'en-tête de l'onglet TEAM/EQUIPE une fois une équipe créer.

#### **Mode Classique (Autonomous)** ⚡
- Architecture simple et stable
- 4 agents autonomes bien maîtrisés
- Idéal pour l'expérience utilisateur fluide
- Meilleure perfor mance en production

**Flux :**
1. Sélectionnez 3-6 Pokémon
2. Choisissez style narratif et langue
3. Lancez l'aventure
4. Prenez décisions tactiques à chaque étape
5. Consultez les logs en temps réel :
   - **Agents** : Actions des 4 agents
   - **Tools** : Appels aux outils déterministes
   - **Interactions** : Communications et votes entre agents

#### **Mode True MAS** 🔬
- Système multi-agent avancé avec recherche
- Generalist + 4 Specialists avec message bus
- Hiérarchique et décentralisé
- Meilleur pour étudier les architectures MAS

**Même flux utilisateur mais interactions agents différentes :**
- Raisonnement long du Generalist
- Coordination via message bus
- Architecture plus proche de la recherche académique

### 🆚 Comparateur
1. Bouton **VS** dans l'en-tête
2. Sélectionnez 2 Pokémon
3. Comparez stats, types et efficacité

### 🏆 Team Builder
1. Bouton **TEAM** dans l'en-tête
2. Construisez équipe de 3-6 Pokémon
3. Consultez analysis automatique :
   - Faiblesses de type
   - Résistances
   - Couverture offensive
4. Obtenez suggestions intelligentes

### 👨‍🔬 Conseil Professor Chen
Disponible dans Team Builder :
- Analyse composition avec 3 agents
- 100% déterministe (pas d'IA)
- Évaluation stratégie et faiblesses
- Reproduction garantie

---

## 🤖 Systèmes Multi-Agent

Le mode aventure propose deux architectures IA différentes pour explorer les systèmes multi-agent :

### **1. Mode Autonomous (Classique)** ⚡
Architecture orchestrée avec 4 agents spécialisés autonomes :

```
┌─────────────────────────────────────┐
│      Central Orchestrator            │
│  (Coordonne 4 agents autonomes)      │
└─────────────────────────────────────┘
         ↓↑      ↓↑      ↓↑      ↓↑
    [GameMaster] [ChoiceAgent] [Guardian] [Narrator]
       🎲          💭          🛡️          📖
```

**Agents :**
- **GameMaster** : Génère quêtes, événements, narration
- **ChoiceAgent** : Crée options tactiques adaptées à l'équipe
- **GuardianAgent** : Valide faisabilité, analyse risques, simule combats
- **NarratorAgent** : Narre les résultats avec style

**Caractéristiques :**
- Boucle Perceive-Reason-Act par agent
- Orchestrateur central = point de coordination
- Vote pondéré et consensus >70%
- Communication rapide et directe
- Facile à déboguer et modifier

### **2. Mode True MAS** 🔬
Système multi-agent hiérarchique plus classique en recherche :

```
┌──────────────────────────────┐
│   Généralist Agent           │
│ (Long Reasoning - Stratégie) │
└──────────────────────────────┘
             ↓↑
        ┌────┴───────────────────┐
        ↓         ↓         ↓       ↓
   [Specialist] [Specialist] [Specialist] [Specialist]
     Quest      Tactics      Combat       Narration
```

**Architecture :**
- 1 **Généralist** : Raisonnement stratégique long terme
- 4 **Specialists** : Exécution courte et spécialisée par domaine
- **Message Bus décentralisé** : Communication asynchrone
- Hiérarchique : Generalist supervise les Specialists

**Caractéristiques :**
- Plus proche de la recherche MAS académique
- Raisonnement long du Generalist (stratégie)
- Exécution courte des Specialists (rapidité)
- Message bus = vraie communication asynchrone
- Complexité supplémentaire mais plus flexible

### **Comparaison**

| Aspect | Autonomous | True MAS |
|--------|-----------|----------|
| **Architecture** | Orchestrateur centralisé | Hiérarchique avec message bus |
| **Agents** | 4 autonomes égaux | 1 Generalist + 4 Specialists |
| **Communication** | Appels directs via orchestrateur | Message bus asynchrone |
| **Raisonnement** | Court mais contextualisé | Generalist long, Specialists cours |
| **Complexité** | Moyenne | Haute |
| **Performance** | Rapide | Plus lente (message bus) |
| **Flexibilité** | Bonne | Excellente |
| **Apprentissage** | Idéal pour comprendre MAS | Idéal pour recherche avancée |

### **Fonctionnalités Communes**

Les deux systèmes proposent :
- ✅ Quêtes narratives générées par IA
- ✅ Choix tactiques adaptatifs
- ✅ Système de combat déterministe
- ✅ Efficacité types automatique
- ✅ Logs temps réel des interactions
- ✅ Votes et consensus
- ✅ Outils déterministes partagés

**Documentation détaillée :** Voir [MULTI_AGENT_SYSTEM.md](MULTI_AGENT_SYSTEM.md)

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

## � Points Forts du Projet

### 🚀 **Performance**
- Chargement initial < 1s (151 Pokémon)
- Chargement progressif en arrière-plan
- Cache intelligent avec SWR/revalidation
- Images optimisées Next.js

### 🎨 **UX/UI Moderne**
- Responsive design (mobile/tablette/desktop)
- Thème clair/sombre persistent
- Animations fluides et transitions
- Composants accessibles (WCAG)
- Support multilingue EN/FR

### 🏗️ **Architecture Robuste**
- TypeScript strict sur l'ensemble
- Composants React modulaires
- Séparation nette client/serveur
- API Routes type-safe
- Patterns SOLID appliqués

### 🤖 **Innovation IA**
- **Véritable système multi-agent** (pas simulation)
- **Deux architectures différentes** à explorer
- **Consensus démocratique** via vote pondéré
- **Outils déterministes** pour reproductibilité
- **Logs temps réel** des interactions agents
- Intégration **Mistral AI** pour génération

---

## 📚 Documentation Complete

Le projet inclut trois fichiers de documentation :

1. **README.md** (ce fichier)
   - Vue d'ensemble du projet
   - Guide d'installation et utilisation
   - Stack technologique
   - Architecture générale

2. **[MULTI_AGENT_SYSTEM.md](MULTI_AGENT_SYSTEM.md)**
   - Architectures complètes (Autonomous & True MAS)
   - Détails techniques de chaque agent
   - Système de communication et voting
   - Outils disponibles
   - Exemples d'utilisation

3. **[PROFESSOR_CHEN_MULTIAGENT.md](PROFESSOR_CHEN_MULTIAGENT.md)**
   - Système d'analyse d'équipe 100% déterministe
   - 3 agents spécialisés (avec logique IA)
   - Calculs stricts en TypeScript
   - Conseils stratégiques reproductibles

---

## 🔗 Ressources & Liens

- **PokéAPI** : https://pokeapi.co/ - Base de données complète Pokémon
- **Mistral AI** : https://mistral.ai/ - Modèles LLM utilisés
- **Next.js Docs** : https://nextjs.org/docs - Framework web
- **Radix UI** : https://www.radix-ui.com/ - Composants accessibles
- **Tailwind CSS** : https://tailwindcss.com/ - Framework CSS

---

## 🎯 Cas d'Usage

### Pour les Joueurs
- **Exploration complète** : Pokédex riche et interactif
- **Aventures narratives** : Quêtes générées par IA personnalisées
- **Créateur d'équipe** : Optimiser votre composition
- **Stratégie** : Analyser et améliorer votre jeu

### Pour les Développeurs
- **Apprentissage MAS** : Deux architectures à étudier
- **Prompt Engineering** : Code généré via GitHub Copilot
- **Patterns TypeScript** : Architecture moderne avec types
- **Intégration LLM** : Comment utiliser les APIs IA
- **Outils déterministes vs génératifs** : Quand les utiliser

### Pour la Recherche
- **Architecture Multi-Agent** : Étudier deux approches
- **Consensus & Negotiation** : Vote pondéré et décision
- **Log & Monitoring** : Traçabilité des interactions agents
- **Orchestration** : Centralisée vs décentralisée
- **Hybrid Agents** : IA générative + outils deterministes

---

## 📝 Notes & Crédits

- **Développement** : Piloté par IA (GitHub Copilot)
- **Architecture** : Production-ready avec patterns SOLID
- **Code** : Bien typé (TypeScript strict) et commenté
- **Backward Compatibility** : Tous les anciens systèmes conservés

---

## ⚠️ Limitations & Améliorations Futures

### Limitations Actuelles
- Aventures limitées à une session (pas de persistance)
- Modèles Mistral variables en qualité
- Rate-limiting API Mistral en mode aventure
- Mode True MAS plus experimental

### Améliorations Possibles
- [ ] Persistance des aventures (base de données)
- [ ] Support d'autres modèles LLM
- [ ] Caching des réponses agents
- [ ] Mode offline avec fallbacks
- [ ] Apprentissage des préférences utilisateur
- [ ] Intégration avec des jeux réels Pokémon
- [ ] Optimisation message bus pour True MAS
- [ ] Web3/NFTs pour collection rare

---

**Merci d'avoir exploré ce projet ! 🎮✨**

Si vous avez des questions ou suggestions, n'hésitez pas à explorer le code et contribuer !
