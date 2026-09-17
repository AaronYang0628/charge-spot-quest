# charge-spot-quest Helm chart

部署 **邻里互助 · 共享充电**（Charge Spot Quest）：邻居预约慢充 + 超级插队；同容器 Vite/React/R3F SPA + FastAPI。

- Chart / app：**0.1.14**
- 默认镜像：`ghcr.io/aaronyang0628/charge-spot-quest:0.1.14`（含前端；Ingress `/` 为应用，`/api` 为 API）
- 需要：Kubernetes `>= 1.25`
- 无 Bitnami 依赖（方便国内镜像环境）
- 钉钉：一等公民 `dingtalk.enabled` + `existingSecret` + `publicBaseUrl`（勿再靠巨型 `extraEnv`）

> **给其他 agent：** 产品与总述在仓库根 [README.md](../../README.md)；本页是 Helm 命令与 values 细则。  
> 镜像自 **0.1.11** 起含 UI：`helm upgrade` / `rollout restart` 到 `0.1.14` 后 Ingress `/` 应出 HTML。  
> **不要**提交真实域名 / 内网 IP / 密码 / webhook；用 `charge-spot.example.com`、`pg.example.com`。

## 数据库模式（三选一）

| 模式 | Values | 说明 |
|------|--------|------|
| **SQLite** | `sqlite.enabled=true` + `postgresql.enabled=false` | 无 Postgres Pod；文件库 + 可选 PVC；**单节点演示** |
| **内置 PG** | `postgresql.enabled=true`（默认） | 集群内 Postgres 16 + PVC；MVP |
| **外置 PG** | `postgresql.enabled=false` + `externalDatabase.*`（且 `sqlite.enabled=false`） | 托管库；**生产推荐** |

互斥：`sqlite.enabled` 与 `postgresql.enabled` 不能同时为 true。

### A) SQLite（不要内置 / 不要外置 PG）

```bash
helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=ghcr.io/aaronyang0628/charge-spot-quest \
  --set image.tag=0.1.14 \
  --set postgresql.enabled=false \
  --set sqlite.enabled=true
```

- Secret：`DATABASE_URL=sqlite:////app/data/chargespot.sqlite`
- 默认 PVC `1Gi` 挂到 `/app/data`；临时：`--set sqlite.persistence.enabled=false`
- **不要**多副本（RWO / 文件锁）

### B) 内置 Postgres

```bash
helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=ghcr.io/aaronyang0628/charge-spot-quest \
  --set image.tag=0.1.14 \
  --set postgresql.enabled=true \
  --set sqlite.enabled=false \
  --set postgresql.auth.password="$(openssl rand -hex 16)"
```

密码为空时 chart 会生成随机密码并写入 Secret（升级时尽量用 `lookup` 保持稳定）。

### C) 外置 Postgres

```bash
# 推荐：现成 Secret
kubectl -n charge-spot create secret generic charge-spot-db \
  --from-literal=DATABASE_URL='postgresql://chargespot@pg.example.com:5432/chargespot?sslmode=require'
  # real password only inside the Secret object, never in git

helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=ghcr.io/aaronyang0628/charge-spot-quest \
  --set image.tag=0.1.14 \
  --set postgresql.enabled=false \
  --set sqlite.enabled=false \
  --set externalDatabase.host=pg.example.com \
  --set secrets.create=false \
  --set secrets.existingSecret=charge-spot-db
```

或用 values 填 `externalDatabase.user/password/database/sslMode`（仅非生产）。

## Ingress（可选）

```bash
--set ingress.enabled=true \
--set ingress.hosts[0].host=charge-spot.example.com
```

## 会部署什么

| 资源 | 条件 |
|------|------|
| Deployment + Service（UI+API） | 始终 |
| ConfigMap / Secret（`DATABASE_URL` 等） | `secrets.create` 等 |
| Ingress | `ingress.enabled` |
| Postgres Deploy/Svc/PVC | `postgresql.enabled` |
| SQLite PVC | `sqlite.enabled` + `sqlite.persistence.enabled` |

探针默认 **开启**：`GET /health`、`GET /readyz`。

## Values 速查

