# 🔒 Guide de Sécurité des Credentials

## ⚠️ SITUATION ACTUELLE : BREACH DE SÉCURITÉ

Vos credentials ont été exposés publiquement. **Actions immédiates requises**.

## 🚨 CHECKLIST DE RÉCUPÉRATION

### Étape 1 : Révoquer les clés exposées (MAINTENANT)

#### Services prioritaires (faire dans l'heure) :

**Anthropic**
1. Aller sur https://console.anthropic.com/settings/keys
2. Révoquer la clé actuelle
3. Générer une nouvelle clé
4. Mettre à jour dans `.env`

**OpenAI**
1. Aller sur https://platform.openai.com/api-keys
2. Révoquer `sk-proj-ly32eYECSkC4sKid...`
3. Créer une nouvelle clé
4. Activer les limites de dépenses si pas déjà fait

**Stripe**
1. ⚠️ **CRITIQUE** - Vérifier d'abord les transactions
2. https://dashboard.stripe.com/apikeys
3. Révoquer `sk_live_51REXsxGjhCSzv4wl...`
4. Générer nouvelle clé
5. Mettre à jour webhooks si nécessaire

**GitHub**
1. https://github.com/settings/tokens
2. Révoquer `ghp_TVVgXuLuariKHwVDrEam...`
3. Générer nouveau token avec scopes minimaux
4. Vérifier l'historique des commits récents

**Supabase** (tous les projets)
1. Projet Nexus: https://supabase.com/dashboard/project/phiduqxcufdmgjvdipyu/settings/api
2. Projet AutoScale: https://supabase.com/dashboard/project/ymwaxkvwypknfumxqhzv/settings/api
3. Projet BP Emondage: https://supabase.com/dashboard/project/tddeimkdqpnsnhqwzlnx/settings/api
4. Pour chaque projet :
   - Régénérer `service_role` key
   - Vérifier les logs d'accès
   - Activer Row Level Security si pas fait

#### Services haute priorité (faire aujourd'hui) :

- **Vercel** : https://vercel.com/account/tokens
- **Twilio** : https://console.twilio.com/
- **Resend** : https://resend.com/api-keys
- **ElevenLabs** : https://elevenlabs.io/app/settings/api-keys
- **LangSmith** : https://smith.langchain.com/settings
- **Cal.com** : https://app.cal.com/settings/developer/api-keys

#### Autres services (faire cette semaine) :

- Facebook, PostHog, Sentry, Apollo
- Upstash, Temporal, Xero, Wise
- Pinecone, Railway, Render
- Groq, Perplexity, Helicone

### Étape 2 : Vérifier les accès et activités

#### Stripe (PRIORITÉ 1)
```bash
# Vérifier les transactions des dernières 24h
# Dashboard > Payments > Filter by date
```

Chercher :
- Transactions inhabituelles
- Nouveaux clients
- Remboursements suspects

#### Supabase
```sql
-- Vérifier les requêtes récentes
SELECT * FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

#### GitHub
```bash
# Vérifier les commits récents
git log --all --since="24 hours ago" --author=".*"

# Vérifier les branches
git branch -r

# Vérifier les tags
git tag -l
```

#### Services API
Pour chaque service, vérifier :
- Logs d'API calls
- Nouvelles ressources créées
- Changements de configuration

### Étape 3 : Sécuriser vos credentials

#### 1. Utiliser un gestionnaire de mots de passe

**Recommandé : 1Password, Bitwarden, ou Vault**

```bash
# Installation 1Password CLI (exemple)
brew install --cask 1password-cli

# Stocker un secret
op item create --category=apiCredential \
  --title="OpenAI API Key" \
  --vault="Development" \
  "key=sk-proj-..."
```

#### 2. Variables d'environnement

**JAMAIS dans le code** :
```javascript
// ❌ MAUVAIS
const apiKey = "sk-proj-xyz123";

// ✅ BON
const apiKey = process.env.OPENAI_API_KEY;
```

**Structure de projet** :
```
project/
├── .env                 # ← JAMAIS committer (dans .gitignore)
├── .env.example         # ← Template sans valeurs réelles
├── .gitignore           # ← .env doit y être
└── src/
```

#### 3. Configuration .env

```bash
# Créer .env depuis le template
cp .env.example .env

# Éditer avec vos vraies valeurs (elles restent locales)
nano .env

# Vérifier que .env est ignoré par git
git status  # .env ne doit PAS apparaître
```

#### 4. Git commit safety

**Ajouter un hook pre-commit** :

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Vérifier qu'aucun .env n'est commité
if git diff --cached --name-only | grep -E '^\.env$'; then
    echo "❌ ERREUR: Tentative de commit de .env"
    echo "Les credentials ne doivent JAMAIS être committés"
    exit 1
fi

# Vérifier les secrets dans le code
if git diff --cached | grep -iE 'sk-[a-zA-Z0-9]{32,}|api_key.*=.*["\'][a-zA-Z0-9]{20,}'; then
    echo "⚠️  ATTENTION: Possible credential détecté"
    echo "Vérifiez que vous n'avez pas commis une clé API"
    read -p "Continuer quand même? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
```

```bash
chmod +x .git/hooks/pre-commit
```

### Étape 4 : Configuration MCP sécurisée

#### Ne PAS mettre de credentials dans mcp.json

**❌ MAUVAIS** :
```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_TOKEN": "ghp_actualtoken123"
      }
    }
  }
}
```

**✅ BON** :
```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

Les variables sont lues depuis l'environnement système.

### Étape 5 : Monitoring continu

#### Activer les alertes

**Stripe** :
- Activer notifications pour transactions > $X
- Alertes de remboursements

**Supabase** :
- Activer alertes d'utilisation anormale
- Monitoring des requêtes SQL

**GitHub** :
- Activer 2FA
- Notifications de push sur branches principales

**Services API** :
- Définir des quotas/limites
- Activer alertes de dépassement

#### Rotation régulière

```bash
# Créer un rappel pour rotation des clés
# Tous les 90 jours minimum

# Exemple de script de rotation
#!/bin/bash
echo "🔄 Rotation des credentials nécessaire"
echo "Services à mettre à jour:"
echo "- OpenAI"
echo "- Anthropic"
echo "- Supabase"
echo "- GitHub"
```

## 📋 Checklist de vérification quotidienne

- [ ] Vérifier `.env` dans `.gitignore`
- [ ] Pas de credentials en clair dans le code
- [ ] Variables d'env pour tous les secrets
- [ ] Logs d'accès vérifiés (services critiques)
- [ ] Aucune alerte de sécurité

## 🆘 En cas de doute

1. **Révoquer immédiatement** la clé suspecte
2. **Vérifier les logs** d'utilisation
3. **Générer nouvelle clé** avec scopes minimaux
4. **Documenter** l'incident
5. **Mettre à jour** les procédures

## 📚 Ressources

- [OWASP Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Supabase Security](https://supabase.com/docs/guides/platform/going-into-prod#security)

## ⚠️ RAPPEL IMPORTANT

**AUCUN credential ne doit JAMAIS apparaître dans** :
- Code source
- Documentation
- Commits Git
- Messages de chat
- Screenshots
- Logs publics
- Issues GitHub publiques

Utilisez TOUJOURS des variables d'environnement et gestionnaires de secrets.
