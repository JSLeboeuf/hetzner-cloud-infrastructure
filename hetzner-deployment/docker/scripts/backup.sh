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
