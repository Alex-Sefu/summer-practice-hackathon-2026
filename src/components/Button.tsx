import React from 'react'
import { motion } from 'framer-motion'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const baseClasses = 'font-sans font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2'

  const variants = {
    primary: 'bg-gradient-to-r from-primary to-secondary text-white',
    secondary: 'bg-gradient-to-r from-accent to-green-400 text-dark-bg',
    outline: 'border-2 border-primary text-primary',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </motion.button>
  )
}
