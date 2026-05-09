import React from 'react'
import { motion } from 'framer-motion'

interface AvatarProps {
  initials: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({ initials, color, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${sizes[size]} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-display font-semibold ring-2 ring-white/20 ${className}`}
    >
      {initials}
    </motion.div>
  )
}
