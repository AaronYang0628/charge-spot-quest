import { AnimatePresence, motion } from 'framer-motion'
import type { SpotId, SpotStatus, VehicleInfo } from '../types'
import { LowPolyCar } from './LowPolyCar'
import { LOT_BACKGROUND_SPRITE } from '../assets/art-slots'

interface Props {
  spots: SpotStatus[]
  /** vehicle currently drifting / parked on C from booking flow */
  animVehicle?: VehicleInfo | null
  animPhase?: 'idle' | 'drift' | 'charging' | null
  selected?: SpotId | null
  onSelectC: () => void
}

/**
 * High-angle low-poly parking lot: daylight asphalt, white bay lines, hard shadows.
 */
export function ParkingLot({
  spots,
  animVehicle,
  animPhase,
  selected,
  onSelectC,
}: Props) {
  const byId = Object.fromEntries(spots.map((s) => [s.id, s])) as Record<
    SpotId,
    SpotStatus
  >

  return (
    <div className="lot-wrap relative mx-auto w-full overflow-hidden rounded-2xl" data-art-slot="parking-lot">
      {LOT_BACKGROUND_SPRITE ? (
        <img
          src={LOT_BACKGROUND_SPRITE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      ) : null}
      {/* TEMP: procedural SVG lot — replace via LOT_BACKGROUND_SPRITE */}
      <svg
        viewBox="0 0 390 220"
        className="block w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="lotGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--lot-asphalt-top)" />
            <stop offset="100%" stopColor="var(--lot-asphalt-bottom)" />
          </linearGradient>
          <linearGradient id="curbGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--lot-curb-top)" />
            <stop offset="100%" stopColor="var(--lot-curb-bottom)" />
          </linearGradient>
        </defs>

        {/* asphalt */}
        <rect x="0" y="0" width="390" height="220" fill="url(#lotGrad)" />

        {/* sidewalk / curb top */}
        <polygon points="0,0 390,0 390,28 0,36" fill="url(#curbGrad)" />
        <polygon points="0,36 390,28 390,34 0,42" fill="var(--lot-curb-bottom)" />

        {/* bushes — green pyramids */}
        {[[18, 22], [48, 18], [340, 20], [368, 24]].map(([x, y], i) => (
          <g key={i}>
            <polygon
              points={`${x},${y + 14} ${x + 10},${y} ${x + 20},${y + 14}`}
              fill="var(--lot-bush)"
            />
            <polygon
              points={`${x + 10},${y} ${x + 20},${y + 14} ${x + 14},${y + 14}`}
              fill="var(--lot-bush-shade)"
            />
          </g>
        ))}

        {/* streetlights */}
        <g>
          <rect x="70" y="8" width="3" height="28" fill="var(--lot-pole)" />
          <rect x="64" y="6" width="15" height="5" fill="var(--lot-lamp)" />
          <rect x="310" y="6" width="3" height="28" fill="var(--lot-pole)" />
          <rect x="304" y="4" width="15" height="5" fill="var(--lot-lamp)" />
        </g>

        {/* three bays — isometric-ish parallelograms */}
        {/* Upright nose-in bays — long axis vertical, cars rotate:0 */}
        <Bay
          points="36,55 128,55 128,165 36,165"
          label="A"
          labelAt={[82, 110]}
          dim
        />
        <Bay
          points="148,55 240,55 240,165 148,165"
          label="B"
          labelAt={[194, 110]}
          dim
        />
        <Bay
          points="260,55 352,55 352,165 260,165"
          label="C"
          labelAt={[306, 110]}
          highlight={selected === 'C' || animPhase === 'drift' || animPhase === 'charging'}
          pulse={animPhase === 'charging'}
          active
        />

        {/* charger posts */}
        <Charger x={74} y={48} broken />
        <Charger x={186} y={48} broken />
        <Charger x={298} y={48} />
      </svg>

      {/* cars layered as HTML/SVG over the lot for easier animation */}
      <div className="pointer-events-none absolute inset-0">
        {/* Spot A parked */}
        {byId.A?.occupied && byId.A.vehicle && (
          <div
            className="absolute left-[6%] top-[26%] w-[26%]"
            style={{
              filter: 'saturate(0.7)',
              opacity: 0.85,
            }}
          >
            <LowPolyCar
              type={byId.A.vehicle.type}
              color={byId.A.vehicle.color}
              size={110}
            />
          </div>
        )}

        {/* Spot B empty — nothing */}

        {/* Spot C — parked from mock OR animation */}
        {/* Cars sit parallel to bay long axis (nose toward charger). No diagonal crabbing. */}
        <AnimatePresence>
          {animPhase && animVehicle && (
            <motion.div
              key="anim-car"
              className="absolute w-[30%]"
              initial={{ left: '64%', top: '58%', opacity: 1, rotate: 0 }}
              animate={{ left: '64%', top: '24%', opacity: 1, rotate: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'center center' }}
            >
              <LowPolyCar
                type={animVehicle.type}
                color={animVehicle.color}
                charging={animPhase === 'charging'}
                size={120}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!animPhase && byId.C?.occupied && byId.C.vehicle && (
          <div className="absolute left-[64%] top-[24%] w-[26%]">
            <LowPolyCar
              type={byId.C.vehicle.type}
              color={byId.C.vehicle.color}
              charging
              size={120}
            />
          </div>
        )}
      </div>

      {/* tap target for C */}
      <button
        type="button"
        aria-label="预约车位 C"
        onClick={onSelectC}
        className="absolute right-[6%] top-[18%] h-[58%] w-[30%] rounded-lg border-0 bg-transparent"
        style={{ cursor: byId.C?.bookable ? 'pointer' : 'not-allowed' }}
      />

      {/* maintenance badges */}
      <span
        className="absolute left-[14%] top-[62%] rounded px-1.5 py-0.5 text-[10px] font-bold"
        style={{ background: 'var(--ui-maint-pill)', color: 'var(--ui-muted)' }}
      >
        维护中
      </span>
      <span
        className="absolute left-[40%] top-[58%] rounded px-1.5 py-0.5 text-[10px] font-bold"
        style={{ background: 'var(--ui-maint-pill)', color: 'var(--ui-muted)' }}
      >
        维护中
      </span>
      {byId.C?.bookable && !byId.C.occupied && !animPhase && (
        <span
          className="absolute right-[12%] top-[64%] rounded px-1.5 py-0.5 text-[10px] font-black shadow"
          style={{ background: 'var(--ui-accent)', color: '#ffffff' }}
        >
          可约 · 点我
        </span>
      )}
    </div>
  )
}

function Bay({
  points,
  label,
  labelAt,
  dim,
  highlight,
  active,
  pulse,
}: {
  points: string
  label: string
  labelAt: [number, number]
  dim?: boolean
  highlight?: boolean
  active?: boolean
  pulse?: boolean
}) {
  return (
    <g opacity={dim ? 0.55 : 1}>
      <polygon
        points={points}
        fill={highlight ? 'var(--lot-bay-fill-active)' : 'var(--lot-bay-fill)'}
        stroke={
          highlight
            ? 'var(--lot-bay-line-active)'
            : dim
              ? 'var(--lot-bay-line-maint)'
              : 'var(--lot-bay-line)'
        }
        strokeWidth={highlight ? 2.5 : 1.8}
        className={pulse ? 'bay-pulse' : undefined}
      />
      <text
        x={labelAt[0]}
        y={labelAt[1]}
        textAnchor="middle"
        fill={active ? '#f8f8f8' : 'var(--lot-curb-top)'}
        fontSize="22"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        opacity="0.35"
      >
        {label}
      </text>
    </g>
  )
}

function Charger({ x, y, broken }: { x: number; y: number; broken?: boolean }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect
        x="0"
        y="0"
        width="10"
        height="22"
        fill={broken ? 'var(--lot-charger-broken)' : 'var(--lot-charger)'}
      />
      <rect
        x="1.5"
        y="2"
        width="7"
        height="6"
        fill={broken ? '#9ca3af' : 'var(--car-bolt)'}
      />
      {!broken && (
        <path d="M4 10 L7 14 L5.5 14 L7 18 L3.5 13.5 L5 13.5 Z" fill="#fff" />
      )}
      {broken && (
        <text x="5" y="17" textAnchor="middle" fontSize="7" fill="#585860">
          ✕
        </text>
      )}
      <rect x="2" y="22" width="6" height="4" fill="#585860" />
    </g>
  )
}
