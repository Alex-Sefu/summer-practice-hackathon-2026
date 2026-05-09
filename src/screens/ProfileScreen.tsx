import React, { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, MapPin, Edit2, Camera, Loader, X, Save } from 'lucide-react'
import { sports } from '../data/mockData'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { AchievementBadge } from '../components/AchievementBadge'
import { useEvents } from '../context/EventsContext'
import { useAuth } from '../context/AuthContext'
import { ACHIEVEMENTS } from '../data/achievements'

interface ProfileScreenProps {
  onLogout: () => void
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro'] as const

interface EditModalProps {
  initial: {
    name: string
    bio: string
    location: string
    skill_level: string
    avatar_emoji: string
  }
  onSave: (data: EditModalProps['initial']) => Promise<void>
  onClose: () => void
}

const AVATAR_OPTIONS = ['👤', '😊', '🤓', '😎', '🏋️', '🎯', '🏃', '🚴', '🎾', '⚽']

const EditModal: React.FC<EditModalProps> = ({ initial, onSave, onClose }) => {
  const [name, setName] = useState(initial.name)
  const [bio, setBio] = useState(initial.bio)
  const [location, setLocation] = useState(initial.location)
  const [skillLevel, setSkillLevel] = useState(initial.skill_level)
  const [avatarEmoji, setAvatarEmoji] = useState(initial.avatar_emoji)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name, bio, location, skill_level: skillLevel, avatar_emoji: avatarEmoji })
    setSaving(false)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-card-bg border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-white">Edit Profile</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div>
          <p className="text-text-muted text-xs font-sans font-semibold uppercase tracking-wider mb-2">Avatar</p>
          <div className="flex gap-2 flex-wrap">
            {AVATAR_OPTIONS.map((emoji) => (
              <motion.button
                key={emoji}
                onClick={() => setAvatarEmoji(emoji)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                  avatarEmoji === emoji
                    ? 'bg-primary ring-2 ring-primary ring-offset-2 ring-offset-card-bg'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-white font-sans font-semibold mb-2 text-sm">Display Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-2xl bg-dark-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-white font-sans font-semibold mb-2 text-sm">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people about yourself..."
            rows={2}
            className="w-full px-4 py-3 rounded-2xl bg-dark-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-white font-sans font-semibold mb-2 text-sm">City</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Bucharest, Cluj..."
            className="w-full px-4 py-3 rounded-2xl bg-dark-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-white font-sans font-semibold mb-2 text-sm">Skill Level</label>
          <div className="grid grid-cols-2 gap-2">
            {skillLevels.map((level) => (
              <motion.button
                key={level}
                onClick={() => setSkillLevel(level)}
                whileHover={{ scale: 1.03 }}
                className={`py-2 px-3 rounded-xl font-sans font-semibold text-sm transition-all ${
                  skillLevel === level
                    ? 'bg-gradient-to-r from-primary to-secondary text-white'
                    : 'bg-dark-bg border border-white/10 text-text-muted hover:text-white'
                }`}
              >
                {level}
              </motion.button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={!name.trim() || saving} size="lg" className="w-full">
          {saving ? (
            <><Loader size={16} className="animate-spin" />Saving…</>
          ) : (
            <><Save size={16} />Save Changes</>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const { events } = useEvents()
  const { profile, signOut, uploadAvatar, updateProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Local override state — updated immediately on save, no waiting for Supabase
  const localRaw = localStorage.getItem('userProfile')
  const local = localRaw ? JSON.parse(localRaw) : null

  const [localOverride, setLocalOverride] = useState<{
    name?: string
    bio?: string
    location?: string
    skill_level?: string
    avatar_emoji?: string
  } | null>(null)

  // Merge priority: localOverride > supabase profile > localStorage > defaults
  const displayName = localOverride?.name ?? profile?.name ?? local?.name ?? 'Player'
  const displayBio = localOverride?.bio ?? profile?.bio ?? local?.bio ?? ''
  const displayLocation = localOverride?.location ?? profile?.location ?? local?.location ?? ''
  const displaySkill = localOverride?.skill_level ?? profile?.skill_level ?? local?.skillLevel ?? ''
  const displayAvatar = localOverride?.avatar_emoji ?? profile?.avatar_emoji ?? local?.avatar_emoji ?? local?.avatarEmoji ?? '👤'
  const displayAvatarUrl = profile?.avatar_url ?? null
  const displaySports: string[] = profile?.sports ?? local?.selectedSports ?? []
  const displayAvailability: string[] = profile?.availability ?? local?.availability ?? []
  const gamesPlayed = profile?.games_played ?? 0
  const streak = profile?.streak ?? 0

  const initials = displayName.charAt(0).toUpperCase()
  const userSports = sports.filter((s) => displaySports.includes(s.id))

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    await uploadAvatar(file)
    setAvatarLoading(false)
  }

  const handleSaveEdit = async (data: {
    name: string; bio: string; location: string; skill_level: string; avatar_emoji: string
  }) => {
    // 1. Update local override immediately — UI updates right away
    setLocalOverride(data)

    // 2. Save to localStorage as persistent fallback
    const existing = localStorage.getItem('userProfile')
    const parsed = existing ? JSON.parse(existing) : {}
    localStorage.setItem('userProfile', JSON.stringify({
      ...parsed,
      name: data.name,
      bio: data.bio,
      location: data.location,
      skillLevel: data.skill_level,
      avatar_emoji: data.avatar_emoji,
    }))

    // 3. Try Supabase in background — don't block UI
    updateProfile(data).catch(() => {})
  }

const handleLogout = async () => {
  console.log("Se inițiază Log Out..."); // Verifică în consolă (F12) dacă apare asta
  
  try {
    // 1. Ștergem totul din memoria locală instant
    window.localStorage.clear();
    window.sessionStorage.clear();
    
    // 2. Semnalăm către Supabase să închidă sesiunea
    await supabase.auth.signOut();
    
    // 3. Forțăm redirectarea prin reîncărcare completă de pagină
    // Asta taie orice legătură cu starea veche a aplicației
    window.location.replace('/auth'); 

  } catch (error) {
    console.error("Eroare la log out:", error);
    // Chiar și cu eroare de la server, forțăm ieșirea din UI
    window.location.replace('/auth');
  }
};

  return (
    <div className="min-h-screen bg-dark-bg pb-32 lg:pb-8">
      <div className="max-w-md mx-auto p-4 space-y-6">

        <div className="pt-4 flex justify-between items-center">
          <h1 className="text-3xl font-display font-bold text-white">Profile</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-text-muted hover:text-white hover:border-white/40 text-sm font-sans font-semibold transition-colors"
          >
            <Edit2 size={14} />
            Edit
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 py-4"
        >
          <div className="relative">
            <motion.button
              onClick={handleAvatarClick}
              whileHover={{ scale: 1.05 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display font-bold text-4xl shadow-lg overflow-hidden"
            >
              {avatarLoading ? (
                <Loader size={28} className="animate-spin" />
              ) : displayAvatarUrl ? (
                <img src={displayAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{displayAvatar !== '👤' ? displayAvatar : initials}</span>
              )}
            </motion.button>
            <div
              onClick={handleAvatarClick}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-md"
            >
              <Camera size={13} className="text-white" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
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

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Games', value: gamesPlayed, emoji: '🏅' },
            { label: 'Sports', value: userSports.length > 0 ? userSports.length : displaySports.length, emoji: '⚽' },
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

        {displaySkill && (
          <div className="bg-card-bg border border-white/10 rounded-2xl p-4">
            <p className="text-text-muted text-xs font-sans font-semibold uppercase tracking-wider mb-2">Skill Level</p>
            <Badge variant="primary" size="md">{displaySkill}</Badge>
          </div>
        )}

        {/* ── Achievements ─────────────────────────────────────────────── */}
        <div className="bg-card-bg border border-white/10 rounded-2xl p-4">
          <p className="text-text-muted text-xs font-sans font-semibold uppercase tracking-wider mb-3">🏆 Achievements</p>
          <div className="grid grid-cols-3 gap-2">
            {ACHIEVEMENTS.map((achievement) => {
              const stats = {
                gamesPlayed,
                sports: displaySports,
                streak,
                eventsCreated: events.length,
              }
              return (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={achievement.condition(stats)}
                />
              )
            })}
          </div>
        </div>

        {userSports.length > 0 && (
          <div className="bg-card-bg border border-white/10 rounded-2xl p-4">
            <p className="text-text-muted text-xs font-sans font-semibold uppercase tracking-wider mb-3">My Sports</p>
            <div className="flex flex-wrap gap-2">
              {userSports.map((sport) => (
                <span key={sport.id} className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${sport.gradient} text-white text-sm font-sans font-semibold`}>
                  {sport.emoji} {sport.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {displayAvailability.length > 0 && (
          <div className="bg-card-bg border border-white/10 rounded-2xl p-4">
            <p className="text-text-muted text-xs font-sans font-semibold uppercase tracking-wider mb-3">Availability</p>
            <div className="grid grid-cols-7 gap-1.5">
              {daysOfWeek.map((day) => (
                <div key={day} className={`py-2 rounded-lg text-center text-xs font-sans font-semibold ${
                  displayAvailability.includes(day) ? 'bg-primary text-white' : 'bg-white/5 text-text-muted'
                }`}>
                  {day}
                </div>
              ))}
            </div>
          </div>
        )}

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

      <AnimatePresence>
        {showEditModal && (
          <EditModal
            initial={{
              name: displayName,
              bio: displayBio,
              location: displayLocation,
              skill_level: displaySkill,
              avatar_emoji: displayAvatar,
            }}
            onSave={handleSaveEdit}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
