# Plan de Déploiement AI Booking Agent sur Hetzner Cloud

**Date:** 18 Novembre 2025
**Projet:** ai-booking-agent → Hetzner Cloud
**Configuration:** Serveur unique CCX33 (€39.90/mois)

---

## 🎯 OBJECTIF

Déployer l'application ai-booking-agent (Backend + AI Layer + PostgreSQL + Redis) sur un serveur Hetzner Cloud avec:
- Infrastructure as Code (Terraform)
- Containerisation (Docker Compose)
- SSL/TLS automatique (Let's Encrypt)
- Monitoring et logging
- Backup automatique
- Zero-downtime deployments

---

## 📋 PRÉ-REQUIS

### Local (déjà fait ✅)
- [x] hcloud CLI installé et configuré
- [x] Token Hetzner API configuré (`HETZNER_API_TOKEN`)
- [x] Terraform installé
- [x] Git repository cloné (ai-booking-agent)

### À faire
- [ ] Générer clé SSH pour serveur Hetzner
- [ ] Whitelister IP Hetzner dans Namecheap (157.157.221.30)
- [ ] Préparer fichier .env de production

---

## 🗂️ STRUCTURE DES FICHIERS

```
hetzner-deployment/
├── terraform/
│   ├── main.tf              # Configuration principale
│   ├── variables.tf         # Variables
│   ├── outputs.tf           # Outputs (IP, etc.)
│   └── terraform.tfvars     # Valeurs des variables
├── docker/
│   ├── docker-compose.prod.yml    # Composition production
│   ├── nginx/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   └── scripts/
│       ├── deploy.sh        # Script déploiement
│       ├── backup.sh        # Script backup
│       └── restore.sh       # Script restore
├── ansible/                 # Optionnel: provisioning
│   └── playbook.yml
└── docs/
    └── RUNBOOK.md          # Procédures opérationnelles
```

---

## 🚀 ÉTAPE 1: INFRASTRUCTURE (Terraform)

### 1.1 Créer les fichiers Terraform

**Fichier:** `terraform/variables.tf`
```hcl
variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Nom du projet"
  type        = string
  default     = "autoscale-ai"
}

variable "server_location" {
  description = "Hetzner datacenter location"
  type        = string
  default     = "nbg1"  # Nuremberg
}

variable "server_type" {
  description = "Hetzner server type"
  type        = string
  default     = "ccx33"  # 8 vCPU, 16GB RAM
}

variable "volume_size" {
  description = "Volume size in GB"
  type        = number
  default     = 50
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/hetzner_autoscale.pub"
}
```

**Fichier:** `terraform/main.tf`
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

# ===== SSH KEY =====
resource "hcloud_ssh_key" "main" {
  name       = "${var.project_name}-main-key"
  public_key = file(var.ssh_public_key_path)
}

# ===== FIREWALL =====
resource "hcloud_firewall" "main" {
  name = "${var.project_name}-firewall"

  # SSH (restricted to your IP - UPDATE THIS!)
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = [
      "0.0.0.0/0",  # TODO: Replace with your IP
      "::/0"
    ]
  }

  # HTTP
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  # HTTPS
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  # Allow all outbound
  rule {
    direction = "out"
    protocol  = "tcp"
    port      = "any"
    destination_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  rule {
    direction = "out"
    protocol  = "udp"
    port      = "any"
    destination_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  rule {
    direction = "out"
    protocol  = "icmp"
    destination_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }
}

# ===== VOLUME (Persistent storage) =====
resource "hcloud_volume" "data" {
  name              = "${var.project_name}-data"
  size              = var.volume_size
  location          = var.server_location
  format            = "ext4"
  delete_protection = true  # Prevent accidental deletion
}

# ===== PLACEMENT GROUP (Anti-affinity for HA) =====
resource "hcloud_placement_group" "main" {
  name = "${var.project_name}-pg"
  type = "spread"  # Distribute across different hosts
}

# ===== SERVER =====
resource "hcloud_server" "main" {
  name        = "${var.project_name}-production"
  server_type = var.server_type
  image       = "ubuntu-22.04"
  location    = var.server_location
  ssh_keys    = [hcloud_ssh_key.main.id]
  firewall_ids = [hcloud_firewall.main.id]
  placement_group_id = hcloud_placement_group.main.id

  # Cloud-init configuration
  user_data = <<-EOF
    #cloud-config
    package_update: true
    package_upgrade: true

    packages:
      - docker.io
      - docker-compose
      - git
      - vim
      - htop
      - curl
      - ufw
      - fail2ban
      - certbot
      - python3-certbot-nginx

    runcmd:
      # Configure Docker
      - systemctl enable docker
      - systemctl start docker
      - usermod -aG docker root

      # Configure UFW (additional layer)
      - ufw default deny incoming
      - ufw default allow outgoing
      - ufw allow 22/tcp
      - ufw allow 80/tcp
      - ufw allow 443/tcp
      - echo "y" | ufw enable

      # Configure Fail2Ban
      - systemctl enable fail2ban
      - systemctl start fail2ban

      # Create mount point for volume
      - mkdir -p /mnt/data

      # Install Docker Compose v2
      - curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
      - chmod +x /usr/local/bin/docker-compose

      # Create app directory
      - mkdir -p /opt/autoscale-ai
      - chown -R root:root /opt/autoscale-ai
  EOF

  # Enable backups (€3.70/mois = 20% du prix serveur)
  backups = true

  # Labels for organization
  labels = {
    environment = "production"
    project     = var.project_name
    managed_by  = "terraform"
  }
}

# ===== ATTACH VOLUME =====
resource "hcloud_volume_attachment" "main" {
  volume_id = hcloud_volume.data.id
  server_id = hcloud_server.main.id
  automount = true
}

# ===== OUTPUTS =====
output "server_ip" {
  description = "Public IP of the server"
  value       = hcloud_server.main.ipv4_address
}

output "server_name" {
  description = "Name of the server"
  value       = hcloud_server.main.name
}

output "volume_id" {
  description = "ID of the persistent volume"
  value       = hcloud_volume.data.id
}

output "ssh_command" {
  description = "SSH command to connect to server"
  value       = "ssh root@${hcloud_server.main.ipv4_address}"
}
```

**Fichier:** `terraform/terraform.tfvars`
```hcl
hcloud_token         = "HOVEvCJ23bJwg8YQSDooFTlk72ix7g8YtqF7MXTcBXS1kVNvkNDB2Sl63uh7jQuw"
project_name         = "autoscale-ai"
server_location      = "nbg1"
server_type          = "ccx33"
volume_size          = 50
ssh_public_key_path  = "~/.ssh/hetzner_autoscale.pub"
```

### 1.2 Déployer l'infrastructure

```bash
cd terraform/

# Initialiser Terraform
terraform init

# Voir le plan
terraform plan

# Appliquer (créer l'infrastructure)
terraform apply

# Récupérer l'IP du serveur
terraform output server_ip
# Output: 157.157.221.30 (exemple)
```

---

## 🐳 ÉTAPE 2: DOCKER COMPOSE PRODUCTION

### 2.1 Créer docker-compose.prod.yml

**Fichier:** `docker/docker-compose.prod.yml`
```yaml
version: '3.9'

services:
  # ===== POSTGRESQL DATABASE =====
  postgres:
    image: postgres:14-alpine
    container_name: autoscale-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-autoscale}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - /mnt/data/postgres:/var/lib/postgresql/data
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # ===== REDIS CACHE =====
  redis:
    image: redis:7-alpine
    container_name: autoscale-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - /mnt/data/redis:/data
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # ===== BACKEND (Node.js) =====
  backend:
    build:
      context: /opt/autoscale-ai/ai-booking-agent
      dockerfile: backend/Dockerfile.optimized
    container_name: autoscale-backend
    restart: unless-stopped
    env_file:
      - /opt/autoscale-ai/.env
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-autoscale}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend
      - frontend
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "20m"
        max-file: "5"

  # ===== AI LAYER (Python) =====
  ai-layer:
    build:
      context: /opt/autoscale-ai/ai-booking-agent/ai-layer
      dockerfile: Dockerfile.optimized
    container_name: autoscale-ai-layer
    restart: unless-stopped
    env_file:
      - /opt/autoscale-ai/.env
    environment:
      PYTHONUNBUFFERED: 1
      ENVIRONMENT: production
      BACKEND_URL: http://backend:3000
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      redis:
        condition: service_healthy
      backend:
        condition: service_healthy
    networks:
      - backend
      - frontend
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8000/health').raise_for_status()"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    logging:
      driver: "json-file"
      options:
        max-size: "20m"
        max-file: "5"

  # ===== NGINX REVERSE PROXY =====
  nginx:
    build:
      context: /opt/autoscale-ai/docker/nginx
      dockerfile: Dockerfile
    container_name: autoscale-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /opt/autoscale-ai/docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /opt/autoscale-ai/docker/nginx/ssl:/etc/nginx/ssl:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
      - ai-layer
    networks:
      - frontend
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  backend:
    driver: bridge
    internal: true  # No external access
  frontend:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

