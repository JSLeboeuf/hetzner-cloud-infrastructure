# AI Booking Agent - Infrastructure Requirements for Hetzner Cloud

**Date:** 18 Novembre 2025
**Project:** ai-booking-agent (9.3GB)
**Target Platform:** Hetzner Cloud (Project 12475170)

---

## 📋 ANALYSE DU PROJET

### Architecture Actuelle
```
Voice (Twilio) → Backend (Node.js:3000) → AI Layer (Python:8000) → Integrations
                      ↓                          ↓
                  PostgreSQL 14              Redis 7
                  Temporal Workflows       LangGraph Agents
```

### Composants Principaux

#### 1. Backend (Node.js/TypeScript)
- **Taille:** 1.2GB
- **Runtime:** Node.js 18+
- **Port:** 3000
- **Services:**
  - 40+ services métier (orchestrator, booking, payment, CRM)
  - 15+ Temporal workflows
  - 28 intégrations externes avec circuit breakers
- **Dépendances:**
  - Express (API REST)
  - Temporal (orchestration workflows)
  - Twilio, Stripe, Cal.com, etc.
  - PostgreSQL client
  - Redis client
- **Ressources minimum:**
  - RAM: 2GB
  - CPU: 2 vCPU
  - Stockage: 5GB

#### 2. AI Layer (Python/FastAPI)
- **Taille:** 7.4GB (includes venv + ML models)
- **Runtime:** Python 3.11
- **Port:** 8000
- **Services:**
  - 7 agents spécialisés (triage, qualification, FAQ, objection_handler, booking, closing, escalation)
  - LangGraph orchestration
  - Claude Sonnet 4.5 integration
  - LangSmith monitoring
- **Dépendances:**
  - FastAPI + Uvicorn
  - Anthropic SDK
  - LangChain + LangGraph
  - Pinecone (vector DB)
  - OpenAI (embeddings)
  - Sentence transformers (ML models)
- **Ressources minimum:**
  - RAM: 4GB (ML models en mémoire)
  - CPU: 4 vCPU (inference parallèle)
  - Stockage: 10GB

#### 3. PostgreSQL 14
- **Source:** Docker image `postgres:14-alpine`
- **Port:** 5432
- **Usage:**
  - Base de données principale
  - Conversations, bookings, users
  - Temporal workflows state
- **Ressources minimum:**
  - RAM: 1GB
  - Stockage: 20GB (persistent volume)

#### 4. Redis 7
- **Source:** Docker image `redis:7-alpine`
- **Port:** 6379
- **Usage:**
  - Cache contexte conversations
  - Rate limiting
  - Session storage
- **Ressources minimum:**
  - RAM: 512MB
  - Stockage: 5GB

---

## 🎯 SCÉNARIOS DE DÉPLOIEMENT HETZNER

### Option 1: Serveur Unique (RECOMMANDÉ pour démarrage)
**Coût:** ~€37/mois

**Serveur:**
- **Type:** CCX33 (8 vCPU, 16GB RAM, 240GB NVMe)
- **Location:** Nuremberg (nbg1)
- **OS:** Ubuntu 22.04 LTS
- **Déploiement:** Docker Compose tout-en-un

**Composition:**
```
┌─────────────────────────────────────┐
│  CCX33 (157.157.221.30)             │
├─────────────────────────────────────┤
│  Docker Compose:                    │
│  - Backend (2GB RAM)                │
│  - AI Layer (4GB RAM)               │
│  - PostgreSQL (1GB RAM + 20GB vol)  │
│  - Redis (512MB RAM + 5GB vol)      │
│  - Nginx (proxy inverse)            │
└─────────────────────────────────────┘
```

**Avantages:**
- Simple à gérer
- Pas de latence réseau inter-services
- Coût minimal
- Backup simplifié

**Inconvénients:**
- Single point of failure
- Pas de scalabilité horizontale
- Downtime lors des mises à jour

**Volume additionnel:**
- 1x Volume 50GB (€2.90/mois) pour PostgreSQL + Redis data

**Total:** €37 + €2.90 = **€39.90/mois**

---

