# AutoScale AI - Facebook Automation System
## Architecture de Qualité Mondiale pour Génération de Contenu IA

### 🎯 Objectif
Automatiser la création et publication de posts Facebook B2B de qualité maximale pour AutoScale AI (réceptionniste IA téléphonique Québec).

### 📊 KPIs Cibles
- **Engagement rate**: 2%+ (benchmark B2B: 0.5-1%)
- **Reach organique**: 500-1000+ personnes/post
- **Qualité contenu**: 95%+ score Claude (ton naturel, zéro clichés IA)
- **Fiabilité système**: 99.95%+ uptime
- **Compliance Facebook**: 100% (zéro bannissement)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  TEMPORAL WORKFLOW (Orchestration principale)               │
│  Hetzner Cloud CX33 - Node.js/TypeScript + Docker          │
│  Durée: 4-6 heures (non-bloquant)                          │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 1: Génération Contenu (Claude Sonnet 4.5)           │
│  ├─ 3 variations (Professional / Storytelling / Question)   │
│  ├─ Scoring automatique (engagement prédit)                │
│  ├─ Anti-clichés IA (validation stricte)                   │
│  └─ Retry intelligent (3x exponential backoff)             │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 2: Génération Image (DALL-E 3)                      │
│  ├─ Prompt optimisé (brand colors + style)                 │
│  ├─ Upload Supabase Storage (CDN permanent)                │
│  ├─ Retry si échec                                         │
│  └─ State persisté (crash-proof)                           │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 3: Human Approval (Dashboard Next.js)               │
│  ├─ Notification Slack + Email                             │
│  ├─ Preview side-by-side (3 variations)                    │
│  ├─ Edit inline si besoin                                  │
│  └─ Temporal WAIT (pause workflow)                         │
└─────────────────────────────────────────────────────────────┘
          ↓ [Approbation]
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 4: Smart Publishing (Facebook Graph API)            │
│  ├─ Timing randomisé ±30min (anti-détection)              │
│  ├─ Circuit breaker (resilience)                           │
│  ├─ Retry avec exponential backoff                         │
│  └─ Confirmation + post_id stocké                          │
└─────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 5: Analytics Collection + ML Optimization           │
│  ├─ Wait 24h (Temporal timer)                              │
│  ├─ Fetch métriques Facebook                               │
│  ├─ ML: Ajustement prompts automatique                     │
│  └─ Rapport hebdomadaire performance                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Technique

### Backend (Node.js/TypeScript)
- **Framework**: Express + TypeScript strict
- **Orchestration**: Temporal (réutilisé de ai-booking-agent)
- **Database**: Supabase PostgreSQL (Pro plan existant)
- **Queue**: Temporal (pas besoin BullMQ)
- **Logging**: Winston + Sentry
- **Testing**: Jest (80%+ coverage)

### AI Layer
- **Text Generation**: Claude Sonnet 4.5 (via kie.ai)
- **Image Generation**: OpenAI DALL-E 3
- **Embeddings**: text-embedding-3-small (similarité contenu)
- **ML**: Auto-ajustement prompts basé analytics

### Frontend Dashboard (Next.js 14)
- **Framework**: Next.js App Router + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Auth**: Supabase Auth
- **Realtime**: Supabase Realtime (notifications)

### Infrastructure
- **Hosting Backend**: Hetzner Cloud CX33 (~$6/mois)
- **Hosting Frontend**: Vercel (gratuit)
- **Database**: Supabase Pro (déjà payé)
- **Storage**: Supabase Storage (images)
- **Monitoring**: Sentry + Supabase Logs

---

## 💰 Coûts Mensuels

| Service | Coût | Notes |
|---------|------|-------|
| Supabase Pro | **$0** | ✅ Déjà payé |
| **Hetzner CX33** | **~$6** (€5.49) | Backend + Temporal worker (4 vCPU, 8GB RAM) |
| kie.ai (Claude) | **$40-60** | ~120 API calls/mois |
| OpenAI (DALL-E) | **$30-50** | 30 images + retries |
| Temporal Cloud | **$0** | Self-hosted (gratuit) |
| Vercel | **$0** | Free tier OK |
| Sentry | **$0** | Free tier (5K errors) |
| **TOTAL** | **$76-116/mois** | Qualité maximale garantie |

**Économie vs Railway**: -$14/mois = **-$168/an** 💰

---

## 📁 Structure du Projet

```
autoscale-facebook-automation/
├── backend/                       # Node.js + Temporal
│   ├── src/
│   │   ├── temporal/
│   │   │   ├── workflows/
│   │   │   │   └── facebook-content.workflow.ts
│   │   │   └── activities/
│   │   │       ├── generate-content.activity.ts
│   │   │       ├── generate-image.activity.ts
│   │   │       ├── publish-facebook.activity.ts
│   │   │       └── collect-analytics.activity.ts
│   │   ├── services/
│   │   │   ├── claude.service.ts
│   │   │   ├── openai.service.ts
│   │   │   ├── facebook.service.ts
│   │   │   ├── supabase.service.ts
│   │   │   └── ml-optimizer.service.ts
│   │   ├── config/
│   │   │   ├── prompts.config.ts
│   │   │   └── temporal.config.ts
│   │   └── index.ts
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
│
├── supabase/
│   ├── migrations/
│   │   └── 20251118_create_tables.sql
│   └── functions/
│       ├── approval-webhook/          # Trigger après approbation
│       ├── analytics-collector/       # Collecte métriques
│       └── _shared/
│
├── dashboard/                     # Next.js approval UI
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Dashboard principal
│   │   │   └── api/
│   │   └── components/
│   │       ├── PostPreview.tsx
│   │       ├── ApprovalButton.tsx
│   │       └── AnalyticsDash board.tsx
│   └── package.json
│
├── scripts/
│   ├── setup.sh                   # Setup initial
│   ├── deploy.sh                  # Déploiement complet
│   └── test-workflow.ts           # Test Temporal workflow
│
├── docs/
│   ├── SETUP.md                   # Guide setup complet
│   ├── WORKFLOWS.md               # Documentation workflows
│   └── PROMPTS.md                 # Bibliothèque prompts
│
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone et setup
cd autoscale-facebook-automation
npm install

# Setup environment
cp .env.example .env
# Éditer .env avec vos credentials

# Setup Supabase
npm run supabase:setup

# Setup Temporal (self-hosted)
npm run temporal:setup
```

