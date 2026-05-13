#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
DOCKER_CMD=${DOCKER_CMD:-docker}
container="$($DOCKER_CMD compose ps -q postgres)"
if [[ -z "${container:-}" ]]; then
  echo "postgres container not running" >&2
  exit 1
fi
$DOCKER_CMD compose exec -T postgres pg_dump -U "${POSTGRES_USER:-chat_nextjs}" "${POSTGRES_DB:-chat_nextjs}" | gzip > "backups/postgres-$stamp.sql.gz"
echo "backups/postgres-$stamp.sql.gz"
