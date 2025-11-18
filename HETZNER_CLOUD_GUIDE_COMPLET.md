# Guide Complet Hetzner Cloud - Utilisation Maximale 2025

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Types de Serveurs et Tarification](#types-de-serveurs-et-tarification)
3. [Networking Avancé](#networking-avancé)
4. [Stockage et Persistance](#stockage-et-persistance)
5. [Automatisation et Infrastructure as Code](#automatisation-et-infrastructure-as-code)
6. [Sécurité et Bonnes Pratiques](#sécurité-et-bonnes-pratiques)
7. [Kubernetes et Containers](#kubernetes-et-containers)
8. [Monitoring et Optimisation des Coûts](#monitoring-et-optimisation-des-coûts)
9. [Cas d'Usage Avancés](#cas-dusage-avancés)

---

## 🌟 Vue d'ensemble

### Services Disponibles

Hetzner Cloud propose trois APIs principales :

- **api.hetzner.cloud** - Services cloud (Serveurs, Load Balancers, Volumes, Floating IPs)
- **api.hetzner.com** - Storage Boxes
- **robot-ws.your-server.de** - Serveurs dédiés

### Produits Cloud

| Produit | Description | Cas d'usage |
|---------|-------------|-------------|
| **Serveurs** | Machines virtuelles | Applications, base de données, compute |
| **Load Balancers** | Distribution de trafic | Haute disponibilité, scaling horizontal |
| **Volumes** | Stockage block SSD | Données persistantes, bases de données |
| **Firewalls** | Sécurité réseau | Protection périmétrique |
| **Networks** | Réseaux privés | Communication inter-serveurs sécurisée |
| **Floating IPs** | IPs élastiques | Failover, migration sans downtime |
| **Placement Groups** | Organisation serveurs | Anti-affinité pour HA |
| **DNS** | Gestion DNS | Résolution de noms de domaine |

### Régions Disponibles (2025)

| Région | Code | Datacenters | Traffic Inclus | Disponibilité |
|--------|------|-------------|----------------|---------------|
| **Allemagne** | DE | FSN1, NBG1 | 20-60 TB | Tous types serveurs |
| **Finlande** | FI | HEL1 | 20-60 TB | Tous types serveurs |
| **USA Est** | US | Ashburn VA | 1-8 TB | CPX/CCX uniquement |
| **USA Ouest** | US | Hillsboro OR | 1-8 TB | CPX/CCX uniquement |
| **Singapour** | SG | SIN1 | 0.5-8 TB | CPX/CCX uniquement |

⚠️ **Important**: Traffic overage coûte €1/TB (EU/US) ou **€7.40/TB (Singapour)** !

---

## 💰 Types de Serveurs et Tarification

### Nouvelles Catégories (Octobre 2025)

Hetzner a restructuré ses offres avec des processeurs AMD EPYC-Genoa plus rapides.

### 1. CX - Cost-Optimized (Shared vCPU)

**Caractéristiques:**
- vCPUs partagés Intel/AMD
- Prix le plus bas
- **Disponible uniquement en EU**
- Idéal pour dev/test, workloads variables

| Modèle | vCPUs | RAM | Stockage | Prix/mois | Prix/heure |
|--------|-------|-----|----------|-----------|------------|
| CX22 | 2 | 4 GB | 40 GB | €3.79 | €0.0060 |
| CX32 | 4 | 8 GB | 80 GB | €6.80 | €0.0113 |
| CX42 | 8 | 16 GB | 160 GB | €16.40 | €0.0273 |
| CX52 | 16 | 32 GB | 320 GB | €32.40 | €0.0540 |

**Démarrage rapide:**
```bash
# Créer un serveur Cost-Optimized
hcloud server create \
  --name web-dev \
  --type cx32 \
  --image ubuntu-22.04 \
  --location nbg1 \
  --ssh-key your-key
```

### 2. CAX - ARM Cost-Optimized

**Caractéristiques:**
- Processeurs **Ampere Altra ARM**
- Excellent rapport performance/prix
- Très efficace énergétiquement
- **Disponible uniquement en EU**
- Compatible avec applications ARM natives

**Démarrage rapide:**
```bash
# Créer un serveur ARM
hcloud server create \
  --name arm-app \
  --type cax21 \
  --image ubuntu-22.04 \
  --location fsn1
```

### 3. CPX - Regular Performance

**Caractéristiques:**
- vCPUs partagés **AMD EPYC**
- Disponible **globalement** (EU, US, Singapour)
- Production avec charge variable
- Meilleur équilibre prix/performance

**Cas d'usage:**
- Applications web production
- APIs REST
- Petites bases de données
- Services microservices

### 4. CCX - Dedicated vCPUs

**Caractéristiques:**
- vCPUs **dédiés** garantis
- Pas de "noisy neighbors"
- Performance constante
- Idéal pour workloads critiques

**Cas d'usage:**
- Bases de données production
- Calcul intensif
- Applications haute performance
- Workloads prévisibles

**Prix indicatif:**
- Petites instances: €3.49-6.49/mois
- Moyennes instances: €10-50/mois
- Grosses instances: €50-300/mois

### Facturation

- **Hourly billing** arrondi à l'heure supérieure
- **Prix plafond mensuel** automatique
- Le système facture **le moins cher** entre total horaire et plafond mensuel
- Snapshots et backups facturés séparément

**Coûts additionnels:**
- IPv4 Primary IP: €0.50/mois
- IPv6 Primary IP: **Gratuit**
- Backups: +20% du coût instance
- Traffic overage: €1/TB (EU/US), €7.40/TB (SG)

---

## 🌐 Networking Avancé

### 1. Private Networks (VPC)

Créez des réseaux privés isolés pour communication inter-serveurs sécurisée.

**Caractéristiques:**
- Jusqu'à **3 réseaux privés par serveur**
- Communication privée sans internet
- Gratuit, pas de frais de bandwidth
- Plage IP personnalisable (10.0.0.0/16, etc.)

**Configuration via CLI:**
```bash
# Créer un réseau privé
hcloud network create \
  --name private-network \
  --ip-range 10.0.0.0/16

# Ajouter un sous-réseau
hcloud network add-subnet private-network \
  --network-zone eu-central \
  --type cloud \
  --ip-range 10.0.1.0/24

# Attacher un serveur au réseau
hcloud server attach-to-network web-server \
  --network private-network \
  --ip 10.0.1.2
```

**Exemple d'architecture:**
```
┌─────────────────────────────────────────┐
│          Internet (Public)              │
└─────────────────┬───────────────────────┘
                  │
         ┌────────▼────────┐
         │  Load Balancer  │
         │  (Public IP)    │
         └────────┬────────┘
                  │
    ┌─────────────┴─────────────┐
    │   Private Network         │
    │   10.0.1.0/24            │
    │                          │
  ┌─▼──────┐  ┌─▼──────┐  ┌─▼──────┐
  │ Web 1  │  │ Web 2  │  │ Web 3  │
  │10.0.1.2│  │10.0.1.3│  │10.0.1.4│
  └────┬───┘  └────┬───┘  └────┬───┘
       │           │           │
    ┌──▼───────────▼───────────▼──┐
    │   Private Network           │
    │   10.0.2.0/24              │
    │                            │
  ┌─▼──────────┐  ┌─▼──────────┐
  │ Database 1 │  │ Database 2 │
  │ 10.0.2.10  │  │ 10.0.2.11  │
  └────────────┘  └────────────┘
```

### 2. Floating IPs

IPs publiques élastiques pour haute disponibilité.

**Caractéristiques:**
- Assignation/réassignation instantanée
- Failover sans DNS propagation
- IPv4 et IPv6 supportés
- Jusqu'à **20 Floating IPs par serveur**
- Peut être assignée à un serveur d'une autre location (même zone réseau)

**Cas d'usage:**
- Failover automatique
- Migration sans downtime
- Blue-green deployments
- Haute disponibilité

**Configuration:**
```bash
# Créer une Floating IP
hcloud floating-ip create \
  --type ipv4 \
  --home-location nbg1 \
  --description "production-web"

# Assigner à un serveur
hcloud floating-ip assign <floating-ip-id> <server-id>

# Réassigner (failover)
hcloud floating-ip assign <floating-ip-id> <backup-server-id>
```

**HA avec Keepalived:**
```bash
# Installation sur deux serveurs
apt-get install keepalived

# Configuration /etc/keepalived/keepalived.conf (Master)
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass secret123
    }
    virtual_ipaddress {
        <votre-floating-ip>
    }
}

# Backup a priority 90
```

### 3. Load Balancers

Distribution de trafic automatique avec health checks.

**Caractéristiques:**
- HTTP/HTTPS/TCP support
- SSL termination
- Health checks automatiques
- Sticky sessions
- Proxy Protocol support
- Intégration avec réseaux privés

**Types:**
- **LB11**: 5,000 connexions/sec - €5.83/mois
- **LB21**: 10,000 connexions/sec - €13.10/mois
- **LB31**: 20,000 connexions/sec - €28.37/mois

**Configuration:**
```bash
# Créer un Load Balancer
hcloud load-balancer create \
  --name web-lb \
  --type lb11 \
  --location nbg1

# Ajouter un service HTTP
hcloud load-balancer add-service web-lb \
  --protocol http \
  --listen-port 80 \
  --destination-port 80 \
  --health-check-protocol http \
  --health-check-path /health

# Ajouter des targets
hcloud load-balancer add-target web-lb \
  --server web-1

hcloud load-balancer add-target web-lb \
  --server web-2
```

**Configuration avancée avec labels:**
```bash
# Target par label (auto-discovery)
hcloud load-balancer add-target web-lb \
  --label-selector app=web
```

### 4. Firewalls

Protection réseau au niveau infrastructure.

**Caractéristiques:**
- Stateful firewall
- Rules inbound/outbound
- Application à plusieurs serveurs
- Gratuit
- Règles par IP, subnet, ou tag

**Configuration:**
```bash
# Créer un firewall
hcloud firewall create --name web-firewall

# Autoriser HTTP/HTTPS
hcloud firewall add-rule web-firewall \
  --direction in \
  --port 80 \
  --protocol tcp \
  --source-ips 0.0.0.0/0 \
  --source-ips ::/0

hcloud firewall add-rule web-firewall \
  --direction in \
  --port 443 \
  --protocol tcp \
  --source-ips 0.0.0.0/0 \
  --source-ips ::/0

# Autoriser SSH depuis votre IP uniquement
hcloud firewall add-rule web-firewall \
  --direction in \
  --port 22 \
  --protocol tcp \
  --source-ips <votre-ip>/32

# Appliquer à un serveur
hcloud firewall apply-to-resource web-firewall \
  --type server \
  --server web-1
```

**Best practice - Firewall par tier:**
```bash
# Firewall web tier (DMZ)
hcloud firewall create --name web-tier
hcloud firewall add-rule web-tier --direction in --port 80 --protocol tcp --source-ips 0.0.0.0/0
hcloud firewall add-rule web-tier --direction in --port 443 --protocol tcp --source-ips 0.0.0.0/0

# Firewall app tier (privé)
hcloud firewall create --name app-tier
hcloud firewall add-rule app-tier --direction in --port 8080 --protocol tcp --source-ips 10.0.1.0/24

# Firewall database tier (ultra-privé)
hcloud firewall create --name db-tier
hcloud firewall add-rule db-tier --direction in --port 5432 --protocol tcp --source-ips 10.0.2.0/24
```

### 5. Placement Groups

Contrôle du placement physique des serveurs.

**Type: spread** (anti-affinité)
- Serveurs sur différents hôtes physiques
- Maximise disponibilité
- Protection contre panne hardware

```bash
# Créer un placement group
hcloud placement-group create \
  --name web-spread \
  --type spread

# Créer des serveurs dans le groupe
hcloud server create \
  --name web-1 \
  --type cx32 \
  --image ubuntu-22.04 \
  --placement-group web-spread

hcloud server create \
  --name web-2 \
  --type cx32 \
  --image ubuntu-22.04 \
  --placement-group web-spread
```

---

## 💾 Stockage et Persistance

### 1. Volumes (Block Storage)

Stockage block SSD réseau hautement disponible.

**Caractéristiques:**
- Stockage en **triple réplication** (3 serveurs physiques)
- Taille: 10 GB à 10 TB
- Attachable/détachable à chaud
- Survit à la suppression du serveur
- Formatage personnalisé (ext4, xfs, etc.)
- Snapshots disponibles

**Limitations:**
- 1 volume = 1 serveur à la fois
- Volume et serveur dans même location
- ⚠️ **Volumes non inclus dans backups serveur automatiques**

**Tarification:**
- €0.0476/GB/mois (~€4.76 pour 100GB)
- Snapshots: tarif similaire

**Configuration:**
```bash
# Créer un volume
hcloud volume create \
  --name database-data \
  --size 100 \
  --location nbg1 \
  --format ext4

# Attacher au serveur
hcloud volume attach database-data database-server

# Sur le serveur, monter le volume
mkdir -p /mnt/data
mount /dev/disk/by-id/scsi-0HC_Volume_<id> /mnt/data

# Rendre permanent
echo '/dev/disk/by-id/scsi-0HC_Volume_<id> /mnt/data ext4 defaults 0 0' >> /etc/fstab
```

**Redimensionner:**
```bash
# Augmenter la taille (détacher d'abord)
hcloud volume detach database-data
hcloud volume resize database-data --size 200
hcloud volume attach database-data database-server

# Sur le serveur, étendre le filesystem
resize2fs /dev/disk/by-id/scsi-0HC_Volume_<id>
```

### 2. Backups vs Snapshots

#### Backups (Automatiques)

**Caractéristiques:**
- Sauvegarde **automatique quotidienne**
- **7 slots** de rotation (une semaine)
- Coût: **+20% du prix serveur**
- Supprimés avec le serveur
- ⚠️ **N'incluent PAS les volumes attachés**

```bash
# Activer les backups sur un serveur
hcloud server enable-backup web-server

# Lister les backups
hcloud server describe web-server

# Restaurer depuis backup
hcloud server rebuild web-server --image <backup-id>
```

#### Snapshots (Manuels)

**Caractéristiques:**
- Créés **manuellement**
- Conservés **indéfiniment** jusqu'à suppression
- **Survivent** à la suppression du serveur
- Jamais supprimés automatiquement
- Peuvent servir d'image pour nouveaux serveurs

```bash
# Créer un snapshot
hcloud server create-image web-server \
  --description "production-2025-01-15" \
  --type snapshot

# Créer un serveur depuis snapshot
hcloud server create \
  --name web-clone \
  --type cx32 \
  --image <snapshot-id> \
  --location nbg1
```

**Best Practice - Stratégie 3-2-1:**
```bash
#!/bin/bash
# Backup automatisé avec Borg et Storage Box

# 1. Snapshot serveur quotidien
hcloud server create-image web-server --description "daily-$(date +%Y%m%d)"

# 2. Backup volume avec Borg vers Storage Box
borg create \
  ssh://u123456@u123456.your-storagebox.de:23/./backups::$(date +%Y%m%d) \
  /mnt/data

# 3. Rotation des snapshots (garder 7 jours)
hcloud image list --type snapshot | tail -n +8 | xargs -I {} hcloud image delete {}
```

### 3. Storage Boxes

Stockage object pour backups, archives, médias.

**Caractéristiques:**
- Protocoles: SSH/SFTP, Samba/CIFS, WebDAV, BorgBackup, Restic, rsync
- Snapshots automatiques disponibles
- Pas de limite de fichiers
- Stockage froid économique

**Tarification:**
- 100 GB: ~€3.20/mois
- 1 TB: ~€3.81/mois
- 5 TB: ~€10.18/mois

**Usage avec Borg:**
```bash
# Installation
apt-get install borgbackup

# Initialiser repository
borg init --encryption=repokey \
  ssh://u123456@u123456.your-storagebox.de:23/./backups

# Backup
borg create \
  ssh://u123456@u123456.your-storagebox.de:23/./backups::$(date +%Y%m%d-%H%M) \
  /var/www /etc /home

# Restaurer
borg extract \
  ssh://u123456@u123456.your-storagebox.de:23/./backups::20250115-1200

# Prune (garder 7 daily, 4 weekly, 6 monthly)
borg prune \
  --keep-daily=7 \
  --keep-weekly=4 \
  --keep-monthly=6 \
  ssh://u123456@u123456.your-storagebox.de:23/./backups
```

---

## 🤖 Automatisation et Infrastructure as Code

### 1. Terraform

Terraform est l'outil standard pour gérer l'infrastructure Hetzner de façon déclarative.

**Installation:**
```bash
# Linux
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

**Configuration Provider:**
```hcl
# main.tf
terraform {
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

variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
}
```

**Exemple complet - Stack 3-tier:**
```hcl
# variables.tf
variable "hcloud_token" {
  sensitive = true
}

# network.tf
resource "hcloud_network" "private" {
  name     = "production-network"
  ip_range = "10.0.0.0/16"
}

resource "hcloud_network_subnet" "web_subnet" {
  network_id   = hcloud_network.private.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = "10.0.1.0/24"
}

resource "hcloud_network_subnet" "app_subnet" {
  network_id   = hcloud_network.private.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = "10.0.2.0/24"
}

# firewall.tf
resource "hcloud_firewall" "web" {
  name = "web-firewall"

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }
}

# servers.tf
resource "hcloud_server" "web" {
  count       = 2
  name        = "web-${count.index + 1}"
  image       = "ubuntu-22.04"
  server_type = "cx32"
  location    = "nbg1"

  network {
    network_id = hcloud_network.private.id
    ip         = "10.0.1.${count.index + 10}"
  }

  firewall_ids = [hcloud_firewall.web.id]

  labels = {
    tier = "web"
    env  = "production"
  }

  user_data = file("cloud-init-web.yml")
}

resource "hcloud_server" "database" {
  name        = "database-primary"
  image       = "ubuntu-22.04"
  server_type = "ccx33"
  location    = "nbg1"

  network {
    network_id = hcloud_network.private.id
    ip         = "10.0.2.10"
  }

  labels = {
    tier = "database"
    env  = "production"
  }
}

# load_balancer.tf
resource "hcloud_load_balancer" "web_lb" {
  name               = "web-lb"
  load_balancer_type = "lb11"
  location           = "nbg1"

  labels = {
    env = "production"
  }
}

resource "hcloud_load_balancer_network" "lb_network" {
  load_balancer_id = hcloud_load_balancer.web_lb.id
  network_id       = hcloud_network.private.id
}

resource "hcloud_load_balancer_service" "lb_service" {
  load_balancer_id = hcloud_load_balancer.web_lb.id
  protocol         = "http"
  listen_port      = 80
  destination_port = 80

  health_check {
    protocol = "http"
    port     = 80
    interval = 10
    timeout  = 5
    http {
      path         = "/health"
      status_codes = ["200"]
    }
  }
}

resource "hcloud_load_balancer_target" "lb_target" {
  type             = "label_selector"
  load_balancer_id = hcloud_load_balancer.web_lb.id
  label_selector   = "tier=web"
}

# volumes.tf
resource "hcloud_volume" "database_data" {
  name     = "database-data"
  size     = 100
  location = "nbg1"
  format   = "ext4"
}

resource "hcloud_volume_attachment" "database_attachment" {
  volume_id = hcloud_volume.database_data.id
  server_id = hcloud_server.database.id
}

# outputs.tf
output "web_servers" {
  value = {
    for server in hcloud_server.web :
    server.name => server.ipv4_address
  }
}

output "load_balancer_ip" {
  value = hcloud_load_balancer.web_lb.ipv4
}

output "database_ip" {
  value = hcloud_server.database.ipv4_address
}
```

**Déploiement:**
```bash
# Initialiser
terraform init

# Planifier
terraform plan -var="hcloud_token=$HETZNER_API_TOKEN"

# Appliquer
terraform apply -var="hcloud_token=$HETZNER_API_TOKEN"

# Détruire
terraform destroy -var="hcloud_token=$HETZNER_API_TOKEN"
```

### 2. Ansible

Ansible gère la configuration des serveurs après provisioning Terraform.

**Workflow recommandé:**
1. **Terraform** crée l'infrastructure
2. **Ansible** configure les applications

**Installation:**
```bash
pip install ansible
```

**Exemple - Playbook Web Server:**
```yaml
# playbook-web.yml
---
- name: Configure web servers
  hosts: web
  become: yes

  vars:
    app_user: webapp
    app_dir: /var/www/app

  tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600

    - name: Install nginx
      apt:
        name: nginx
        state: present

    - name: Install Node.js
      apt:
        name:
          - nodejs
          - npm
        state: present

    - name: Create app user
      user:
        name: "{{ app_user }}"
        system: yes
        shell: /bin/bash

    - name: Create app directory
      file:
        path: "{{ app_dir }}"
        state: directory
        owner: "{{ app_user }}"
        group: "{{ app_user }}"

    - name: Configure nginx
      template:
        src: templates/nginx-app.conf.j2
        dest: /etc/nginx/sites-available/app
      notify: Reload nginx

    - name: Enable nginx site
      file:
        src: /etc/nginx/sites-available/app
        dest: /etc/nginx/sites-enabled/app
        state: link
      notify: Reload nginx

    - name: Configure firewall
      ufw:
        rule: allow
        port: "{{ item }}"
        proto: tcp
      loop:
        - 80
        - 443

  handlers:
    - name: Reload nginx
      service:
        name: nginx
        state: reloaded
```

**Intégration Terraform + Ansible:**
```hcl
# Dans Terraform, générer inventory Ansible
resource "local_file" "ansible_inventory" {
  content = templatefile("inventory.tpl", {
    web_servers = hcloud_server.web,
    db_server   = hcloud_server.database
  })
  filename = "../ansible/inventory.ini"
}

# Exécuter Ansible après provisioning
resource "null_resource" "ansible_provisioning" {
  depends_on = [
    hcloud_server.web,
    local_file.ansible_inventory
  ]

  provisioner "local-exec" {
    command = "cd ../ansible && ansible-playbook -i inventory.ini playbook-web.yml"
  }
}
```

### 3. Cloud-Init

Configuration au premier boot du serveur.

**Exemple complet:**
```yaml
# cloud-init-web.yml
#cloud-config

users:
  - name: deploy
    groups: sudo
    shell: /bin/bash
    sudo: ['ALL=(ALL) NOPASSWD:ALL']
    ssh_authorized_keys:
      - ssh-rsa AAAAB3NzaC1yc2E... your-key

package_update: true
package_upgrade: true

packages:
  - nginx
  - docker.io
  - docker-compose
  - ufw
  - fail2ban
  - htop
  - git

write_files:
  - path: /etc/nginx/sites-available/default
    content: |
      server {
        listen 80 default_server;
        location /health {
          return 200 "OK";
          add_header Content-Type text/plain;
        }
      }

runcmd:
  # Security
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow 22/tcp
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw --force enable

  # Docker
  - usermod -aG docker deploy
  - systemctl enable docker
  - systemctl start docker

  # SSH hardening
  - sed -i 's/^#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
  - sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
  - systemctl restart sshd

  # Nginx
  - systemctl enable nginx
  - systemctl start nginx

final_message: "Server configured and ready after $UPTIME seconds"
```

**Utilisation avec hcloud:**
```bash
hcloud server create \
  --name web-server \
  --type cx32 \
  --image ubuntu-22.04 \
  --location nbg1 \
  --user-data-from-file cloud-init-web.yml
```

---

## 🔒 Sécurité et Bonnes Pratiques

### 1. SSH Hardening

**Configuration sécurisée /etc/ssh/sshd_config:**
```bash
# Désactiver root login
PermitRootLogin no

# Authentification par clé uniquement
PasswordAuthentication no
PubkeyAuthentication yes

# Changer le port SSH (optionnel mais réduit les scans)
Port 2222

# Désactiver les protocoles obsolètes
Protocol 2

# Limiter les tentatives
MaxAuthTries 3
MaxSessions 2

# Timeout
ClientAliveInterval 300
ClientAliveCountMax 2

# Désactiver X11 forwarding si non nécessaire
X11Forwarding no

# Utiliser uniquement des algorithmes forts
KexAlgorithms curve25519-sha256@libssh.org
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
```

**Générer une clé SSH forte:**
```bash
# ED25519 (recommandé)
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/hetzner_ed25519

# Ou RSA 4096 bits
ssh-keygen -t rsa -b 4096 -C "your-email@example.com" -f ~/.ssh/hetzner_rsa

# Protéger avec passphrase !
```

**Ajouter la clé à Hetzner:**
```bash
# Via CLI
hcloud ssh-key create --name "laptop-2025" --public-key-from-file ~/.ssh/hetzner_ed25519.pub

# Utiliser lors de création serveur
hcloud server create \
  --name secure-server \
  --type cx32 \
  --image ubuntu-22.04 \
  --ssh-key laptop-2025
```

### 2. Fail2Ban

Protection contre brute-force.

**Installation et configuration:**
```bash
# Installation
apt-get install fail2ban

# Configuration /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = admin@example.com
sendername = Fail2Ban
action = %(action_mwl)s

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log

# Redémarrer
systemctl restart fail2ban

# Vérifier status
fail2ban-client status sshd
```

### 3. Firewall Multi-Couches

**Niveau 1 - Hetzner Cloud Firewall:**
```bash
hcloud firewall create --name production-fw

# SSH depuis votre IP uniquement
hcloud firewall add-rule production-fw \
  --direction in \
  --port 22 \
  --protocol tcp \
  --source-ips <VOTRE_IP>/32

# HTTP/HTTPS depuis partout
hcloud firewall add-rule production-fw \
  --direction in \
  --port 80 \
  --protocol tcp \
  --source-ips 0.0.0.0/0

# Bloquer tout le reste (implicite)
```

**Niveau 2 - UFW (Uncomplicated Firewall):**
```bash
# Configuration de base
ufw default deny incoming
ufw default allow outgoing

# Autoriser services
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Rate limiting SSH
ufw limit 22/tcp

# Activer
ufw enable

# Status
ufw status verbose
```

**Niveau 3 - Application Firewall (ModSecurity):**
```bash
# Installation avec nginx
apt-get install libnginx-mod-security

# Télécharger OWASP Core Rule Set
cd /etc/nginx/modsec
git clone https://github.com/coreruleset/coreruleset.git
mv coreruleset/crs-setup.conf.example crs-setup.conf
```

### 4. Updates Automatiques

**Configuration unattended-upgrades:**
```bash
# Installation
apt-get install unattended-upgrades

# Configuration /etc/apt/apt.conf.d/50unattended-upgrades
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";

# Activer
dpkg-reconfigure -plow unattended-upgrades
```

### 5. Secrets Management

**Utiliser des variables d'environnement:**
```bash
# Jamais hardcoder les secrets !
# ❌ MAUVAIS
DATABASE_URL="postgresql://user:password123@db.example.com/prod"

# ✅ BON
# Dans .env (gitignore)
DATABASE_URL="postgresql://user:${DB_PASSWORD}@db.example.com/prod"

# Charger avec systemd
# /etc/systemd/system/app.service
[Service]
EnvironmentFile=/etc/app/.env
ExecStart=/usr/bin/app
```

**Vault pour secrets enterprise:**
```bash
# Installation HashiCorp Vault
wget https://releases.hashicorp.com/vault/1.15.0/vault_1.15.0_linux_amd64.zip
unzip vault_*_linux_amd64.zip
sudo mv vault /usr/local/bin/

# Démarrer serveur dev (production = mode HA)
vault server -dev

# Stocker secret
vault kv put secret/database password="super-secret"

# Récupérer
vault kv get -field=password secret/database
```

### 6. Audit et Logging

**Centralization avec rsyslog:**
```bash
# Sur serveur central
# /etc/rsyslog.conf
module(load="imudp")
input(type="imudp" port="514")

# Sur serveurs clients
# /etc/rsyslog.d/50-remote.conf
*.* @10.0.0.100:514

# Redémarrer
systemctl restart rsyslog
```

**Audit avec auditd:**
```bash
# Installation
apt-get install auditd

# Règles /etc/audit/rules.d/audit.rules
# Surveiller /etc
-w /etc/ -p wa -k etc_changes

# Surveiller sudo
-w /usr/bin/sudo -p x -k sudo_execution

# Surveiller modifications users
-w /etc/passwd -p wa -k passwd_changes
-w /etc/shadow -p wa -k shadow_changes

# Redémarrer
systemctl restart auditd

# Consulter logs
ausearch -k passwd_changes
```

---

## ☸️ Kubernetes et Containers

### 1. Options pour Kubernetes sur Hetzner

#### Option A - kube-hetzner (Recommandé)

Déploiement Kubernetes optimisé en une commande.

```bash
# Clone le repo
git clone https://github.com/kube-hetzner/terraform-hcloud-kube-hetzner

cd terraform-hcloud-kube-hetzner

# Configuration kube.tf
module "kube-hetzner" {
  source = "kube-hetzner/kube-hetzner/hcloud"

  hcloud_token = var.hcloud_token

  cluster_name = "production"
  network_region = "eu-central"

  control_plane_nodepools = [{
    name        = "control-plane"
    server_type = "cpx21"
    location    = "nbg1"
    count       = 3
  }]

  agent_nodepools = [{
    name        = "agent-small"
    server_type = "cpx31"
    location    = "nbg1"
    count       = 2
  }]

  load_balancer_type = "lb11"

  enable_longhorn = true  # Stockage persistant
  enable_cert_manager = true
  enable_metrics_server = true
}

# Déployer
terraform init
terraform apply -var="hcloud_token=$HETZNER_API_TOKEN"

# Récupérer kubeconfig
terraform output kubeconfig > ~/.kube/config
chmod 600 ~/.kube/config

# Vérifier
kubectl get nodes
```

#### Option B - K3s Manuel

Installation légère de Kubernetes.

```bash
# Sur master node
curl -sfL https://get.k3s.io | sh -

# Récupérer token
sudo cat /var/lib/rancher/k3s/server/node-token

# Sur worker nodes
curl -sfL https://get.k3s.io | K3S_URL=https://<master-ip>:6443 \
  K3S_TOKEN=<token> sh -

# Vérifier
kubectl get nodes
```

#### Option C - Cluster API Provider Hetzner (CAPH)

Pour gestion multi-cloud et HA avancée.

```bash
# Installation clusterctl
curl -L https://github.com/kubernetes-sigs/cluster-api/releases/download/v1.6.0/clusterctl-linux-amd64 \
  -o clusterctl
chmod +x clusterctl
sudo mv clusterctl /usr/local/bin/

# Initialiser management cluster
clusterctl init --infrastructure hetzner

# Créer workload cluster
clusterctl generate cluster my-cluster \
  --kubernetes-version v1.28.0 \
  --control-plane-machine-count=3 \
  --worker-machine-count=3 \
  | kubectl apply -f -
```

### 2. Hetzner Cloud Controller Manager

Intégration native Kubernetes avec Hetzner Cloud.

**Fonctionnalités:**
- Load Balancers automatiques pour Services type LoadBalancer
- Routes pour networking pod-to-pod
- Node labels avec location/type

**Installation:**
```bash
# Via Helm
helm repo add hcloud https://charts.hetzner.cloud
helm repo update

# Créer secret avec token
kubectl create secret generic hcloud \
  --from-literal=token=$HETZNER_API_TOKEN \
  -n kube-system

# Installer
helm install hcloud-cloud-controller-manager hcloud/hcloud-cloud-controller-manager \
  -n kube-system
```

**Exemple - Service avec LoadBalancer:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-service
  annotations:
    load-balancer.hetzner.cloud/name: "web-lb"
    load-balancer.hetzner.cloud/type: "lb11"
    load-balancer.hetzner.cloud/location: "nbg1"
    load-balancer.hetzner.cloud/use-private-ip: "true"
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP
  selector:
    app: web
```

### 3. CSI Driver pour Volumes

Provisioning automatique de Volumes Hetzner.

**Installation:**
```bash
# Via kubectl
kubectl apply -f https://raw.githubusercontent.com/hetznercloud/csi-driver/main/deploy/kubernetes/hcloud-csi.yml
```

**StorageClass:**
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: hcloud-volumes
provisioner: csi.hetzner.cloud
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

**PersistentVolumeClaim:**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: database-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: hcloud-volumes
```

**Pod avec volume:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: postgres
spec:
  containers:
    - name: postgres
      image: postgres:15
      volumeMounts:
        - mountPath: /var/lib/postgresql/data
          name: database-storage
      env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
  volumes:
    - name: database-storage
      persistentVolumeClaim:
        claimName: database-pvc
```

### 4. Exemple Complet - Application Full-Stack

**Deployment:**
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production

---
# database.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: production
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  storageClassName: hcloud-volumes

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: production
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
          env:
            - name: POSTGRES_DB
              value: myapp
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: hcloud-volumes
        resources:
          requests:
            storage: 50Gi

---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: production
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
    - port: 5432

---
# backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: myregistry.io/backend:latest
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              value: postgresql://postgres:5432/myapp
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
    - port: 8080

---
# frontend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: myregistry.io/frontend:latest
          ports:
            - containerPort: 80
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"

---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: production
  annotations:
    load-balancer.hetzner.cloud/name: "production-lb"
    load-balancer.hetzner.cloud/type: "lb11"
    load-balancer.hetzner.cloud/location: "nbg1"
    load-balancer.hetzner.cloud/http-certificates: "managed-cert"
spec:
  type: LoadBalancer
  selector:
    app: frontend
  ports:
    - name: http
      port: 80
      targetPort: 80
    - name: https
      port: 443
      targetPort: 80
```

**Déploiement:**
```bash
# Créer secrets
kubectl create secret generic db-credentials \
  --from-literal=password='super-secret-password' \
  -n production

# Déployer
kubectl apply -f namespace.yaml
kubectl apply -f database.yaml
kubectl apply -f backend.yaml
kubectl apply -f frontend.yaml

# Vérifier
kubectl get all -n production
kubectl get pvc -n production
kubectl get svc frontend -n production  # Récupérer IP du LB
```

---

## 📊 Monitoring et Optimisation des Coûts

### 1. Prometheus + Grafana

Stack de monitoring standard.

**Installation via Helm:**
```bash
# Ajouter repos
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Installer Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi

# Accéder à Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Default credentials: admin / prom-operator
```

**Dashboard Hetzner Cloud:**
```bash
# Installer le plugin Grafana
kubectl exec -n monitoring deployment/prometheus-grafana -- \
  grafana-cli plugins install apricote-hcloud-datasource

# Redémarrer Grafana
kubectl rollout restart -n monitoring deployment/prometheus-grafana

# Importer dashboard ID: 16169
```

**Métriques personnalisées Hetzner:**
```bash
# hetzner-exporter pour métriques via API
helm repo add billimek https://billimek.com/billimek-charts/
helm install hetzner-exporter billimek/hcloud-exporter \
  --set hcloud.token=$HETZNER_API_TOKEN \
  --namespace monitoring
```

### 2. Alerting avec AlertManager

**Configuration alertes coûts:**
```yaml
# prometheus-alerts.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
  namespace: monitoring
data:
  alerts.yaml: |
    groups:
      - name: hetzner_costs
        interval: 1h
        rules:
          - alert: HighMonthlyCost
            expr: hcloud_server_count * 20 > 200
            for: 1h
            labels:
              severity: warning
            annotations:
              summary: "Monthly costs trending above €200"
              description: "Current server count {{ $value }} may exceed budget"

          - alert: SingaporeTrafficOverage
            expr: hcloud_server_traffic_used{location="sin1"} > hcloud_server_traffic_included{location="sin1"} * 0.9
            for: 10m
            labels:
              severity: critical
            annotations:
              summary: "Singapore traffic overage imminent (€7.40/TB)"
              description: "Server {{ $labels.server }} at 90% traffic quota"

          - alert: UnusedVolume
            expr: hcloud_volume_attached == 0
            for: 24h
            labels:
              severity: info
            annotations:
              summary: "Unused volume costing money"
              description: "Volume {{ $labels.name }} not attached for 24h"
```

**Notification Slack:**
```yaml
# alertmanager-config.yaml
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-config
  namespace: monitoring
stringData:
  alertmanager.yaml: |
    global:
      slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

    route:
      receiver: 'slack'
      group_by: ['alertname', 'cluster']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h

    receivers:
      - name: 'slack'
        slack_configs:
          - channel: '#alerts'
            title: 'Hetzner Alert'
            text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

### 3. Cost Optimization Strategies

#### A. Right-Sizing Instances

**Analyse utilisation:**
```bash
# Installer metrics-server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Voir utilisation réelle
kubectl top nodes
kubectl top pods -A

# Recommandations avec kube-resource-report
helm install kube-resource-report hjacobs/kube-resource-report --namespace monitoring
```

**Downsize sous-utilisés:**
```bash
# Si CPU < 20% et RAM < 30% pendant 7 jours
# CX42 (€16.40) → CX32 (€6.80) = €9.60/mois économisé
hcloud server change-type web-server --server-type cx32 --upgrade-disk=false
```

#### B. Utiliser Spot/Preemptible Instances

Hetzner ne propose pas de spot instances, mais :

**Alternative - Mix CX/CCX:**
- Workloads tolérants à la variabilité → **CX** (shared, moins cher)
- Workloads critiques → **CCX** (dedicated, stable)

```bash
# Web tier (variable load) → CX
hcloud server create --name web-1 --type cx32

# Database (constant load) → CCX
hcloud server create --name db-1 --type ccx33
```

#### C. Automated Scaling

**Horizontal Pod Autoscaler:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

**Cluster Autoscaler:**
```bash
# Avec kube-hetzner
# Dans kube.tf
autoscaler_nodepools = [{
  name        = "autoscale-pool"
  server_type = "cpx21"
  location    = "nbg1"
  min_nodes   = 1
  max_nodes   = 10
}]
```

#### D. Scheduled Shutdown

**Éteindre dev/staging la nuit:**
```bash
# Cron job pour éteindre à 19h
0 19 * * * hcloud server poweroff dev-server

# Rallumer à 7h
0 7 * * 1-5 hcloud server poweron dev-server

# Économie: 12h/jour * 22 jours = €10.90/mois pour CX32 (€6.80)
```

**Kubernetes CronJob:**
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scale-down-staging
spec:
  schedule: "0 19 * * *"  # 19h chaque jour
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: scaler
          containers:
            - name: kubectl
              image: bitnami/kubectl
              command:
                - kubectl
                - scale
                - deployment
                - --all
                - --replicas=0
                - -n
                - staging
          restartPolicy: OnFailure
```

#### E. Traffic Optimization

**CDN pour réduire bandwidth:**
```bash
# Cloudflare (gratuit) devant Hetzner
# → Cache assets statiques
# → Réduit traffic Hetzner de 60-80%

# Ou self-hosted nginx cache
http {
  proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m;

  server {
    location / {
      proxy_cache my_cache;
      proxy_cache_valid 200 60m;
      proxy_pass http://backend;
    }
  }
}
```

### 4. Cost Dashboard

**Script mensuel de coûts:**
```bash
#!/bin/bash
# hetzner-costs.sh

echo "=== Hetzner Cloud Monthly Costs ==="
echo ""

# Servers
SERVERS=$(hcloud server list -o json)
SERVER_COST=$(echo "$SERVERS" | jq -r '.[].server_type.prices[] | select(.location=="nbg1") | .price_monthly.gross' | awk '{s+=$1} END {print s}')
SERVER_COUNT=$(echo "$SERVERS" | jq length)

echo "Servers ($SERVER_COUNT): €$SERVER_COST"

# Volumes
VOLUMES=$(hcloud volume list -o json)
VOLUME_SIZE=$(echo "$VOLUMES" | jq -r '.[].size' | awk '{s+=$1} END {print s}')
VOLUME_COST=$(echo "$VOLUME_SIZE * 0.0476" | bc)

echo "Volumes (${VOLUME_SIZE}GB): €$VOLUME_COST"

# Load Balancers
LB_COUNT=$(hcloud load-balancer list -o json | jq length)
LB_COST=$(echo "$LB_COUNT * 5.83" | bc)

echo "Load Balancers ($LB_COUNT): €$LB_COST"

# Total
TOTAL=$(echo "$SERVER_COST + $VOLUME_COST + $LB_COST" | bc)

echo ""
echo "TOTAL ESTIMATED: €$TOTAL/month"
echo ""

# Alert si > budget
BUDGET=200
if (( $(echo "$TOTAL > $BUDGET" | bc -l) )); then
  echo "⚠️  WARNING: Costs exceed budget of €$BUDGET"
fi
```

---

## 🚀 Cas d'Usage Avancés

### 1. High-Availability Architecture

Architecture 3-tier hautement disponible.

```
                    Internet
                       │
              ┌────────▼────────┐
              │  Floating IP    │
              │  (Failover)     │
              └────────┬────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
    ┌────▼────┐                 ┌────▼────┐
    │  LB 1   │                 │  LB 2   │
    │ (keepalived)              │ (keepalived)
    │ MASTER  │                 │ BACKUP  │
    └────┬────┘                 └────┬────┘
         │                           │
         └─────────────┬─────────────┘
                       │
              Private Network
                   10.0.1.0/24
                       │
     ┌─────────┬───────┼───────┬─────────┐
     │         │       │       │         │
  ┌──▼──┐  ┌──▼──┐ ┌──▼──┐ ┌──▼──┐  ┌──▼──┐
  │Web 1│  │Web 2│ │Web 3│ │Web 4│  │Web 5│
  │ AZ 1│  │ AZ 2│ │ AZ 1│ │ AZ 2│  │ AZ 1│
  └──┬──┘  └──┬──┘ └──┬──┘ └──┬──┘  └──┬──┘
     │         │       │       │         │
     └─────────┴───────┼───────┴─────────┘
                       │
              Private Network
                   10.0.2.0/24
                       │
         ┌─────────────┴─────────────┐
         │                           │
    ┌────▼────┐                 ┌────▼────┐
    │  DB 1   │◄───replication──►  DB 2   │
    │ PRIMARY │                 │ STANDBY │
    │  AZ 1   │                 │  AZ 2   │
    └─────────┘                 └─────────┘
```

**Terraform configuration:**
```hcl
# Placement groups pour anti-affinité
resource "hcloud_placement_group" "web_spread" {
  name = "web-spread"
  type = "spread"
}

resource "hcloud_placement_group" "db_spread" {
  name = "db-spread"
  type = "spread"
}

# Web servers dans différentes AZ
resource "hcloud_server" "web" {
  count = 3
  name  = "web-${count.index + 1}"

  # Alterner entre FSN1 et NBG1
  location = count.index % 2 == 0 ? "fsn1" : "nbg1"

  server_type     = "cx32"
  image           = "ubuntu-22.04"
  placement_group_id = hcloud_placement_group.web_spread.id

  # ...
}

# Database avec réplication
resource "hcloud_server" "db_primary" {
  name               = "db-primary"
  location           = "fsn1"
  server_type        = "ccx33"
  image              = "ubuntu-22.04"
  placement_group_id = hcloud_placement_group.db_spread.id
}

resource "hcloud_server" "db_standby" {
  name               = "db-standby"
  location           = "nbg1"
  server_type        = "ccx33"
  image              = "ubuntu-22.04"
  placement_group_id = hcloud_placement_group.db_spread.id
}
```

### 2. Multi-Region Deployment

Déploiement global avec latence minimale.

```bash
# Europe (primary)
hcloud server create --name eu-web-1 --type cx32 --location nbg1
hcloud server create --name eu-web-2 --type cx32 --location fsn1

# USA
hcloud server create --name us-web-1 --type cpx31 --location ash
hcloud server create --name us-web-2 --type cpx31 --location hil

# Asia (Singapore)
hcloud server create --name sg-web-1 --type cpx31 --location sin1

# GeoDNS avec Cloudflare ou Route53
# Dirige utilisateurs vers région la plus proche
```

### 3. Disaster Recovery

**Backup Strategy:**
```bash
#!/bin/bash
# backup-strategy.sh

# 1. Snapshot serveurs critiques
for server in db-primary web-1 web-2; do
  hcloud server create-image $server \
    --description "dr-$(date +%Y%m%d-%H%M)" \
    --type snapshot
done

# 2. Backup volumes avec Borg vers Storage Box
borg create \
  ssh://u123456@u123456.your-storagebox.de:23/./backups::$(date +%Y%m%d) \
  /mnt/volumes/ \
  --compression lz4 \
  --exclude '*.tmp'

# 3. Export configuration Terraform
terraform state pull > backups/terraform-state-$(date +%Y%m%d).json

# 4. Backup databases
pg_dump -h db-primary production | gzip > backups/db-$(date +%Y%m%d).sql.gz

# 5. Upload vers S3/Wasabi (off-site)
aws s3 sync backups/ s3://my-dr-bucket/$(date +%Y%m%d)/
```

**Recovery Plan:**
```bash
#!/bin/bash
# disaster-recovery.sh

# 1. Recréer infrastructure depuis Terraform
cd terraform/
terraform apply -var="hcloud_token=$HETZNER_API_TOKEN"

# 2. Restaurer database depuis backup
gunzip < backups/db-20250115.sql.gz | psql -h new-db-server production

# 3. Restaurer volumes depuis Borg
borg extract ssh://u123456@u123456.your-storagebox.de:23/./backups::20250115

# 4. Redéployer applications
kubectl apply -f k8s/

# 5. Mettre à jour DNS
# Pointer vers nouvelles IPs
```

**RTO/RPO:**
- **RPO** (Recovery Point Objective): 1 heure (backups horaires)
- **RTO** (Recovery Time Objective): 2 heures (restauration complète)

### 4. CI/CD Pipeline avec Hetzner

**GitLab CI/CD:**
```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy

variables:
  HCLOUD_TOKEN: $HETZNER_API_TOKEN

build:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

test:
  stage: test
  script:
    - npm test
    - npm run e2e

deploy_staging:
  stage: deploy
  environment:
    name: staging
  script:
    # Créer serveur staging éphémère
    - |
      hcloud server create \
        --name staging-$CI_COMMIT_SHORT_SHA \
        --type cx32 \
        --image ubuntu-22.04 \
        --user-data-from-file cloud-init.yml

    # Déployer application
    - ssh root@$STAGING_IP "docker pull $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - ssh root@$STAGING_IP "docker-compose up -d"

    # Tests E2E
    - npm run e2e:staging
  only:
    - develop

deploy_production:
  stage: deploy
  environment:
    name: production
  script:
    # Déploiement Kubernetes production
    - kubectl set image deployment/backend backend=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - kubectl rollout status deployment/backend
  only:
    - main
  when: manual

cleanup_staging:
  stage: deploy
  script:
    # Nettoyer serveurs staging > 2 jours
    - |
      hcloud server list -o json | \
      jq -r '.[] | select(.name | startswith("staging-")) | select(.created | fromdateiso8601 < (now - 172800)) | .name' | \
      xargs -I {} hcloud server delete {}
  schedule: daily
```

### 5. Autoscaling avec Metrics

**Custom Metrics Autoscaling:**
```yaml
# prometheus-adapter-values.yaml
rules:
  - seriesQuery: 'http_requests_total'
    resources:
      overrides:
        namespace: {resource: "namespace"}
        pod: {resource: "pod"}
    name:
      matches: "^(.*)_total"
      as: "${1}_per_second"
    metricsQuery: 'rate(<<.Series>>{<<.LabelMatchers>>}[2m])'

---
# HPA basé sur requests/second
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-requests-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"  # Scale si > 1000 req/s par pod
```

---

## 📚 Ressources et Outils

### CLI Tools

```bash
# hcloud CLI - principal
https://github.com/hetznercloud/cli

# terraform-provider-hcloud
https://registry.terraform.io/providers/hetznercloud/hcloud

# ansible-hcloud
https://docs.ansible.com/ansible/latest/collections/hetzner/hcloud/

# kubectl hetzner plugin
kubectl krew install hetzner
```

### Bibliothèques

**Python:**
```python
from hcloud import Client

client = Client(token="your-token")
servers = client.servers.get_all()

# Créer serveur
server = client.servers.create(
    name="python-server",
    server_type=client.server_types.get_by_name("cx32"),
    image=client.images.get_by_name("ubuntu-22.04"),
    location=client.locations.get_by_name("nbg1")
)
```

**Go:**
```go
import "github.com/hetznercloud/hcloud-go/hcloud"

client := hcloud.NewClient(hcloud.WithToken("your-token"))

server, _, err := client.Server.Create(ctx, hcloud.ServerCreateOpts{
    Name:       "go-server",
    ServerType: &hcloud.ServerType{Name: "cx32"},
    Image:      &hcloud.Image{Name: "ubuntu-22.04"},
    Location:   &hcloud.Location{Name: "nbg1"},
})
```

**Node.js:**
```javascript
const { Client } = require('hcloud-js');

const client = new Client('your-token');

const server = await client.servers.create({
  name: 'node-server',
  serverType: 'cx32',
  image: 'ubuntu-22.04',
  location: 'nbg1'
});
```

### Documentation Officielle

- **API Docs**: https://docs.hetzner.cloud/
- **Community Tutorials**: https://community.hetzner.com/tutorials
- **Status Page**: https://status.hetzner.com/
- **Pricing Calculator**: https://costgoat.com/pricing/hetzner

### Community Resources

- **GitHub hetznercloud**: https://github.com/hetznercloud
- **Awesome Hetzner Cloud**: https://github.com/hetznercloud/awesome-hcloud
- **Reddit r/hetzner**: https://reddit.com/r/hetzner

---

## 🎯 Quick Start Checklists

### Checklist - Premier Serveur

- [ ] Créer compte Hetzner
- [ ] Générer API token
- [ ] Installer hcloud CLI
- [ ] Générer clé SSH (ed25519)
- [ ] Uploader clé SSH vers Hetzner
- [ ] Créer premier serveur
- [ ] Configurer firewall
- [ ] SSH vers serveur
- [ ] Configurer unattended-upgrades
- [ ] Installer monitoring (node_exporter)

### Checklist - Production Ready

- [ ] Architecture HA (3+ serveurs, 2+ AZ)
- [ ] Load Balancer configuré
- [ ] Private networks pour backend
- [ ] Firewalls multi-couches
- [ ] SSH hardening (keys only, fail2ban)
- [ ] Backups automatiques activés
- [ ] Monitoring (Prometheus/Grafana)
- [ ] Alerting configuré
- [ ] CI/CD pipeline
- [ ] Disaster recovery plan testé
- [ ] Documentation architecture
- [ ] Runbooks incidents

### Checklist - Kubernetes Production

- [ ] Cluster 3+ control planes
- [ ] 3+ worker nodes
- [ ] hcloud-cloud-controller-manager
- [ ] CSI driver pour volumes
- [ ] Ingress controller (nginx/traefik)
- [ ] Cert-manager pour TLS
- [ ] Monitoring stack (Prometheus)
- [ ] Logging stack (Loki/ELK)
- [ ] Network policies
- [ ] Pod Security Standards
- [ ] Resource limits/requests
- [ ] HPA configuré
- [ ] Backup strategy (Velero)

---

## 💡 Conseils Finaux

### Performance

1. **Choisir la bonne région**
   - EU (FSN1/NBG1): Meilleure latence Europe, traffic généreux
   - USA: Latence Amérique, traffic limité
   - SG: Asie, attention au coût traffic overage

2. **Types de serveurs**
   - Dev/Test: CX (shared, économique)
   - Production variable: CPX (shared performant)
   - Production stable: CCX (dedicated)
   - ARM workloads: CAX (excellent rapport qualité/prix)

3. **Networking**
   - Toujours utiliser private networks entre serveurs
   - Floating IPs pour HA sans downtime
   - Load Balancers plutôt que HAProxy manuel

### Coûts

1. **Optimisation continue**
   - Audit mensuel des ressources
   - Supprimer volumes/snapshots inutilisés
   - Right-size instances (monitoring utilisation)
   - Shutdown dev/staging hors heures

2. **Traffic management**
   - CDN pour assets statiques
   - Compression (gzip/brotli)
   - Attention Singapore (€7.40/TB overage !)

3. **Backups intelligents**
   - Snapshots manuels pour templates
   - Backups auto (20%) pour prod uniquement
   - Storage Box + Borg pour archives
   - Rotation automatique

### Sécurité

1. **Defense in depth**
   - Hetzner Firewall (infrastructure)
   - UFW (OS level)
   - Application firewall (nginx/ModSecurity)

2. **Secrets**
   - JAMAIS dans Git
   - Variables d'environnement
   - Vault pour production

3. **Updates**
   - unattended-upgrades activé
   - Monitoring CVEs
   - Plan de patching

### Évolutivité

1. **Penser cloud-native dès le départ**
   - Stateless applications
   - Stockage externe (Volumes/S3)
   - Configuration externalisée

2. **Automation first**
   - Terraform pour infrastructure
   - Ansible pour configuration
   - CI/CD pour déploiements

3. **Monitoring early**
   - Métriques dès le jour 1
   - Alerting proactif
   - Capacity planning

---

## 🚀 Prochaines Étapes

Maintenant que vous avez une compréhension complète de Hetzner Cloud :

1. **Commencer petit**
   - Déployer un serveur test
   - Expérimenter avec les features
   - Tester les outils (Terraform, hcloud CLI)

2. **Construire progressivement**
   - Ajouter networking privé
   - Configurer monitoring
   - Implémenter HA

3. **Automatiser**
   - Infrastructure as Code
   - CI/CD pipelines
   - Backups automatisés

4. **Optimiser**
   - Monitoring continu
   - Cost optimization
   - Performance tuning

**Bonne chance avec Hetzner Cloud ! 🎉**
