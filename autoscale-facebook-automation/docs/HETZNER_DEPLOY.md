# 🚀 Déploiement Hetzner Cloud
## Guide Complet - AutoScale Facebook Automation

**Plan recommandé**: Hetzner CX33 (€5.49/mois)
- 4 vCPU AMD EPYC-Genoa
- 8GB RAM
- 80GB NVMe SSD
- 20TB traffic inclus
- **70% moins cher que Railway** ($6 vs $20/mois)

---

## 📋 Prérequis

- ✅ Compte Hetzner Cloud
- ✅ API Token Hetzner: `3zmYwXwVAwpxcl38ul6dpxpCrwu8244IDf2KlDHeBObfdalJskCOl5uZQSDzmFWa`
- ✅ Domaine DNS (optionnel mais recommandé)
- ✅ GitHub repo avec le code

---

## 🎯 Méthode 1: Création Serveur via API (Automatisé)

### 1. Créer le serveur

```bash
# Via curl (API Hetzner)
curl -X POST \
  https://api.hetzner.cloud/v1/servers \
  -H "Authorization: Bearer 3zmYwXwVAwpxcl38ul6dpxpCrwu8244IDf2KlDHeBObfdalJskCOl5uZQSDzmFWa" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "autoscale-facebook-automation",
    "server_type": "cx33",
    "location": "nbg1",
    "image": "docker-ce",
    "ssh_keys": [],
    "user_data": "#cloud-config\nruncmd:\n  - curl -fsSL https://get.docker.com | sh\n  - curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose\n  - chmod +x /usr/local/bin/docker-compose"
  }'
```

**Sortie attendue**:
```json
{
  "server": {
    "id": 123456,
    "name": "autoscale-facebook-automation",
    "public_net": {
      "ipv4": {
        "ip": "YOUR_SERVER_IP"
      }
    }
  }
}
```

**Sauvegarder**: `YOUR_SERVER_IP` et mot de passe root (envoyé par email)

---

## 🎯 Méthode 2: Création via Dashboard Web (Manuel)

### 1. Créer le serveur

1. Aller sur [console.hetzner.cloud](https://console.hetzner.cloud)
2. Projet → **Add Server**
3. **Location**: Nuremberg (nbg1) ou Falkenstein (fsn1)
4. **Image**: Ubuntu 24.04 LTS
5. **Type**: Shared vCPU → **CX33** (4 vCPU, 8GB RAM)
6. **Networking**: IPv4 + IPv6
7. **SSH Key**: Ajouter votre clé SSH publique
8. **Name**: `autoscale-facebook-automation`
9. **Create & Buy Now**

### 2. Se connecter au serveur

```bash
# SSH (remplacer YOUR_SERVER_IP)
ssh root@YOUR_SERVER_IP

# Mettre à jour système
apt update && apt upgrade -y

# Installer Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Vérifier installation
docker --version
docker-compose --version
```

---

## 📦 Déploiement de l'Application

### 1. Créer Docker Compose

Sur votre **machine locale**, créer `docker-compose.yml` :

```yaml
version: '3.8'

services:
  # Temporal Server
  temporal:
    image: temporalio/auto-setup:latest
    ports:
      - "7233:7233"
      - "8233:8233"
    environment:
      - DB=postgresql
      - DB_PORT=5432
      - POSTGRES_USER=temporal
      - POSTGRES_PWD=temporal
      - POSTGRES_SEEDS=postgres
    depends_on:
      - postgres
    networks:
      - app-network
    restart: unless-stopped

  # PostgreSQL pour Temporal
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: temporal
      POSTGRES_PASSWORD: temporal
      POSTGRES_DB: temporal
    volumes:
      - temporal-db:/var/lib/postgresql/data
    networks:
      - app-network
    restart: unless-stopped

  # Backend API + Temporal Worker
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      # Supabase
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

      # AI
      - KAI_API_KEY=${KAI_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}

      # Facebook
      - FACEBOOK_PAGE_ID=${FACEBOOK_PAGE_ID}
      - FACEBOOK_ACCESS_TOKEN=${FACEBOOK_ACCESS_TOKEN}

      # Temporal
      - TEMPORAL_ADDRESS=temporal:7233
      - TEMPORAL_NAMESPACE=default

      # App
      - NODE_ENV=production
      - PORT=3001
    depends_on:
      - temporal
    networks:
      - app-network
    restart: unless-stopped
    volumes:
      - ./backend:/app
      - /app/node_modules

  # Nginx Reverse Proxy (SSL/HTTPS)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    networks:
      - app-network
    restart: unless-stopped

volumes:
  temporal-db:

networks:
  app-network:
    driver: bridge
```

### 2. Créer Dockerfile Backend

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copier package files
COPY package*.json ./
RUN npm ci --only=production

# Copier code source
COPY . .

# Build TypeScript
RUN npm run build

# Exposer port
EXPOSE 3001

# Démarrer worker + API
CMD ["npm", "run", "start:prod"]
```

### 3. Ajouter scripts package.json

```json
{
  "scripts": {
    "build": "tsc",
    "start:prod": "node dist/index.js & node dist/temporal/worker.js"
  }
}
```

### 4. Créer fichier .env.production

```bash
# .env.production (NE PAS committer sur Git)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...

KAI_API_KEY=b23878d0f4f0d9d975dc364145227220
OPENAI_API_KEY=sk-proj-...

FACEBOOK_PAGE_ID=123456789
FACEBOOK_ACCESS_TOKEN=EAAG...

TEMPORAL_ADDRESS=temporal:7233
TEMPORAL_NAMESPACE=default

NODE_ENV=production
PORT=3001
```

### 5. Déployer sur Hetzner

```bash
# Sur votre machine locale
# 1. Copier fichiers sur serveur
scp -r autoscale-facebook-automation root@YOUR_SERVER_IP:/root/

# 2. SSH dans le serveur
ssh root@YOUR_SERVER_IP

# 3. Aller dans le dossier
cd /root/autoscale-facebook-automation

# 4. Créer .env à partir de .env.production
cp .env.production .env
nano .env  # Éditer avec vraies credentials

# 5. Démarrer tous les services
docker-compose up -d

# 6. Vérifier logs
docker-compose logs -f backend
docker-compose logs -f temporal
```

---

## 🔒 Configuration SSL/HTTPS (Optionnel mais recommandé)

### Option A: Certbot (Let's Encrypt gratuit)

```bash
# Sur serveur Hetzner
apt install certbot python3-certbot-nginx -y

# Obtenir certificat SSL (remplacer api.autoscaleai.ca)
certbot --nginx -d api.autoscaleai.ca

# Auto-renewal (déjà configuré par certbot)
systemctl status certbot.timer
```

### Option B: Cloudflare Tunnel (Gratuit + DDOS protection)

```bash
# Sur serveur Hetzner
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
dpkg -i cloudflared.deb

# Authentifier
cloudflared tunnel login

# Créer tunnel
cloudflared tunnel create autoscale-facebook-api

# Configurer
nano ~/.cloudflared/config.yml
```

**config.yml**:
```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: api.autoscaleai.ca
    service: http://localhost:3001
  - service: http_status:404
```

```bash
# Route DNS
cloudflared tunnel route dns autoscale-facebook-api api.autoscaleai.ca

# Démarrer service
cloudflared service install
systemctl start cloudflared
systemctl enable cloudflared
```

---

## 🔄 CI/CD avec GitHub Actions

### Créer `.github/workflows/deploy-hetzner.yml`

```yaml
name: Deploy to Hetzner

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Hetzner via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HETZNER_SERVER_IP }}
          username: root
          key: ${{ secrets.HETZNER_SSH_KEY }}
          script: |
            cd /root/autoscale-facebook-automation
            git pull origin main
            docker-compose down
            docker-compose build
            docker-compose up -d
            docker-compose logs --tail=50
