# 邻里互助 · 共享充电 · Charge Spot Quest

> **需求与问题清单：** [docs/REQUIREMENTS-AND-ISSUES.md](docs/REQUIREMENTS-AND-ISSUES.md)

主人在自有车位装了充电桩，开放给邻居预约慢充。无登录、无支付；浏览器 `sessionId` 标识预约者。

| 层 | 现状 |
|----|------|
| 前端 Demo | GitHub Pages（mock）或集群 Ingress `/`（同镜像 UI） |
| API + UI 镜像 | FastAPI + Vite dist（根 `Dockerfile`）→ GHCR |
| 部署 | Helm chart `charts/charge-spot-quest`（SQLite / 内置 PG / 外置 PG） |

## Demo

- Pages：https://aaronyang0628.github.io/charge-spot-quest/  
  （国内可能较慢；生产静态站建议 OSS/CDN 或集群 Ingress。）
- 镜像：`ghcr.io/aaronyang0628/charge-spot-quest:0.1.3`（另有 `latest`、`0.1.0`；含前端 UI + API）  
  https://github.com/users/AaronYang0628/packages/container/package/charge-spot-quest

## UX

- 三维车位 **647 / 648 / 649**；每卡只显示**当前时段**空闲条（本地时钟 **08→今早 / 12→中午 / 18→今晚**），并标功率（649=7kW，647/648=0kW）
- 三卡下：**今日预约 / 登记**（仅今天，车牌打码）
- 仅 **649** 可约；CTA：`🔋预约649车位充电`
- 抽屉：日期 ‹ ›（今天起 7 天）、早/中/晚、车牌/颜色/类型（**黑白灰红蓝**）
- 场景默认锁定以便页面滚动；**双击场景**可旋转约 10 秒；车不自动转

未设 `VITE_API_BASE` → `src/api/mock.ts`（Pages）。`VITE_API_BASE=/`（或 `same`）→ 同域 `/api`（Docker/Ingress）。绝对 URL → 直连该源。

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
# 可选 Postgres: export DATABASE_URL='postgresql://USER@127.0.0.1:5432/chargespot'  # password via PG* env / Secret, not in git
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

# 另一终端接 API（绝对 URL）
VITE_API_BASE=http://127.0.0.1:8080 npm run dev

# 或同域：先 build 再让 API 托管 dist
VITE_BASE=/ VITE_API_BASE=/ npm run build
STATIC_DIR="$(pwd)/dist" uvicorn app.main:app --app-dir server --host 0.0.0.0 --port 8080
```

- 健康：`/health`、`/readyz` · 文档：`/docs` · 有 static 时 `/` 为 SPA
- 测试：`cd server && pytest -q` · `./scripts/smoke.sh http://127.0.0.1:8080`
- 镜像：`docker build -f Dockerfile .`（勿用已废弃的 `server/Dockerfile`）

## Deploy — Helm / k3s（给其他 agent）

用仓库 chart [`charts/charge-spot-quest`](charts/charge-spot-quest) 部署 **UI + API**（同镜像）。镜像默认 `ghcr.io/aaronyang0628/charge-spot-quest:0.1.3`。Ingress `/` 出前端，`/api` 为 API；探针对 `/health`、`/readyz` 默认开启。

> **Agent handoff：** 拉 `0.1.3`/`latest` 后 `kubectl -n charge-spot rollout restart deploy/charge-spot-quest`（或 helm upgrade 改 tag）；打开 Ingress 根路径应是 HTML 应用，不再是 `{"detail":"Not Found"}`。

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
  --set image.tag=0.1.3 \
  --set postgresql.enabled=false \
  --set sqlite.enabled=true
```

重启可丢数据时加：`--set sqlite.persistence.enabled=false`。

### 内置 Postgres

```bash
helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=ghcr.io/aaronyang0628/charge-spot-quest \
  --set image.tag=0.1.3 \
  --set postgresql.enabled=true \
  --set postgresql.auth.password="$(openssl rand -hex 16)"
```

### 外置 Postgres（生产）

```bash
kubectl -n charge-spot create namespace charge-spot --dry-run=client -o yaml | kubectl apply -f -
kubectl -n charge-spot create secret generic charge-spot-db \
  --from-literal=DATABASE_URL='postgresql://USER@pg.example.com:5432/chargespot?sslmode=require'
  # put the real password only in the cluster Secret — never commit it

helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=ghcr.io/aaronyang0628/charge-spot-quest \
  --set image.tag=0.1.3 \
  --set postgresql.enabled=false \
  --set sqlite.enabled=false \
  --set externalDatabase.host=pg.example.com \
  --set secrets.create=false \
  --set secrets.existingSecret=charge-spot-db \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=charge-spot.example.com
```


### DingTalk 通知（可选）

预约成功后若同时设置 `DINGTALK_WEBHOOK_URL` 与 `DINGTALK_SEC_SECRET`（加签），API 会向钉钉发文本通知；缺 SEC 则跳过；失败只打日志，不影响预约。**不要**把真实 token/SEC 提交进 git；集群用 Secret / `extraEnv` valueFrom，见 [charts/charge-spot-quest/README.md](charts/charge-spot-quest/README.md)。

### 自检

```bash
kubectl -n charge-spot get deploy,svc,ingress,pvc
kubectl -n charge-spot logs -l app.kubernetes.io/name=charge-spot-quest --tail=100
curl -sS http://<svc-or-ingress>/health
```

细则与 values 表见 [charts/charge-spot-quest/README.md](charts/charge-spot-quest/README.md)。镜像由 `.github/workflows/container.yml`（根 `Dockerfile`，前端+API）在相关路径变更时推 GHCR。

## Visual

R3F：`LotScene` + `public/models/*.glb`；回退 `public/art/`。  
美术：`design-refs/art-direction/`。Token：`src/theme/tokens.css`。