### 2.2 Configuration Nginx

**Fichier:** `docker/nginx/Dockerfile`
```dockerfile
FROM nginx:alpine

RUN apk add --no-cache \
    openssl \
    bash

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

**Fichier:** `docker/nginx/nginx.conf`
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req_status 429;

    # Upstream backends
    upstream backend {
        server backend:3000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    upstream ai_layer {
        server ai-layer:8000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name api.autoscaleai.ca;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name api.autoscaleai.ca;

        # SSL certificates (Let's Encrypt)
        ssl_certificate /etc/letsencrypt/live/api.autoscaleai.ca/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.autoscaleai.ca/privkey.pem;

        # SSL optimization
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Backend API
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # AI Layer
        location /ai/ {
            limit_req zone=api_limit burst=10 nodelay;

            proxy_pass http://ai_layer;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_connect_timeout 120s;
            proxy_send_timeout 120s;
            proxy_read_timeout 120s;
        }

        # Health check (public)
        location /health {
            proxy_pass http://backend/health;
            access_log off;
        }

        # Default
        location / {
            return 404;
        }
    }
}
```

---

## 📝 ÉTAPE 3: SCRIPTS DE DÉPLOIEMENT

### 3.1 Script de déploiement principal

**Fichier:** `docker/scripts/deploy.sh`
```bash
#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AutoScale AI - Production Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Variables
APP_DIR="/opt/autoscale-ai"
REPO_URL="https://github.com/JSLeboeuf/ai-booking-agent.git"
BRANCH="main"

# 1. Clone/Update repository
echo -e "${YELLOW}1. Updating repository...${NC}"
if [ -d "$APP_DIR/ai-booking-agent" ]; then
    cd "$APP_DIR/ai-booking-agent"
    git pull origin $BRANCH
else
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    git clone -b $BRANCH $REPO_URL
fi

# 2. Check .env file
echo -e "${YELLOW}2. Checking environment variables...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${RED}ERROR: .env file not found at $APP_DIR/.env${NC}"
    echo "Please create it first with production credentials"
    exit 1
fi

# 3. Mount data volume if not mounted
echo -e "${YELLOW}3. Checking data volume...${NC}"
if ! mountpoint -q /mnt/data; then
    echo "Mounting volume..."
    mount /dev/disk/by-id/scsi-0HC_Volume_* /mnt/data
    echo "/dev/disk/by-id/scsi-0HC_Volume_* /mnt/data ext4 discard,nofail,defaults 0 0" >> /etc/fstab
fi

# Create data directories
mkdir -p /mnt/data/postgres
mkdir -p /mnt/data/redis
mkdir -p /mnt/data/backups
chmod -R 700 /mnt/data

# 4. Build Docker images
echo -e "${YELLOW}4. Building Docker images...${NC}"
cd "$APP_DIR"
docker-compose -f docker/docker-compose.prod.yml build --no-cache

# 5. Stop old containers
echo -e "${YELLOW}5. Stopping old containers...${NC}"
docker-compose -f docker/docker-compose.prod.yml down

# 6. Start new containers
echo -e "${YELLOW}6. Starting containers...${NC}"
docker-compose -f docker/docker-compose.prod.yml up -d

# 7. Wait for health checks
echo -e "${YELLOW}7. Waiting for services to be healthy...${NC}"
sleep 30

# Check health
if curl -f http://localhost:3000/health &>/dev/null; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
fi

if curl -f http://localhost:8000/health &>/dev/null; then
    echo -e "${GREEN}✓ AI Layer is healthy${NC}"
else
    echo -e "${RED}✗ AI Layer health check failed${NC}"
fi

# 8. Show logs
echo -e "${YELLOW}8. Recent logs:${NC}"
docker-compose -f docker/docker-compose.prod.yml logs --tail=50

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Check status: docker-compose -f docker/docker-compose.prod.yml ps"
echo "View logs: docker-compose -f docker/docker-compose.prod.yml logs -f"
```

