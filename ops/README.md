# chat-nextjs Bunker deployment

Target path: `/opt/empire/apps/chat-nextjs/app`

## Current design
- Docker Compose app + Postgres.
- App listens only on `127.0.0.1:3100` on the host.
- Public exposure/reverse proxy is intentionally not configured yet.
- Real `.env` must stay outside git.

## First deploy
```bash
cd /opt/empire/apps/chat-nextjs/app
cp .env.example .env
# edit .env with strong POSTGRES_PASSWORD and JWT_SECRET
./scripts/deploy-local.sh
```

## Backup
```bash
cd /opt/empire/apps/chat-nextjs/app
./scripts/backup-postgres.sh
```

## Smoke test
```bash
curl -fsS http://127.0.0.1:3100/
docker compose ps
```

## Security notes
- Do not deploy with placeholder secrets.
- Do not expose Postgres publicly.
- Put Cloudflare/reverse proxy in front only after local smoke tests pass.
