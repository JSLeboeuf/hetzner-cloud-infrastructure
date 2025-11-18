# Cursor - De quoi tu te souviens ?

## Contexte et Mémoire des Assistants IA

Ce document explique ce dont un assistant IA comme Cursor se souvient lors du travail sur un projet.

## Ce dont Cursor se souvient

### 1. Contexte de Conversation
- **Historique de la session courante** : Toutes les interactions depuis le début de la session
- **Fichiers ouverts** : Les fichiers actuellement visibles dans l'éditeur
- **Sélections de code** : Le code sélectionné ou mis en surbrillance
- **Modifications récentes** : Les changements effectués pendant la session

### 2. Structure du Projet
- **Arborescence des fichiers** : Organisation des répertoires et fichiers
- **Fichiers de configuration** :
  - `package.json`, `tsconfig.json`, `.env.example`
  - Fichiers de configuration spécifiques au projet
- **Dépendances** : Bibliothèques et frameworks utilisés
- **Conventions de nommage** : Patterns observés dans le code

### 3. Contexte Technique
- **Langage(s) de programmation** : JavaScript, TypeScript, Python, etc.
- **Framework(s)** : React, Next.js, Express, FastAPI, etc.
- **Architecture** : Patterns architecturaux utilisés
- **Style de code** : Conventions de formatage et de style

### 4. Fichiers de Directives
Si présents dans le projet :
- **`.cursorrules`** : Règles spécifiques pour Cursor
- **`CLAUDE.md`** : Directives pour Claude Code
- **`README.md`** : Documentation du projet
- **Autres guides** : Documentation technique et guides de contribution

## Ce dont Cursor NE se souvient PAS

### 1. Entre les Sessions
- ❌ Conversations précédentes (sauf si explicitement référencées)
- ❌ Décisions prises dans des sessions antérieures
- ❌ Contexte qui n'est pas dans les fichiers actuels

### 2. Contexte Externe
- ❌ Bases de données en production
- ❌ Services externes non documentés dans le code
- ❌ Conversations ou décisions prises en dehors de l'éditeur

### 3. Informations Sensibles
- ❌ Mots de passe ou clés API (et c'est une bonne chose !)
- ❌ Données personnelles non présentes dans le code
- ❌ Secrets d'environnement (sauf structure dans `.env.example`)

## Comment Aider Cursor à Mieux Comprendre

### 1. Documentation dans le Projet
```markdown
# Créez ou maintenez ces fichiers :
- README.md : Vue d'ensemble du projet
- ARCHITECTURE.md : Structure technique
- CONTRIBUTING.md : Guide de contribution
- .cursorrules : Règles spécifiques pour Cursor
```

### 2. Commentaires de Code
```javascript
// ✅ Bon : Explique POURQUOI
// Utilise un cache Redis pour éviter les appels API répétés
// qui causaient des timeouts en production

// ❌ Moins utile : Explique QUOI (déjà visible)
// Crée une variable cache
```

### 3. Contexte Explicite
```markdown
# Au lieu de :
"Continue le travail sur l'authentification"

# Préférez :
"Continue l'implémentation de l'authentification JWT dans
src/auth/jwt.service.ts. Nous utilisons passport-jwt et devons
ajouter le refresh token selon la spec dans docs/auth-spec.md"
```

### 4. Fichiers de Contexte Projet

Créez un fichier `PROJECT_CONTEXT.md` avec :
```markdown
## Décisions Architecturales
- Pourquoi tel pattern ?
- Quelles alternatives ont été considérées ?
- Quelles sont les contraintes techniques ?

## Dépendances Clés
- Rôle de chaque dépendance principale
- Versions spécifiques et pourquoi

## Gotchas et Pièges
- Problèmes connus
- Solutions de contournement temporaires
- Dette technique documentée
```

## Comparaison : Cursor vs Claude Code

| Aspect | Cursor | Claude Code |
|--------|--------|-------------|
| **Contexte de fichiers** | Fichiers ouverts + @mentions | Tout le projet accessible |
| **Commandes** | Interface graphique + chat | CLI + outils spécialisés |
| **Mémoire session** | Chat dans l'éditeur | Historique de conversation |
| **Configuration** | `.cursorrules` | `CLAUDE.md` + config JSON |
| **Outils** | Édition, recherche, terminal | Read, Write, Edit, Bash, etc. |
| **Workflow** | IDE-centric | Terminal-centric |

## Meilleures Pratiques

### 1. Soyez Explicite
- ✅ Mentionnez les fichiers concernés
- ✅ Expliquez le contexte des changements
- ✅ Référencez la documentation pertinente

### 2. Maintenez la Documentation
- ✅ Mettez à jour le README après changements majeurs
- ✅ Documentez les décisions importantes
- ✅ Gardez les fichiers de directives à jour

### 3. Utilisez les Outils de Contexte
```bash
# Pour Cursor
@fichier.ts  # Mentionne un fichier spécifique
@dossier     # Inclut un dossier
@web         # Recherche web si activé

# Pour Claude Code
# Utilisez les outils Read, Grep, Glob pour donner du contexte
```

### 4. Structure de Session Efficace
```markdown
1. Donnez le contexte au début
2. Précisez les contraintes et objectifs
3. Mentionnez les fichiers pertinents
4. Indiquez les tests ou validations attendus
```

## Exemple de Prompt Optimal

```markdown
Je travaille sur l'ajout d'un système de cache Redis pour notre API.

**Contexte** :
- Projet : API REST en Express + TypeScript
- Fichiers concernés : src/services/cache.service.ts (à créer)
- Nous avons déjà Redis configuré (voir config/redis.ts)
- Architecture : Pattern Repository + Service Layer

**Objectif** :
Créer un CacheService avec :
- get(key: string): Promise<any>
- set(key: string, value: any, ttl?: number): Promise<void>
- delete(key: string): Promise<void>
- Type-safe avec générics

**Contraintes** :
- Suivre les patterns dans src/services/user.service.ts
- Tests requis dans tests/services/cache.service.test.ts
- Utiliser ioredis (déjà dans package.json)
- TTL par défaut : 300 secondes

**Références** :
- Architecture : voir ARCHITECTURE.md section "Service Layer"
- Style : voir CLAUDE.md section "TypeScript"
```

## Conclusion

Les assistants IA comme Cursor ou Claude Code sont puissants mais ont besoin de contexte. Plus vous êtes explicite et organisé dans votre projet et vos demandes, meilleurs seront les résultats.

**Principe clé** : Si un nouveau développeur humain aurait besoin de cette information, l'IA en a probablement besoin aussi.

---

*Document créé le 2025-11-16*
*Mis à jour selon les besoins du projet*
