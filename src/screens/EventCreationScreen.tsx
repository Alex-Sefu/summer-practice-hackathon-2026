import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Plus, Minus, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { sports } from '../data/mockData'
import { SportCard } from '../components/SportCard'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { useEvents } from '../context/EventsContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro'] as const

export const EventCreationScreen: React.FC = () => {
  const navigate = useNavigate()
  const { addEvent } = useEvents()
  const { user, profile } = useAuth()

  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [skillLevel, setSkillLevel] = useState<(typeof skillLevels)[number] | null>(null)
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [creating, setCreating] = useState(false)

  const sport = selectedSport ? sports.find((s) => s.id === selectedSport) : null
  const minPlayers = sport?.groupSizeMin || 2
  const maxAllowed = sport?.groupSizeMax || 20

  const handleMaxPlayersChange = (delta: number) => {
    const newValue = maxPlayers + delta
    if (newValue >= minPlayers && newValue <= maxAllowed) {
      setMaxPlayers(newValue)
    }
  }

  const canSubmit = selectedSport && title && date && time && location && skillLevel

  const handleCreate = async () => {
    if (!canSubmit || !sport) return
    setCreating(true)

    const createdBy = profile?.name || user?.email || 'You'
    const timeLabel = `${date} at ${time}`

    // Try Supabase insert first
    let savedToDb = false
    if (user) {
      try {
        const { data, error } = await supabase
          .from('events')
          .insert({
            created_by: user.id,
            sport: sport.label,
            emoji: sport.emoji,
            gradient: sport.gradient,
            title,
            description,
            location,
            event_date: date,
            event_time: time,
            max_players: maxPlayers,
            skill_level: skillLevel,
            is_public: isPublic,
          })
          .select()
          .single()

        if (!error && data) {
          // Auto-create chat room for this event
          await supabase.from('chat_rooms').insert({ event_id: data.id })
          savedToDb = true
        }
      } catch {
        // Fall through to in-memory
      }
    }

    // Always add to in-memory context (works offline / without DB)
    addEvent({
      id: Date.now().toString(),
      sport: selectedSport!,
      emoji: sport.emoji,
      gradient: sport.gradient,
      title,
      time: timeLabel,
      location,
      maxPlayers,
      skillLevel: skillLevel!,
      description,
      isPublic,
      createdBy,
    })

    setCreating(false)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
      navigate('/')
    }, 2500)
  }

  const PreviewCard = () => (
    <div
      className={`w-full rounded-3xl overflow-hidden bg-gradient-to-br ${sport?.gradient || 'from-primary to-secondary'} p-6 flex flex-col justify-between min-h-96 shadow-2xl`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{sport?.emoji || '⚽'}</span>
          <div className="text-left">
            <p className="text-white font-display font-bold text-lg">{sport?.label || 'Sport'}</p>
            <p className="text-white/80 text-sm">{time || 'Select time'}</p>
          </div>
        </div>
        <Badge variant="outline">📍 {location || 'Location'}</Badge>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-white font-display font-bold text-2xl mb-2">{title || 'Event Title'}</h3>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <MapPin size={16} />
            {location || 'Add location'}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-sm font-sans">Spots available</span>
            <span className="text-white font-sans font-bold">0 / {maxPlayers}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-white w-0" />
          </div>
        </div>
      </div>

      <div className="space-y-2 text-white/60 text-sm font-sans">
        <p>Level: {skillLevel || 'Select level'}</p>
        {description && <p className="text-white/80">"{description}"</p>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-bg pb-32 lg:pb-8">
      <div className="max-w-md lg:max-w-none mx-auto p-4">
        <h1 className="text-3xl font-display font-bold text-white mb-6">Create Event 🚀</h1>

        {/* Preview toggle for mobile */}
        <div className="lg:hidden mb-4">
          <Button
            variant={showPreview ? 'secondary' : 'primary'}
            onClick={() => setShowPreview(!showPreview)}
            size="md"
            className="w-full"
          >
            {showPreview ? 'Show Form' : 'Show Preview'}
          </Button>
        </div>

        <div className="lg:flex lg:gap-8">
          {/* Form side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`space-y-6 lg:flex-1 ${showPreview ? 'hidden' : 'block'} lg:block`}
          >
            {/* Sport selector */}
            <div>
              <label className="block text-white font-sans font-semibold mb-3">Sport</label>
              <div className="grid grid-cols-2 gap-3">
                {sports.map((s) => (
                  <SportCard
                    key={s.id}
                    sport={s}
                    selected={selectedSport === s.id}
                    onSelect={() => setSelectedSport(s.id)}
                    size="sm"
                  />
                ))}
              </div>
            </div>

            {/* Title input */}
            <div>
              <label className="block text-white font-sans font-semibold mb-2">Event Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  selectedSport
                    ? `${sports.find((s) => s.id === selectedSport)?.label} at ${location || 'location'}`
                    : 'Event name'
                }
                className="w-full px-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white font-sans font-semibold mb-2 text-sm">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-white font-sans font-semibold mb-2 text-sm">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-white font-sans font-semibold mb-2">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where will you play?"
                className="w-full px-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary"
              />
            </div>

            {/* Max players stepper */}
            <div>
              <label className="block text-white font-sans font-semibold mb-3">Max Players</label>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="md" onClick={() => handleMaxPlayersChange(-1)} className="px-3">
                  <Minus size={20} />
                </Button>
                <span className="text-white font-display font-bold text-2xl w-12 text-center">{maxPlayers}</span>
                <Button variant="outline" size="md" onClick={() => handleMaxPlayersChange(1)} className="px-3">
                  <Plus size={20} />
                </Button>
              </div>
              <p className="text-text-muted text-xs mt-2">
                Min: {minPlayers}, Max: {maxAllowed}
              </p>
            </div>

            {/* Skill level */}
            <div>
              <label className="block text-white font-sans font-semibold mb-3">Skill Level</label>
              <div className="grid grid-cols-2 gap-2">
                {skillLevels.map((level) => (
                  <motion.button
                    key={level}
                    onClick={() => setSkillLevel(level)}
                    whileHover={{ scale: 1.05 }}
                    className={`py-2 px-3 rounded-lg font-sans font-semibold text-sm transition-all ${
                      skillLevel === level
                        ? 'bg-gradient-to-r from-primary to-secondary text-white'
                        : 'bg-card-bg border border-white/10 text-text-muted'
                    }`}
                  >
                    {level}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-sans font-semibold mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people about your event..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Visibility toggle */}
            <div>
              <label className="block text-white font-sans font-semibold mb-3">Visibility</label>
              <div className="flex gap-2">
                {[
                  { label: 'Public', value: true },
                  { label: 'Friends only', value: false },
                ].map(({ label, value }) => (
                  <motion.button
                    key={label}
                    onClick={() => setIsPublic(value)}
                    className={`flex-1 py-2 px-3 rounded-lg font-sans font-semibold text-sm transition-all ${
                      isPublic === value
                        ? 'bg-primary text-white'
                        : 'bg-card-bg border border-white/10 text-text-muted'
                    }`}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>

            <Button onClick={handleCreate} disabled={!canSubmit || creating} size="lg" className="w-full">
              {creating ? 'Creating... ⏳' : 'Create Event 🚀'}
            </Button>
          </motion.div>

          {/* Preview side — always visible on desktop, toggle on mobile */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`lg:w-80 lg:sticky lg:top-6 lg:self-start ${showPreview ? 'block' : 'hidden'} lg:block`}
          >
            <label className="text-white font-sans font-semibold mb-4 block">Preview</label>
            <PreviewCard />
          </motion.div>
        </div>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl bg-green-500 text-white font-sans font-semibold shadow-2xl"
          >
            <CheckCircle size={22} />
            Event created! 🎉
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
