import React from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEvents } from '../context/EventsContext'

const nearbyUsers = [
  { id: '1', name: 'Sofia', initials: 'S', color: 'from-violet-500 to-purple-700', sports: ['🏃', '🏊'], distance: '0.8 km' },
  { id: '2', name: 'Marco', initials: 'M', color: 'from-cyan-400 to-blue-600', sports: ['⚽', '🏀'], distance: '1.2 km' },
  { id: '3', name: 'Elena', initials: 'E', color: 'from-pink-400 to-rose-600', sports: ['🚴', '🎾'], distance: '2.1 km' },
]

const eventTips = [
  '🎯 Be specific about skill level to attract the right players',
  '📍 Add a precise location so people can find you easily',
  '⏰ Set a realistic time — evenings and weekends fill up fastest',
  '💬 Write a short description to build excitement',
]

export const RightPanel: React.FC = () => {
  const location = useLocation()
  const { events } = useEvents()

  const isHome = location.pathname === '/'
  const isMatch = location.pathname === '/match'
  const isChat = location.pathname.startsWith('/chat')
  const isCreate = location.pathname === '/events/create'

  return (
    <div className="w-[320px] h-screen sticky top-0 px-6 py-8 overflow-y-auto scrollbar-hide">
      {/* Home: Quick Stats + People nearby */}
      {isHome && (
        <div className="space-y-6">
          <div className="bg-card-bg border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-display font-bold text-base mb-4">Quick Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Active events today', value: '3', emoji: '🔥' },
                { label: 'Players nearby', value: '24', emoji: '👥' },
                { label: 'Your streak', value: '4 days', emoji: '⚡' },
              ].map(({ label, value, emoji }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{emoji}</span>
                    <span className="text-text-muted text-sm font-sans">{label}</span>
                  </div>
                  <span className="text-white font-sans font-bold text-sm">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card-bg border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-display font-bold text-base mb-4">People nearby</h3>
            <div className="space-y-3">
              {nearbyUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0`}>
                    {user.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-sans font-semibold text-sm">{user.name}</p>
                    <div className="flex items-center gap-1">
                      {user.sports.map((s) => (
                        <span key={s} className="text-xs">{s}</span>
                      ))}
                      <span className="text-text-muted text-xs ml-1">{user.distance}</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 rounded-xl bg-primary/20 border border-primary/30 text-primary text-xs font-sans font-semibold"
                  >
                    Connect
                  </motion.button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Match: Joined events today */}
      {isMatch && (
        <div className="bg-card-bg border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-display font-bold text-base mb-4">Your joined events</h3>
          {events.length === 0 ? (
            <p className="text-text-muted text-sm font-sans">No events joined yet. Start swiping! 🎯</p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map((evt) => (
                <div key={evt.id} className="flex items-center gap-3">
                  <span className="text-xl">{evt.emoji}</span>
                  <div>
                    <p className="text-white font-sans font-semibold text-sm">{evt.title}</p>
                    <p className="text-text-muted text-xs">{evt.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat: Active members */}
      {isChat && (
        <div className="bg-card-bg border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-display font-bold text-base mb-4">Active members</h3>
          <div className="space-y-3">
            {nearbyUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-white font-display font-bold text-xs`}>
                    {user.initials}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card-bg" />
                </div>
                <p className="text-white font-sans font-semibold text-sm">{user.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event creation: Tips */}
      {isCreate && (
        <div className="bg-card-bg border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-display font-bold text-base mb-4">Tips for great events</h3>
          <div className="space-y-3">
            {eventTips.map((tip, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="text-text-muted text-sm font-sans leading-relaxed"
              >
                {tip}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
