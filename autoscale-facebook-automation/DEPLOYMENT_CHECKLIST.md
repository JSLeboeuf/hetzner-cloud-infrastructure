# ✅ Checklist de Déploiement Hetzner
## AutoScale Facebook Automation

Cette checklist vous guide étape par étape pour déployer sur Hetzner Cloud.

---

## 📋 Phase 1: Préparation (30 min)

### ✅ 1.1 Vérifier les credentials

- [ ] **Supabase**
  - [ ] URL: `https://[projet].supabase.co`
  - [ ] Service Key (commence par `eyJhbGc...`)
  - [ ] Migration SQL appliquée (9 tables créées)
  - [ ] Bucket `generated-images` créé

- [ ] **API Keys**
  - [ ] kie.ai API Key (Claude): `b23878d0f4f0d9d975dc364145227220`
  - [ ] OpenAI API Key: `sk-proj-...`

- [ ] **Facebook**
  - [ ] Page ID obtenu
  - [ ] Access Token permanent obtenu (conversion faite)
  - [ ] Permissions validées: `pages_manage_posts`, `pages_read_engagement`

- [ ] **Hetzner**
  - [ ] API Token: `3zmYwXwVAwpxcl38ul6dpxpCrwu8244IDf2KlDHeBObfdalJskCOl5uZQSDzmFWa`
  - [ ] Compte vérifié et actif

### ✅ 1.2 Compléter le code manquant

- [ ] `backend/src/temporal/worker.ts` (voir STATUS.md)
- [ ] `backend/src/index.ts` (API Express)
- [ ] `backend/src/services/supabase.service.ts` (Client Supabase)
- [ ] `backend/src/scripts/trigger-workflow.ts` (Trigger manuel)
- [ ] `backend/src/scripts/test-workflow.ts` (Tests)

### ✅ 1.3 Tests locaux

- [ ] `npm install` réussi
- [ ] `npm run build` compile sans erreur
- [ ] TypeScript strict mode OK
- [ ] ESLint passe

---

## 🚀 Phase 2: Déploiement Hetzner (1h)

### ✅ 2.1 Créer le serveur Hetzner

**Option A: Via API (automatisé)**

```bash
curl -X POST https://api.hetzner.cloud/v1/servers \
  -H "Authorization: Bearer 3zmYwXwVAwpxcl38ul6dpxpCrwu8244IDf2KlDHeBObfdalJskCOl5uZQSDzmFWa" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "autoscale-facebook-automation",
    "server_type": "cx33",
    "location": "nbg1",
    "image": "ubuntu-24.04",
    "ssh_keys": []
  }'
```

- [ ] Serveur créé avec succès
- [ ] IP serveur notée: `_________________`
- [ ] Mot de passe root reçu par email

**Option B: Via Dashboard Web**

