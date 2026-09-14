# Prompt sheets — Charge Spot Quest
Paste into your image tool. One subject per generation. These are **prompts**, not finished art.

Common suffix (append to every prompt):
```
low-poly 3D, isometric orthographic view, flat shaded hard-edged polygons, solid face colors, crisp hard contact shadow under object, no textures, no gradients on mesh, no cartoon eyes or faces, dark charcoal backdrop #282028, game asset, transparent background if possible, clean silhouette
```

## A. Vehicles — body colors (use exact hex in prompt)

| key | body hex |
|-----|----------|
| blue | #0088D0 |
| yellow | #D89000 |
| orange | #E89040 |
| white | #F0E0D8 |
| red | #E23B2F |
| green | #3DBE3A |

### Sedan
```
isometric low-poly sedan hatchback, boxy body in {COLOR_HEX}, darker shade faces, flat dark window panels #1C2430, yellow cube headlights #FDE047, hexagonal dark wheels, short hard shadow, toy-block proportions, not cute, not realistic
```
+ common suffix. Replace `{COLOR_HEX}`. Export as `sedan-{color}.webp`.

### SUV
```
isometric low-poly compact SUV, taller boxy cabin, roof-rail prisms, body {COLOR_HEX}, flat windows, yellow headlights, dark wheels, hard contact shadow, rigid geometric, not rounded cartoon
```

### Van
```
isometric low-poly delivery van, tall rectangular cargo box, short cab, body {COLOR_HEX}, flat windows, hard shadow, low-poly only
```

### Pickup
```
isometric low-poly pickup truck, open rear bed, cabin {COLOR_HEX}, dark bed interior, yellow headlights, hard shadow, angular
```

## B. Default car (first paint / preview)
Use **sedan × blue #0088D0** prompt above. Filename `sedan-blue.webp`.

## C. Maintenance state
Do **not** generate a sad car. Prefer runtime desaturate. If a dedicated sprite is required:
```
same isometric low-poly {TYPE} as production asset, body muted toward grey, still hard-edged flat faces, no face, no wrench mascot, hard shadow, charcoal backdrop
```

## D. Lot plate (optional full-bleed)
```
isometric low-poly parking lot plate, three side-by-side parking bays labeled space for A B C, dark asphalt #182030, thick white bay lines #E8E8E4, simple low-poly green bush wedges, grey lamp poles, small cyan charging post on right bay, hard directional shadows from upper-left, no people, no text, mobile game background
```

## E. Charging post prop
```
isometric low-poly EV charger pedestal, body #38BDF8, yellow lightning bolt inset #FDE047, hard shadow, simple prism, isolated on charcoal
```

## F. Slice / pack notes
- Keep one vehicle centered; margin ≥8% of canvas.
- Do not atlas until all 24 type×color exist (4×6).
- Preview sheet: 4 columns (types) × 6 rows (colors) or vice versa; 32px gutter.
- Reject any frame with soft airbrush shading or character faces.
