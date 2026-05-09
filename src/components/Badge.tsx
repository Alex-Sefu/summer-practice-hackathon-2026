import React from 'react'
import { motion } from 'framer-motion'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'warning' | 'success' | 'danger' | 'outline'
  size?: 'sm' | 'md'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', size = 'sm', className = '' }) => {
  const variants = {
    primary: 'bg-primary/20 text-primary border border-primary/30',
    secondary: 'bg-secondary/20 text-secondary border border-secondary/30',
    accent: 'bg-accent/20 text-accent border border-accent/30',
    warning: 'bg-warning/20 text-warning border border-warning/30',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    outline: 'bg-white/5 text-white border border-white/20',
  }

  const sizes = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
  }

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1 rounded-full font-sans font-semibold ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </motion.span>
  )
}
