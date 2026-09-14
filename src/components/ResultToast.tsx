import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  open: boolean
  ok: boolean
  message: string
  onClose: () => void
}

export function ResultToast({ open, ok, message, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl"
            style={{ background: 'var(--ui-shell-top, #181820)' }}
            initial={{ scale: 0.92, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* white bolt — no confetti / no cute faces */}
            <svg
              viewBox="0 0 40 40"
              width={40}
              height={40}
              className="mx-auto mb-2"
              aria-hidden
            >
              <path
                d="M22 4 L12 20 L20 20 L10 36 L30 16 L21 16 Z"
                fill="#F4F4F5"
              />
            </svg>
            <h3
              className="mb-1 text-xl font-black"
              style={{ color: 'var(--ui-text)' }}
            >
              预约结果
            </h3>
            <p
              className="text-sm font-semibold"
              style={{ color: ok ? 'var(--ui-success)' : '#f87171' }}
            >
              {message}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-2xl py-2.5 text-sm font-bold"
              style={{ background: '#fff', color: '#0a0a0a' }}
            >
              知道了
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
