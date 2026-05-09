import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Flame, Calendar, MessageCircle, User } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/match', icon: Flame, label: 'Match' },
  { path: '/events/create', icon: Calendar, label: 'Events' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export const BottomNav: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A2E]/95 backdrop-blur-md border-t border-white/5"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive =
            path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path)
          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              whileTap={{ scale: 0.9 }}
              className="relative flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors duration-200"
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
              )}
              <Icon
                size={22}
                className={`transition-colors duration-200 ${isActive ? 'text-primary' : 'text-text-muted'}`}
              />
              <span
                className={`text-xs font-sans font-semibold mt-1 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-text-muted'}`}
              >
                {label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </motion.nav>
  )
}
