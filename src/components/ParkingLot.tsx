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
 * High-angle low-poly parking lot: dark asphalt, white bay lines, crisp shadows.
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
            <stop offset="0%" stopColor="#3a3d42" />
            <stop offset="100%" stopColor="#2a2c30" />
          </linearGradient>
          <linearGradient id="curbGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>
        </defs>

        {/* asphalt */}
        <rect x="0" y="0" width="390" height="220" fill="url(#lotGrad)" />

        {/* sidewalk / curb top */}
        <polygon points="0,0 390,0 390,28 0,36" fill="url(#curbGrad)" />
        <polygon points="0,36 390,28 390,34 0,42" fill="#5b616a" />

        {/* bushes — green pyramids */}
        {[[18, 22], [48, 18], [340, 20], [368, 24]].map(([x, y], i) => (
          <g key={i}>
            <polygon
              points={`${x},${y + 14} ${x + 10},${y} ${x + 20},${y + 14}`}
              fill="#4a9c3f"
            />
            <polygon
              points={`${x + 10},${y} ${x + 20},${y + 14} ${x + 14},${y + 14}`}
              fill="#2f6e2a"
            />
          </g>
        ))}

        {/* streetlights */}
        <g>
          <rect x="70" y="8" width="3" height="28" fill="#8b9099" />
          <rect x="64" y="6" width="15" height="5" fill="#aeb4be" />
          <rect x="310" y="6" width="3" height="28" fill="#8b9099" />
          <rect x="304" y="4" width="15" height="5" fill="#aeb4be" />
        </g>

        {/* three bays — isometric-ish parallelograms */}
        <Bay
          points="40,70 130,58 150,150 60,162"
          label="A"
          labelAt={[88, 105]}
          dim
        />
        <Bay
          points="145,58 235,48 255,140 165,150"
          label="B"
          labelAt={[193, 95]}
          dim
        />
        <Bay
          points="250,48 340,38 360,130 270,140"
          label="C"
          labelAt={[298, 85]}
          highlight={selected === 'C' || animPhase === 'drift' || animPhase === 'charging'}
          active
        />

        {/* charger posts */}
        <Charger x={118} y={64} broken />
        <Charger x={223} y={54} broken />
        <Charger x={328} y={44} />
      </svg>

      {/* cars layered as HTML/SVG over the lot for easier animation */}
      <div className="pointer-events-none absolute inset-0">
        {/* Spot A parked */}
        {byId.A?.occupied && byId.A.vehicle && (
          <div className="absolute left-[8%] top-[28%] w-[28%] opacity-55">
            <LowPolyCar
              type={byId.A.vehicle.type}
              color={byId.A.vehicle.color}
              size={110}
            />
          </div>
        )}

        {/* Spot B empty — nothing */}

        {/* Spot C — parked from mock OR animation */}
        <AnimatePresence>
          {animPhase && animVehicle && (
            <motion.div
              key="anim-car"
              className="absolute w-[30%]"
              initial={
                animPhase === 'drift'
                  ? { left: '78%', top: '8%', opacity: 0, rotate: -12 }
                  : { left: '58%', top: '22%', opacity: 1, rotate: -6 }
              }
              animate={
                animPhase === 'drift' || animPhase === 'charging'
                  ? { left: '58%', top: '22%', opacity: 1, rotate: -6 }
                  : { left: '58%', top: '22%', opacity: 1 }
              }
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 120, damping: 16, mass: 0.9 }}
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
          <div className="absolute left-[58%] top-[22%] w-[30%]">
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
      <span className="absolute left-[14%] top-[62%] rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white/90">
        维护中
      </span>
      <span className="absolute left-[40%] top-[58%] rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white/90">
        维护中
      </span>
      {byId.C?.bookable && !byId.C.occupied && !animPhase && (
        <span className="absolute right-[12%] top-[64%] rounded bg-sky-500/90 px-1.5 py-0.5 text-[10px] font-black text-white shadow">
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
}: {
  points: string
  label: string
  labelAt: [number, number]
  dim?: boolean
  highlight?: boolean
  active?: boolean
}) {
  return (
    <g opacity={dim ? 0.55 : 1}>
      <polygon
        points={points}
        fill={highlight ? '#3d4550' : '#32363c'}
        stroke={highlight ? '#7dd3fc' : '#e8e8e4'}
        strokeWidth={highlight ? 2.5 : 1.8}
      />
      {/* inner dashed feel via thinner inset isn't needed — white bay outline */}
      <text
        x={labelAt[0]}
        y={labelAt[1]}
        textAnchor="middle"
        fill={active ? '#e2e8f0' : '#9ca3af'}
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
      <rect x="0" y="0" width="10" height="22" fill={broken ? '#6b7280' : '#38bdf8'} />
      <rect x="1.5" y="2" width="7" height="6" fill={broken ? '#4b5563' : '#fde047'} />
      {!broken && (
        <path d="M4 10 L7 14 L5.5 14 L7 18 L3.5 13.5 L5 13.5 Z" fill="#fff" />
      )}
      {broken && (
        <text x="5" y="17" textAnchor="middle" fontSize="7" fill="#ddd">
          ✕
        </text>
      )}
      <rect x="2" y="22" width="6" height="4" fill="#1f2937" />
    </g>
  )
}
