# Architecture de Déploiement AI Booking Agent sur Hetzner Cloud

**Date:** 18 Novembre 2025
**Version:** 1.0
**Statut:** Production-Ready

---

## 📐 VUE D'ENSEMBLE

### Architecture Actuelle (Locale/Railway)
```
┌─────────────────────────────────────────────────────────────────────┐
│                         DÉVELOPPEMENT LOCAL                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐        │
│  │  Backend     │◄───┤  PostgreSQL  │    │   Redis      │        │
│  │  Node.js     │    │  14-alpine   │    │   7-alpine   │        │
│  │  :3000       │    │  :5432       │    │   :6379      │        │
│  └──────────────┘    └──────────────┘    └──────────────┘        │
│         ▲                                                          │
│         │                                                          │
│         ▼                                                          │
│  ┌──────────────┐                                                 │
│  │  AI Layer    │                                                 │
│  │  Python 3.11 │                                                 │
│  │  :8000       │                                                 │
│  └──────────────┘                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Architecture Cible (Hetzner Cloud Production)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         INTERNET (USERS & APIs)                              │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
                   ┌────────────────────────────────┐
                   │   DNS (Namecheap)              │
                   │   api.autoscaleai.ca           │
                   │   → 157.157.221.30             │
                   └────────────────┬───────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      HETZNER CLOUD FIREWALL                                  │
│  Inbound: 22 (SSH), 80 (HTTP), 443 (HTTPS)                                  │
│  Outbound: All (external API calls)                                          │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  HETZNER SERVER: autoscale-ai-production (CCX33)                            │
│  8 vCPU | 16GB RAM | 240GB NVMe | Ubuntu 22.04 LTS                          │
│  Location: Nuremberg (nbg1)                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    NGINX REVERSE PROXY                               │   │
│  │  :80 → :443 (redirect) | :443 (SSL/TLS termination)                │   │
│  │  Let's Encrypt certificates | Rate limiting | Gzip                  │   │
│  └─────────────────┬───────────────────────────────────────────────────┘   │
│                    │                                                         │
│       ┌────────────┴────────────┐                                           │
│       ▼                         ▼                                           │
│  ┌──────────────┐         ┌──────────────┐                                 │
│  │  Backend     │         │  AI Layer    │                                 │
│  │  (Docker)    │◄───────►│  (Docker)    │                                 │
│  │  Node.js     │         │  Python 3.11 │                                 │
│  │  :3000       │         │  :8000       │                                 │
│  │  2GB RAM     │         │  4GB RAM     │                                 │
│  └──────┬───────┘         └──────┬───────┘                                 │
│         │                        │                                          │
│         │    Backend Network     │                                          │
│         │    (Internal Only)     │                                          │
│         ▼                        ▼                                          │
│  ┌──────────────┐         ┌──────────────┐                                 │
│  │  PostgreSQL  │         │   Redis      │                                 │
│  │  (Docker)    │         │   (Docker)   │                                 │
│  │  14-alpine   │         │   7-alpine   │                                 │
│  │  :5432       │         │   :6379      │                                 │
│  │  1GB RAM     │         │   512MB RAM  │                                 │
│  └──────┬───────┘         └──────────────┘                                 │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────┐                               │
│  │  PERSISTENT VOLUME (50GB ext4)          │                               │
│  │  /mnt/data/postgres/ (20GB)             │                               │
│  │  /mnt/data/redis/ (5GB)                 │                               │
│  │  /mnt/data/backups/ (25GB)              │                               │
│  └─────────────────────────────────────────┘                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES & APIs                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│  • Claude Sonnet 4.5 (Anthropic)   • Twilio (Voice/SMS)                    │
│  • Cal.com (Booking)                • Stripe (Payments)                     │
│  • Supabase (Additional DB)         • Temporal Cloud (Workflows)            │
│  • LangSmith (AI Monitoring)        • Sentry (Error Tracking)               │
│  • PostHog (Analytics)              • 20+ other integrations                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUX DE DONNÉES

### 1. Appel Entrant (Twilio Voice)
```
User Phone Call
    ↓
