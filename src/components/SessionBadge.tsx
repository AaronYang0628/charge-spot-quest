import { motion } from 'framer-motion'
import { shortSessionBadge } from '../lib/nicknames'
import { NO_SHOW_LIMIT } from '../types'

interface Props {
  nickname: string
  sessionId: string
  noShowCount: number
  onEditNickname: () => void
}

export function SessionBadge({
  nickname,
  sessionId,
  noShowCount,
  onEditNickname,
}: Props) {
  const badge = shortSessionBadge(sessionId)
  const hearts = Array.from({ length: NO_SHOW_LIMIT }, (_, i) => i < noShowCount)

  return (
    <motion.button
      type="button"
      onClick={onEditNickname}
      className="flex items-center gap-1.5 rounded-full bg-white/90 py-1 pl-1 pr-2.5 shadow-sm ring-1 ring-slate-100"
      whileTap={{ scale: 0.97 }}
      title="点击改昵称"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-mint to-sky text-xs">
        ⚡
      </span>
      <div className="text-left leading-tight">
        <div className="max-w-[72px] truncate text-[11px] font-black text-ink">
          {nickname}
        </div>
        <div className="flex items-center gap-1 text-[9px]">
          <span className="font-mono font-bold text-violet-500">#{badge}</span>
          <span className="flex gap-px" title="剩余爽约机会">
            {hearts.map((lost, i) => (
              <span key={i} className={lost ? 'grayscale opacity-35' : ''}>
                {lost ? '💔' : '💚'}
              </span>
            ))}
          </span>
        </div>
      </div>
    </motion.button>
  )
}
