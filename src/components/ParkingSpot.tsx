import { motion } from 'framer-motion'
import type { SpotId } from '../types'
import { SPOT_LABELS } from '../types'

interface Props {
  spotId: SpotId
  maintenance?: boolean
  selected?: boolean
  onSelect?: () => void
}

function CuteCar({ color, sad }: { color: string; sad?: boolean }) {
  return (
    <svg viewBox="0 0 100 58" className="h-9 w-16">
      <ellipse cx="50" cy="50" rx="32" ry="4" fill="#00000012" />
      <path
        d="M16 36 C18 24 30 16 42 14 L58 14 C72 16 82 24 84 36 L84 42 L16 42 Z"
        fill={color}
      />
      <path
        d="M34 16 L46 8 L62 8 L72 16 Z"
        fill="#e0f7ff"
        stroke="#fff"
        strokeWidth="1.2"
      />
      <circle cx="40" cy="31" r="4" fill="#fff" />
      <circle cx="60" cy="31" r="4" fill="#fff" />
      <circle cx={sad ? 39 : 41} cy={sad ? 32 : 31} r="1.8" fill="#1e293b" />
      <circle cx={sad ? 59 : 61} cy={sad ? 32 : 31} r="1.8" fill="#1e293b" />
      {sad ? (
        <path d="M45 39 Q50 36 55 39" stroke="#1e293b" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M45 38 Q50 42 55 38" stroke="#1e293b" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      )}
      <circle cx="32" cy="44" r="6" fill="#1e293b" />
      <circle cx="32" cy="44" r="2.5" fill="#e2e8f0" />
      <circle cx="68" cy="44" r="6" fill="#1e293b" />
      <circle cx="68" cy="44" r="2.5" fill="#e2e8f0" />
      {!sad && (
        <>
          <ellipse cx="34" cy="35" rx="2.5" ry="1.2" fill="#fb718555" />
          <ellipse cx="66" cy="35" rx="2.5" ry="1.2" fill="#fb718555" />
        </>
      )}
    </svg>
  )
}

function MiniCharger({ broken }: { broken?: boolean }) {
  return (
    <svg viewBox="0 0 36 52" className="h-8 w-5">
      <rect x="8" y="4" width="20" height="36" rx="5" fill={broken ? '#94a3b8' : '#2dd4bf'} />
      <rect x="12" y="9" width="12" height="9" rx="2" fill={broken ? '#64748b' : '#fef08a'} />
      {broken ? (
        <text x="18" y="32" textAnchor="middle" fontSize="10">🔧</text>
      ) : (
        <path d="M16 24 L21 30 L18 30 L20 38 L14 30 L17 30 Z" fill="#fff" />
      )}
      <rect x="13" y="40" width="10" height="6" rx="1.5" fill="#1e293b" />
    </svg>
  )
}

const COLORS: Record<SpotId, string> = {
  A: '#fda4af',
  B: '#c4b5fd',
  C: '#5eead4',
}

export function ParkingSpot({ spotId, maintenance, selected, onSelect }: Props) {
  const label = SPOT_LABELS[spotId]

  if (maintenance) {
    return (
      <div className="relative flex flex-1 flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-100/80 px-1.5 py-2 opacity-70">
        <span className="mb-1 rounded-full bg-slate-400 px-2 py-0.5 text-[9px] font-bold text-white">
          {label}
        </span>
        <div className="flex flex-col items-center gap-0.5">
          <MiniCharger broken />
          <CuteCar color={COLORS[spotId]} sad />
        </div>
        <span className="mt-1 rounded-lg bg-slate-400/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
          维护中
        </span>
      </div>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-1 flex-col items-center rounded-2xl border-2 px-1.5 py-2 shadow-sm ${
        selected
          ? 'border-mint-deep bg-gradient-to-b from-teal-50 to-emerald-50 animate-pulse-glow'
          : 'border-teal-200/80 bg-gradient-to-b from-white to-teal-50/80'
      }`}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
    >
      <span className="mb-1 rounded-full bg-mint-deep px-2 py-0.5 text-[9px] font-bold text-white">
        {label}
      </span>
      <motion.div
        className="flex flex-col items-center gap-0.5"
        animate={{ y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
      >
        <MiniCharger />
        <CuteCar color={COLORS[spotId]} />
      </motion.div>
      <span className="mt-1 rounded-lg bg-gradient-to-r from-mint-deep to-teal-500 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
        可约
      </span>
    </motion.button>
  )
}
