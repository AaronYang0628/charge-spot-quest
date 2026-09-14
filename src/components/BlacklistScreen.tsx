import { motion } from 'framer-motion'

interface Props {
  nickname: string
  noShowCount: number
  onReset: () => void
}

export function BlacklistScreen({ nickname, noShowCount, onReset }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/80 backdrop-blur-md sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="relative w-full max-w-[420px] overflow-hidden rounded-t-3xl bg-gradient-to-b from-rose-50 to-white p-6 text-center shadow-2xl sm:rounded-3xl sm:mx-4"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <motion.div
          className="mx-auto mb-3 text-6xl"
          animate={{ rotate: [-6, 6, -6] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        >
          🚫
        </motion.div>

        <h2 className="mb-1 text-2xl font-black tracking-wide text-coral">
          GAME OVER
        </h2>
        <p className="mb-1 text-base font-bold text-ink">
          「{nickname}」进入爽约黑名单
        </p>
        <p className="mb-5 text-sm leading-relaxed text-muted">
          累计爽约 <span className="font-black text-coral">{noShowCount}</span> 次
          <br />
          充电精灵翻白眼了…下次记得签到
        </p>

        <div className="mb-5 rounded-2xl bg-white p-4 text-left text-sm text-ink shadow-inner ring-1 ring-rose-100">
          <p className="mb-2 font-bold">规则</p>
          <ul className="list-inside list-disc space-y-1 text-muted text-xs">
            <li>无法创建新预约</li>
            <li>清除本机数据才能重新开局</li>
            <li>结束前点「我已到达」就不会扣心</li>
          </ul>
        </div>

        <motion.button
          type="button"
          onClick={onReset}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-mint-deep py-4 text-sm font-black text-white shadow-lg"
          whileTap={{ scale: 0.98 }}
        >
          清除本地数据 · 重新开局
        </motion.button>
        <p className="mt-3 text-[10px] text-slate-400">
          将删除 session、预约与黑名单状态
        </p>
      </motion.div>
    </motion.div>
  )
}
