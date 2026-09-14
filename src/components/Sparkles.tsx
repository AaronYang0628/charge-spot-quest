import { AnimatePresence, motion } from 'framer-motion'

const SPARKS = [
  { id: 0, x: 30, y: 35, delay: 0, emoji: '✨' },
  { id: 1, x: 50, y: 28, delay: 0.08, emoji: '⚡' },
  { id: 2, x: 68, y: 38, delay: 0.14, emoji: '💫' },
  { id: 3, x: 42, y: 48, delay: 0.1, emoji: '⭐' },
  { id: 4, x: 58, y: 52, delay: 0.18, emoji: '✨' },
]

export function SparkleBurst({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
          {SPARKS.map((s) => (
            <motion.span
              key={s.id}
              className="absolute text-xl"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              initial={{ opacity: 0, scale: 0, y: 12 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.15, 0.7], y: -28 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, delay: s.delay, ease: 'easeOut' }}
            >
              {s.emoji}
            </motion.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

const BOLTS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: 8 + ((i * 17) % 84),
  delay: (i % 5) * 0.06,
  rot: -30 + (i % 7) * 10,
  emoji: ['⚡', '🔋', '💚', '✨'][i % 4]!,
}))

export function ChargeConfetti({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
          {BOLTS.map((b) => (
            <motion.span
              key={b.id}
              className="absolute text-lg"
              style={{ left: `${b.x}%`, top: '-4%' }}
              initial={{ opacity: 1, y: 0, rotate: 0 }}
              animate={{ opacity: [1, 1, 0], y: '105vh', rotate: b.rot }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, delay: b.delay, ease: 'easeIn' }}
            >
              {b.emoji}
            </motion.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="fixed bottom-8 left-1/2 z-[90] max-w-[min(90vw,380px)] -translate-x-1/2 rounded-2xl bg-ink/95 px-5 py-3 text-center text-sm font-semibold text-white shadow-xl"
          initial={{ opacity: 0, y: 20, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
