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
/** 3D plant-on-lot: Z yaw + X pitch (not flat CSS rotate only) */
const CAR_PERSPECTIVE = 900
const CAR_YAW_Z = -30 // deg, CCW on screen
const CAR_PITCH_X = 28 // deg, tip into lot ground plane — tune with Aaron
const carTransform = `perspective(${CAR_PERSPECTIVE}px) rotateX(${CAR_PITCH_X}deg) rotateZ(${CAR_YAW_Z}deg)`

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
    <div className="lot-wrap relative mx-auto aspect-[390/220] w-full overflow-hidden rounded-2xl" data-art-slot="parking-lot">
      {LOT_BACKGROUND_SPRITE ? (
        <img
          src={LOT_BACKGROUND_SPRITE}
          alt=""
          className="absolute inset-0 h-full w-full object-fill"
          draggable={false}
        />
      ) : null}
      {/* Bay overlays + fallback procedural env when no LOT_BACKGROUND_SPRITE */}
      <svg
        viewBox="0 0 390 220"
        className="relative block w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {!LOT_BACKGROUND_SPRITE && (
          <>
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
            <rect x="0" y="0" width="390" height="220" fill="url(#lotGrad)" />
            <polygon points="0,0 390,0 390,28 0,36" fill="url(#curbGrad)" />
            <polygon points="0,36 390,28 390,34 0,42" fill="var(--lot-curb-bottom)" />
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
            <g>
              <rect x="70" y="8" width="3" height="28" fill="var(--lot-pole)" />
              <rect x="64" y="6" width="15" height="5" fill="var(--lot-lamp)" />
              <rect x="310" y="6" width="3" height="28" fill="var(--lot-pole)" />
              <rect x="304" y="4" width="15" height="5" fill="var(--lot-lamp)" />
            </g>
            <Charger x={74} y={48} broken />
            <Charger x={186} y={48} broken />
            <Charger x={298} y={48} />
          </>
        )}

        {/* Isometric bays matching parking-lot.webp tilt; cars use iso sprites, no CSS rotate.
            With lot sprite, fills stay mostly transparent so the plate shows through. */}
        <Bay
          points="40,78 128,68 112,188 24,198"
          label="A"
          labelAt={[76, 135]}
          dim
          plate={Boolean(LOT_BACKGROUND_SPRITE)}
        />
        <Bay
          points="148,70 236,60 220,180 132,190"
          label="B"
          labelAt={[184, 128]}
          dim
          plate={Boolean(LOT_BACKGROUND_SPRITE)}
        />
        <Bay
          points="256,62 344,52 328,172 240,182"
          label="C"
          labelAt={[292, 120]}
          highlight={selected === 'C' || animPhase === 'drift' || animPhase === 'charging'}
          pulse={animPhase === 'charging'}
          active
          plate={Boolean(LOT_BACKGROUND_SPRITE)}
        />
      </svg>

      {/* cars layered as HTML/SVG over the lot for easier animation */}
      <div className="pointer-events-none absolute inset-0" style={{ perspective: CAR_PERSPECTIVE, transformStyle: 'preserve-3d' }}>
        {/* Spot A parked */}
        {byId.A?.occupied && !byId.A.maintenance && byId.A.vehicle && (
          <div
            className="absolute left-[4%] top-[36%] w-[26%]"
            style={{
              filter: 'saturate(0.7)',
              opacity: 0.85,
              transform: carTransform,
              transformOrigin: 'center bottom',
              transformStyle: 'preserve-3d',
            }}
          >
            <LowPolyCar
              pose="park"
              type={byId.A.vehicle.type}
              color={byId.A.vehicle.color}
              size={96}
            />
          </div>
        )}

        {/* Spot B empty — nothing */}

        {/* Spot C — parked from mock OR animation */}
        {/* 倒车入库 + 3D: yaw Z + pitch X into lot plane */}
        <AnimatePresence>
          {animPhase && animVehicle && (
            <motion.div
              key="anim-car"
              className="absolute w-[30%]"
              initial={{
                left: '58%',
                top: '70%',
                opacity: 1,
                rotateX: CAR_PITCH_X,
                rotateZ: CAR_YAW_Z,
              }}
              animate={{
                left: '58%',
                top: '36%',
                opacity: 1,
                rotateX: CAR_PITCH_X,
                rotateZ: CAR_YAW_Z,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{
                transformOrigin: 'center bottom',
                transformPerspective: CAR_PERSPECTIVE,
                transformStyle: 'preserve-3d',
              }}
            >
              <LowPolyCar
                pose="park"
                type={animVehicle.type}
                color={animVehicle.color}
                charging={animPhase === 'charging'}
                size={104}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!animPhase && byId.C?.occupied && !byId.C.maintenance && byId.C.vehicle && (
          <div
            className="absolute left-[58%] top-[36%] w-[26%]"
            style={{
              transform: carTransform,
              transformOrigin: 'center bottom',
              transformStyle: 'preserve-3d',
            }}
          >
            <LowPolyCar
              pose="park"
              type={byId.C.vehicle.type}
              color={byId.C.vehicle.color}
              charging
              size={104}
            />
          </div>
        )}
      </div>

      {/* tap target for C */}
      <button
        type="button"
        aria-label="预约车位 C"
        onClick={onSelectC}
        className="absolute right-[10%] top-[28%] h-[55%] w-[28%] rounded-lg border-0 bg-transparent"
        style={{ cursor: byId.C?.bookable ? 'pointer' : 'not-allowed' }}
      />

      {/* A/B barriers painted into parking-lot.webp */}

      {/* maintenance badges */}
      <span
        className="absolute left-[10%] top-[72%] rounded px-1.5 py-0.5 text-[10px] font-bold"
        style={{ background: 'var(--ui-maint-pill)', color: 'var(--ui-muted)' }}
      >
        维护中
      </span>
      <span
        className="absolute left-[38%] top-[72%] rounded px-1.5 py-0.5 text-[10px] font-bold"
        style={{ background: 'var(--ui-maint-pill)', color: 'var(--ui-muted)' }}
      >
        维护中
      </span>
      {byId.C?.bookable && !byId.C.occupied && !animPhase && (
        <span
          className="absolute right-[14%] top-[74%] rounded px-1.5 py-0.5 text-[10px] font-black shadow"
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
  plate,
}: {
  points: string
  label: string
  labelAt: [number, number]
  dim?: boolean
  highlight?: boolean
  active?: boolean
  pulse?: boolean
  /** true when painted lot sprite is under us — keep fills light */
  plate?: boolean
}) {
  const fill = plate
    ? highlight
      ? 'rgba(88, 112, 192, 0.18)'
      : 'rgba(0, 0, 0, 0)'
    : highlight
      ? 'var(--lot-bay-fill-active)'
      : 'var(--lot-bay-fill)'
  return (
    <g opacity={dim && !plate ? 0.55 : 1}>
      <polygon
        points={points}
        fill={fill}
        stroke={
          highlight
            ? 'var(--lot-bay-line-active)'
            : dim
              ? 'var(--lot-bay-line-maint, #9ca3af)'
              : 'var(--lot-bay-line)'
        }
        strokeWidth={highlight ? 2.5 : plate ? 0 : 1.8}
        className={pulse ? 'bay-pulse' : undefined}
      />
      <text
        x={labelAt[0]}
        y={labelAt[1]}
        textAnchor="middle"
        fill={active ? (plate ? '#5870C0' : '#f8f8f8') : 'var(--lot-curb-top)'}
        fontSize="22"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        opacity={plate ? 0.25 : 0.35}
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
