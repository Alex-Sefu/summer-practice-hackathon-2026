import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Flame, Calendar, MessageCircle, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/match', icon: Flame, label: 'Match' },
  { path: '/events/create', icon: Calendar, label: 'Events' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()

  // Auth context is source of truth; fall back to localStorage for demo mode
  const localRaw = localStorage.getItem('userProfile')
  const local = localRaw ? JSON.parse(localRaw) : null

  const displayName  = profile?.name         || local?.name         || 'Player'
  const displayAvatar = profile?.avatar_emoji || local?.avatar_emoji || local?.avatarEmoji || '👤'
  const initials     = displayName.charAt(0).toUpperCase()
  const showEmoji    = displayAvatar && displayAvatar !== '👤'

  return (
    <div className="w-[260px] h-screen sticky top-0 bg-card-bg border-r border-white/10 flex flex-col px-6 py-8">
      {/* Logo */}
      <div className="mb-10">
        <span className="font-display font-bold text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          ShowUp
        </span>
        <span className="font-display font-bold text-2xl text-white">2Move</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive =
            path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path)
          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans font-semibold text-sm transition-colors duration-200 ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-primary' : ''} />
              {label}
              {isActive && (
                <motion.div
                  layoutId="sidebarActive"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* User mini-profile — updates instantly when profile changes */}
      <div className="mt-auto pt-6 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0">
            {showEmoji ? displayAvatar : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-sans font-semibold text-sm truncate">{displayName}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent inline-block" />
              <span className="text-text-muted text-xs">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
