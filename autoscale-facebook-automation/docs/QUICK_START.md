# 🚀 Quick Start Guide
## AutoScale Facebook Automation - Qualité Maximale

Ce guide vous permet de démarrer le système complet en **30 minutes**.

---

## ✅ Prérequis

Vous avez déjà :
- ✅ **Supabase Pro** (payé)
- ✅ **kie.ai API Key** (Claude)
- ✅ **OpenAI API Key** (DALL-E 3)
- ✅ **Hetzner Cloud API Token** (fourni)
- ⚠️ **Facebook Page Access Token** (à obtenir)

---

## 📦 Installation

### 1. Clone & Setup

```bash
cd autoscale-facebook-automation

# Backend
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos credentials
```

### 2. Configuration Supabase

```bash
# Appliquer migration SQL
# Option A: Via Supabase Dashboard
# 1. Aller dans votre projet Supabase
# 2. SQL Editor → New Query
# 3. Copier contenu de supabase/migrations/20251118_facebook_automation_schema.sql
# 4. Run

# Option B: Via Supabase CLI (si installé)
npx supabase db push
```

### 3. Credentials Facebook

**Obtenir Page Access Token permanent** :

1. Aller sur [developers.facebook.com](https://developers.facebook.com)
2. Créer une app "Business" si pas déjà fait
3. Ajouter produit "Facebook Login"
4. Graph API Explorer :
   - Sélectionner votre app
   - User Token → Get Token → Pages
   - Permissions : `pages_manage_posts`, `pages_read_engagement`
   - Générer token
5. **Important** : Convertir en token permanent :
   ```
   https://graph.facebook.com/v18.0/oauth/access_token?
     grant_type=fb_exchange_token&
     client_id=YOUR_APP_ID&
     client_secret=YOUR_APP_SECRET&
     fb_exchange_token=YOUR_SHORT_LIVED_TOKEN
   ```
6. Copier le token longue durée dans `.env`

**Obtenir Page ID** :
```bash
curl "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_TOKEN"
```

### 4. Setup Temporal (Self-Hosted)

```bash
# Option A: Docker (recommandé)
docker run -p 7233:7233 temporalio/auto-setup:latest

# Option B: Temporal CLI (développement)
brew install temporal
temporal server start-dev
```

### 5. Variables d'Environnement

Éditer `backend/.env` :

```bash
# Supabase (déjà payé ✅)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...

# AI (déjà configurés ✅)
KAI_API_KEY=b23878d0f4f0d9d975dc364145227220
OPENAI_API_KEY=sk-proj-...

# Facebook (à configurer ⚠️)
FACEBOOK_PAGE_ID=123456789
FACEBOOK_ACCESS_TOKEN=EAAG...

# Temporal
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default

# Notifications (optionnel)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
NOTIFICATION_EMAIL=vous@email.com

# App
NODE_ENV=development
PORT=3001
```

---

## 🚀 Démarrage

### Terminal 1: Temporal Server
```bash
docker run -p 7233:7233 temporalio/auto-setup:latest
# OU
temporal server start-dev
```

### Terminal 2: Temporal Worker
```bash
cd backend
npm run temporal:dev
```

### Terminal 3: Backend API (optionnel)
```bash
cd backend
npm run dev
```

---

## 🧪 Test du Workflow

```bash
cd backend

# Test complet (génération + approbation simulée)
npm run workflow:test

# Déclencher workflow réel
npm run workflow:trigger -- --type case_study
```

**Workflow va** :
1. Générer 3 variations de texte (Claude)
2. Générer image (DALL-E 3)
3. **PAUSE** → Attendre votre approbation
4. Vous appelez `approveWorkflow(workflowId, { approved: true, selectedVariation: 0 })`
5. Publier sur Facebook
6. Collecter analytics 24h après

---

## 📊 Vérifications

### ✅ Supabase
```sql
-- Vérifier tables créées
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Vérifier bucket storage
SELECT * FROM storage.buckets WHERE name = 'generated-images';
```

### ✅ Temporal
```bash
# Ouvrir Temporal UI
open http://localhost:8233
# Voir workflows en cours
```

### ✅ Facebook API
```bash
# Test connexion
curl "https://graph.facebook.com/v18.0/YOUR_PAGE_ID?access_token=YOUR_TOKEN"

# Test rate limits
curl "https://graph.facebook.com/v18.0/YOUR_PAGE_ID?fields=id&access_token=YOUR_TOKEN" -i | grep X-App-Usage
```

---

## 🎯 Workflow Complet (Premier Post)

### 1. Déclencher Génération

```bash
npm run workflow:trigger -- --type statistic
```

**Sortie attendue** :
```
✅ Workflow started: workflow-123abc
✅ Generating 3 content variations...
✅ Generating image with DALL-E 3...
⏸️  Waiting for approval...
   Dashboard: http://localhost:3000/approve/workflow-123abc
```

### 2. Approuver (pour l'instant : manuel)

```typescript
// Dans Node REPL ou script
import { Connection, WorkflowClient } from '@temporalio/client';

const connection = await Connection.connect();
const client = new WorkflowClient({ connection });

const handle = client.getHandle('workflow-123abc');

await handle.signal('approval', {
  approved: true,
  selectedVariation: 0, // Choisir variation 0, 1 ou 2
  publishTime: new Date('2025-11-20T14:30:00'), // Optionnel
});
```

**Workflow continue** :
```
✅ Approved! Publishing variation 0...
✅ Published to Facebook: post_id_456
⏳ Scheduling analytics collection in 24h...
```

### 3. Vérifier Publication

```bash
# Supabase
SELECT * FROM facebook_posts ORDER BY created_at DESC LIMIT 1;

# Facebook
open https://facebook.com/YOUR_PAGE_ID
```

---

## 📅 Automatisation (Cron)

### Option A: Supabase pg_cron (Recommandé)

```sql
-- Dashboard Supabase → Database → Cron Jobs

SELECT cron.schedule(
  'generate-facebook-content-tuesday',
  '0 10 * * 2', -- Mardi 10h00 UTC (14h00 EST hiver)
  $$
  SELECT net.http_post(
    url := 'https://api.autoscaleai.ca/api/trigger-workflow',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"contentType": "case_study"}'::jsonb
  );
  $$
);

-- Répéter pour mercredi (3) et jeudi (4)
```

### Option B: Node-Cron (Backend)

```typescript
// backend/src/index.ts
import cron from 'cron';

const job = new cron.CronJob(
  '0 10 * * 2,3,4', // Mardi, Mercredi, Jeudi à 10h
  async () => {
    console.log('Triggering Facebook content workflow...');
    await triggerWorkflow({ contentType: 'statistic' });
  },
  null,
  true,
  'America/Toronto'
);
```

---

## 🐛 Troubleshooting

### Problème: "Temporal connection refused"
```bash
# Vérifier Temporal tourne
docker ps | grep temporal
# OU
lsof -i :7233
```

### Problème: "Supabase RLS policy blocks insert"
```bash
# Vérifier vous utilisez SERVICE_KEY (pas ANON_KEY)
echo $SUPABASE_SERVICE_KEY
```

### Problème: "Facebook API error 190"
```bash
# Token expiré ou invalide
# Régénérer token permanent (voir étape 3)
```

### Problème: "DALL-E quota exceeded"
```bash
# Vérifier quota OpenAI
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

## 📚 Prochaines Étapes

1. ✅ **Dashboard Next.js** → Interface approbation visuelle
2. ✅ **ML Optimization** → Auto-ajustement prompts
3. ✅ **Analytics Avancées** → Rapport hebdomadaire
4. ✅ **Multi-plateforme** → LinkedIn, Instagram

**Besoin d'aide ?**
- Voir `docs/WORKFLOWS.md` pour détails workflow
- Voir `docs/TROUBLESHOOTING.md` pour problèmes courants

---

**🚀 Vous êtes prêt ! Le système de qualité maximale tourne.**