### 3.2 Script de backup

**Fichier:** `docker/scripts/backup.sh`
```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/mnt/data/backups"
DATE=$(date +%Y%m%d_%H%M%S)
POSTGRES_CONTAINER="autoscale-postgres"

echo "Starting backup at $DATE..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
echo "Backing up PostgreSQL..."
docker exec $POSTGRES_CONTAINER pg_dumpall -U postgres > "$BACKUP_DIR/postgres_$DATE.sql"
gzip "$BACKUP_DIR/postgres_$DATE.sql"

# Backup Redis
echo "Backing up Redis..."
docker exec autoscale-redis redis-cli --rdb /data/dump.rdb SAVE
cp /mnt/data/redis/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

# Backup .env
echo "Backing up .env..."
cp /opt/autoscale-ai/.env "$BACKUP_DIR/env_$DATE"

# Delete backups older than 7 days
find "$BACKUP_DIR" -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
ls -lh "$BACKUP_DIR" | tail -10
```

### 3.3 Cron pour backup automatique

```bash
# Ajouter à crontab (crontab -e)
0 3 * * * /opt/autoscale-ai/docker/scripts/backup.sh >> /var/log/autoscale-backup.log 2>&1
```

---

## 🔐 ÉTAPE 4: SSL/TLS (Let's Encrypt)