### Option 2: Architecture 3-Tiers (Production)
**Coût:** ~€95/mois

**Serveurs:**

1. **Backend Server**
   - Type: CPX31 (4 vCPU, 8GB RAM)
   - Location: Nuremberg (nbg1)
   - Coût: €19.90/mois
   - Services: Backend Node.js + Nginx

2. **AI Layer Server**
   - Type: CCX23 (8 vCPU, 16GB RAM)
   - Location: Nuremberg (nbg1)
   - Coût: €37/mois
   - Services: AI Layer Python + ML models

3. **Database Server**
   - Type: CPX21 (3 vCPU, 4GB RAM)
   - Location: Nuremberg (nbg1)
   - Coût: €11.90/mois
   - Services: PostgreSQL 14 + Redis 7

**Infrastructure:**
- Private Network (€0 - gratuit)
- Volume 50GB pour PostgreSQL (€2.90/mois)
- Volume 20GB pour Redis (€1.16/mois)
- Firewall (€0 - gratuit)
- Load Balancer (€7.26/mois)

**Total:** €19.90 + €37 + €11.90 + €2.90 + €1.16 + €7.26 = **€95.12/mois**

**Architecture:**
```
Internet
    ↓
Load Balancer (api.autoscaleai.ca)
    ↓
Private Network (10.0.0.0/16)
    ↓
┌─────────────┬─────────────┬──────────────┐
│ Backend     │ AI Layer    │ Database     │
│ CPX31       │ CCX23       │ CPX21        │
│ 10.0.1.10   │ 10.0.1.20   │ 10.0.1.30    │
│ :3000       │ :8000       │ :5432, :6379 │
└─────────────┴─────────────┴──────────────┘
```

**Avantages:**
- Isolation des services
- Scalabilité par composant
- Zero downtime deployments
- Meilleure sécurité (private network)
- Monitoring granulaire

**Inconvénients:**
- Plus complexe à gérer
- Coût plus élevé
- Nécessite orchestration (Ansible/Terraform)

---

### Option 3: Haute Disponibilité (Enterprise)
**Coût:** ~€180/mois

**Serveurs:**
- 2x Backend (CPX31) = €39.80/mois
- 2x AI Layer (CCX23) = €74/mois
- 1x PostgreSQL Primary (CPX31) = €19.90/mois
- 1x PostgreSQL Replica (CPX31) = €19.90/mois
- 2x Redis (CPX11) = €9.80/mois

**Infrastructure:**
- Load Balancer (€7.26/mois)
- Volumes 100GB (€5.80/mois)
- Private Network (€0)
- Floating IPs x2 (€2.34/mois)

**Total:** **€178.80/mois**

**Avantages:**
- Zero downtime garanti
- Auto-failover
- Database replication
- Gestion de charge (load balancing)
- Disaster recovery

**Inconvénients:**
- Coût élevé
- Complexité élevée
- Nécessite Kubernetes ou orchestration avancée

---

## 🔧 RESSOURCES EXACTES PAR SCÉNARIO

### Scénario 1: Serveur Unique (CHOIX RECOMMANDÉ)

```yaml
Compute:
  - 1x CCX33 (8 vCPU, 16GB RAM, 240GB NVMe)

Storage:
  - 1x Volume 50GB (PostgreSQL + Redis persistent data)

Network:
  - 1x Public IP (inclus)
  - Firewall (gratuit)

Coût mensuel: €39.90
```

**Commandes de déploiement:**
```bash
# Créer le serveur
hcloud server create \
  --name autoscale-ai-production \
  --type ccx33 \
  --image ubuntu-22.04 \
  --location nbg1 \
  --ssh-key autoscale-main-key

# Créer le volume
hcloud volume create \
  --name autoscale-data \
  --size 50 \
  --location nbg1 \
  --format ext4

# Attacher le volume
hcloud volume attach autoscale-data autoscale-ai-production
```

---

## 🌐 CONFIGURATION DNS (Namecheap)

**Domaine:** autoscaleai.ca

