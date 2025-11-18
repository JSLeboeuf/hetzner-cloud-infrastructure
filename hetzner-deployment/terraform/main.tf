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
