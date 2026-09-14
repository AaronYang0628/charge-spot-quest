import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Props {
  open: boolean
  nickname: string
  onClose: () => void
  onSave: (name: string) => void
}

export function NicknameModal({ open, nickname, onClose, onSave }: Props) {
  const [value, setValue] = useState(nickname)

  useEffect(() => {
    if (open) setValue(nickname)
  }, [open, nickname])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[75] flex items-end justify-center bg-slate-900/40 backdrop-blur-[2px] sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-[420px] rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:mx-4"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-lg font-black">改个可爱昵称</h3>
            <p className="mb-4 text-xs text-muted">最多 12 字 · 仅保存在本机</p>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value.slice(0, 12))}
              className="mb-4 w-full rounded-2xl border-2 border-teal-100 bg-teal-50/40 px-4 py-3.5 text-sm font-bold outline-none focus:border-mint-deep"
              placeholder="例如：闪电兔"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl bg-fog py-3.5 text-sm font-bold text-muted"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  onSave(value)
                  onClose()
                }}
                className="flex-1 rounded-2xl bg-mint-deep py-3.5 text-sm font-black text-white"
              >
                保存
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
