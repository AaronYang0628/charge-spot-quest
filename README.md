# 邻里互助 · 共享充电 · Charge Spot Quest

> **需求与问题清单（权威）：** [docs/REQUIREMENTS-AND-ISSUES.md](docs/REQUIREMENTS-AND-ISSUES.md)

主人在自有车位装了充电桩，开放给邻居预约慢充（Vite + React + TS + Tailwind + Framer Motion + React Three Fiber）。无登录、无支付；浏览器 `sessionId` + 本地 mock（待薄后端）。

## Demo（前端）

GitHub Pages：https://aaronyang0628.github.io/charge-spot-quest/  
（国内访问可能较慢；生产静态资源建议另挂国内 OSS/CDN 或 k3s。）

## UX（当前）

- 开屏：大日期 + 三维车位 **647 / 648 / 649**；每卡 **今早 / 中午 / 今晚** 空闲条，按本地时钟 **08 / 12 / 18** 切换「此刻」高亮
- 三卡下方：**今日预约 / 登记**（仅今天，车牌打码）
- 仅 **649** 可约；647/648 维护中
- CTA：`🔋预约649车位充电` → 抽屉选日期（‹ › 无圆圈、不可早于今天、共 7 天）+ 早/中/晚 + 车牌/颜色/类型（颜色仅 **黑白灰红蓝**）
- 场景可拖动调视角；车辆不自动旋转
- Mock：`src/api/`；session：`localStorage`

## Dev

```bash
npm install
npm run dev    # http://localhost:5173  （注意 Vite base 为 /charge-spot-quest/，本地一般仍可用）
npm test
npm run build
```

手机竖屏优先（~390px）。

## Deploy — Helm / k3s（给其他 agent 的部署说明）

仓库内已有脚手架 chart：[`charts/charge-spot-quest`](charts/charge-spot-quest)（**v0.1.0**）。  
**现状：** 前端仍在 GitHub Pages + mock；chart 面向未来的 **薄 API + Postgres**。默认 `image.repository` / `tag` 是**占位镜像**，部署前必须改成真实 API 镜像。健康检查默认关闭，等 API 提供 `/health`、`/readyz` 后再打开。

**不要**把真实域名、集群内网 IP、密码写进公开 values / README；用 `charge-spot.example.com`、`pg.example.com` 这类占位符，密钥用集群外 Secret。

### 数据库两种模式（二选一）

| 模式 | 配置 | 适用 |
|------|------|------|
| **内置 PG** | `postgresql.enabled=true`（默认） | 演示 / MVP；单副本+PVC，非 HA |
| **外置 PG** | `postgresql.enabled=false` + `externalDatabase.*`（或现成 Secret） | **生产推荐** |

详细命令与 values 见 [charts/charge-spot-quest/README.md](charts/charge-spot-quest/README.md)。

### 内置 PG 示例

```bash
helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=<YOUR_API_IMAGE> \
  --set image.tag=<TAG> \
  --set postgresql.enabled=true \
  --set postgresql.auth.password='<CHANGE_ME>'
```

### 外置 PG 示例（推荐生产）

```bash
kubectl -n charge-spot create namespace charge-spot --dry-run=client -o yaml | kubectl apply -f -

kubectl -n charge-spot create secret generic charge-spot-db \
  --from-literal=DATABASE_URL='postgresql://USER:PASS@pg.example.com:5432/chargespot?sslmode=require'

helm upgrade --install charge-spot-quest ./charts/charge-spot-quest \
  -n charge-spot --create-namespace \
  --set image.repository=<YOUR_API_IMAGE> \
  --set image.tag=<TAG> \
  --set postgresql.enabled=false \
  --set externalDatabase.host=pg.example.com \
  --set secrets.create=false \
  --set secrets.existingSecret=charge-spot-db \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=charge-spot.example.com
```

Chart 会（在 `secrets.create=true` 时）根据内置/外置配置组装 `DATABASE_URL` 给 API；外置生产请优先用上面的 **existingSecret** 方式。

### 部署后自检

```bash
kubectl -n charge-spot get deploy,svc,ingress,pvc
kubectl -n charge-spot logs -l app.kubernetes.io/name=charge-spot-quest --tail=100
```

可选 Ingress：`--set ingress.enabled=true` + `ingress.hosts[0].host=...`（占位域名即可写进私有 values）。

## Visual

R3F 场景：`LotScene` + `public/models/*.glb`；2D 回退：`public/art/`。  
美术方向：`design-refs/art-direction/`。Token：`src/theme/tokens.css`。