### 4.1 Obtenir certificat SSL

```bash
# Installer Certbot
apt-get install -y certbot python3-certbot-nginx

# Obtenir certificat (remplacer EMAIL et DOMAIN)
certbot certonly --standalone \
  --preferred-challenges http \
  --email jsleboeuf@autoscaleai.ca \
  -d api.autoscaleai.ca \
  --agree-tos

# Auto-renewal (déjà configuré par défaut)
systemctl enable certbot.timer
systemctl start certbot.timer

# Tester renewal
certbot renew --dry-run
```

---

## 📊 ÉTAPE 5: MONITORING

### 5.1 Vérifier les services

```bash
# Status des containers
docker-compose -f docker/docker-compose.prod.yml ps

# Logs en temps réel
docker-compose -f docker/docker-compose.prod.yml logs -f

# Healthchecks
curl http://localhost:3000/health
curl http://localhost:8000/health

# Métriques serveur
htop
df -h
docker stats
```

---

## ✅ CHECKLIST DE DÉPLOIEMENT

### Avant déploiement
- [ ] Générer clé SSH: `ssh-keygen -t ed25519 -f ~/.ssh/hetzner_autoscale -C "autoscale-ai"`
- [ ] Copier .env de production sur serveur: `scp .env root@IP:/opt/autoscale-ai/.env`
- [ ] Whitelister IP Hetzner dans Namecheap (157.157.221.30)
- [ ] Vérifier tous les credentials dans .env

### Infrastructure Terraform
- [ ] `cd terraform && terraform init`
- [ ] `terraform plan` (vérifier le plan)
- [ ] `terraform apply` (créer infrastructure)
- [ ] Noter l'IP du serveur: `terraform output server_ip`

### Configuration DNS
- [ ] Ajouter record A: `api.autoscaleai.ca → IP_SERVEUR`
- [ ] Attendre propagation DNS (5-10 min)
- [ ] Vérifier: `nslookup api.autoscaleai.ca`

### Déploiement application
- [ ] SSH au serveur: `ssh root@IP_SERVEUR`
- [ ] Copier docker-compose.prod.yml et scripts
- [ ] Exécuter deploy.sh: `/opt/autoscale-ai/docker/scripts/deploy.sh`
- [ ] Vérifier healthchecks

### SSL/TLS
- [ ] Obtenir certificat Let's Encrypt
- [ ] Redémarrer Nginx
- [ ] Vérifier HTTPS: `curl https://api.autoscaleai.ca/health`

### Tests post-déploiement
- [ ] Test appel Twilio webhook
- [ ] Test conversation AI complète
- [ ] Test booking Cal.com
- [ ] Test payment Stripe
- [ ] Vérifier logs Sentry
- [ ] Vérifier métriques LangSmith

### Monitoring
- [ ] Configurer alertes Sentry
- [ ] Créer dashboard Grafana Cloud
- [ ] Tester backup: `./docker/scripts/backup.sh`
- [ ] Configurer cron backup quotidien

---

## 🔥 PROCÉDURE DE ROLLBACK

Si problème critique après déploiement:

```bash
# 1. Revenir au commit précédent
cd /opt/autoscale-ai/ai-booking-agent
git log --oneline -10  # Voir les commits
git checkout PREVIOUS_COMMIT_SHA

# 2. Rebuild et redémarrer
docker-compose -f docker/docker-compose.prod.yml build
docker-compose -f docker/docker-compose.prod.yml up -d

# 3. Restaurer backup PostgreSQL si nécessaire
docker exec -i autoscale-postgres psql -U postgres < /mnt/data/backups/postgres_YYYYMMDD.sql.gz
```

---

## 📞 SUPPORT

**En cas de problème:**
1. Vérifier logs: `docker-compose logs -f`
2. Vérifier healthchecks: `curl localhost:3000/health`
3. Vérifier Sentry dashboard: https://sentry.io/
4. Consulter RUNBOOK.md pour procédures complètes

**Métriques à surveiller:**
- CPU < 80%
- RAM < 90%
- Disk < 85%
- Backend response time < 500ms
- AI Layer response time < 2s
- Error rate < 1%

---

**Prêt pour le déploiement !** 🚀
