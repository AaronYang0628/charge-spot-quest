import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { VehicleColor, VehicleType } from '../types'
import { VEHICLE_PALETTE } from '../types'
import { vehicleSpriteUrl } from '../assets/art-slots'

interface Props {
  type?: VehicleType
  color?: VehicleColor
  charging?: boolean
  className?: string
  size?: number
}

/**
 * TEMP PLACEHOLDER — SVG low-poly car.
 * Prefer Art Director sprite when registered in `assets/art-slots.ts`.
 * Colors map to `--car-*` tokens in `theme/tokens.css`.
 */
export function LowPolyCar({
  type = 'sedan',
  color = 'blue',
  charging = false,
  className = '',
  size = 120,
}: Props) {
  const sprite = vehicleSpriteUrl(type, color)
  const pal = VEHICLE_PALETTE[color]
  const Body = BODIES[type]

  return (
    <motion.div
      className={className}
      style={{ width: size, height: (size * 90) / 120, position: 'relative' }}
      animate={
        charging
          ? {
              filter: [
                'drop-shadow(0 0 6px rgba(0,172,244,0.55))',
                'drop-shadow(0 0 12px rgba(0,204,240,0.9))',
                'drop-shadow(0 0 8px rgba(253,224,71,0.85))',
                'drop-shadow(0 0 12px rgba(0,172,244,0.9))',
              ],
            }
          : undefined
      }
      transition={charging ? { duration: 1.3, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      {sprite ? (
        <img
          src={sprite}
          alt=""
          width={size}
          height={(size * 90) / 120}
          draggable={false}
          style={{ display: 'block', objectFit: 'contain' }}
        />
      ) : (
        <svg
          viewBox="0 0 120 90"
          width={size}
          height={(size * 90) / 120}
          style={{ overflow: 'visible', display: 'block' }}
          data-art-placeholder="lowpoly-svg"
        >
          <ellipse cx="60" cy="78" rx="38" ry="7" fill="var(--car-shadow)" opacity="1" />
          <Body pal={pal} />
        </svg>
      )}

      {charging && (
        <motion.svg
          viewBox="0 0 40 40"
          width={28}
          height={28}
          style={{ position: 'absolute', top: '8%', right: '18%' }}
          animate={{ opacity: [0.4, 1, 0.55, 1], scale: [0.9, 1.08, 0.95, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        >
          <path
            d="M22 4 L12 20 L20 20 L10 36 L30 16 L21 16 Z"
            fill="var(--car-bolt, #FDE047)"
            stroke="#F59E0B"
            strokeWidth="1"
          />
        </motion.svg>
      )}
    </motion.div>
  )
}

type Pal = { body: string; light: string; dark: string }

const BODIES: Record<VehicleType, (p: { pal: Pal }) => ReactNode> = {
  sedan: Sedan,
  suv: Suv,
  van: Van,
  pickup: Pickup,
}

function Sedan({ pal }: { pal: Pal }) {
  return (
    <g>
      <polygon points="28,58 88,58 96,48 36,48" fill={pal.dark} />
      <polygon points="28,58 36,48 36,38 22,46" fill={pal.body} />
      <polygon points="36,38 62,34 70,40 44,46" fill={pal.light} />
      <polygon points="50,22 74,18 82,28 58,32" fill={pal.light} />
      <polygon points="58,32 82,28 82,40 58,44" fill={pal.dark} />
      <polygon points="50,24 58,32 44,36 40,28" fill="var(--car-window-front, #2a2e35)" />
      <polygon points="58,32 76,29 76,38 58,42" fill="var(--car-window, #1c2026)" />
      <polygon points="74,40 96,36 96,48 82,50" fill={pal.light} />
      <polygon points="82,50 96,48 96,56 82,58" fill={pal.dark} />
      <polygon points="22,46 36,38 36,42 24,50" fill="#3a3a3a" />
      <ellipse cx="40" cy="60" rx="7" ry="5" fill="var(--car-wheel, #111)" />
      <ellipse cx="40" cy="60" rx="3" ry="2" fill="var(--car-wheel-hub, #444)" />
      <ellipse cx="78" cy="60" rx="7" ry="5" fill="var(--car-wheel, #111)" />
      <ellipse cx="78" cy="60" rx="3" ry="2" fill="var(--car-wheel-hub, #444)" />
      <polygon points="28,44 34,40 34,43 28,47" fill="#FFE566" />
    </g>
  )
}

function Suv({ pal }: { pal: Pal }) {
  return (
    <g>
      <polygon points="24,60 90,60 98,48 32,48" fill={pal.dark} />
      <polygon points="24,60 32,48 32,34 18,44" fill={pal.body} />
      <polygon points="38,16 78,12 88,28 48,32" fill={pal.light} />
      <polygon points="48,32 88,28 88,46 48,50" fill={pal.dark} />
      <polygon points="32,34 48,32 48,50 32,48" fill={pal.body} />
      <polygon points="40,20 48,30 36,34 32,26" fill="var(--car-window-front, #2a2e35)" />
      <polygon points="50,20 74,16 74,28 50,32" fill="var(--car-window, #1c2026)" />
      <rect x="52" y="12" width="22" height="2.5" fill="#555" transform="skewX(-18)" />
      <rect x="52" y="16" width="22" height="2.5" fill="#555" transform="skewX(-18)" />
      <ellipse cx="38" cy="62" rx="8" ry="5.5" fill="var(--car-wheel, #111)" />
      <ellipse cx="38" cy="62" rx="3.2" ry="2" fill="var(--car-wheel-hub, #444)" />
      <ellipse cx="80" cy="62" rx="8" ry="5.5" fill="var(--car-wheel, #111)" />
      <ellipse cx="80" cy="62" rx="3.2" ry="2" fill="var(--car-wheel-hub, #444)" />
      <polygon points="20,46 30,38 30,42 20,50" fill="#FFE566" />
    </g>
  )
}

function Van({ pal }: { pal: Pal }) {
  return (
    <g>
      <polygon points="26,62 94,62 100,50 32,50" fill={pal.dark} />
      <polygon points="26,62 32,50 32,28 20,38" fill={pal.body} />
      <polygon points="32,18 86,12 96,28 42,34" fill={pal.light} />
      <polygon points="42,34 96,28 96,50 42,56" fill={pal.dark} />
      <polygon points="32,28 42,34 42,56 32,50" fill={pal.body} />
      <polygon points="28,30 42,26 42,38 28,40" fill="var(--car-window-front, #2a2e35)" />
      <polygon points="46,20 78,16 78,30 46,34" fill="var(--car-window, #1c2026)" />
      <ellipse cx="40" cy="64" rx="8" ry="5.5" fill="var(--car-wheel, #111)" />
      <ellipse cx="40" cy="64" rx="3" ry="2" fill="var(--car-wheel-hub, #444)" />
      <ellipse cx="82" cy="64" rx="8" ry="5.5" fill="var(--car-wheel, #111)" />
      <ellipse cx="82" cy="64" rx="3" ry="2" fill="var(--car-wheel-hub, #444)" />
    </g>
  )
}

function Pickup({ pal }: { pal: Pal }) {
  return (
    <g>
      <polygon points="22,58 92,58 100,46 30,46" fill={pal.dark} />
      <polygon points="22,58 30,46 30,36 16,44" fill={pal.body} />
      <polygon points="34,20 56,16 64,30 42,34" fill={pal.light} />
      <polygon points="42,34 64,30 64,44 42,48" fill={pal.dark} />
      <polygon points="30,36 42,34 42,48 30,46" fill={pal.body} />
      <polygon points="36,24 42,32 34,36 30,28" fill="var(--car-window-front, #2a2e35)" />
      <polygon points="44,22 56,20 56,30 44,32" fill="var(--car-window, #1c2026)" />
      <polygon points="64,36 96,32 100,46 68,50" fill="#4a4a4a" />
      <polygon points="64,30 96,26 96,32 64,36" fill="#6a6a6a" />
      <polyline
        points="70,34 70,22 90,18 90,30"
        fill="none"
        stroke="#ddd"
        strokeWidth="2.5"
        strokeLinejoin="miter"
      />
      <ellipse cx="36" cy="60" rx="7" ry="5" fill="var(--car-wheel, #111)" />
      <ellipse cx="36" cy="60" rx="3" ry="2" fill="var(--car-wheel-hub, #444)" />
      <ellipse cx="82" cy="60" rx="7" ry="5" fill="var(--car-wheel, #111)" />
      <ellipse cx="82" cy="60" rx="3" ry="2" fill="var(--car-wheel-hub, #444)" />
    </g>
  )
}
