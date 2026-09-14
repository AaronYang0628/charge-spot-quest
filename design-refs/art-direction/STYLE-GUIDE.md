# 充电车位小站 · Style Guide (v2 — light / Synty Mini)
**Game:** 充电车位小站 / Charge Spot Quest  
**Look:** POLYGON Mini–adjacent · low-poly · isometric · hard-edged flat faces · crisp daylight shadows · **light / white UI chrome**  
**Direction refs:** Synty [POLYGON Mini City Pack](https://assetstore.unity.com/packages/3d/props/exterior/polygon-mini-city-pack-art-by-synty-138321) (gallery saved under `design-refs/synty-mini-city/`) + existing `lowpoly-parking-lot.png` / `lowpoly-vehicle-sheet.png`  
**Not this:** Dark charcoal app shell, Q-cute faces, soft pastels mush, PBR, neon cyber night  
**Supersedes:** Style Guide v1 dark chrome. Vehicle body hexes stay; UI + lot plate go light.

Mobile-first (~390px). Scene = small isometric lot plate on a **white / cream shell**.

---

## 1. Perspective & geometry (unchanged)

| Rule | Spec |
|------|------|
| Camera | Orthographic / isometric top-¾. Same angle for lot + every vehicle. |
| Faces | Flat shaded. 1 solid color per face. No soft mesh gradients. |
| Edges | Hard facets. Wheels = hex/oct disks. |
| Windows | Flat `#1C2430` / `#2A3340`. |
| Scale | 3 bays A/B/C. Vehicles readable at ~96–128px wide. |

Light: **upper-left → lower-right**, bright daylight (Synty Mini). Contact shadow hard, opacity ~0.28–0.38 on light asphalt (lighter than v1).

---

## 2. Locked palette (measured)

### UI chrome — light (from Synty cream boards + white phone frames)
| Role | Hex | Source note |
|------|-----|-------------|
| App background | `#F5F5F7` | Near-white shell |
| Page / sheet | `#FFFFFF` | Cards, drawer |
| Soft cream plate | `#F0F0D0` | Optional lot mount (Synty-05 board) |
| Soft blush cream | `#F8E8F0` | Alt mount (Synty-03) — use sparingly |
| Card border | `#E5E7EB` | 1px |
| Text primary | `#18181B` | |
| Text muted | `#71717A` | |
| Primary accent | `#5870C0` | Synty Mini accent blue (gallery) |
| Accent hot / selected | `#4F6AD6` | Pressed / selected tile |
| Success | `#3DBE3A` | Idle % + success copy |
| Warn / occupied | `#E89040` | Occupied timer (vehicle orange body) |
| Maintenance pill bg | `#E4E4E7` | + muted text |
| Bookable pill | `#5870C0` bg + `#FFFFFF` text | |

### Scene / lot — daylight (Synty tiles + lot ref)
| Role | Hex | Notes |
|------|-----|-------|
| Sky / scene wash (optional) | `#486080` | Distant wash only; UI stays white |
| Asphalt | `#707070` | Mid grey road (not near-black) |
| Asphalt shade | `#585860` | Recessed bay |
| Sidewalk / curb light | `#D8D0A8` | Cream walk |
| Curb shade | `#B8A888` | |
| Grass / bush lit | `#A0B848` | Synty yellowish green |
| Grass / bush shade | `#485828` | |
| Bay line idle | `#F8F8F8` | Thick white paint |
| Bay line active | `#5870C0` | Bookable / charging rim |
| Pole / lamp | `#9CA3AF` / `#AEB4BE` | |
| Charger body | `#5870C0` | Matches accent |
| Charger bolt | `#F0D000` | |
| Charger broken | `#9CA3AF` | Maintenance |

### Vehicle body (unchanged from v1 — measured sheet)
| Color | Light | Body | Shade |
|-------|-------|------|-------|
| blue | `#5B9AD4` | `#0088D0` | `#002060` |
| yellow | `#F0D000` | `#D89000` | `#804800` |
| orange | `#F0B000` | `#E89040` | `#B85000` |
| white | `#F8F8F8` | `#F0E0D8` | `#C8B8A0` |
| red | `#F80000` | `#E23B2F` | `#680000` |
| green | `#98B850` | `#3DBE3A` | `#285000` |

Shared: wheel `#111111`, hub `#444444`, window `#1C2430`, headlight `#FDE047`, shadow `rgba(24,24,32,0.32)`.

**Default vehicle:** `sedan` × `blue`.

---

## 3. Material & shadow

1. No textures. Color blocks only.  
2. No faces / sparkles on cars.  
3. Shadows hard; on light asphalt keep them readable but not inky black.  
4. Maintenance: desaturate body ~30% or `#A1A1AA` multiply 35%.  
5. Lot plate sits on white card with 12–16px radius; **inner scene stays hard-edged**.

---

## 4. Main screen (light)

```
[ year · weekday ]     muted #71717A
[ 大日期 ]              #18181B hero
[ 充电车位 · 慢充预约 ]  muted
┌ white card ─────────────────────────┐
│  cream/light isometric lot           │
│  A maint · B maint · C bookable      │
└─────────────────────────────────────┘
[ A ] [ B ] [ C ] white status cards
  pills + 1h / tonight bars (track #E4E4E7, fill #3DBE3A)
  occupied → orange chip #E89040
```

Spot C CTA: 「可约 · 点我」 on `#5870C0` / white label.

---

## 5. Drawer

White sheet `#FFFFFF`, top handle `#D4D4D8`.  
Period tiles: idle `#F4F4F5` + dark label; selected `#5870C0` + white label.  
Color swatches = body hex; selected = `#18181B` ring.  
CTA 「确认预约」 `#5870C0` / white text.

---

## 6. Confirm motion (same timing as v1)

Drawer down 220–280ms → rigid drift into bay C 500–700ms → bay rim pulse `#5870C0` + bolt `#F0D000` → result modal on white card, success line `#3DBE3A`, 「知道了」 dark-on-light pill.

---

## 7. Naming / export

Same as v1: `{type}-{color}.webp`, canvas **256×192**, register in `art-slots.ts`.  
Prompt backdrops: **light cream / soft grey**, not charcoal.

---

## 8. Anti-patterns

- Dark `#101010` app shell (v1)  
- Q-cute anthropomorphic cars  
- Soft purple clock-grid drawer  
- Inventing hex outside this table without updating the guide  
