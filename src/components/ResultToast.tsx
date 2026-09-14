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
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-3xl bg-zinc-900 p-6 text-center shadow-2xl"
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 text-4xl">{ok ? '⚡' : '🚫'}</div>
            <h3 className="mb-1 text-xl font-black text-white">预约结果</h3>
            <p className={`text-sm font-semibold ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>
              {message}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-2xl bg-zinc-100 py-2.5 text-sm font-bold text-zinc-900"
            >
              知道了
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
