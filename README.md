# 邻里互助 · 共享充电 · Charge Spot Quest

邻居在主人车位上预约慢充时段：移动端优先、低模（low-poly）三车位场景，**无登录**；访客用浏览器 `sessionId` 标识。普通预约免费；主人车牌占用时段时可走 **超级插队 ¥5**（支付宝收款码 stub，无应用内支付网关）。

| 层 | 说明 |
|----|------|
| 前端 Demo | [GitHub Pages](https://aaronyang0628.github.io/charge-spot-quest/)（mock）或集群 Ingress `/`（同镜像 UI） |
| API + UI | FastAPI + Vite/React/R3F → 单镜像 GHCR |
| 部署 | Helm chart [`charts/charge-spot-quest`](charts/charge-spot-quest)（SQLite / 内置 PG / 外置 PG） |

> 需求考古：[docs/REQUIREMENTS-AND-ISSUES.md](docs/REQUIREMENTS-AND-ISSUES.md)（早期清单；以本 README 为准）

## 产品怎么用

- 三维车位 **647 / 648 / 649**；仅 **649** 可约（7kW）；647/648 维护中（0kW）
- 每卡展示**当前时段**空闲条（本地时钟约 **08→今早 / 12→中午 / 18→今晚**）
- 三卡下：**今日预约 / 登记**（仅今天，车牌打码）
- CTA：`🔋预约649车位充电` → 抽屉：日期 ‹ ›（今天起 **7 天**）、早/中/晚、车牌/颜色/类型（黑白灰红蓝）
- 场景默认锁定便于滚动；**双击场景**可旋转约 10 秒

### 超级插队 ¥5

当该时段已被**主人车牌**占用时，可发起超级插队：

1. 弹出支付页（支付宝收款码 stub）→ **已支付成功** / **取消插队**
2. 确认支付后占用时段；取消则恢复主人占用
3. 钉钉通知插队 / 取消；若配置了 `PUBLIC_BASE_URL` + revoke secret，插队消息附带**签名撤销链接**（车主核对未到账时可一点撤销）

普通预约、插队、取消插队均可发钉钉（需 webhook + 加签 SEC）。

支付说明：**无应用内支付网关**；仅插队走支付宝二维码 stub；正常预约免费。

未设 `VITE_API_BASE` → `src/api/mock.ts`（Pages）。`VITE_API_BASE=/`（或 `same`）→ 同域 `/api`。绝对 URL → 直连该源。

## Demo / 镜像

- Pages：https://aaronyang0628.github.io/charge-spot-quest/  
  （国内可能较慢；生产建议 OSS/CDN 或集群 Ingress。）
- 镜像：`ghcr.io/aaronyang0628/charge-spot-quest:0.1.13`（另有 `latest`；含前端 UI + API）  
  https://github.com/users/AaronYang0628/packages/container/package/charge-spot-quest

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
# 可选 Postgres: export DATABASE_URL='postgresql://USER@127.0.0.1:5432/chargespot'
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

# 另一终端接 API
VITE_API_BASE=http://127.0.0.1:8080 npm run dev

# 或同域：先 build 再让 API 托管 dist
VITE_BASE=/ VITE_API_BASE=/ npm run build
STATIC_DIR="$(pwd)/dist" uvicorn app.main:app --app-dir server --host 0.0.0.0 --port 8080
```

- 健康：`/health`、`/readyz` · 文档：`/docs` · 有 static 时 `/` 为 SPA
- 测试：`cd server && pytest -q` · `./scripts/smoke.sh http://127.0.0.1:8080`
- 镜像：`docker build -f Dockerfile .`（勿用已废弃的 `server/Dockerfile`）

## Deploy — Helm / k3s（给其他 agent）

用仓库 chart [`charts/charge-spot-quest`](charts/charge-spot-quest) 部署 **UI + API**（同镜像 `0.1.13`）。Ingress `/` 出前端，`/api` 为 API；探针 `/health`、`/readyz`。

> **Agent handoff：** 拉 `0.1.13`/`latest` 后 `helm upgrade`（或 `kubectl -n charge-spot rollout restart deploy/charge-spot-quest`）；打开 Ingress 根路径应是 HTML 应用。钉钉用一等公民 `dingtalk.enabled` + `existingSecret` + `publicBaseUrl`，勿再靠巨型 `extraEnv`。

**禁止**把真实域名、内网 IP、密码、webhook/SEC 写进公开 values / README；示例一律 `charge-spot.example.com`、`pg.example.com`，密钥进集群 Secret。

数据库 **三选一**：

| 模式 | 设置 | 适用 |
|------|------|------|
| **SQLite** | `sqlite.enabled=true` + `postgresql.enabled=false` | 节点演示；默认 1Gi PVC |
| **内置 PG** | `postgresql.enabled=true`（chart 默认） | MVP；单副本非 HA |
| **外置 PG** | `postgresql.enabled=false` + `externalDatabase.*` 或现成 `DATABASE_URL` Secret | **生产推荐** |

### SQLite

```bash
helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=ghcr.io/aaronyang0628/charge-spot-quest \
  --set image.tag=0.1.13 \
  --set postgresql.enabled=false \
  --set sqlite.enabled=true
```

### 内置 Postgres

```bash
helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=ghcr.io/aaronyang0628/charge-spot-quest \
  --set image.tag=0.1.13 \
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
  --set image.tag=0.1.13 \
  --set postgresql.enabled=false \
  --set sqlite.enabled=false \
  --set externalDatabase.host=pg.example.com \
  --set secrets.create=false \
  --set secrets.existingSecret=charge-spot-db \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=charge-spot.example.com
```

### DingTalk（一等公民 values）

预约 / 超级插队 / 取消插队 → 钉钉文本；插队可附签名撤销 URL。

```bash
kubectl -n charge-spot create secret generic charge-spot-dingtalk \
  --from-literal=webhook_url='https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN' \
  --from-literal=sec_secret='SECxxxxxxxxxxxx' \
  --from-literal=revoke_secret="$(openssl rand -hex 32)"

helm upgrade --install charge-spot-quest ./charts/charge-spot-quest -n charge-spot \
  --set image.tag=0.1.13 \
  --set dingtalk.enabled=true \
  --set dingtalk.existingSecret=charge-spot-dingtalk \
  --set dingtalk.publicBaseUrl=https://charge-spot.example.com
```

Secret keys：`webhook_url`、`sec_secret`、`revoke_secret`。细则见 [charts/charge-spot-quest/README.md](charts/charge-spot-quest/README.md)。

### 自检

```bash
kubectl -n charge-spot get deploy,svc,ingress,pvc
kubectl -n charge-spot logs -l app.kubernetes.io/name=charge-spot-quest --tail=100
curl -sS http://<svc-or-ingress>/health
```

镜像由 `.github/workflows/container.yml`（根 `Dockerfile`）在相关路径变更时推 GHCR。

## Visual

R3F：`LotScene` + `public/models/*.glb`；回退 `public/art/`。  
美术：`design-refs/art-direction/`。Token：`src/theme/tokens.css`。