```

### Configurer GitHub Secrets

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Ajouter:
   - `HETZNER_SERVER_IP`: YOUR_SERVER_IP
   - `HETZNER_SSH_KEY`: Votre clé SSH privée

---

## 📊 Monitoring & Maintenance

### Vérifier status services

```bash
# Tous les services
docker-compose ps

# Logs backend
docker-compose logs -f backend

# Logs Temporal
docker-compose logs -f temporal

# Utilisation ressources
docker stats
```

### Redémarrer services

```bash
# Redémarrer backend seulement
docker-compose restart backend

# Redémarrer tout
docker-compose restart

# Rebuild après changement code
docker-compose down
docker-compose build
docker-compose up -d
```

### Sauvegardes

```bash
# Backup volumes Docker
docker run --rm \
  -v autoscale-facebook-automation_temporal-db:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/temporal-db-backup-$(date +%Y%m%d).tar.gz -C /data .

# Copier backup localement
scp root@YOUR_SERVER_IP:/root/temporal-db-backup-*.tar.gz ./backups/
```

---

## 🐛 Troubleshooting

### Problème: "Cannot connect to Temporal"

```bash
# Vérifier Temporal tourne
docker-compose ps temporal

# Vérifier logs
docker-compose logs temporal

# Restart
docker-compose restart temporal
```

### Problème: "Port 3001 already in use"

```bash
# Trouver processus
lsof -i :3001
kill -9 PID

# Ou changer port dans docker-compose.yml
```

### Problème: "Out of memory"

```bash
# Vérifier utilisation RAM
free -h
docker stats

# Augmenter plan Hetzner si besoin:
# CX33 (8GB) → CX43 (16GB) = €10.49/mois
```

---

## 💰 Coûts Mensuels Finaux

| Service | Coût |
|---------|------|
| Hetzner CX33 | €5.49 (~$6 CAD) |
| Supabase Pro | $0 (déjà payé) |
| kie.ai (Claude) | $40-60 |
| OpenAI (DALL-E) | $30-50 |
| **TOTAL** | **$76-116/mois** |

**vs Railway**: Économie de **$168/an** 🎉

---

## 🚀 Prochaines Étapes

1. ✅ Créer serveur Hetzner CX33
2. ✅ Déployer avec Docker Compose
3. ✅ Configurer SSL (Certbot ou Cloudflare)
4. ✅ Setup CI/CD GitHub Actions
5. ✅ Tester workflow end-to-end
6. ✅ Configurer Supabase Cron pour déclenchement auto

**Temps estimé**: 2-3 heures (avec ce guide)

---

## 📚 Ressources

- [Hetzner Cloud Docs](https://docs.hetzner.com/cloud/)
- [Hetzner API Reference](https://developers.hetzner.com/cloud/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Temporal Self-Hosted](https://docs.temporal.io/self-hosted-guide)
- [Certbot SSL Guide](https://certbot.eff.org/)

**Besoin d'aide ?** Voir STATUS.md ou documentation Temporal.
