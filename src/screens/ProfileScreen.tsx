import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, MapPin, Edit2, Camera, Loader } from 'lucide-react'
import { sports } from '../data/mockData'
import { Badge } from '../components/Badge'
import { useEvents } from '../context/EventsContext'
import { useAuth } from '../context/AuthContext'

interface ProfileScreenProps {
  onLogout: () => void
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const { events } = useEvents()
  const { profile, signOut, uploadAvatar } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)

  // Merge Supabase profile with localStorage fallback
  const localRaw = localStorage.getItem('userProfile')
  const local = localRaw ? JSON.parse(localRaw) : null

  const displayName = profile?.name || local?.name || 'Player'
  const displayBio = profile?.bio || local?.bio || ''
  const displayLocation = profile?.location || local?.location || ''
  const displaySkill = profile?.skill_level || local?.skillLevel || ''
  const displaySports: string[] = profile?.sports || local?.selectedSports || []
  const displayAvailability: string[] = profile?.availability || local?.availability || []
  const displayAvatar = profile?.avatar_emoji || local?.avatarEmoji || '👤'
  const displayAvatarUrl = profile?.avatar_url || null
  const gamesPlayed = profile?.games_played ?? 12
  const streak = profile?.streak ?? 4

  const initials = displayName.charAt(0).toUpperCase()
  const userSports = sports.filter((s) => displaySports.includes(s.id))

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    await uploadAvatar(file)
    setAvatarLoading(false)
  }

  const handleLogout = async () => {
    await signOut()
    onLogout()
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-32 lg:pb-8">
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="pt-4 flex justify-between items-center">
          <h1 className="text-3xl font-display font-bold text-white">Profile</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-text-muted hover:text-white text-sm font-sans font-semibold transition-colors"
          >
            <Edit2 size={14} />
            Edit
          </motion.button>
        </div>

        {/* Avatar + name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 py-4"
        >
          {/* Clickable avatar with upload */}
          <div className="relative">
            <motion.button
              onClick={handleAvatarClick}
              whileHover={{ scale: 1.05 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display font-bold text-4xl shadow-lg overflow-hidden relative"
            >
              {avatarLoading ? (
                <Loader size={28} className="animate-spin" />
              ) : displayAvatarUrl ? (
                <img src={displayAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{displayAvatar !== '👤' ? displayAvatar : initials}</span>
              )}
            </motion.button>
            {/* Camera overlay */}
            <div
              onClick={handleAvatarClick}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-md"
            >
              <Camera size={13} className="text-white" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-white">{displayName}</h2>
            {displayLocation && (
              <div className="flex items-center justify-center gap-1 text-text-muted text-sm mt-1">
                <MapPin size={14} />
                {displayLocation}
              </div>
            )}
            {displayBio && (
              <p className="text-text-muted text-sm mt-2 max-w-xs">{displayBio}</p>
            )}
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Games', value: gamesPlayed, emoji: '🏅' },
            { label: 'Sports', value: userSports.length || sportsCount(displaySports), emoji: '⚽' },
            { label: 'Streak', value: `${streak}d`, emoji: '🔥' },
          ].map(({ label, value, emoji }, idx) => (
            <motion.div
              key={label}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-card-bg border border-white/10 rounded-2xl p-3 text-center"
            >
              <p className="text-2xl mb-1">{emoji}</p>
              <p className="text-2xl font-display font-bold text-primary">{value}</p>
              <p className="text-text-muted text-xs mt-1">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Skill level */}
        {displaySkill && (
          <div className="bg-card-bg border border-white/10 rounded-2xl p-4">
            <p className="text-text-muted text-xs font-sans font-semibold uppercase tracking-wider mb-2">Skill Level</p>
            <Badge variant="primary" size="md">{displaySkill}</Badge>
          </div>
        )}

        {/* My sports */}
        {userSports.length > 0 && (
          <div className="bg-card-bg border border-white/10 rounded-2xl p-4">
            <p className="text-text-muted text-xs font-sans font-semibold uppercase tracking-wider mb-3">My Sports</p>
            <div className="flex flex-wrap gap-2">
              {userSports.map((sport) => (
                <span
                  key={sport.id}
                  className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${sport.gradient} text-white text-sm font-sans font-semibold`}
                >
                  {sport.emoji} {sport.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Availability */}
        {displayAvailability.length > 0 && (
          <div className="bg-card-bg border border-white/10 rounded-2xl p-4">
            <p className="text-text-muted text-xs font-sans font-semibold uppercase tracking-wider mb-3">Availability</p>
            <div className="grid grid-cols-7 gap-1.5">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className={`py-2 rounded-lg text-center text-xs font-sans font-semibold transition-colors ${
                    displayAvailability.includes(day)
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-text-muted'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My created events */}
        <div className="bg-card-bg border border-white/10 rounded-2xl p-4">
          <p className="text-text-muted text-xs font-sans font-semibold uppercase tracking-wider mb-3">My Created Events</p>
          {events.length === 0 ? (
            <p className="text-text-muted text-sm font-sans">No events created yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <div key={evt.id} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${evt.gradient} flex items-center justify-center text-xl flex-shrink-0`}>
                    {evt.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-sans font-semibold text-sm truncate">{evt.title}</p>
                    <p className="text-text-muted text-xs">{evt.time} · {evt.location}</p>
                  </div>
                  <Badge variant="primary" size="sm">Host</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 font-sans font-semibold transition-colors"
        >
          <LogOut size={18} />
          Log out
        </motion.button>
      </div>
    </div>
  )
}

// Helper to count sports from string array
function sportsCount(sportIds: string[]): number {
  return sportIds.length || 3
}
