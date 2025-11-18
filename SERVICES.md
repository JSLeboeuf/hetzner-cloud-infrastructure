# Services et Infrastructure AutoScale AI

Ce document liste tous les services externes utilisés par le projet AutoScale AI.

## Infrastructure et Cloud

### Hetzner Cloud
**Objectif:** Hébergement de serveurs et infrastructure
- **Console:** https://console.hetzner.com
- **Projet:** AutoScale AI
- **Variables d'environnement:**
  - `HETZNER_API_TOKEN`
  - `HETZNER_PROJECT_ID`
  - `HETZNER_PROJECT_NAME`

### Namecheap
**Objectif:** Gestion DNS et domaines
- **Console:** https://ap.www.namecheap.com
- **Domaine principal:** autoscaleai.ca
- **Variables d'environnement:**
  - `NAMECHEAP_API_USER`
  - `NAMECHEAP_API_KEY`
  - `NAMECHEAP_USERNAME`
  - `NAMECHEAP_CLIENT_IP` (IP whitelistée)
  - `DOMAIN`

**Configuration requise:**
- Whitelist au moins 1 IP dans API Access: https://ap.www.namecheap.com/settings/tools/apiaccess/

## Base de données

### Supabase
**Objectif:** Base de données PostgreSQL et backend
- **Console:** https://supabase.com/dashboard
- **Organisation:** Jarvis
- **Projet:** AutoScale AI
- **Région:** AWS us-east-2
- **Variables d'environnement:**
  - `SUPABASE_ORG_ID`
  - `SUPABASE_PROJECT_ID`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

**État actuel:** Projet en pause - doit être réactivé pour obtenir les clés API

## Développement

### Lovable
**Objectif:** Développement no-code de l'agent IA
- **Console:** https://lovable.dev
- **Projet:** quebecois-ai-reception
- **Description:** Agent IA téléphonique pour réception automatisée
- **Variables d'environnement:**
  - `LOVABLE_PROJECT_ID`
  - `LOVABLE_PROJECT_NAME`

**Fonctionnalités:**
- Réponse instantanée 24/7
- Basé au Québec
- Intégration téléphonique

## Configuration

### Fichiers de configuration
- `.env` - Variables d'environnement locales (NON commité, protégé par .gitignore)
- `.env.example` - Template avec placeholders (SAFE pour GitHub)

### Sécurité
- Tous les credentials sont stockés dans `.env` localement
- `.env` est exclu du versioning via `.gitignore`
- Ne jamais committer de credentials réels
- Utiliser `.env.example` comme référence pour les variables requises

## Actions à compléter

1. **Namecheap:** Whitelist ton IP publique dans l'API Access
2. **Supabase:** Réactiver le projet AutoScale AI pour obtenir:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. **Lovable:** Connecter GitHub pour déploiement automatique

## Support

Pour toute question sur la configuration:
- Consulter `.env.example` pour les variables requises
- Vérifier les consoles respectives pour l'état des services
- S'assurer que tous les credentials sont à jour dans `.env` local
