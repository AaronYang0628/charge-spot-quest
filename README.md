# 邻里互助 · 共享充电 · Charge Spot Quest

> **需求与问题清单：** [docs/REQUIREMENTS-AND-ISSUES.md](docs/REQUIREMENTS-AND-ISSUES.md)

主人在自有车位装了充电桩，开放给邻居预约慢充。无登录、无支付；浏览器 `sessionId` 标识预约者。

| 层 | 现状 |
|----|------|
| 前端 Demo | GitHub Pages + 可选本地 mock |
| 薄 API | FastAPI（`server/`），镜像已发 GHCR |
| 部署 | Helm chart `charts/charge-spot-quest`（SQLite / 内置 PG / 外置 PG） |

## Demo

- Pages：https://aaronyang0628.github.io/charge-spot-quest/  
  （国内可能较慢；生产静态站建议 OSS/CDN 或集群 Ingress。）
- 镜像：`ghcr.io/aaronyang0628/charge-spot-quest:0.1.0`（另有 `latest`）  
  https://github.com/users/AaronYang0628/packages/container/package/charge-spot-quest

## UX

- 三维车位 **647 / 648 / 649**；每卡 **今早 / 中午 / 今晚** 空闲，本地时钟 **08 / 12 / 18** 标「此刻」
- 三卡下：**今日预约 / 登记**（仅今天，车牌打码）
- 仅 **649** 可约；CTA：`🔋预约649车位充电`
- 抽屉：日期 ‹ ›（今天起 7 天）、早/中/晚、车牌/颜色/类型（**黑白灰红蓝**）
- 场景可拖动；车不自动转

前端未设 `VITE_API_BASE` 时走 `src/api/mock.ts`；接集群/本地 API 时设该变量。

## 本地开发

```bash
# 前端
npm install && npm run dev    # http://localhost:5173
npm test && npm run build

# 后端（默认 SQLite → server/data/chargespot.sqlite）
cd server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export ALLOW_DEMO_RESET=true   # 可选
# 可选 Postgres: export DATABASE_URL='postgresql://USER:PASS@127.0.0.1:5432/chargespot'
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

# 另一终端接 API
VITE_API_BASE=http://127.0.0.1:8080 npm run dev
```

- 健康：`/health`、`/readyz` · 文档：`/docs`
- 测试：`cd server && pytest -q` · `./scripts/smoke.sh http://127.0.0.1:8080`

## Deploy — Helm / k3s（给其他 agent）

用仓库 chart [`charts/charge-spot-quest`](charts/charge-spot-quest) 部署 **薄 API**。镜像默认已是 `ghcr.io/aaronyang0628/charge-spot-quest:0.1.0`。探针对 `/health`、`/readyz` 默认开启。

**禁止**把真实域名、内网 IP、密码写进公开 values；用 `charge-spot.example.com`、`pg.example.com`，密钥用集群 Secret。

数据库 **三选一**：

| 模式 | 设置 | 适用 |
|------|------|------|
| **SQLite** | `sqlite.enabled=true` + `postgresql.enabled=false` | 最简单节点演示；默认 1Gi PVC |
| **内置 PG** | `postgresql.enabled=true`（chart 默认） | MVP；单副本非 HA |
| **外置 PG** | `postgresql.enabled=false` + `externalDatabase.*` 或现成 `DATABASE_URL` Secret | **生产推荐** |

### SQLite（不要内置、也不要外置 PG）

```bash
helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=ghcr.io/aaronyang0628/charge-spot-quest \
  --set image.tag=0.1.0 \
  --set postgresql.enabled=false \
  --set sqlite.enabled=true
```

重启可丢数据时加：`--set sqlite.persistence.enabled=false`。

### 内置 Postgres

```bash
helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=ghcr.io/aaronyang0628/charge-spot-quest \
  --set image.tag=0.1.0 \
  --set postgresql.enabled=true \
  --set postgresql.auth.password='CHANGE_ME'
```

### 外置 Postgres（生产）

```bash
kubectl -n charge-spot create namespace charge-spot --dry-run=client -o yaml | kubectl apply -f -
kubectl -n charge-spot create secret generic charge-spot-db \
  --from-literal=DATABASE_URL='postgresql://USER:PASS@pg.example.com:5432/chargespot?sslmode=require'

helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=ghcr.io/aaronyang0628/charge-spot-quest \
  --set image.tag=0.1.0 \
  --set postgresql.enabled=false \
  --set sqlite.enabled=false \
  --set externalDatabase.host=pg.example.com \
  --set secrets.create=false \
  --set secrets.existingSecret=charge-spot-db \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=charge-spot.example.com
```

### 自检

```bash
kubectl -n charge-spot get deploy,svc,ingress,pvc
kubectl -n charge-spot logs -l app.kubernetes.io/name=charge-spot-quest --tail=100
curl -sS http://<svc-or-ingress>/health
```

细则与 values 表见 [charts/charge-spot-quest/README.md](charts/charge-spot-quest/README.md)。镜像由 `.github/workflows/container.yml` 在 `server/**` 变更时推 GHCR。

## Visual

R3F：`LotScene` + `public/models/*.glb`；回退 `public/art/`。  
美术：`design-refs/art-direction/`。Token：`src/theme/tokens.css`。