| Key | Default | Notes |
|-----|---------|-------|
| `image.repository` | `ghcr.io/aaronyang0628/charge-spot-quest` | 已发布 |
| `image.tag` | `0.1.14` | 也有 `latest`、`0.1.0`、`0.1.1` |
| `service.port` | `8080` | |
| `sqlite.enabled` | `false` | 与 PG 互斥 |
| `sqlite.persistence.size` | `1Gi` | |
| `postgresql.enabled` | `true` | 内置 PG |
| `postgresql.persistence.size` | `5Gi` | |
| `externalDatabase.host` | `pg.example.com` | 关内置且非 SQLite 时 |
| `ingress.enabled` | `false` | |
| `dingtalk.enabled` | `false` | 钉钉通知 + 撤销链接 |
| `dingtalk.existingSecret` | `""` | keys: `webhook_url`, `sec_secret`, `revoke_secret` |
| `dingtalk.publicBaseUrl` | `""` | Ingress 源，无尾斜杠 |
| `extraEnv` | `[]` | 逃生舱；钉钉请用 `dingtalk.*` |
| `livenessProbe.enabled` | `true` | `/health` |
| `readinessProbe.enabled` | `true` | `/readyz` |


## DingTalk 预约 / 插队通知 + 撤销链接（可选）

用 chart 一等公民 values：`dingtalk.enabled` + `dingtalk.existingSecret` + `dingtalk.publicBaseUrl`（**不要**再靠巨型 `--set-json extraEnv=...`）。`extraEnv` 仍保留作逃生舱。

成功 `POST /api/bookings`（普通预约）、`POST /api/bookings/cut-in`（超级插队，`kind=cut_in`）、以及用户 `POST /api/bookings/cut-in/cancel`（`kind=cut_in_cancel`）后，若同时注入 webhook + 加签 SEC，则向钉钉自定义机器人发文本。缺 SEC → warning 并跳过；通知失败不影响业务。

### 车主撤销插队链接（支付宝线下核对）

插队创建 / 用户取消通知可附带**签名撤销 URL**。车主核对支付宝：已到账勿点；未到账打开 `GET /api/cut-in/revoke?bookingId=&exp=&sig=` 撤销插队并恢复占用（幂等 HTML）。

启用时 Deployment 注入：

| Env | 来源 |
|-----|------|
| `DINGTALK_WEBHOOK_URL` | Secret key `webhook_url` |
| `DINGTALK_SEC_SECRET` | Secret key `sec_secret` |
| `CUT_IN_REVOKE_SECRET` | Secret key `revoke_secret` |
| `PUBLIC_BASE_URL` | `dingtalk.publicBaseUrl`（非密钥，Ingress 源，无尾斜杠） |

`dingtalk.enabled=true` 时 **必须**同时设置 `existingSecret` 与 `publicBaseUrl`，否则 `helm template` / install 会 fail。

### 必须两步（Secret 一次 + Helm）

**切勿**把真实 token / SEC / revoke secret 写进 values、README 或源码。

**步骤 1 — 集群创建 Secret（占位符）：**

```bash
kubectl -n charge-spot create secret generic charge-spot-dingtalk \
  --from-literal=webhook_url='https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN' \
  --from-literal=sec_secret='SECxxxxxxxxxxxx' \
  --from-literal=revoke_secret="$(openssl rand -hex 32)"
```

**步骤 2 — Helm 开启 `dingtalk.*`：**

```bash
helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot \
  --set image.tag=0.1.14 \
  --set dingtalk.enabled=true \
  --set dingtalk.existingSecret=charge-spot-dingtalk \
  --set dingtalk.publicBaseUrl=https://charge-spot.example.com
```

自检：`kubectl -n charge-spot get deploy charge-spot-quest -o yaml | grep -E 'DINGTALK|PUBLIC_BASE|CUT_IN_REVOKE'`；再约一次 / 插队一次，钉钉群应收到消息（插队含撤销 URL）。

本地 smoke：`export DINGTALK_WEBHOOK_URL=... DINGTALK_SEC_SECRET=... PUBLIC_BASE_URL=http://127.0.0.1:8080 CUT_IN_REVOKE_SECRET=dev-only` 后打 API（勿写入已跟踪文件）。

## 安全

- 生产：外置 PG + 集群外 Secret
- 勿把真实连接串提交进 git
- 内置 PG / SQLite 均为单节点演示级，非 HA
