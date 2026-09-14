import { motion } from 'framer-motion'
import { ParkingSpot } from './ParkingSpot'
import type { SpotId } from '../types'

interface Props {
  selectedSpot: SpotId | null
  onSelectBookable: () => void
}

export function SpotScene({ selectedSpot, onSelectBookable }: Props) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100/80 via-cream/60 to-teal-50/70 px-3 py-3">
      <motion.span
        className="absolute right-3 top-2 text-sm opacity-70"
        animate={{ y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 3.5 }}
      >
        ☀️
      </motion.span>
      <div className="relative z-10 flex gap-2">
        <ParkingSpot spotId="A" maintenance />
        <ParkingSpot spotId="B" maintenance />
        <ParkingSpot
          spotId="C"
          selected={selectedSpot === 'C'}
          onSelect={onSelectBookable}
        />
      </div>
    </section>
  )
}
