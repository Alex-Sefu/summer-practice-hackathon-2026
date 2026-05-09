import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Plus, Minus, Sparkles,
  ChevronRight, ChevronLeft, Star, ExternalLink,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { sports } from '../data/mockData'
import { SportCard } from '../components/SportCard'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { useEvents } from '../context/EventsContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { parseSmartDescription, getSuggestedVenues, getGoogleMapsUrl, Venue } from '../lib/matching'

const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro'] as const

const AIBadge: React.FC = () => (
  <motion.span
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-accent text-[10px] font-bold uppercase tracking-wide"
  >
    ✨ AI Detected
  </motion.span>
)

const VenueCard: React.FC<{ venue: Venue; onSelect: (v: Venue) => void; selected: boolean }> = ({
  venue, onSelect, selected,
}) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    className={`w-full rounded-2xl border transition-all overflow-hidden ${
      selected ? 'border-primary bg-primary/10' : 'border-white/10 bg-card-bg'
    }`}
  >
    <button onClick={() => onSelect(venue)} className="w-full text-left p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{venue.emoji}</span>
          <div className="min-w-0">
            <p className="text-white font-sans font-semibold text-sm truncate">{venue.name}</p>
            <p className="text-text-muted text-xs truncate">{venue.address}</p>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={i < Math.floor(venue.rating) ? 'text-warning fill-warning' : 'text-white/20'}
                />
              ))}
              <span className="text-text-muted text-xs ml-1">{venue.rating}</span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-accent font-sans font-bold text-sm">{venue.pricePerHour} RON</p>
          <p className="text-text-muted text-xs">/hour</p>
        </div>
      </div>
    </button>
    <div className="px-4 pb-3">
      <a
        href={getGoogleMapsUrl(venue)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 text-xs font-sans font-semibold text-primary hover:text-accent transition-colors"
      >
        <ExternalLink size={11} />
        Open in Google Maps
      </a>
    </div>
  </motion.div>
)

