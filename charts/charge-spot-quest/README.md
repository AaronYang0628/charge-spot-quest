# charge-spot-quest Helm chart

部署 **邻里互助 · 共享充电** UI + API（同容器：Vite SPA + FastAPI）到 Kubernetes / k3s。

- Chart / app：**0.1.10**
- 默认镜像：`ghcr.io/aaronyang0628/charge-spot-quest:0.1.10`（含前端；Ingress `/` 为应用，`/api` 为 API）
- 需要：Kubernetes `>= 1.25`
- 无 Bitnami 依赖（方便国内镜像环境）

> **给其他 agent：** 总述在仓库根 [README.md](../../README.md)「Deploy — Helm / k3s」；本页是命令与 values 细则。  
> 镜像自 **0.1.10** 起含 UI：`rollout restart` / helm upgrade 到 `0.1.10` 后 Ingress `/` 应出 HTML。  
> **不要**提交真实域名 / 内网 IP / 密码；用 `charge-spot.example.com`、`pg.example.com`。

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
  --set image.tag=0.1.10 \
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
  --set image.tag=0.1.10 \
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
  --set image.tag=0.1.10 \
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
| `image.tag` | `0.1.10` | 也有 `latest`、`0.1.0`、`0.1.1` |
| `service.port` | `8080` | |
| `sqlite.enabled` | `false` | 与 PG 互斥 |
| `sqlite.persistence.size` | `1Gi` | |
| `postgresql.enabled` | `true` | 内置 PG |
| `postgresql.persistence.size` | `5Gi` | |
| `externalDatabase.host` | `pg.example.com` | 关内置且非 SQLite 时 |
| `ingress.enabled` | `false` | |
| `livenessProbe.enabled` | `true` | `/health` |
| `readinessProbe.enabled` | `true` | `/readyz` |


## DingTalk 预约通知（可选）

成功 `POST /api/bookings` 后，若同时设置 `DINGTALK_WEBHOOK_URL`（完整 webhook URL）与 `DINGTALK_SEC_SECRET`（加签 SEC），会向钉钉自定义机器人发文本通知（timestamp + HMAC-SHA256）。缺 SEC 时打 warning 并跳过；通知失败**不会**影响预约成功。

**切勿**把真实 token / SEC 写进 values、README 或源码。集群内用 Secret：

```bash
kubectl -n charge-spot create secret generic charge-spot-dingtalk \
  --from-literal=webhook_url='https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN' \
  --from-literal=sec_secret='SECxxxxxxxxxxxx'

helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot \
  --set image.tag=0.1.10 \
  --set-json 'extraEnv=[
    {"name":"DINGTALK_WEBHOOK_URL","valueFrom":{"secretKeyRef":{"name":"charge-spot-dingtalk","key":"webhook_url"}}},
    {"name":"DINGTALK_SEC_SECRET","valueFrom":{"secretKeyRef":{"name":"charge-spot-dingtalk","key":"sec_secret"}}}
  ]'
```

本地 smoke：`export DINGTALK_WEBHOOK_URL=... DINGTALK_SEC_SECRET=...`（勿写入已跟踪文件）。

## 安全

- 生产：外置 PG + 集群外 Secret
- 勿把真实连接串提交进 git
- 内置 PG / SQLite 均为单节点演示级，非 HA
