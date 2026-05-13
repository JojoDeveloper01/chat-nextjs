#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .env ]]; then
  echo "Missing .env. Copy .env.example to .env and fill secrets first." >&2
  exit 1
fi
DOCKER_CMD=${DOCKER_CMD:-docker}
$DOCKER_CMD compose pull postgres
$DOCKER_CMD compose build app
$DOCKER_CMD compose up -d postgres
$DOCKER_CMD compose run --rm app npx prisma migrate deploy
$DOCKER_CMD compose up -d app
$DOCKER_CMD compose ps