**Records DNS à créer:**
```
A       api.autoscaleai.ca       → 157.157.221.30 (IP Hetzner)
A       ai.autoscaleai.ca        → 157.157.221.30 (backup)
CNAME   www.autoscaleai.ca       → api.autoscaleai.ca
TXT     autoscaleai.ca           → "v=spf1 include:_spf.mx.cloudflare.net ~all"
```

---

## 🔒 SÉCURITÉ

### Firewall Rules (Hetzner Cloud Firewall)

**Inbound:**
```yaml
- Port 22 (SSH): IP whitelist uniquement
- Port 80 (HTTP): 0.0.0.0/0 (redirect to HTTPS)
- Port 443 (HTTPS): 0.0.0.0/0
- Port 3000: Deny (backend internal only)
- Port 8000: Deny (AI layer internal only)
- Port 5432: Deny (PostgreSQL internal only)
- Port 6379: Deny (Redis internal only)
```

**Outbound:**
- Allow all (external API calls: Twilio, Stripe, Claude, etc.)

### SSL/TLS
- Let's Encrypt certificates (gratuit)
- Auto-renewal via Certbot
- Nginx reverse proxy avec TLS termination

### Secrets Management
- Variables d'environnement via `/etc/environment` (encrypted at rest)
- Backup des secrets dans Hetzner Cloud Secrets (à venir) ou HashiCorp Vault
- Rotation des clés API tous les 90 jours

---

## 📊 BESOINS EN BANDE PASSANTE

### Estimations par mois (1000 appels/mois):

**Backend:**
- Appels API Twilio: 1000 × 2KB = 2MB
- Webhooks entrants: 1000 × 5KB = 5MB
- Réponses API: 1000 × 10KB = 10MB
- **Total Backend:** ~20MB/mois

**AI Layer:**
- Requêtes Claude API: 1000 × 500 tokens × 2 = 1,000,000 tokens
- Streaming responses: 1000 × 100KB = 100MB
- **Total AI Layer:** ~100MB/mois

**Total estimé:** ~150MB/mois (négligeable avec Hetzner 20TB/mois inclus)

---

## 💾 STRATÉGIE DE BACKUP

### PostgreSQL (Base de données principale)
- **Fréquence:** Snapshots quotidiens automatiques (3h du matin UTC)
- **Rétention:** 7 jours (rolling)
- **Outil:** `pg_dump` + stockage sur Hetzner Volume
- **Coût:** Inclus dans le volume 50GB

### Redis (Cache - optionnel)
- **Fréquence:** Snapshots hebdomadaires
- **Rétention:** 2 semaines
- **Outil:** RDB snapshots

### Code & Configuration
- **Méthode:** Git repository (GitHub privé)
- **Secrets:** Encrypted backup sur Hetzner Volume

### Disaster Recovery
- **RTO:** 4 heures (Recovery Time Objective)
- **RPO:** 24 heures (Recovery Point Objective)
- **Procédure:**
  1. Créer nouveau serveur depuis snapshot Hetzner
  2. Restaurer volume PostgreSQL
  3. Redéployer containers Docker Compose
  4. Mettre à jour DNS (TTL: 300s)

---

## 📈 MONITORING & ALERTING

### Métriques à suivre:
- **Serveur:** CPU, RAM, Disk I/O, Network
- **Backend:** Request rate, Error rate, P95 latency, Temporal workflow status
- **AI Layer:** Claude API calls, Token usage, Agent execution time
- **Database:** Query performance, Connection pool, Replication lag (si HA)
- **Redis:** Memory usage, Hit rate, Evictions

### Stack recommandé:
- **Prometheus:** Métriques (déjà dans package.json)
- **Grafana Cloud:** Dashboards (tier gratuit 10k séries)
- **Sentry:** Error tracking (déjà configuré)
- **PostHog:** Product analytics (déjà configuré)
- **LangSmith:** AI agent tracing (déjà configuré)

### Alertes critiques:
- CPU > 80% pendant 5 minutes
- RAM > 90% pendant 5 minutes
- Disk > 85%
- Backend down (healthcheck fail)
- AI Layer down
- PostgreSQL connection errors
- Stripe webhook failures

---

