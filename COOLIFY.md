# Coolify deployment

This project deploys as a two-service Docker Compose stack:

- `nginx` is the public HTTP entrypoint on port `80`.
- `cashper` runs the Vinext application internally on port `8787`.

## Coolify setup

1. Create a Docker Compose resource from this repository.
2. Set these runtime variables in Coolify:

   - `HELIUS_API_KEY` — server-only Helius key.
   - `SOLANA_RPC_URL` — primary Solana RPC URL.
   - `SOLANA_FALLBACK_RPC_URL` — fallback RPC URL.

3. Point the Coolify domain to the `nginx` service on container port `80`.
4. Use `/nginx-health` as the HTTP health path if Coolify requests one.
5. Deploy. Do not commit provider keys or create a `.env` file in the repository.

For local Compose testing, run:

```bash
docker compose up --build
```

The default local URL is `http://localhost:8080`. Set `WEB_PORT` to use another host port. The port mapping lives in `docker-compose.override.yml`, which Docker Compose loads automatically on localhost but Coolify ignores (Coolify routes traffic through its own proxy to the `nginx` container on port `80`).
