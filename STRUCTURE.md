# Structure du Projet Pokédex

## 📁 Organisation des Dossiers

```
Pokemon_Projet/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── page.tsx           # Page d'accueil
│   │   ├── layout.tsx         # Layout principal
│   │   ├── loading.tsx        # État de chargement
│   │   └── pokemon/           
│   │       └── [id]/          # Page de détail d'un Pokémon
│   │
│   ├── features/              # Fonctionnalités principales
│   │   ├── pokemon/           # Gestion des Pokémon
│   │   │   ├── pokemon-details.tsx
│   │   │   ├── pokemon-list.tsx
│   │   │   ├── pokemon-list-item.tsx
│   │   │   ├── evolution-chain.tsx
│   │   │   ├── moves-tab.tsx
│   │   │   ├── stat-bars.tsx
│   │   │   ├── ability-popup.tsx
│   │   │   └── index.ts       # Exports publics
│   │   │
│   │   ├── team-builder/      # Constructeur d'équipe
│   │   │   ├── team-builder.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── booster/           # Laboratoire de boosters
│   │   │   ├── booster-lab.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── comparison/        # Comparaison de Pokémon
│   │       ├── pokemon-comparison.tsx
│   │       └── index.ts
│   │
│   ├── components/            # Composants réutilisables
│   │   ├── ui/               # Composants UI de base (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   └── shared/           # Composants partagés
│   │       ├── pokedex-shell.tsx
│   │       ├── type-badge.tsx
│   │       ├── network-status.tsx
│   │       ├── boot-animation.tsx
│   │       ├── theme-provider.tsx
│   │       ├── language-provider.tsx
│   │       └── index.ts
│   │
│   ├── lib/                  # Utilitaires & services
│   │   ├── api/             # Appels API
│   │   │   ├── pokeapi.ts
│   │   │   ├── pokemon-search.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── data/            # Données statiques
│   │   │   ├── type-chart.ts
│   │   │   ├── ability-names.ts
│   │   │   ├── move-names.ts
│   │   │   └── index.ts
│   │   │
│   │   └── utils/           # Fonctions utilitaires
│   │       ├── utils.ts
│   │       └── index.ts
│   │
│   ├── hooks/               # Hooks personnalisés
│   │   ├── use-pokemon.ts
│   │   ├── use-toast.ts
│   │   └── use-mobile.ts
│   │
│   └── types/               # Types TypeScript globaux
│
├── public/                   # Assets statiques
├── components.json           # Configuration shadcn/ui
├── next.config.mjs          # Configuration Next.js
├── package.json             # Dépendances
├── tsconfig.json            # Configuration TypeScript
└── README.md                # Documentation

```

## 🎯 Conventions d'Import

Grâce aux alias de chemin configurés dans `tsconfig.json`, vous pouvez importer comme suit :

```tsx
// Fonctionnalités
import { PokemonDetails, PokemonList } from '@/features/pokemon'
import { TeamBuilder } from '@/features/team-builder'
import { BoosterLab } from '@/features/booster'
import { PokemonComparison } from '@/features/comparison'

// Composants partagés
import { PokedexShell, TypeBadge, NetworkStatus } from '@/components/shared'

// Composants UI
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// API & Services
import { getAllPokemonFast, loadRemainingPokemon } from '@/lib/api'

// Données statiques
import { typeChart } from '@/lib/data'

// Utilitaires
import { cn } from '@/lib/utils'

// Hooks
import { usePokemon } from '@/hooks/use-pokemon'
```

## 📦 Principes d'Organisation

### 1. **Features** (`src/features/`)
Contient les fonctionnalités métier regroupées par domaine. Chaque feature est autonome et peut contenir :
- Composants spécifiques
- Logique métier
- Types locaux
- Un fichier `index.ts` pour les exports publics

### 2. **Components** (`src/components/`)
- **ui/** : Composants UI de base (shadcn/ui) - réutilisables partout
- **shared/** : Composants partagés entre plusieurs features

### 3. **Lib** (`src/lib/`)
- **api/** : Toute la logique d'appel aux APIs externes
- **data/** : Données statiques, constantes, configurations
- **utils/** : Fonctions utilitaires pures

### 4. **Hooks** (`src/hooks/`)
Hooks React personnalisés réutilisables

### 5. **Types** (`src/types/`)
Définitions de types TypeScript globaux (à créer au besoin)

## 🔍 Avantages de cette Structure

✅ **Modularité** : Chaque fonctionnalité est isolée  
✅ **Scalabilité** : Facile d'ajouter de nouvelles features  
✅ **Maintenabilité** : Code organisé par domaine métier  
✅ **Imports clairs** : Grâce aux fichiers index.ts  
✅ **Standards** : Suit les best practices Next.js/React  

## 🚀 Démarrage Rapide

```bash
# Installer les dépendances
pnpm install

# Lancer le serveur de développement
pnpm dev

# Build production
pnpm build

# Lancer en production
pnpm start
```

## 📝 Notes de Migration

Tous les imports ont été mis à jour pour refléter la nouvelle structure. Les alias `@/*` pointent maintenant vers `./src/*` au lieu de `./*`.
