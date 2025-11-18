#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_date>"
    echo "Example: $0 20251118_030000"
    exit 1
fi

BACKUP_DATE=$1
BACKUP_DIR="/mnt/data/backups"
POSTGRES_CONTAINER="autoscale-postgres"

echo -e "${YELLOW}Restoring backup from $BACKUP_DATE...${NC}"

# Check if backup exists
if [ ! -f "$BACKUP_DIR/postgres_${BACKUP_DATE}.sql.gz" ]; then
    echo -e "${RED}ERROR: Backup file not found: $BACKUP_DIR/postgres_${BACKUP_DATE}.sql.gz${NC}"
    exit 1
fi

# Confirm
echo -e "${RED}WARNING: This will overwrite the current database!${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Stop services
echo -e "${YELLOW}Stopping services...${NC}"
docker-compose -f /opt/autoscale-ai/docker/docker-compose.prod.yml stop backend ai-layer

# Restore PostgreSQL
echo -e "${YELLOW}Restoring PostgreSQL...${NC}"
gunzip -c "$BACKUP_DIR/postgres_${BACKUP_DATE}.sql.gz" | docker exec -i $POSTGRES_CONTAINER psql -U postgres

# Restore Redis (optional)
if [ -f "$BACKUP_DIR/redis_${BACKUP_DATE}.rdb" ]; then
    echo -e "${YELLOW}Restoring Redis...${NC}"
    docker-compose -f /opt/autoscale-ai/docker/docker-compose.prod.yml stop redis
    cp "$BACKUP_DIR/redis_${BACKUP_DATE}.rdb" /mnt/data/redis/dump.rdb
    docker-compose -f /opt/autoscale-ai/docker/docker-compose.prod.yml start redis
fi

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f /opt/autoscale-ai/docker/docker-compose.prod.yml start backend ai-layer

echo -e "${GREEN}Restore completed!${NC}"