Twilio (receives call)
    ↓
Webhook → HTTPS://api.autoscaleai.ca/api/webhooks/twilio
    ↓
Nginx (SSL termination, rate limiting)
    ↓
Backend :3000 (receives webhook)
    ↓
Backend → AI Layer :8000 (process conversation)
    ↓
AI Layer (7 agents orchestration via LangGraph)
    ├─ Triage Agent (determine intent)
    ├─ Qualification Agent (gather info)
    ├─ FAQ Agent (answer questions)
    ├─ Objection Handler (handle objections)
    ├─ Booking Agent (check calendar, create booking)
    ├─ Closing Agent (confirm and close)
    └─ Escalation Agent (if needed)
    ↓
AI Layer → Claude Sonnet 4.5 API (anthropic.com)
    ↓
AI Layer → Backend (return response)
    ↓
Backend → PostgreSQL (save conversation state)
Backend → Redis (cache context)
    ↓
Backend → Twilio (send voice response)
    ↓
User hears response
```

### 2. Booking Workflow (Temporal)
```
Booking Agent → Backend :3000
    ↓
Backend triggers Temporal Workflow
    ↓
Temporal Activities (sequential execution):
    1. Check Cal.com availability
    2. Reserve time slot
    3. Create Stripe payment intent
    4. Send confirmation email (Resend)
    5. Update CRM (Supabase)
    6. Log to LangSmith
    ↓
Workflow Success → Update PostgreSQL
    ↓
Notify user via Twilio
```

### 3. Monitoring & Logging
```
All Services
    ↓
    ├─ Errors → Sentry (real-time alerts)
    ├─ Metrics → Prometheus (system metrics)
    ├─ AI Traces → LangSmith (conversation flows)
    ├─ Analytics → PostHog (user behavior)
    └─ Logs → Winston/Structlog → Docker logs
                ↓
            Grafana Cloud (dashboards)
```

---

## 🐳 ARCHITECTURE DOCKER

### Docker Compose Services

#### Backend Service
```yaml
Image: Node.js 20-alpine (multi-stage build)
Resources: 2GB RAM, 2 vCPU
Ports: 3000 (internal only)
Health: GET /health every 30s
Dependencies: PostgreSQL, Redis
Environment: Production (.env file)
Restart: unless-stopped
```

#### AI Layer Service
```yaml
Image: Python 3.11-slim (multi-stage build)
Resources: 4GB RAM, 4 vCPU
Ports: 8000 (internal only)
Health: GET /health every 30s
Dependencies: Redis, Backend
Workers: 4 Gunicorn workers + Uvicorn
Restart: unless-stopped
```

#### PostgreSQL Service
```yaml
Image: postgres:14-alpine
Resources: 1GB RAM, shared vCPU
Ports: 5432 (internal only)
Volume: /mnt/data/postgres (persistent)
Health: pg_isready every 10s
Backup: pg_dumpall daily at 3 AM
```

#### Redis Service
```yaml
Image: redis:7-alpine
Resources: 512MB RAM, shared vCPU
Ports: 6379 (internal only)
Volume: /mnt/data/redis (persistent)
Persistence: AOF (append-only file)
Health: redis-cli ping every 10s
```

#### Nginx Service
```yaml
Image: nginx:alpine
Resources: 256MB RAM, shared vCPU
Ports: 80, 443 (public)
Volumes:
  - nginx.conf (config)
  - /etc/letsencrypt (SSL certs)
