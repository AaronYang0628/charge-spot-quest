# Prompt sheets — Charge Spot Quest (v2 light)
Paste into your image tool. One subject per generation. **Prompts, not finished art.**

Common suffix:
```
low-poly 3D, isometric orthographic, flat shaded hard-edged polygons, solid face colors, crisp hard contact shadow, no textures, no mesh gradients, no cartoon eyes or faces, bright daylight, soft cream backdrop #F0F0D0, game asset, transparent background if possible, clean silhouette, POLYGON Mini style
```

## Vehicle colors
| key | body |
|-----|------|
| blue | #0088D0 |
| yellow | #D89000 |
| orange | #E89040 |
| white | #F0E0D8 |
| red | #E23B2F |
| green | #3DBE3A |

### Sedan / SUV / Van / Pickup
Use the same geometry prompts as v1 (boxy hard-edged), swap backdrop to cream, keep `{COLOR_HEX}`.

Sedan example:
```
isometric low-poly sedan hatchback, boxy body in {COLOR_HEX}, darker shade faces, flat dark window panels #1C2430, yellow cube headlights #FDE047, hexagonal dark wheels, short hard shadow, toy-block proportions, not cute, not realistic
```
+ common suffix → `sedan-{color}.webp`

## Default
`sedan` × `blue` `#0088D0`.

## Lot plate
```
isometric low-poly parking lot plate, three parking bays A B C, asphalt #707070, thick white bay lines, cream sidewalk #D8D0A8, low-poly yellowish-green bush wedges #A0B848, grey lamp poles, small blue charging post #5870C0 with yellow bolt on right bay, hard daylight shadows from upper-left, bright airy look, no people, no text, mobile game background, soft cream surround
```

## Charger
```
isometric low-poly EV charger pedestal, body #5870C0, yellow lightning bolt #F0D000, hard shadow, simple prism, cream backdrop
```

## Slice notes
Same as v1: margin ≥8%, atlas after all 24 type×color, reject soft airbrush / faces.
