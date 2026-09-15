# charge-spot-quest Helm chart

Kubernetes / k3s scaffold for **邻里互助 · 共享充电** (Charge Spot Quest).

Chart version **0.1.0**, appVersion **0.1.0**.

> **Agent handoff:** 根目录 [README.md](../../README.md) 的「Deploy — Helm / k3s」是给其他 ops agent 的总述；本文件是命令细则。

> **Honest status:** the product is still mostly a Vite frontend + mock API on GitHub Pages. This chart is ready for a **thin API + Postgres** once an image exists. The default `image.repository` / `tag` are **placeholders** — override them at install time.

Requires Kubernetes `>= 1.25`. No Bitnami subchart dependency (simpler for offline China mirrors); bundled Postgres is a small in-chart Deployment+PVC.

## Database modes / 数据库模式

| Mode | Values | Notes |
|------|--------|-------|
| **Bundled / 内置 PG** | `postgresql.enabled: true` (default) | Chart deploys Postgres 16 + PVC + builds `DATABASE_URL` for the API. **MVP / demo only.** |
| **External / 外置 PG** | `postgresql.enabled: false` + `externalDatabase.*` | Point at managed Postgres. **Prefer this in production.** |

### A) Bundled Postgres (内置)

```bash
helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=ghcr.io/aaronyang0628/charge-spot-quest \
  --set image.tag=0.1.0 \
  --set postgresql.enabled=true \
  --set postgresql.auth.password='change-me'
```

If `postgresql.auth.password` is empty, the chart generates a random password into the app Secret (stable across upgrades via `lookup`).

### B) External Postgres (外置)

```bash
# Option 1: password in values (local/non-prod only — prefer a Secret)
helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=ghcr.io/aaronyang0628/charge-spot-quest \
  --set image.tag=0.1.0 \
  --set postgresql.enabled=false \
  --set externalDatabase.host=pg.example.com \
  --set externalDatabase.port=5432 \
  --set externalDatabase.user=chargespot \
  --set externalDatabase.database=chargespot \
  --set externalDatabase.password='change-me' \
  --set externalDatabase.sslMode=require
```

```bash
# Option 2: existing Secret with DATABASE_URL (recommended for production)
kubectl -n charge-spot create secret generic charge-spot-db \
  --from-literal=DATABASE_URL='postgresql://chargespot:SECRET@pg.example.com:5432/chargespot?sslmode=require'

helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=ghcr.io/aaronyang0628/charge-spot-quest \
  --set image.tag=0.1.0 \
  --set postgresql.enabled=false \
  --set externalDatabase.host=pg.example.com \
  --set secrets.create=false \
  --set secrets.existingSecret=charge-spot-db
```

Do **not** commit real hostnames or passwords. Placeholders like `pg.example.com` / `charge-spot.example.com` are intentional.

## Optional Ingress

```bash
helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=charge-spot.example.com
```

## What gets deployed

- **Deployment + Service** for the API (or static+API) container — image fully configurable
- **ConfigMap** from `env.*`
- **Secret** with `DATABASE_URL` (and `POSTGRES_*` when bundled)
- **Optional** Ingress
- **Optional** Postgres Deployment + Service + PVC when `postgresql.enabled: true`

Liveness / readiness probes default to **off** until the real API exposes `/health` and `/readyz` (`livenessProbe.enabled` / `readinessProbe.enabled`).

## Values cheat sheet

| Key | Default | Notes |
|-----|---------|-------|
| `image.repository` | `ghcr.io/aaronyang0628/charge-spot-quest` | Placeholder |
| `image.tag` | `0.1.0` | Override when you publish |
| `service.port` | `8080` | Container + Service port |
| `postgresql.enabled` | `true` | 内置 PG |
| `postgresql.auth.username` | `chargespot` | |
| `postgresql.persistence.size` | `5Gi` | |
| `externalDatabase.host` | `pg.example.com` | Used when bundled off |
| `ingress.enabled` | `false` | |
| `secrets.create` | `true` | Chart builds `DATABASE_URL` |

## Security notes

- Prefer **external Postgres** and an **out-of-band Secret** for production.
- Never commit real passwords, connection strings, or cluster hostnames.
- Bundled Postgres is single-replica and not HA — fine for demos, not for production data.
