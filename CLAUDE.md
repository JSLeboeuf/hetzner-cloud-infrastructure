# Directives pour Claude Code

Ce fichier définit les directives de style, les bonnes pratiques et les règles spécifiques pour ce projet.

## Style de Code

### Général
- Utilisez des noms de variables descriptifs et explicites
- Commentez le code complexe avec des explications claires
- Suivez les principes SOLID pour la conception orientée objet
- Préférez la composition à l'héritage
- Écrivez des fonctions courtes et ciblées (une seule responsabilité)

### JavaScript/TypeScript
- Utilisez TypeScript pour tous les nouveaux fichiers
- Préférez `const` et `let` à `var`
- Utilisez les fonctions fléchées pour les callbacks
- Activez le mode strict TypeScript
- Utilisez les types explicites plutôt que `any`
- Format : 2 espaces d'indentation, guillemets simples

### Python
- Suivez PEP 8 pour le style de code
- Utilisez les type hints pour toutes les fonctions
- Format : 4 espaces d'indentation
- Longueur maximale de ligne : 88 caractères (Black formatter)
- Utilisez des docstrings pour documenter les classes et fonctions

## Tests

### Exigences
- Tous les nouveaux features doivent avoir des tests
- Couverture de code minimale : 80%
- Tests unitaires pour la logique métier
- Tests d'intégration pour les API et bases de données
- Tests end-to-end pour les parcours utilisateurs critiques

### Conventions de nommage
- JavaScript/TypeScript : `describe()` et `it()` avec des descriptions claires
- Python : `test_<fonction>_<scenario>_<résultat_attendu>`

## Revue de Code

### Critères d'approbation
- Code conforme aux standards de style du projet
- Tests passants et couverture adéquate
- Pas de secrets ou credentials en dur
- Documentation à jour
- Pas de console.log ou print() de debug
- Performance optimisée (pas de boucles O(n²) évitables)

### Sécurité
- Validation de toutes les entrées utilisateur
- Protection contre XSS, CSRF, SQL injection
- Pas de dépendances avec des vulnérabilités connues
- Gestion sécurisée des erreurs (pas de stack traces exposées)
- Utilisation de variables d'environnement pour les secrets

## Architecture

### Structure de répertoires
```
project/
├── src/           # Code source
├── tests/         # Tests
├── docs/          # Documentation
├── scripts/       # Scripts utilitaires
└── config/        # Configuration
```

### Patterns recommandés
- Repository pattern pour l'accès aux données
- Service layer pour la logique métier
- Dependency injection pour la testabilité
- Factory pattern pour la création d'objets complexes

## Git et Versioning

### Commits
- Messages de commit descriptifs (présent impératif)
- Format : `type(scope): description`
  - Types : feat, fix, docs, style, refactor, test, chore
- Commits atomiques (une seule responsabilité par commit)

### Branches
- `main` : production
- `develop` : développement
- `feature/*` : nouvelles fonctionnalités
- `fix/*` : corrections de bugs
- `hotfix/*` : corrections urgentes en production

## Performance

### Optimisations
- Lazy loading pour les ressources lourdes
- Mise en cache appropriée
- Pagination pour les grandes listes
- Optimisation des requêtes base de données (indexes, N+1)
- Compression des assets (images, CSS, JS)

## Documentation

### Requis
- README.md avec instructions de setup
- CHANGELOG.md à jour
- Documentation API (OpenAPI/Swagger)
- Diagrammes d'architecture pour les systèmes complexes
- Guide de contribution (CONTRIBUTING.md)

## Bonnes Pratiques Spécifiques

### Error Handling
- Toujours gérer les erreurs explicitement
- Utiliser des custom error classes
- Logger les erreurs avec contexte suffisant
- Ne jamais laisser passer des erreurs silencieusement

### Logging
- Niveaux appropriés : DEBUG, INFO, WARN, ERROR
- Inclure contexte et métadonnées utiles
- Pas de données sensibles dans les logs
- Format structuré (JSON) pour faciliter l'analyse

### Configuration
- Variables d'environnement pour tout ce qui change entre environnements
- Fichier `.env.example` avec toutes les variables nécessaires
- Validation de la configuration au démarrage
- Pas de valeurs par défaut pour les secrets

## Dépendances

### Gestion
- Revue régulière des dépendances obsolètes
- Audit de sécurité automatisé
- Versions fixées (pas de `^` ou `~` en production)
- Documentation des raisons d'ajout de nouvelles dépendances

## Notes Supplémentaires

Ce fichier doit être adapté aux besoins spécifiques de votre projet. Mettez à jour ces directives au fur et à mesure que le projet évolue.
