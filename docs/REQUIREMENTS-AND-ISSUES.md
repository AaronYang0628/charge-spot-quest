# 充电车位小站 · 需求与问题清单

> 仓库：https://github.com/AaronYang0628/charge-spot-quest（私有）  
> 文档日期：2026-09-14  
> 当前代码：`main`（推送时请以最新 commit 为准）  
> 状态：功能骨架可用；**车辆与场景透视对齐未解决**，3D 角度拧试已暂停。

---

## 1. 产品目标

移动端优先的慢充车位预约小游戏风 Web：用户看到今日三车位占用/概率，点可约车位预约早/中/晚，无登录、无支付；访客用浏览器 session 识别。

参考视觉：Synty POLYGON（[Starter Pack](https://assetstore.unity.com/packages/3d/environments/polygon-starter-pack-art-by-synty-156819)）低模硬边日光风。Unity 包仅作风格参考，仓内为重绘 webp，不进 unitypackage。

---

## 2. 需求（已定）

### 2.1 开屏主界面

| 项 | 说明 |
|---|---|
| 顶部 | 当前日期（大、清晰） |
| 中央 | Q/low-poly 三车位 A / B / C（视觉焦点） |
| 车位下方 | 进度条：如「1 小时后空闲概率」「今晚空闲概率」（满条=100%）；若占用则占用时长走表 |
| 日历 | **不要**抢开屏主视觉；近况以「今日三车位 + 概率」为主 |
| 可约性 | **仅 C 可约**；A/B **维护中**（路障+锥桶，非石柱） |

### 2.2 点击 C → 预约抽屉

| 项 | 说明 |
|---|---|
| 抽屉 | 底部呼出 |
| 顶部 | 大大的日期 |
| 时段 | 仅 **早 / 中 / 晚**，不要具体钟点、不要 30 分钟格子 |
| 车辆信息 | 车牌号、颜色、类型；读写 localStorage |
| 入场动画 | 对应颜色+车型车辆 **倒车入库**；无信息则用默认车 |
| 确认后 | 抽屉收起 → 充电动画 → 预约结果提示 |

### 2.3 倒车入库朝向（业务）

- 车尾朝湾顶（充电桩 / 路障端）
- 车头朝通道（湾底）
- 车身长轴贴车位边线
- **必须与 `parking-lot.webp` 同一斜俯视相机**，不能是正俯视「纸片车」

### 2.4 身份与后端

- **有后端**（可先 mock：`src/api/`），无用户系统、无登录
- 浏览器 **sessionId**（localStorage）
- **无支付**
- 爽约/黑名单（可选保留）：未签到累计，3 次按 session 拉黑；开始前取消不算

### 2.5 技术栈

Vite + React + TypeScript + Tailwind + Framer Motion；纯前端 + mock API。

---

## 3. 已完成（相对可用）

- [x] 开屏日期 + 三车位场景底板（Synty 风 `public/art/lot/parking-lot.webp`）
- [x] A/B 维护路障+锥（风格已认可）
- [x] 每车位概率条 / 占用计时 UI
- [x] C 预约抽屉：大日期 + 早中晚 + 车牌/颜色/车型（localStorage）
- [x] 确认后漂移 / 充电光效 / 结果弹层流程
- [x] Mock API、session、维护位不叠车（A 不再假装 occupied 压路障）
- [x] Game Art Director 风格指南与资产目录（`design-refs/art-direction/`、`public/art/`）
- [x] 浅色主题 tokens（AD v2）
- [x] 代码已推私有 GitHub

---

## 4. 现存问题（优先）

### 4.1 【阻断体验】车辆与场景透视对不齐

**现象：**  
场景是斜俯视等轴；车辆精灵几经迭代（正俯视纸片 → 斜俯视 iso），再用 CSS `perspective + rotateX + rotateZ` 拧角度，仍难真正「贴地」停进车位。用户判定 **根本不行**，已放弃继续拧。

**根因（共识）：**

1. 精灵相机与 `parking-lot.webp` 不完全同机位时，仅靠平面/伪 3D CSS 无法补全透视。
2. CSS `rotateZ` 只有绕屏幕法线；`rotateX/Y` 是补救，不是最终方案。
3. 曾出现：维护位 A 叠车+路障像「翻车」；正俯视纸片与斜场景打架；错误 `rotate(180)` 拧反朝向等。

**最后一试（未采纳为终态）：**

- `perspective: 900px`
- `rotateZ(-35°)`（yaw）
- `rotateX(58°)`（pitch）
- `rotateY: 0`

**建议下一步：**

1. **美术**：按 lot 最终相机重渲停车向车（倒车入库），把 pitch/yaw **烤进 webp**，工程变换回到接近 `0`。
2. **或** 改真 3D（Three.js / R3F）同场景同相机放车——成本更高，但角度可控。
3. 合片 QA 以「车长轴 // 车位线 + 轮胎贴沥青观感」为准，不要只看 yaw 数字。

### 4.2 开屏演示数据

- C 曾为方便拧角度 **默认 occupied 一辆蓝车**（`src/api/mock.ts`），与「空闲可约」产品态不一致；后续应恢复「默认空，预约后才有车」，或加 `?demoCar=1` 开关。

### 4.3 抽屉「display」姿态

- 曾区分 `pose=display|park`；主文件与 `-park` 多轮同内容覆盖后语义混乱。需理清：抽屉预览用 3/4，入库用停车向——或统一一种并改文档。

### 4.4 后端未接真服务

- 现为内存 mock；生产需真实占用/概率/预约冲突 API；session 黑名单规则未完整产品化。

### 4.5 README 过时

- README 仍有「临时 SVG」「dark-grey lot」等旧描述，与浅色 Synty 底板+webp 现状不符（写本文档后应改 README 指向本文）。

### 4.6 其它小债

- 车位叠层多边形与底板白线可能仍有像素级偏移
- 入场动画时长/路径未按最终透视精调
- 爽约签到入口弱、黑名单 UI 未作为主路径验收

---

## 5. 验收清单（未全部通过）

| # | 标准 | 状态 |
|---|---|---|
| 1 | 开屏：日期 + 三车位 + 概率/占用条 | 基本通过 |
| 2 | A/B 维护路障风格统一 | 通过 |
| 3 | C 抽屉：大日期 + 早中晚 + 车辆信息持久化 | 基本通过 |
| 4 | 确认后抽屉收起 + 充电反馈 + 结果提示 | 基本通过 |
| 5 | 倒车入库且与场景透视一致、贴车位线 | **未通过** |
| 6 | 无登录无支付；session 可刷新保留 | 基本通过 |
| 7 | 真后端对接 | 未做 |

---

## 6. 关键路径速查

| 路径 | 用途 |
|---|---|
| `public/art/lot/parking-lot.webp` | 停车场底板 |
| `public/art/props/barrier.webp` | 路障叠层资产 |
| `public/art/vehicles/{type}-{color}.webp` | 车精灵 |
| `public/art/vehicles/{type}-{color}-park.webp` | 停车向（现多与主图同） |
| `design-refs/art-direction/STYLE-GUIDE.md` | 美术规范 |
| `src/components/ParkingLot.tsx` | 车位场景与 3D 变换常量 |
| `src/api/mock.ts` | Mock 占用/预约 |
| `src/theme/tokens.css` | 色板 |

---

## 7. 给下一位接手的一句话

**产品交互和场景/路障大体可用；把「同相机倒车入库的车」做对是当前唯一硬阻断。不要再靠无止境的 CSS 角度拧试当最终解。**
