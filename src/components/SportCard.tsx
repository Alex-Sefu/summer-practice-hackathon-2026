import React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Sport } from '../types'

interface SportCardProps {
  sport: Sport
  selected?: boolean
  onSelect?: (sport: Sport) => void
  size?: 'sm' | 'md' | 'lg'
}

export const SportCard: React.FC<SportCardProps> = ({ sport, selected = false, onSelect, size = 'md' }) => {
  const sizes = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  }

  const emojiSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  }

  return (
    <motion.button
      onClick={() => onSelect?.(sport)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative rounded-2xl bg-gradient-to-br ${sport.gradient} overflow-hidden transition-all duration-300 ${
        selected ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-bg scale-105' : ''
      } ${sizes[size]}`}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <span className={`${emojiSizes[size]}`}>{sport.emoji}</span>
        <p className="text-white font-sans font-semibold text-sm text-center">{sport.label}</p>
      </div>

      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 bg-white rounded-full p-1"
        >
          <Check size={16} className="text-dark-bg" />
        </motion.div>
      )}
    </motion.button>
  )
}
