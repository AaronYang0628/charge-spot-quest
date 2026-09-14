# 充电车位小站 · Style Guide (v1)
**Game:** 充电车位小站 / Charge Spot Quest  
**Look:** low-poly · isometric (≈30° axonometric) · hard-edged flat faces · crisp contact shadows  
**Not this:** Q-cute, soft pastels, faces on cars, fluffy gradients, rounded "toy blob" bodies  
**Refs locked from:** `design-refs/lowpoly-parking-lot.png`, `design-refs/lowpoly-vehicle-sheet.png`, and current mobile screenshots  

Mobile-first (~390px). Dark chrome. Scene is a small isometric lot plate inside a dark shell — not a full city diorama on the home screen.

---

## 1. Perspective & geometry

| Rule | Spec |
|------|------|
| Camera | Orthographic / isometric top-¾. Same angle for lot + every vehicle sprite. |
| Faces | Flat shaded polygons only. 1 solid color per face. No soft gradients on meshes. |
| Edges | Hard. Visible facet breaks OK. No bevel blur. |
| Wheels | Dark hexagonal/octagonal cylinders or flat disks — not round soft tires. |
| Windows | Recessed flat panels in `#1C2430` / `#2A3340` — no reflections, no glass shine. |
| Scale | One lot plate shows **3 bays A/B/C**. Vehicles read clearly at ~96–128px wide on phone. |

Light direction (locked): **upper-left → lower-right**. Lit tops/lefts brighter; right/undersides one step darker. Contact shadow sits under each object as a hard dark ellipse/polygon, opacity ~0.40–0.50.

---

## 2. Locked palette (measured)

Hex values sampled from the reference PNGs and UI screens. Roles are binding for audits.

### Scene / lot
| Role | Hex | Notes |
|------|-----|-------|
| Asphalt cool | `#182030` | Dominant road plane |
| Asphalt mid | `#505058` | Bay fill |
| Asphalt warm edge | `#504840` | Warm dirt/curb mix from lot ref |
| Curb / concrete light | `#9CA3AF` | Keep for raised curb tops |
| Curb shade | `#6B7280` | |
| Bay line idle | `#E8E8E4` | Thick simple rectangles, not dashed soft lines |
| Bay line active / bookable | `#7DD3FC` | Glow rim on C when bookable or charging |
| Foliage lit | `#4A9C3F` | Low-poly bush/tree wedges |
| Foliage shade | `#2F6E2A` | |
| Pole / lamp | `#8B9099` / `#AEB4BE` | Thin stalks + flat caps |
| Charger body | `#38BDF8` | Bookable pile |
| Charger broken | `#6B7280` | Maintenance piles |
| Warm rim light (env only) | `#F8D8B0` | Golden-hour bounce from parking-lot ref — optional on distant walls, not on UI chrome |

### UI chrome (dark shell)
| Role | Hex | Notes |
|------|-----|-------|
| App background | `#101010` | Measured from mobile-main |
| Shell / cards | `#181820` / `#202028` | Drawer + cards |
| Primary accent | `#00ACF4` | Selected slot, primary CTA (drawer confirm) |
| Accent hot | `#00CCF0` | Hover / pressed glow |
| Success | `#00D490` | 「预约成功」copy |
| Warn / occupied timer | `#F59E0B` | Occupied duration chip |
| Text primary | `#F4F4F5` | |
| Text muted | `#787878` / `#9098A0` | Secondary lines |
| Maintenance pill | `#404048` bg + muted text | |
| Bookable pill | `#00ACF4` bg + `#0A0A0A` text | |

### Vehicle body (type × color — light / body / shade)
Sampled from vehicle sheet + lot accents. Use **exactly three steps** per body (lit face / main / shade). No fourth mid-tone.

| Color key | Light | Body | Shade |
|-----------|-------|------|-------|
| blue | `#5B9AD4` | `#0088D0` | `#002060` |
| yellow | `#F0D000` | `#D89000` | `#804800` |
| orange | `#F0B000` | `#E89040` | `#B85000` |
| white | `#F8F8F8` | `#F0E0D8` | `#C8B8A0` |
| red | `#F80000` | `#E23B2F` | `#680000` |
| green | `#98B850` | `#3DBE3A` | `#285000` |

