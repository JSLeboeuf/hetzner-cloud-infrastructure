# Hetzner Cloud Deployment for AI Booking Agent

This directory contains all the Infrastructure as Code (IaC) and deployment scripts for deploying the ai-booking-agent application to Hetzner Cloud.

## 📁 Structure

```
hetzner-deployment/
├── terraform/              # Infrastructure as Code
│   ├── main.tf            # Main Terraform configuration
│   ├── variables.tf       # Variable definitions
│   └── terraform.tfvars.example  # Example values (copy to terraform.tfvars)
├── docker/                # Docker deployment files
│   ├── scripts/
│   │   ├── deploy.sh      # Main deployment script
│   │   ├── backup.sh      # Database backup script
│   │   └── restore.sh     # Database restore script
│   └── nginx/             # Nginx reverse proxy configuration
└── docs/                  # Additional documentation

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install Terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform

# Verify hcloud CLI is configured
hcloud context list
```

### 2. Generate SSH Key

```bash
ssh-keygen -t ed25519 -f ~/.ssh/hetzner_autoscale -C "autoscale-ai"
```

### 3. Configure Terraform

```bash
cd terraform/
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

Update:
- `hcloud_token` = Your Hetzner API token
- `ssh_public_key_path` = Path to your SSH public key

### 4. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply (create infrastructure)
terraform apply

# Get server IP
terraform output server_ip
```

### 5. Configure DNS

Add DNS record in Namecheap:
```
Type: A
Host: api
Value: <SERVER_IP from terraform output>
TTL: 300
```

### 6. Deploy Application

```bash
# SSH to server
ssh root@<SERVER_IP>

# Copy .env file (from local machine)
scp /path/to/.env root@<SERVER_IP>:/opt/autoscale-ai/.env

# Copy deployment files
scp -r docker/ root@<SERVER_IP>:/opt/autoscale-ai/

# Run deployment
ssh root@<SERVER_IP> /opt/autoscale-ai/docker/scripts/deploy.sh
```

### 7. Setup SSL

```bash
ssh root@<SERVER_IP>

# Install certbot
apt-get install -y certbot python3-certbot-nginx

# Get certificate
certbot certonly --standalone \
  --preferred-challenges http \
  --email your-email@domain.com \
  -d api.autoscaleai.ca \
  --agree-tos
```

## 📊 Monitoring

### Check Service Status

```bash
ssh root@<SERVER_IP>

# Container status
docker-compose -f /opt/autoscale-ai/docker/docker-compose.prod.yml ps

# Logs
docker-compose -f /opt/autoscale-ai/docker/docker-compose.prod.yml logs -f

# Health checks
curl http://localhost:3000/health
curl http://localhost:8000/health
```

### System Metrics

```bash
# CPU & Memory
htop

# Disk usage
df -h

# Docker stats
docker stats
```

## 💾 Backup & Restore

### Manual Backup

```bash
ssh root@<SERVER_IP>
/opt/autoscale-ai/docker/scripts/backup.sh
```

### Scheduled Backup (Daily at 3 AM)

```bash
crontab -e

# Add this line:
0 3 * * * /opt/autoscale-ai/docker/scripts/backup.sh >> /var/log/autoscale-backup.log 2>&1
```

### Restore from Backup

```bash
ssh root@<SERVER_IP>

# List available backups
ls -lh /mnt/data/backups/

# Restore (format: YYYYMMDD_HHMMSS)
/opt/autoscale-ai/docker/scripts/restore.sh 20251118_030000
```

## 🔥 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f /opt/autoscale-ai/docker/docker-compose.prod.yml logs

# Rebuild containers
docker-compose -f /opt/autoscale-ai/docker/docker-compose.prod.yml build --no-cache
docker-compose -f /opt/autoscale-ai/docker/docker-compose.prod.yml up -d
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs autoscale-postgres

# Test connection
docker exec -it autoscale-postgres psql -U postgres -c "SELECT 1;"
```

### High CPU/Memory Usage

```bash
# Check resource usage
docker stats

# Scale down AI workers if needed (edit docker-compose.prod.yml)
# Restart services
docker-compose -f /opt/autoscale-ai/docker/docker-compose.prod.yml restart
```

## 📝 Cost Breakdown

### Monthly Costs

- **Server CCX33:** €37.00/month
- **Volume 50GB:** €2.90/month
- **Backups (20% of server):** €7.40/month (optional)

**Total:** €39.90/month (€47.30/month with backups)

### Cost Optimization

- Use server snapshots instead of backups: €0.015/GB/month
- Scale down to CPX31 (4 vCPU, 8GB): €19.90/month (if traffic is low)
- Remove backups and manage manually

## 🔒 Security Checklist

- [ ] SSH key authentication only (disable password auth)
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] Fail2Ban installed and running
- [ ] SSL/TLS certificates from Let's Encrypt
- [ ] Regular backups scheduled
- [ ] .env file permissions set to 600
- [ ] Secrets rotated regularly (90 days)

## 📚 Additional Resources

- [Hetzner Cloud Documentation](https://docs.hetzner.com/)
- [Terraform Hetzner Provider](https://registry.terraform.io/providers/hetznercloud/hcloud/latest/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## 🆘 Support

**Documentation:**
- Infrastructure requirements: `/home/developer/AI_BOOKING_AGENT_INFRASTRUCTURE_REQUIREMENTS.md`
- Deployment plan: `/home/developer/HETZNER_DEPLOYMENT_PLAN.md`

**Monitoring:**
- Sentry: https://sentry.io/
- PostHog: https://app.posthog.com/
- LangSmith: https://smith.langchain.com/

---

**Last Updated:** 2025-11-18
**Maintained by:** AutoScale AI Team
