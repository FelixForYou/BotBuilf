#!/usr/bin/env bash
# Backup PostgreSQL terkompresi dengan rotasi. Jadwalkan via cron, mis.: 0 */6 * * * cd /app && npm run backup
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL belum diatur}"
DIR="${BACKUP_DIR:-./backups}"
KEEP="${BACKUP_KEEP:-28}"
mkdir -p "$DIR"
FILE="$DIR/fxbpay-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --format=custom --no-owner --dbname="$DATABASE_URL" --file="$FILE"
pg_restore --list "$FILE" > /dev/null   # verifikasi arsip dapat dibaca
echo "Backup: $FILE ($(du -h "$FILE" | cut -f1))"
ls -1t "$DIR"/fxbpay-*.dump | tail -n +$((KEEP + 1)) | xargs -r rm --