Shared vehicle parts:
| Role | Hex |
|------|-----|
| Wheel | `#111111` |
| Wheel hub | `#444444` |
| Window | `#1C2430` |
| Window front (slightly lighter) | `#2A3340` |
| Headlight | `#FDE047` |
| Contact shadow | `rgba(10,10,10,0.45)` |
| Charging bolt overlay | `#FDE047` + accent rim `#00ACF4` |

**Default vehicle for empty preview / first paint:** `sedan` × `blue`.

---

## 3. Material & shadow rules

1. **No textures.** Color blocks only.
2. **No Q-eyes, smiles, blush, sparkles** on cars.
3. Shadow = hard, short, same light vector everywhere. Never soft Gaussian blobs under UI cards (cards use flat dark fills + 1px edge, not drop-shadow mush).
4. Occupied / maintenance vehicles: same mesh, **desaturate body ~30%** or multiply with `#404048` overlay at 35% — do not redraw a sad face.
5. Maintenance bay: dashed or dimmed bay line `#586068`, badge 「维护中」 on `#303038`.

---

## 4. Main screen layout (visual)

```
[ year · weekday ]          muted
[ 大日期 M月D日 ]            #F4F4F5, hero type
[ 充电车位 · 慢充预约 ]       muted
┌─ isometric lot plate ─────────────┐
│  A (maint)  B (maint)  C (bookable)│
│  trees/poles only as low-poly props │
└───────────────────────────────────┘
[ A card ] [ B card ] [ C card ]
  status pill + 1h bar + tonight bar
  if occupied → orange elapsed chip
```

**Bars:** track `#303038`, fill success `#00D490` for idle %, label right-aligned. Height 6–8px, radius 4px max (slightly soft for finger UI — scene stays hard-edged).

**Spot C CTA:** floating chip 「可约 · 点我」 on `#00ACF4`.

---

## 5. Drawer (tap C)

Bottom sheet `#181818` / `#202020`.
1. Huge date repeat + 「预约日 · YYYY-MM-DD」
2. Vehicle preview (isometric sprite, floating, hard shadow)
3. Period: three equal tiles **早 / 中 / 晚** — selected = `#00ACF4` fill + dark label
4. 车牌号 field (dark inset)
5. Color swatches: circles using **body** hex; selected = white ring 2px
6. Type pills: 轿车 / SUV / 面包车 / 皮卡
7. Full-width CTA 「确认预约」 `#00ACF4` / black label

Unify with scene: same vehicle palette, same accent cyan, hard preview shadow — UI corners may be squircles for tap targets; **3D content never gets soft cartoon rounding**.

---

## 6. Confirm flow — motion & visual specs

| Step | Visual | Timing (guide) |
|------|--------|----------------|
| 1 Confirm tap | Drawer slides down | 220–280ms ease-out |
| 2 Drift-in | Selected vehicle enters bay C along bay long-axis (diagonal of isometric bay). Rigid body, no squash. Slight yaw lock to bay. | 500–700ms, ease-out cubic |
| 3 Charge | Bay rim → `#7DD3FC` pulse; bolt glyph on roof/side; drop-shadow cycle cyan↔yellow | loop 1.2–1.4s |
| 4 Result modal | Center card: white bolt icon, title 「预约结果」, green line 「预约成功，车位开始充电」 `#00D490`, pill 「知道了」 white/black | appear 180ms after charge starts |

Do **not** morph car into a cute face. Do not confetti.

---

## 7. Naming & export

Sprites: `{type}-{color}.webp` (transparent), isometric, canvas **256×192** (or 128×96 @2x).  
Lot plate optional: `lot-plate.webp` matching bay layout A|B|C.  
Maintenance: same sprite + CSS desaturate, **or** `{type}-{color}-maint.webp` only if desaturate fails readability.

Register in `src/assets/art-slots.ts` → `VEHICLE_SPRITES`.  
Tokens in `src/theme/tokens.css` — keep CSS vars as source for SVG placeholders until sprites land.

---

## 8. Anti-patterns (reject in review)

- Pastel gradient backgrounds, heart meters, anthropomorphic cars (old Q mock)
- Soft purple booking grid / clock-slot chrome from early drawer mock
- Smooth subdivision cars, PBR materials, lens flare
- Inventing colors outside this table without updating the guide first
