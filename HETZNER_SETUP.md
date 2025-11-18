# Configuration Hetzner Cloud - Guide de Sécurité

## ✅ Configuration Complète

### Installation hcloud CLI

```bash
# Installation de hcloud CLI
curl -sL https://github.com/hetznercloud/cli/releases/latest/download/hcloud-linux-amd64.tar.gz | tar xz -C /tmp
sudo mv /tmp/hcloud /usr/local/bin/hcloud

# Vérification
hcloud version
```

### Configuration Sécurisée du Token

Le token API Hetzner a été configuré de manière sécurisée :

1. **Token stocké dans `.env`** (fichier ignoré par Git)
2. **Template dans `.env.example`** (committé sur Git sans valeur réelle)
3. **Configuration hcloud** dans `~/.config/hcloud/cli.toml`

### Utilisation

```bash
# Lister les serveurs
hcloud server list

# Lister les réseaux
hcloud network list

# Vérifier le contexte actif
hcloud context list
```

## 🔒 Bonnes Pratiques de Sécurité

### ❌ À NE JAMAIS FAIRE

1. **Ne JAMAIS committer le token sur Git/GitHub**
   - Le token donne un accès COMPLET à votre infrastructure
   - Même sur un repo privé, c'est un risque de sécurité

2. **Ne JAMAIS partager le token en clair**
   - Dans des emails
   - Dans des messages Slack/Discord
   - Dans des issues GitHub
   - Dans des logs

3. **Ne JAMAIS hardcoder le token dans le code**
   ```python
   # ❌ MAUVAIS
   HETZNER_TOKEN = "HOVEvC..."

   # ✅ BON
   import os
   HETZNER_TOKEN = os.getenv('HETZNER_API_TOKEN')
   ```

### ✅ Bonnes Pratiques

1. **Utiliser des variables d'environnement**
   ```bash
   # Dans votre shell
   export HETZNER_API_TOKEN="your_token_here"

   # Ou charger depuis .env
   source .env
   ```

2. **Pour CI/CD (GitHub Actions, GitLab CI, etc.)**
   - Utiliser les secrets intégrés de la plaaforme
   - GitHub : Settings → Secrets and variables → Actions
   - GitLab : Settings → CI/CD → Variables

3. **Rotation régulière des tokens**
   - Créer un nouveau token tous les 3-6 mois
   - Révoquer les anciens tokens
   - Hetzner Console → Security → API tokens

4. **Permissions minimales**
   - Créer des tokens avec uniquement les permissions nécessaires
   - Utiliser des tokens différents pour différents environnements

## 🚨 Si le Token est Compromis

Si vous pensez que votre token a été exposé :

1. **Révoquer immédiatement le token**
   - Aller sur Hetzner Cloud Console
   - Security → API tokens
   - Supprimer le token compromis

2. **Créer un nouveau token**
   ```bash
   # Mettre à jour .env avec le nouveau token
   nano .env

   # Mettre à jour la config hcloud
   hcloud context delete autoscale-ai
   nano ~/.config/hcloud/cli.toml
   ```

3. **Vérifier les ressources**
   ```bash
   # Vérifier s'il y a des ressources non autorisées
   hcloud server list
   hcloud volume list
   hcloud network list
   ```

4. **Activer l'authentification à deux facteurs**
   - Hetzner Console → Account → Security

## 📁 Structure des Fichiers

```
/home/developer/
├── .env                      # ❌ NE PAS COMMITTER (dans .gitignore)
│   └── HETZNER_API_TOKEN=HOVEvC...
├── .env.example              # ✅ Committer (template sans valeurs)
│   └── HETZNER_API_TOKEN=your_hetzner_api_token
├── .gitignore                # ✅ Contient .env
└── ~/.config/hcloud/
    └── cli.toml              # Configuration hcloud (contient le token)
```

## 🔄 Automatisation et Scripts

Si vous utilisez le token dans des scripts :

```bash
#!/bin/bash
# script.sh

# Charger les variables d'environnement
source .env

# Utiliser le token
export HCLOUD_TOKEN="$HETZNER_API_TOKEN"
hcloud server create --name my-server --type cx11 --image ubuntu-22.04
```

## 📚 Ressources

- [Documentation Hetzner Cloud API](https://docs.hetzner.cloud/)
- [hcloud CLI GitHub](https://github.com/hetznercloud/cli)
- [Bonnes pratiques de sécurité des API keys](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password)

## ✅ Checklist de Sécurité

- [ ] Token stocké dans `.env`
- [ ] `.env` présent dans `.gitignore`
- [ ] `.env.example` créé avec des placeholders
- [ ] Token non présent dans l'historique Git
- [ ] Authentification à deux facteurs activée sur Hetzner
- [ ] Token avec permissions minimales nécessaires
- [ ] Plan de rotation des tokens en place
