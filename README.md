# 🎮 Pokédex - Plateforme Interactive de Découverte Pokémon

## Principe du projet

L’objectif principal du projet est de le réaliser uniquement à l’aide de prompts, grâce au chat Copilot intégré à l’IDE.

## 📖 Résumé du Projet

**Pokédex** est une application web moderne et interactive construite avec **Next.js** qui permet aux utilisateurs d'explorer et de découvrir tous les Pokémon. C'est un site de référence complet qui offre des informations détaillées sur chaque créature, incluant les statistiques, les attaques, les évolutions, et bien plus encore.

### 🎯 Objectif Principal
Créer une **Pokédex numérique** fonctionnelle et performante qui reproduit l'expérience d'une véritable encyclopédie Pokémon, avec une interface utilisateur intuitive et réactive.

---

## ✨ Fonctionnalités Principales

### 1. **Liste Complète des Pokémon**
- Affichage d'une liste explorable de tous les Pokémon
- Chargement rapide des 151 premiers Pokémon (génération Kanto)
- Chargement progressif des générations suivantes en arrière-plan
- **Recherche multilingue** : Recherche par nom français ou anglais, par ID
- Pagination "Load More" pour exploration fluide (100 Pokémon à la fois)
- Pokédex fermée par défaut pour meilleure UX

### 2. **Fiches Détaillées des Pokémon**
Chaque Pokémon dispose d'une page complète avec :
- **Images du Pokémon** : Sprites avant/arrière, variantes normales et chromatiques (shiny)
- **Cri Pokémon** : Lecture du cri audio original
- **Informations Générales** : ID, nom, type(s), taille, poids
- **Statistiques** : HP, Attaque, Défense, Attaque Spéciale, Défense Spéciale, Vitesse
- **Attaques** : Liste des mouvements avec niveaux d'apprentissage
- **Chaîne d'Évolution** : Affichage visuel de l'évolution complète avec sélection directe (sans rechargement)
- **Capacités** : Compétences spéciales y compris les capacités cachées

### 3. **Comparateur de Pokémon**
- Mode "VS" pour comparer deux Pokémon côte à côte
- Comparaison des statistiques avec indicateurs visuels (gagnant/égal/perdant)
- Analyse des types avec matrice d'efficacité
- Sélection de Pokémon via modal de recherche multilingue
- Affichage des sprites pixelisés

### 4. **Team Builder**
- Créez une équipe de jusqu'à 6 Pokémon
- Analyse automatique de la couverture de type :
  - **Faiblesses défensives** : Types contre lesquels l'équipe est vulnérable
  - **Résistances** : Types que l'équipe peut contrer efficacement
  - **Couverture offensive** : Types offensifs couverts par l'équipe
- Suggestions intelligentes pour compléter votre équipe
- Empêche les doublons
- Interface optimisée avec sprites agrandis et types redimensionnés

### 5. **Support Multilingue Complet**
- Traductions EN/FR pour l'interface et les noms de Pokémon
- Recherche fonctionnelle dans les deux langues
- Noms et descriptions adaptés selon la langue choisie
- Sélection de langue accessible dans l'en-tête

### 6. **Interface Utilisateur Moderne**
- Design responsif et adaptatif (mobile, tablette, desktop)
- Thème clair/sombre avec persistence
- Animations fluides et transitions élégantes
- Composants UI professionnels via Radix UI
- Affichage pixelisé rétro pour les sprites

### 7. **Performance Optimisée**
- Chargement initial rapide avec données pré-calculées
- Chargement progressif des données supplémentaires
- Optimisation des images
- Mise en cache intelligente avec revalidation
- useSWR pour gestion des données côté client

### 8. **Navigation Avancée**
- Barre de recherche avec support multilingue
- Liens directs vers les pages détaillées
- Paramètres d'URL pour partage facile
- Navigation contextuelle
- Sélection de Pokémon sans rechargement depuis la chaîne d'évolution

---

## 🛠️ Stack Technologique

### Frontend
- **Next.js 16** - Framework React moderne et performant
- **React 19** - Bibliothèque UI
- **TypeScript** - Langage typé pour plus de sécurité
- **Tailwind CSS** - Framework CSS utilitaire
- **Radix UI** - Composants UI accessibles et non stylisés