export const EventCreationScreen: React.FC = () => {
  const navigate = useNavigate()
  const { addEvent } = useEvents()
  const { user, profile } = useAuth()

  const [step, setStep] = useState(1)
  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [skillLevel, setSkillLevel] = useState<(typeof skillLevels)[number] | null>(null)
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set())
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [suggestedVenues, setSuggestedVenues] = useState<Venue[]>([])
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sport = selectedSport ? sports.find((s) => s.id === selectedSport) : null
  const minPlayers = 2
  const maxAllowed = 22

  useEffect(() => {
    if (!selectedSport) { setSuggestedVenues([]); return }
    const city = location.trim() || profile?.location || 'Bucharest'
    setSuggestedVenues(getSuggestedVenues(selectedSport, city))
  }, [selectedSport, profile?.location])

  useEffect(() => {
    if (selectedVenue) setLocation(selectedVenue.name + ', ' + selectedVenue.city)
  }, [selectedVenue])

  const handleDescriptionChange = (text: string) => {
    setDescription(text)
    if (aiTimer.current) clearTimeout(aiTimer.current)
    if (text.length < 8) return
    aiTimer.current = setTimeout(() => {
      const parsed = parseSmartDescription(text)
      const newFilled = new Set<string>()
      if (parsed.detectedSport && !selectedSport) { setSelectedSport(parsed.detectedSport); newFilled.add('sport') }
      if (parsed.detectedSkillLevel && !skillLevel) { setSkillLevel(parsed.detectedSkillLevel as typeof skillLevels[number]); newFilled.add('skill') }
      if (parsed.detectedPlayers) { setMaxPlayers(Math.min(Math.max(parsed.detectedPlayers, minPlayers), maxAllowed)); newFilled.add('players') }
      if (parsed.detectedCity && !location) { setLocation(parsed.detectedCity); newFilled.add('location') }
      if (parsed.detectedTime && !time) { setTime(parsed.detectedTime); newFilled.add('time') }
      if (parsed.detectedSport && !title) {
        const sportObj = sports.find((s) => s.id === parsed.detectedSport)
        if (sportObj) {
          const cityPart = parsed.detectedCity || profile?.location || ''
          setTitle(cityPart ? `${sportObj.label} in ${cityPart}` : `${sportObj.label} Game`)
          newFilled.add('title')
        }
      }
      if (newFilled.size > 0) {
        setAiFilledFields((prev) => new Set([...prev, ...newFilled]))
        setTimeout(() => setAiFilledFields(new Set()), 4000)
      }
    }, 350)
  }

  const handleMaxPlayersChange = (delta: number) => {
    const newValue = maxPlayers + delta
    if (newValue >= minPlayers && newValue <= maxAllowed) {
      setMaxPlayers(newValue)
      setAiFilledFields((prev) => { const n = new Set(prev); n.delete('players'); return n })
    }
  }

  const canGoToStep2 = selectedSport && title && date && time && skillLevel
  const canSubmit = canGoToStep2 && location

  const handleCreate = () => {
    if (!canSubmit || !sport) return
    const createdBy = profile?.name || user?.email || 'You'
    const eventId = Date.now().toString()
    const timeLabel = `${date} at ${time}`

    addEvent({
      id: eventId,
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

    navigate('/')

    if (user) {
      supabase
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
        .then(({ data, error }) => {
          if (!error && data) {
            supabase.from('chat_rooms').insert({ event_id: data.id }).catch(() => {})
          }
        })
        .catch(() => {})
    }
  }

  const steps = ['Details', 'Venue', 'Preview']

  return (
    <div className="min-h-screen bg-dark-bg pb-32 lg:pb-8">
      <div className="max-w-2xl mx-auto p-4">

        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-white mb-4">Create Event 🚀</h1>
          <div className="flex items-center gap-2">
            {steps.map((label, idx) => {
              const s = idx + 1
              const active = step === s
              const done = step > s
              return (
                <React.Fragment key={label}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done ? 'bg-accent text-dark-bg' : active ? 'bg-primary text-white' : 'bg-white/10 text-text-muted'
                    }`}>
                      {done ? '✓' : s}
                    </div>
                    <span className={`text-xs font-sans font-semibold hidden sm:block ${active ? 'text-white' : 'text-text-muted'}`}>
                      {label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full transition-all ${done ? 'bg-accent' : 'bg-white/10'}`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-accent" />
                  <label className="text-white font-sans font-semibold">Magic Description</label>
                  <Badge variant="accent" size="sm">AI</Badge>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder='Describe your event — e.g. "Fotbal 5 la 5 diseară în Cluj, nivel avansat"'
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-card-bg border border-accent/30 text-white placeholder-text-muted focus:outline-none focus:border-accent resize-none transition-colors"
                />
                <p className="text-text-muted text-xs mt-1.5 font-sans">Type naturally — sport, city, time, and player count are detected automatically</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-white font-sans font-semibold">Sport</label>
                  <AnimatePresence>{aiFilledFields.has('sport') && <AIBadge />}</AnimatePresence>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {sports.map((s) => (
                    <SportCard key={s.id} sport={s} selected={selectedSport === s.id} onSelect={() => { setSelectedSport(s.id); setAiFilledFields((prev) => { const n = new Set(prev); n.delete('sport'); return n }) }} size="sm" />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-white font-sans font-semibold">Event Title</label>
                  <AnimatePresence>{aiFilledFields.has('title') && <AIBadge />}</AnimatePresence>
                </div>
                <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setAiFilledFields((prev) => { const n = new Set(prev); n.delete('title'); return n }) }} placeholder={sport ? `${sport.label} at ${location || 'location'}` : 'Event name'} className="w-full px-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-sans font-semibold mb-2 text-sm">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-white font-sans font-semibold text-sm">Time</label>
                    <AnimatePresence>{aiFilledFields.has('time') && <AIBadge />}</AnimatePresence>
                  </div>
                  <input type="time" value={time} onChange={(e) => { setTime(e.target.value); setAiFilledFields((prev) => { const n = new Set(prev); n.delete('time'); return n }) }} className="w-full px-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-white font-sans font-semibold">Max Players</label>
                  <AnimatePresence>{aiFilledFields.has('players') && <AIBadge />}</AnimatePresence>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="md" onClick={() => handleMaxPlayersChange(-1)} className="px-3"><Minus size={20} /></Button>
                  <span className="text-white font-display font-bold text-2xl w-12 text-center">{maxPlayers}</span>
                  <Button variant="outline" size="md" onClick={() => handleMaxPlayersChange(1)} className="px-3"><Plus size={20} /></Button>
                </div>
                <p className="text-text-muted text-xs mt-2">Min: {minPlayers}, Max: {maxAllowed}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-white font-sans font-semibold">Skill Level</label>
                  <AnimatePresence>{aiFilledFields.has('skill') && <AIBadge />}</AnimatePresence>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {skillLevels.map((level) => (
                    <motion.button key={level} onClick={() => { setSkillLevel(level); setAiFilledFields((prev) => { const n = new Set(prev); n.delete('skill'); return n }) }} whileHover={{ scale: 1.03 }} className={`py-2.5 px-3 rounded-xl font-sans font-semibold text-sm transition-all ${skillLevel === level ? 'bg-gradient-to-r from-primary to-secondary text-white' : 'bg-card-bg border border-white/10 text-text-muted hover:text-white'}`}>
                      {level}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white font-sans font-semibold mb-3">Visibility</label>
                <div className="flex gap-2">
                  {[{ label: 'Public', value: true }, { label: 'Friends only', value: false }].map(({ label, value }) => (
                    <motion.button key={label} onClick={() => setIsPublic(value)} className={`flex-1 py-2 px-3 rounded-xl font-sans font-semibold text-sm transition-all ${isPublic === value ? 'bg-primary text-white' : 'bg-card-bg border border-white/10 text-text-muted'}`}>
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <Button onClick={() => setStep(2)} disabled={!canGoToStep2} size="lg" className="w-full">
                Next: Choose Venue <ChevronRight size={18} />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-white font-sans font-semibold">Location</label>
                  <AnimatePresence>{aiFilledFields.has('location') && <AIBadge />}</AnimatePresence>
                </div>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input type="text" value={location} onChange={(e) => { setLocation(e.target.value); setAiFilledFields((prev) => { const n = new Set(prev); n.delete('location'); return n }) }} placeholder="Type an address or pick a venue below" className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary" />
                </div>
              </div>

              {suggestedVenues.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={15} className="text-primary" />
                    <h3 className="text-white font-sans font-semibold">Recommended Venues</h3>
                    <Badge variant="primary" size="sm">{sport?.emoji} {sport?.label}</Badge>
                  </div>
                  <div className="space-y-3">
                    {suggestedVenues.map((venue) => (
                      <VenueCard key={venue.name} venue={venue} selected={selectedVenue?.name === venue.name} onSelect={(v) => setSelectedVenue(selectedVenue?.name === v.name ? null : v)} />
                    ))}
                  </div>
                  {selectedVenue && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-sans">
                      ✓ Venue selected — estimated cost: <strong>{selectedVenue.pricePerHour} RON/hour</strong>
                    </motion.div>
                  )}
                </div>
              )}

              {suggestedVenues.length === 0 && selectedSport && (
                <p className="text-center py-8 text-text-muted text-sm">No venues found for {sport?.label} in your area. Enter a custom location above.</p>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} size="lg" className="flex-1"><ChevronLeft size={18} /> Back</Button>
                <Button onClick={() => setStep(3)} disabled={!location.trim()} size="lg" className="flex-1">Preview <ChevronRight size={18} /></Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-white font-display font-bold text-xl">Review your event</h2>

              <div className={`w-full rounded-3xl overflow-hidden bg-gradient-to-br ${sport?.gradient || 'from-primary to-secondary'} p-6 flex flex-col gap-4 shadow-2xl`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{sport?.emoji || '⚽'}</span>
                    <div>
                      <p className="text-white font-display font-bold text-lg">{sport?.label || 'Sport'}</p>
                      <p className="text-white/80 text-sm">{time || '—'}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{skillLevel || '—'}</Badge>
                </div>
                <div>
                  <h3 className="text-white font-display font-bold text-2xl mb-1">{title || 'Event Title'}</h3>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <MapPin size={14} />
                    {location || '—'}
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/80 text-sm">Spots available</span>
                    <span className="text-white font-bold">0 / {maxPlayers}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2" />
                </div>
                {description && <p className="text-white/70 text-sm italic">"{description}"</p>}
                <div className="flex items-center justify-between text-white/60 text-xs">
                  <span>📅 {date || '—'}</span>
                  <span>{isPublic ? '🌍 Public' : '🔒 Friends only'}</span>
                </div>
              </div>

              {selectedVenue && (
                <div className="bg-card-bg border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedVenue.emoji}</span>
                    <div className="flex-1">
                      <p className="text-white font-sans font-semibold text-sm">{selectedVenue.name}</p>
                      <p className="text-text-muted text-xs">{selectedVenue.address}</p>
                    </div>
                    <p className="text-accent font-bold text-sm">{selectedVenue.pricePerHour} RON/h</p>
                  </div>
                  <a href={getGoogleMapsUrl(selectedVenue)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-sans font-semibold text-primary hover:text-accent transition-colors">
                    <ExternalLink size={11} />
                    Open in Google Maps
                  </a>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} size="lg" className="flex-1"><ChevronLeft size={18} /> Back</Button>
                <Button onClick={handleCreate} disabled={!canSubmit} size="lg" className="flex-1">Create Event 🚀</Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}