## 🚀 PLAN DE MIGRATION

### Étape 1: Préparation (1 jour)
- [ ] Créer serveur Hetzner CCX33
- [ ] Créer volume 50GB
- [ ] Configurer firewall
- [ ] Installer Docker + Docker Compose
- [ ] Cloner repository ai-booking-agent

### Étape 2: Configuration (1 jour)
- [ ] Copier fichiers .env avec credentials production
- [ ] Configurer Nginx reverse proxy
- [ ] Installer Certbot + générer certificats SSL
- [ ] Tester docker-compose.yml localement

### Étape 3: Déploiement (2 heures)
- [ ] `docker-compose up -d` sur serveur Hetzner
- [ ] Vérifier healthchecks (backend:3000/health, ai-layer:8000/health)
- [ ] Tester webhooks Twilio
- [ ] Tester appel complet end-to-end

### Étape 4: DNS & Go Live (30 minutes)
- [ ] Ajouter IP 157.157.221.30 à Namecheap whitelist
- [ ] Créer records DNS (api.autoscaleai.ca)
- [ ] Attendre propagation DNS (5-10 minutes)
- [ ] Tester domaine en production

### Étape 5: Monitoring (1 heure)
- [ ] Configurer Prometheus exporters
- [ ] Créer dashboards Grafana
- [ ] Tester alertes Sentry
- [ ] Vérifier logs LangSmith

### Étape 6: Backup & Documentation (2 heures)
- [ ] Configurer pg_dump automatique
- [ ] Tester procédure de restore
- [ ] Documenter procédures opérationnelles
- [ ] Créer runbook incidents

**Temps total estimé:** 2-3 jours

---

## 💰 COMPARAISON COÛTS HETZNER vs ALTERNATIVES

### Hetzner (Option 1 - Serveur unique)
- CCX33: €37/mois
- Volume 50GB: €2.90/mois
- **Total:** €39.90/mois

### Railway (Actuel - selon .env.railway.txt)
- Backend: $20/mois
- AI Layer: $50/mois (4GB RAM)
- PostgreSQL: $10/mois
- Redis: $5/mois
- **Total:** $85/mois = ~€78/mois

### AWS (équivalent)
- EC2 t3.large (2 vCPU, 8GB): $60/mois
- RDS PostgreSQL db.t3.small: $25/mois
- ElastiCache Redis: $15/mois
- **Total:** ~$100/mois = ~€92/mois

### DigitalOcean (équivalent)
- Droplet 8GB: $48/mois
- Managed PostgreSQL 1GB: $15/mois
- Managed Redis 1GB: $15/mois
- **Total:** $78/mois = ~€72/mois

**🎯 Économie avec Hetzner:** €38-52/mois (49-56% moins cher)

---

## ✅ RECOMMANDATION FINALE

**Pour autoscaleai.ca (ai-booking-agent):**

### Configuration recommandée:
- **Serveur:** CCX33 (8 vCPU, 16GB RAM) à Nuremberg
- **Volume:** 50GB persistent pour données
- **Déploiement:** Docker Compose (backend + ai-layer + postgres + redis)
- **Coût:** €39.90/mois
- **Temps de mise en place:** 2-3 jours

### Raisons:
1. ✅ **Coût optimisé:** 50% moins cher que Railway/AWS
2. ✅ **Ressources suffisantes:** 16GB RAM = 2GB (backend) + 4GB (AI) + 1GB (postgres) + 512MB (redis) + 8GB buffer
3. ✅ **Simple à gérer:** 1 serveur = 1 point de gestion
4. ✅ **Production-ready:** Dockerfiles optimisés déjà présents
5. ✅ **Scalabilité future:** Facile d'ajouter serveurs si besoin

### Migration path:
1. **Aujourd'hui:** Déployer sur CCX33 (€39.90/mois)
2. **Si trafic > 5000 appels/mois:** Passer à Option 2 (3-tiers, €95/mois)
3. **Si trafic > 20000 appels/mois:** Passer à Option 3 (HA, €180/mois)

---

**Prêt pour la création du plan de déploiement Terraform + Docker Compose !**