### Outils & Libraires
- **React Hook Form** - Gestion de formulaires
- **Date-fns** - Manipulation de dates
- **Lucide React** - Icônes SVG
- **Next-themes** - Gestion du thème clair/sombre
- **Sonner** - Notifications de style toast
- **Embla Carousel** - Carrousels responsives

### API
- **PokéAPI** - Source de données complète sur les Pokémon
  - Accessible à : https://pokeapi.co/api/v2/

### Build & Déploiement
- **pnpm** - Gestionnaire de paquets performant
- **PostCSS + Autoprefixer** - Post-traitement CSS
- **ESLint** - Linter pour la qualité du code

---

## 📁 Structure du Projet

```
Pokemon_Projet/
├── app/                          # Pages Next.js App Router
│   ├── layout.tsx               # Layout principal
│   ├── page.tsx                 # Page d'accueil avec liste
│   ├── loading.tsx              # Écran de chargement
│   ├── globals.css              # Styles globaux
│   └── pokemon/
│       └── [id]/                # Page dynamique pour chaque Pokémon
│           ├── page.tsx         # Page serveur
│           └── client.tsx       # Composant client
├── components/                   # Composants React réutilisables
│   ├── pokemon-list.tsx         # Liste affichable des Pokémon
│   ├── pokemon-details.tsx      # Affichage détaillé d'un Pokémon
│   ├── evolution-chain.tsx      # Chaîne d'évolution avec sélection
│   ├── moves-tab.tsx            # Onglet des attaques
│   ├── ability-popup.tsx        # Modal des capacités
│   ├── stat-bars.tsx            # Affichage des barres de stats
│   ├── type-badge.tsx           # Badge de type
│   ├── pokedex-shell.tsx        # Layout principal de la Pokédex
│   ├── pokemon-comparison.tsx   # Comparateur de Pokémon
│   ├── team-builder.tsx         # Créateur d'équipe avec analyse
│   ├── theme-provider.tsx       # Fournisseur de thème
│   ├── language-provider.tsx    # Fournisseur de langue (EN/FR)
│   ├── network-status.tsx       # Indicateur d'état réseau
│   ├── boot-animation.tsx       # Animation de démarrage
│   └── ui/                      # Composants UI génériques
│       ├── button.tsx, card.tsx, dialog.tsx
│       ├── tabs.tsx, input.tsx, etc.
│       └── ...
├── hooks/                        # Hooks React personnalisés
│   ├── use-pokemon.ts           # Hook pour récupérer les données Pokémon
│   ├── use-mobile.ts            # Hook pour détection mobile
│   └── use-toast.ts             # Hook pour notifications
├── lib/                          # Utilitaires et logique métier
│   ├── pokeapi.ts               # Intégration PokéAPI
│   ├── ability-names.ts         # Traduction des capacités
│   ├── move-names.ts            # Traduction des attaques
│   └── utils.ts                 # Fonctions utilitaires
├── public/                       # Fichiers statiques
├── styles/                       # Fichiers CSS supplémentaires
├── package.json                 # Dépendances du projet
├── tsconfig.json                # Configuration TypeScript
├── next.config.mjs              # Configuration Next.js
├── tailwind.config.ts           # Configuration Tailwind CSS
└── components.json              # Configuration des composants
```

---

## 🚀 Guide de Démarrage

### Prérequis
- **Node.js** 18.17+ ou **Bun**, **pnpm** 9+
- Un gestionnaire de paquets (pnpm recommandé)

### Installation

1. **Cloner/Accéder au projet**
   ```bash
   cd Pokemon_Projet
   ```

2. **Installer les dépendances**
   ```bash
   pnpm install
   ```

3. **Lancer le serveur de développement**
   ```bash
   pnpm dev
   ```

4. **Accéder à l'application**
   - Ouvrir http://localhost:3000 dans le navigateur

### Scripts Disponibles

```bash
# Développement avec hot-reload
pnpm dev

# Build pour production
pnpm build

# Lancer le serveur production
pnpm start

# Vérifier la qualité du code
pnpm lint
```

---

## 💡 Fonctionnement Principal

### Flux de Chargement des Données

1. **Chargement Rapide Initial (< 1s)**
   - 151 premiers Pokémon chargés depuis données pré-calculées
   - Affichage immédiat de l'interface

2. **Chargement Progressif en Arrière-Plan**
   - Générations suivantes chargées graduellement
   - Pas de blocage de l'interface utilisateur
   - Indicateur de progression visible