Reverse Proxy: /api/* → backend:3000
               /ai/* → ai-layer:8000
Rate Limiting: 100 req/min per IP
```

### Docker Networks

**Frontend Network** (public-facing):
- Nginx
- Backend
- AI Layer

**Backend Network** (internal only):
- Backend
- AI Layer
- PostgreSQL
- Redis

---

## 🔐 SÉCURITÉ

### Layers de Sécurité

#### Layer 1: Hetzner Cloud Firewall
- Inbound: Ports 22, 80, 443 uniquement
- Outbound: Tous (pour appels API externes)
- Protection DDoS niveau réseau
- IP whitelisting pour SSH (recommandé)

#### Layer 2: UFW (Ubuntu Firewall)
- Deny all incoming par défaut
- Allow 22, 80, 443
- Fail2Ban pour brute force SSH

#### Layer 3: Docker Networks
- Backend network: internal only (pas d'accès internet direct)
- PostgreSQL et Redis: isolés du public
- Seul Nginx expose des ports publics

#### Layer 4: Nginx
- Rate limiting: 100 req/min
- SSL/TLS 1.2+ uniquement
- HTTP/2 activé
- Security headers (HSTS, X-Frame-Options, CSP)
- Gzip compression

#### Layer 5: Application
- Validation inputs (Zod schemas)
- Webhook HMAC validation (Twilio, Stripe)
- Circuit breakers (Opossum) pour tous les appels API
- JWT pour authentification
- PII encryption (phone numbers)
- No secrets in code (all in .env)

### Secrets Management

**Development:**
- `.env` local (gitignored)
- `.env.example` committed (no real values)

**Production:**
- `/opt/autoscale-ai/.env` (chmod 600, root only)
- Encrypted backup daily in `/mnt/data/backups/`
- Rotation schedule: 90 jours

**Critical Secrets:**
```
ANTHROPIC_API_KEY      (Claude AI)
STRIPE_SECRET_KEY      (Payments - LIVE)
TWILIO_AUTH_TOKEN      (Voice)
SUPABASE_SERVICE_ROLE_KEY (Database full access)
POSTGRES_PASSWORD      (Local DB)
REDIS_PASSWORD         (Cache)
JWT_SECRET             (Authentication)
ENCRYPTION_KEY         (PII data)
```

---

## 📊 RESSOURCES & CAPACITÉ

### Allocation Mémoire (Total: 16GB)

```
Component          | Allocation | % Total | Notes
-------------------|------------|---------|---------------------------
Backend            | 2GB        | 12.5%   | Express + Node.js runtime
AI Layer           | 4GB        | 25%     | ML models (LangChain, embeddings)
PostgreSQL         | 1GB        | 6.25%   | Shared buffers + cache
Redis              | 512MB      | 3.2%    | In-memory cache
Nginx              | 256MB      | 1.6%    | Minimal footprint
System (Ubuntu)    | 2GB        | 12.5%   | OS + Docker daemon
Free Buffer        | 6.2GB      | 38.75%  | Available for bursts
-------------------|------------|---------|---------------------------
TOTAL              | 16GB       | 100%    |
```

### Allocation CPU (Total: 8 vCPU)

```
Component          | Priority | Cores | Notes
-------------------|----------|-------|---------------------------
AI Layer           | High     | ~4    | Gunicorn 4 workers + inference
Backend            | Medium   | ~2    | Node.js cluster mode
PostgreSQL         | Medium   | ~1    | Query processing
Redis + Nginx      | Low      | ~0.5  | Lightweight services
System overhead    | -        | ~0.5  | Docker, OS processes
```

### Stockage (Total: 50GB Volume + 240GB NVMe)

**Volume Persistent (/mnt/data):**
```
/mnt/data/postgres/    20GB    (database files)
/mnt/data/redis/       5GB     (RDB snapshots + AOF)
/mnt/data/backups/     25GB    (7 days retention)
```

**NVMe Local (240GB):**
```
/                      10GB    (OS + packages)
/opt/autoscale-ai/     15GB    (application code + node_modules + venv)
/var/lib/docker/       30GB    (Docker images + layers)
Free space             185GB   (logs, temporary files, buffer)
```

### Bande Passante

**Inclus:** 20TB/mois (Hetzner)

**Estimation mensuelle (1000 appels):**
- API calls: ~20MB
- AI streaming responses: ~100MB
- Webhook traffic: ~50MB
- Logs & monitoring: ~30MB

**Total:** ~200MB/mois (0.001% de 20TB)

---

## 🔄 SCALABILITÉ

### Scalabilité Verticale (Upgrade serveur)

**Scénario de croissance:**

**Phase 1: 0-5K appels/mois**
- Serveur: CCX33 (8 vCPU, 16GB RAM) - **€37/mois**
- Statut: Actuel, suffisant

**Phase 2: 5K-20K appels/mois**
- Serveur: CCX43 (16 vCPU, 32GB RAM) - **€75/mois**
- Action: `hcloud server change-type autoscale-ai-production ccx43`
- Downtime: ~2 minutes (pendant le resize)

**Phase 3: 20K-50K appels/mois**
- Passer à architecture 3-tiers (voir option 2 dans requirements)
- Backend: CPX31 (€19.90)
- AI Layer: CCX23 x2 (€74)
- Database: CPX31 (€19.90)
- Load Balancer: €7.26
- **Total: €121/mois**

**Phase 4: 50K+ appels/mois**
- Kubernetes cluster (kube-hetzner)
- Auto-scaling horizontal
- Multi-region deployment
- **Coût: €200-400/mois**

### Scalabilité Horizontale (Multi-serveur)

**Option: Load Balanced Backend**
```
Load Balancer
    ↓
    ├─ Backend Server 1 (CPX31)
    ├─ Backend Server 2 (CPX31)
    └─ Backend Server 3 (CPX31)
            ↓
    AI Layer (CCX23 x2)
            ↓
    Database Cluster (Primary + Replica)
```

**Coût:** ~€180/mois
**Capacité:** 100K+ appels/mois

---

## 💾 BACKUP & DISASTER RECOVERY

### Stratégie de Backup

#### Backup Automatique (Script daily)

**PostgreSQL:**
- Fréquence: Quotidien (3h AM UTC)
- Méthode: `pg_dumpall` → gzip
- Rétention: 7 jours (rolling)
- Localisation: `/mnt/data/backups/postgres_YYYYMMDD.sql.gz`
- Taille estimée: ~500MB compressé

**Redis:**
- Fréquence: Quotidien (3h AM UTC)
- Méthode: RDB snapshot
- Rétention: 7 jours
- Localisation: `/mnt/data/backups/redis_YYYYMMDD.rdb`
- Taille estimée: ~100MB

**Credentials (.env):**
- Fréquence: Quotidien
- Méthode: Copy (encrypted at rest)
- Rétention: 7 jours
- Localisation: `/mnt/data/backups/env_YYYYMMDD`

#### Backup Hetzner (Serveur complet)

- Fréquence: Automatique (Hetzner schedule)
- Méthode: Snapshot complet du serveur
- Rétention: 7 snapshots
- Coût: €7.40/mois (20% prix serveur)
- Restauration: Nouveau serveur from snapshot (~5 min)

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 4 heures
**RPO (Recovery Point Objective):** 24 heures

**Scénario 1: Perte de données (corruption DB)**
```
1. Identifier backup le plus récent (max 24h)
2. Arrêter services: docker-compose down
3. Restaurer PostgreSQL: restore.sh YYYYMMDD_HHMMSS
4. Redémarrer services: docker-compose up -d
5. Vérifier healthchecks
Total: ~30 minutes
```

**Scénario 2: Perte serveur complet**
```
1. Créer nouveau serveur from Hetzner snapshot
2. Ou: déployer new serveur with Terraform
3. Monter volume persistent (data survives)
4. Restaurer .env from backup
5. Redéployer containers: deploy.sh
6. Mettre à jour DNS (si nouvelle IP)
Total: ~2-4 heures
```

**Scénario 3: Perte datacenter (Nuremberg)**
```
1. Déployer dans nouveau datacenter (Falkenstein/Helsinki)
2. Restaurer from offsite backup (si configuré)
3. Mettre à jour DNS
4. Tester end-to-end
Total: ~4-8 heures
```

---

## 📈 MONITORING & ALERTING

### Métriques Système

**Collectées par:**
- Prometheus (node_exporter)
- Docker stats
- PostgreSQL metrics
- Redis INFO

**Métriques clés:**
```
System:
  - cpu_usage_percent < 80%
  - memory_usage_percent < 90%
  - disk_usage_percent < 85%
  - network_rx_bytes, network_tx_bytes

Containers:
  - container_cpu_usage
  - container_memory_usage
  - container_restarts (should be 0)

PostgreSQL:
  - pg_stat_database (connections, transactions)
  - pg_locks (deadlocks)
  - pg_stat_activity (active queries)

Redis:
  - redis_memory_used_bytes
  - redis_connected_clients
  - redis_keyspace_hits_total / keyspace_misses_total
```

### Métriques Application

**Backend (Express + Temporal):**
- Request rate (req/s)
- Response time (p50, p95, p99)
- Error rate (%)
- Temporal workflow status (running, completed, failed)
- Circuit breaker status (open/closed)

**AI Layer (LangGraph agents):**
- Agent invocations
- Claude API calls
- Token usage (input/output)
- Agent execution time
- Conversation completion rate

**External APIs:**
- Twilio call duration
- Cal.com booking success rate
- Stripe payment success rate
- Supabase query latency

### Alerting Rules

**Critical (PagerDuty/Email immédiat):**
- Service down (healthcheck fail > 2 min)
- CPU > 90% pendant 5 min
- Memory > 95%
- Disk > 90%
- Error rate > 5%
- PostgreSQL connections exhausted

**Warning (Email):**
- CPU > 80% pendant 15 min
- Memory > 85%
- Disk > 80%
- Response time p95 > 2s
- Circuit breaker opened

**Info (Dashboard only):**
- Deployment completed
- Backup completed
- Certificate renewal

### Dashboard (Grafana)

**Panels:**
1. System overview (CPU, RAM, Disk, Network)
2. Container status (all services green/red)
3. Request rate & latency (time series)
4. Error rate & types (pie chart)
5. Database performance (connections, queries/s)
6. AI agent performance (invocations, success rate)
7. Cost tracking (API usage, Hetzner billing)

---

## 🔄 CI/CD PIPELINE (Future)

### GitHub Actions Workflow

```yaml
name: Deploy to Hetzner

on:
  push:
    branches: [main]

jobs:
  test:
    - Run npm test
    - Run pytest (AI layer)
    - Code coverage > 80%

  build:
    - Build Docker images
    - Push to registry (GHCR)

  deploy:
    - SSH to Hetzner server
    - Pull latest images
    - Run deploy.sh
    - Health check
    - Rollback if fail

  notify:
    - Post to Slack
    - Update status page
```

---

## 📝 RUNBOOK - PROCÉDURES OPÉRATIONNELLES

### Déploiement Initial

**Checklist complète:**
```bash
# 1. Infrastructure
cd hetzner-deployment/terraform/
terraform init
terraform apply
# Note l'IP du serveur

# 2. DNS
# Ajouter record A: api.autoscaleai.ca → SERVER_IP
# Attendre propagation (nslookup api.autoscaleai.ca)

# 3. SSH Setup
ssh root@SERVER_IP
# Vérifier: Docker installé, volume monté

# 4. Application
scp .env root@SERVER_IP:/opt/autoscale-ai/.env
scp -r docker/ root@SERVER_IP:/opt/autoscale-ai/
ssh root@SERVER_IP /opt/autoscale-ai/docker/scripts/deploy.sh

# 5. SSL
ssh root@SERVER_IP
certbot certonly --standalone -d api.autoscaleai.ca --email YOUR_EMAIL

# 6. Tests
curl https://api.autoscaleai.ca/health
# Tester appel Twilio complet

# 7. Monitoring
# Vérifier Sentry, LangSmith, PostHog reçoivent des événements
```

### Mise à Jour Application

```bash
# Zero-downtime deployment
ssh root@SERVER_IP

cd /opt/autoscale-ai/ai-booking-agent
git pull origin main

# Rebuild images
docker-compose -f docker/docker-compose.prod.yml build

# Rolling restart (une par une)
docker-compose -f docker/docker-compose.prod.yml up -d --no-deps --build backend
sleep 30 # Wait for health
docker-compose -f docker/docker-compose.prod.yml up -d --no-deps --build ai-layer

# Verify
docker-compose ps
docker-compose logs --tail=100
```

### Debug Common Issues

**Issue: Backend ne démarre pas**
```bash
# Check logs
docker logs autoscale-backend

# Common causes:
# - .env missing/malformed
# - PostgreSQL not ready (wait 30s)
# - Port 3000 already in use

# Fix:
docker-compose down
docker-compose up -d postgres redis
sleep 30
docker-compose up -d backend
```

**Issue: High CPU usage**
```bash
# Identify culprit
docker stats

# If AI Layer:
# - Check Claude API latency (LangSmith)
# - Reduce Gunicorn workers temporarily
# - Scale up server type

# If Backend:
# - Check Temporal workflows (stuck?)
# - Review circuit breaker status
```

**Issue: Disk full**
```bash
# Check usage
df -h
du -sh /mnt/data/* | sort -h

# Clean old backups
find /mnt/data/backups/ -mtime +7 -delete

# Clean Docker
docker system prune -a
```

---

## 💰 COÛTS TOTAUX

### Coûts Mensuels (Production Minimale)

```
Infrastructure:
  Hetzner CCX33 (8 vCPU, 16GB)      €37.00
  Volume 50GB                        €2.90
  Snapshots (optionnel)              €7.40

External Services (existants):
  Anthropic Claude                   Variable (~€50-200)
  Twilio                             Variable (~€20-100)
  Temporal Cloud                     Gratuit (tier)
  LangSmith                          Gratuit (tier)
  Supabase                           Gratuit (tier)
  Stripe                             % transactions

Total Hetzner:                      €39.90 - €47.30/mois
Total avec APIs:                    ~€110 - €350/mois
```

### ROI Estimé

**Scénario actuel (Railway):**
- Infrastructure: $85/mois (€78)
- APIs: ~$150/mois (€138)
- **Total: €216/mois**

**Avec Hetzner:**
- Infrastructure: €39.90/mois
- APIs: ~€138/mois (unchanged)
- **Total: €178/mois**

**Économies:** €38/mois (€456/an) = **18% réduction coûts**

---

## 📚 RÉFÉRENCES

### Documentation Projet
- [Infrastructure Requirements](/home/developer/AI_BOOKING_AGENT_INFRASTRUCTURE_REQUIREMENTS.md)
- [Deployment Plan](/home/developer/HETZNER_DEPLOYMENT_PLAN.md)
- [Hetzner Guide Complet](/home/developer/HETZNER_CLOUD_GUIDE_COMPLET.md)
- [Infrastructure Status](/home/developer/INFRASTRUCTURE_STATUS.md)

### Documentation Externe
- [Hetzner Cloud Docs](https://docs.hetzner.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Terraform Hetzner Provider](https://registry.terraform.io/providers/hetznercloud/hcloud/)
- [ai-booking-agent CLAUDE.md](file:///home/developer/ai-booking-agent/CLAUDE.md)

### Monitoring
- Sentry: https://sentry.io/
- PostHog: https://app.posthog.com/
- LangSmith: https://smith.langchain.com/
- Hetzner Console: https://console.hetzner.com/projects/12475170/

---

**Version:** 1.0
**Dernière mise à jour:** 2025-11-18
**Maintenu par:** AutoScale AI Team
**Contact:** jsleboeuf@autoscaleai.ca
