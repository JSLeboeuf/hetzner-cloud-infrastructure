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