3. **Mise en Cache**
   - Données mises en cache côté client
   - Requêtes optimisées vers PokéAPI
   - Réduction de la bande passante

### Affichage des Détails d'un Pokémon

- URL paramétrisée : `/pokemon/[id]`
- Page optimisée avec génération de métadonnées SSG
- Récupération complète des données :
  - Informations de base
  - Espèce et description
  - Chaîne d'évolution complète
  - Toutes les attaques disponibles

### Comparateur de Pokémon (Mode VS)

- Accessible via le bouton "VS" dans l'en-tête
- Affichage côte à côte de deux Pokémon
- Comparaison détaillée des statistiques avec indicateurs
- Analyse complète des types (efficacités)
- Modal de sélection avec recherche multilingue
- Sprite pixelisé pour chaque Pokémon

### Team Builder (Mode TEAM)

- Accessible via le bouton "TEAM" dans l'en-tête
- Construction d'équipe jusqu'à 6 Pokémon
- Prévention automatique des doublons
- **Analyse de Couverture** :
  - Tableau des faiblesses défensives
  - Tableau des résistances
  - Matrice de couverture offensive
- **Suggestions Intelligentes** pour compléter l'équipe
- Modal de sélection avec recherche par nom (EN/FR) ou ID
- Interface optimisée : sprites agrandis (80px), types redimensionnés

### Recherche Multilingue

- Recherche par nom français (ex: "Rondoudou" pour Jigglypuff)
- Recherche par nom anglais (ex: "Pikachu")
- Recherche par ID Pokémon (ex: "25" pour Pikachu)
- Fonctionne dans :
  - Liste principale des Pokémon
  - Comparateur
  - Team Builder
- Mise en cache des noms traduits pour performance

---

## 🎨 Points Forts du Design

### Interface Utilisateur
- **Responsive** : Fonctionne parfaitement sur tous les appareils
- **Accessible** : Normes WCAG respectées
- **Moderne** : Design minimaliste et épuré
- **Thématisé** : Support clair/sombre avec sauvegarde des préférences

### Performance
- **Optimisation Image** : Utilisation de Next.js Image
- **Code Splitting** : Chargement sous demande des modules
- **Chargement Progressif** : Pas d'attente inutile
- **SEO** : Métadonnées dynamiques pour chaque Pokémon

---

## 📊 Contenu Disponible

- **Total de Pokémon** : 1025+ (toutes générations)
- **Génération Kanto** : 151 Pokémon chargés en priorité
- **Données Complètes** :
  - Statistiques de base
  - Attaques et niveaux d'apprentissage
  - Chaînes d'évolution
  - Capacités et capacités cachées
  - Descriptions en plusieurs langues
  - Images officielles (sprites et artwork)

---

## 🔗 Ressources Externes

- **PokéAPI** : https://pokeapi.co/
  - API gratuite et open-source
  - Documentation complète disponible
  - Accessible sans authentification

---

## 👨‍💻 Architecture et Bonnes Pratiques

### Composants
- Utilisation de composants fonctionnels avec hooks
- Séparation entre composants serveur et client
- Réutilisabilité maximale

### Typage
- TypeScript strict
- Types explicites pour les interfaces
- Prévention des erreurs runtime

### Organisation du Code
- Logique métier isolée dans `/lib`
- Hooks personnalisés pour la réutilisabilité
- Composants modulaires et testables

---

### Termes Clés Expliqués
- **Next.js** : Framework qui facilite la création de sites web avec React
- **TypeScript** : Version "sécurisée" du JavaScript avec vérification des erreurs
- **Tailwind CSS** : Outil pour faire des designs modernes rapidement
- **PokéAPI** : Base de données gratuite contenant toutes les infos Pokémon
- **Responsive** : Le site s'adapte automatiquement à la taille de l'écran

---

## 📝 Notes de Développement

- Le projet utilise **App Router** de Next.js (architecture moderne)
- Tous les composants sont optimisés pour performance
- Les données sont auto-mises en cache intelligemment
- L'application est production-ready

---

## 📧 Support et Questions

Pour toute question sur le fonctionnement du projet, consultez :
- La documentation Next.js : https://nextjs.org/docs
- La documentation PokéAPI : https://pokeapi.co/docs/v2
- Les fichiers source bien commentés

---