### 2. Configuration

```bash
# .env requis
SUPABASE_URL=https://[votre-projet].supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
KAI_API_KEY=b23878d0...            # kie.ai pour Claude
OPENAI_API_KEY=sk-proj-...
FACEBOOK_PAGE_ID=...
FACEBOOK_ACCESS_TOKEN=...
SLACK_WEBHOOK_URL=...              # Notifications approbation
```

### 3. Démarrage

```bash
# Terminal 1: Temporal server (si self-hosted)
npm run temporal:server

# Terminal 2: Temporal worker
npm run temporal:worker

# Terminal 3: Backend API
npm run dev

# Terminal 4: Dashboard
cd dashboard && npm run dev
```

### 4. Test Workflow

```bash
# Déclencher workflow manuellement
npm run workflow:test

# Vérifier dashboard
open http://localhost:3000
```

---

## 📝 Workflow Utilisation

### Automatique (Production)
1. **Cron déclenche workflow** (mardi-jeudi 10h00)
2. Génération contenu + image (5-10 min)
3. **Notification Slack** : "Post ready for review"
4. Vous ouvrez dashboard, approuvez en 1 clic
5. Publication dans fenêtre randomisée (13h-16h)
6. Analytics collectées 24h après

### Manuel (Test/Override)
```bash
# Générer post immédiatement
npm run workflow:trigger

# Générer pour type spécifique
npm run workflow:trigger -- --type case_study

# Planifier pour date spécifique
npm run workflow:trigger -- --date 2025-11-20
```

---

## 🎨 Qualité Maximale - Features Clés

### 1. **Génération Texte (Claude Sonnet 4.5)**
- ✅ 3 variations systématiques (A/B/C testing)
- ✅ Prompts optimisés par type contenu
- ✅ Anti-clichés IA (validation stricte)
- ✅ Ton français canadien authentique
- ✅ Scoring automatique (prédit engagement)

### 2. **Génération Images (DALL-E 3)**
- ✅ Brand colors AutoScale AI
- ✅ Text overlay professionnel
- ✅ Qualité HD (1200x630px optimal Facebook)
- ✅ Style moderne corporate québécois

### 3. **Human-in-the-Loop**
- ✅ Dashboard preview élégant
- ✅ Édition inline si besoin
- ✅ Historique versions
- ✅ Timing publication ajustable

### 4. **ML Auto-Optimization**
- ✅ Analyse performance chaque post
- ✅ Ajustement prompts automatique
- ✅ Suggestions améliorations
- ✅ Rapport hebdomadaire insights

### 5. **Resilience Production**
- ✅ Temporal workflows (durable execution)
- ✅ Circuit breakers (Opossum)
- ✅ Retry exponential backoff
- ✅ Monitoring Sentry 24/7
- ✅ Logs structurés Winston

---

## 📊 Métriques & Monitoring

### Dashboard Analytics
- Engagement rate par type contenu
- Reach organique trends
- Meilleur jour/heure publication
- Performance prompts (ML)
- Coût par post (AI API calls)

### Alertes Automatiques
- ⚠️ Post échec publication (Slack)
- ⚠️ Engagement <1% (email)
- 🚨 Facebook API error (Sentry)
- 📈 Record engagement (celebration!)

---

## 🔐 Sécurité & Compliance

### Facebook Compliance
- ✅ Human approval obligatoire
- ✅ Timing randomisé (anti-bot)
- ✅ Rate limiting respecté
- ✅ Webhook HMAC validation
- ✅ Access token rotation

### Data Security
- ✅ Supabase RLS policies
- ✅ Credentials encrypted (Vault)
- ✅ Audit logs complets
- ✅ GDPR compliant

---

## 📚 Documentation Complète

- [Setup Guide](docs/SETUP.md)
- [Workflows Documentation](docs/WORKFLOWS.md)
- [Prompts Library](docs/PROMPTS.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

---

## 🎯 Roadmap

### Phase 1 (Semaine 1) ✅
- [x] Architecture Temporal + Supabase
- [x] Génération contenu Claude
- [x] Génération images DALL-E
- [x] Dashboard approbation
- [x] Publication Facebook

### Phase 2 (Semaine 2)
- [ ] ML auto-optimization
- [ ] Analytics avancées
- [ ] Multi-variation A/B testing
- [ ] Rapport hebdomadaire automatique

### Phase 3 (Semaine 3-4)
- [ ] Expansion LinkedIn
- [ ] Expansion Instagram
- [ ] Calendrier éditorial intelligent
- [ ] Suggestions contenu proactives

---

## 🤝 Support

**Contact**: Pour questions/support
**Documentation**: `/docs`
**Issues**: GitHub Issues (si repo privé)

---

**Version**: 1.0.0
**Dernière mise à jour**: 18 Novembre 2025
**Auteur**: Claude Code + Vous
**Licence**: Propriétaire AutoScale AI
