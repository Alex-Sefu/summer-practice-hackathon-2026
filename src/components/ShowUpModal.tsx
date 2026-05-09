import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShowUp } from '../context/ShowUpContext'

export const ShowUpModal: React.FC = () => {
  const { isAvailableToday, setIsAvailableToday } = useShowUp()

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  // Already answered this session — don't show
  if (isAvailableToday !== null) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="bg-card-bg border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl"
        >
          {/* Bouncing emoji */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl"
          >
            🏃
          </motion.div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold text-white leading-tight">
              Will you show up today?
            </h2>
            <p className="text-text-muted text-sm">{today}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => setIsAvailableToday(true)}
              className="flex-1 py-4 px-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-sans font-bold text-sm shadow-lg"
            >
              YES, I'M IN 🙌
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => setIsAvailableToday(false)}
              className="flex-1 py-4 px-4 rounded-2xl bg-white/10 border border-white/20 text-white font-sans font-semibold text-sm"
            >
              Not today 😴
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