- [ ] Connexion à [console.hetzner.cloud](https://console.hetzner.cloud)
- [ ] Serveur créé (CX33, Ubuntu 24.04, Nuremberg)
- [ ] SSH Key ajoutée
- [ ] IP serveur notée: `_________________`

### ✅ 2.2 Configuration serveur

```bash
# SSH dans le serveur
ssh root@YOUR_SERVER_IP

# Mise à jour système
apt update && apt upgrade -y

# Installation Docker
curl -fsSL https://get.docker.com | sh

# Installation Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Vérification
docker --version
docker-compose --version
```

- [ ] Docker installé: version `_________`
- [ ] Docker Compose installé: version `_________`

### ✅ 2.3 Déployer l'application

```bash
# Sur votre machine locale
cd autoscale-facebook-automation

# Copier sur serveur
scp -r . root@YOUR_SERVER_IP:/root/autoscale-facebook-automation/

# SSH dans serveur
ssh root@YOUR_SERVER_IP
cd /root/autoscale-facebook-automation

# Créer .env
cp backend/.env.example backend/.env
nano backend/.env  # Éditer avec vraies credentials

# Démarrer services
docker-compose up -d

# Vérifier logs
docker-compose logs -f
```

- [ ] Fichiers copiés sur serveur
- [ ] `.env` configuré avec vraies credentials
- [ ] Docker Compose up réussi
- [ ] 4 conteneurs tournent: `temporal`, `postgres`, `backend`, `nginx`

### ✅ 2.4 Vérifier les services

```bash
# Status conteneurs
docker-compose ps

# Logs backend
docker-compose logs backend | tail -50

# Logs Temporal
docker-compose logs temporal | tail -50

# Health checks
curl http://localhost:3001/health
curl http://localhost:8233  # Temporal UI
```

- [ ] Backend répond sur port 3001
- [ ] Temporal UI accessible sur port 8233
- [ ] PostgreSQL connecté
- [ ] Aucune erreur dans les logs

---

## 🔒 Phase 3: SSL/HTTPS (30 min)

### ✅ 3.1 Configuration DNS

- [ ] Domaine pointé vers IP Hetzner: `api.autoscaleai.ca` → `YOUR_SERVER_IP`
- [ ] DNS propagé (vérifier avec `nslookup api.autoscaleai.ca`)

### ✅ 3.2 Certbot SSL (Let's Encrypt)

```bash
# Sur serveur Hetzner
apt install certbot python3-certbot-nginx -y

# Obtenir certificat
certbot --nginx -d api.autoscaleai.ca

# Auto-renewal configuré
systemctl status certbot.timer
```

- [ ] Certificat SSL obtenu
- [ ] HTTPS fonctionne: `https://api.autoscaleai.ca/health`
- [ ] HTTP redirige vers HTTPS
- [ ] Auto-renewal activé

---

## 🧪 Phase 4: Tests End-to-End (1h)

### ✅ 4.1 Test workflow complet

```bash
# Sur serveur ou localement via API
curl -X POST https://api.autoscaleai.ca/api/trigger-workflow \
  -H "Content-Type: application/json" \
  -d '{"contentType": "statistic"}'
```

- [ ] Workflow démarre avec succès
- [ ] 3 variations générées (Claude)
- [ ] Image générée (DALL-E 3)
- [ ] Image uploadée Supabase Storage
- [ ] Workflow en pause (attente approbation)

### ✅ 4.2 Vérifier Supabase

```sql
-- Dans Supabase SQL Editor
SELECT * FROM content_generations ORDER BY created_at DESC LIMIT 1;
SELECT * FROM generated_images ORDER BY created_at DESC LIMIT 1;
SELECT * FROM approval_queue WHERE status = 'pending';
```

- [ ] Entrée dans `content_generations`
- [ ] Image dans `generated_images` avec URL publique
- [ ] Entrée dans `approval_queue` avec status `pending`

### ✅ 4.3 Tester approbation (manuel pour MVP)

```typescript
// Script Node.js temporaire
import { Connection, WorkflowClient } from '@temporalio/client';

const connection = await Connection.connect({
  address: 'api.autoscaleai.ca:7233'
});
const client = new WorkflowClient({ connection });

const handle = client.getHandle('workflow-xxx');
await handle.signal('approval', {
  approved: true,
  selectedVariation: 0
});
```

- [ ] Signal envoyé avec succès
- [ ] Workflow reprend
- [ ] **DRY RUN**: Ne PAS publier vraiment sur Facebook au début

### ✅ 4.4 Test publication Facebook (dry-run)

```bash
# Modifier temporairement publish-facebook.activity.ts
# Commenter l'appel Facebook Graph API
# Juste logger ce qui serait publié
```

- [ ] Post prévisualisé dans logs
- [ ] Texte correct (variation sélectionnée)
- [ ] URL image correcte
- [ ] Aucune erreur API

---

## 📅 Phase 5: Automatisation Cron (30 min)

### ✅ 5.1 Supabase Cron (Recommandé)

```sql
-- Dashboard Supabase → Database → Cron Jobs

-- Mardi 10h00 UTC
SELECT cron.schedule(
  'facebook-content-tuesday',
  '0 10 * * 2',
  $$
  SELECT net.http_post(
    url := 'https://api.autoscaleai.ca/api/trigger-workflow',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"contentType": "case_study"}'::jsonb
  );
  $$
);

-- Mercredi 10h00 UTC
SELECT cron.schedule(
  'facebook-content-wednesday',
  '0 10 * * 3',
  $$
  SELECT net.http_post(
    url := 'https://api.autoscaleai.ca/api/trigger-workflow',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"contentType": "statistic"}'::jsonb
  );
  $$
);

-- Jeudi 10h00 UTC
SELECT cron.schedule(
  'facebook-content-thursday',
  '0 10 * * 4',
  $$
  SELECT net.http_post(
    url := 'https://api.autoscaleai.ca/api/trigger-workflow',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"contentType": "tip"}'::jsonb
  );
  $$
);
```

- [ ] 3 cron jobs créés dans Supabase
- [ ] Horaires corrects (10h UTC = 14h EST hiver, 15h EST été)
- [ ] Types de contenu variés

### ✅ 5.2 Vérifier exécution cron

```sql
-- Vérifier historique exécution
SELECT * FROM cron.job_run_details
WHERE jobname LIKE 'facebook-content%'
ORDER BY start_time DESC
LIMIT 10;
```

- [ ] Cron jobs apparaissent dans historique
- [ ] Aucune erreur d'exécution

---

## 📊 Phase 6: Monitoring (30 min)

### ✅ 6.1 Sentry (Error Tracking)

```bash
# Ajouter SENTRY_DSN dans .env
nano /root/autoscale-facebook-automation/backend/.env

# Redémarrer backend
docker-compose restart backend
```

- [ ] Sentry DSN configuré
- [ ] Test erreur capturée
- [ ] Notifications email configurées

### ✅ 6.2 Temporal UI

- [ ] Accessible via `https://api.autoscaleai.ca/temporal/`
- [ ] Workflows visibles
- [ ] Metrics disponibles

### ✅ 6.3 Logs système

```bash
# Configurer rotation logs Docker
nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

- [ ] Rotation logs configurée
- [ ] Logs accessibles: `docker-compose logs`

---

## 🎉 Phase 7: Go-Live (Progressif)

### ✅ 7.1 Semaine 1: Test réel (1 post)

- [ ] Activer publication Facebook (retirer dry-run)
- [ ] Déclencher workflow manuel (1 post test)
- [ ] Approuver variation
- [ ] Publier sur Facebook
- [ ] Vérifier post publié correctement
- [ ] Monitorer métriques 24h

### ✅ 7.2 Semaine 2: Automatisation légère (1-2 posts/semaine)

- [ ] Activer cron pour 1 jour (ex: mardi)
- [ ] Vérifier workflow auto-déclenche
- [ ] Approuver et publier
- [ ] Analyser engagement après 48h

### ✅ 7.3 Semaine 3+: Production complète (3 posts/semaine)

- [ ] Activer cron pour 3 jours (mardi, mercredi, jeudi)
- [ ] Workflow fonctionne sans intervention
- [ ] Analytics collectées automatiquement
- [ ] ML optimization activée

---

## 📈 Métriques de Succès

### Technique
- [ ] Uptime backend: 99.95%+
- [ ] Latence API: <500ms
- [ ] Erreurs Sentry: <5/jour
- [ ] Temporal workflows: 100% success rate

### Business
- [ ] Posts publiés: 3/semaine
- [ ] Engagement rate: 2%+ (target)
- [ ] Reach organique: 500+ personnes/post
- [ ] Zéro bannissement Facebook

---

## 🆘 Support & Troubleshooting

### Problèmes courants

**Problème**: Temporal connection refused
```bash
docker-compose logs temporal
docker-compose restart temporal
```

**Problème**: Facebook API error 190
- Token expiré → régénérer token permanent

**Problème**: Image upload Supabase failed
- Vérifier RLS policies
- Utiliser SERVICE_KEY (pas ANON_KEY)

**Problème**: Out of memory
```bash
free -h
docker stats
# Si besoin: upgrade vers CX43 (16GB RAM)
```

### Documentation

- `README.md` - Architecture complète
- `STATUS.md` - État du projet
- `docs/QUICK_START.md` - Guide 30min
- `docs/HETZNER_DEPLOY.md` - Déploiement détaillé

---

**🚀 Félicitations! Votre système est en production.**

**Coût total**: $76-116/mois pour qualité maximale mondiale.
