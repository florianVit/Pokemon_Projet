# 🤖 Générateur d'Équipe IA

## Configuration

### 1. Obtenir une clé API Mistral (GRATUIT! 🎉)

1. Allez sur [console.mistral.ai](https://console.mistral.ai)
2. Créez un compte gratuit
3. Allez dans **"API Keys"**
4. Cliquez **"Create New Key"**
5. Copiez la clé

### 2. Configurer l'environnement

Créez un fichier `.env.local` à la racine du projet:

```bash
MISTRAL_API_KEY=your-mistral-api-key-here
```

Ou utilisez le fichier `.env.example` comme modèle.

### 💰 Tarification Mistral

**Complètement GRATUIT:**
- ✅ 200 requêtes/mois gratuites
- ✅ Pas de carte bancaire requise pour le compte gratuit
- ✅ Modèle puissant: Mistral Small
- ✅ Pas de limite de temps

Parfait pour tester et développer!

## 🎮 Utilisation

### Accéder au générateur IA

1. Ouvrez le **Team Builder** (icône d'équipe)
2. Cliquez sur le bouton **AI ✨** dans le header
3. Sélectionnez vos préférences

### Options disponibles

#### 🎯 Style d'Équipe

- **Defensive** 🛡️ : Équipe avec bonnes résistances et support en défense
- **Offensive** ⚡ : Équipe avec attaques puissantes et couverture de types
- **Balanced** ⚖️ : Mélange équilibré entre offense et défense
- **Special** 🎯 : Stratégies de support et mouvements de statut

#### ❤️ Types Favoris (Optionnel)

Sélectionnez jusqu'à 6 types de Pokémon qu'elle préfère pour l'équipe:
- Normal, Feu, Eau, Électrique, Plante, Glace
- Combat, Poison, Sol, Vol, Psy, Insecte
- Roche, Spectre, Dragon, Ténèbres, Acier, Fée

## 🔄 Résultats Générés

L'IA génère:

1. **Stratégie d'équipe** : Description de la stratégie globale
2. **6 Pokémon** : Avec explication pour chacun
3. **Forces** : Points forts de l'équipe (3 max)
4. **Faiblesses** : Points faibles de l'équipe (2 max)

## 📝 Exemple Workflow

```
1. Ouvre Team Builder → AI ✨
2. Sélectionne "Balanced" comme style
3. Accorde "Fire" et "Water" comme types favoris
4. Clique "Generate Team"
5. L'IA propose une équipe optimale
6. Clique "Manual" pour voir l'équipe formée
7. Ajuste manuellement si besoin
```

## 🔧 Dépannage

### "MISTRAL_API_KEY not configured"
- Vérifiez que `.env.local` existe à la racine
- Vérifiez que `MISTRAL_API_KEY` est défini correctement
- Redémarrez le serveur de développement avec `npm run dev`

### "Invalid response from AI"
- Vérifiez votre clé API Mistral est valide
- Vérifiez que vous n'avez pas dépassé le quota gratuit (200/mois)
- Vérifiez votre connexion Internet

### L'IA retourne des Pokémon invalides
- C'est rare, mais vous pouvez revenir au mode Manual
- Sélectionnez manuellement les Pokémon

## 📚 Améliorations futures

- [ ] Mémorisation des équipes générées
- [ ] Export en JSON/PNG
- [ ] Historique des équipes
- [ ] Partage d'équipes avec d'autres joueurs
- [ ] Analyse de matchups contre les équipes adverses

---

**Besoin d'aide?** Consultez le [README principal](README.md) ou ouvrez une issue.
