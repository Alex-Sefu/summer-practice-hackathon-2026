import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Trophy, Dumbbell, MessageCircle, Check, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { matchCards } from '../data/mockData'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { Avatar } from '../components/Avatar'
import { useEvents } from '../context/EventsContext'
import { useAuth } from '../context/AuthContext'
import { useShowUp } from '../context/ShowUpContext'
import { supabase } from '../lib/supabase'
import { getNearbyVenues, getGoogleMapsUrl } from '../lib/matching'

interface DbEvent {
  id: string
  sport: string
  emoji: string
  gradient: string
  title: string
  location: string
  event_date: string
  event_time: string
  status: string
}

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate()
  const { events: createdEvents, joinedEvents, joinEvent, hasJoined } = useEvents()
  const { user, profile } = useAuth()
  const { isAvailableToday } = useShowUp()
  const [dbEvents, setDbEvents] = useState<DbEvent[]>([])
  // Track which nearby cards just got joined (for success state)
  const [justJoined, setJustJoined] = useState<string | null>(null)

  const [gamesPlayed, setGamesPlayed] = useState(profile?.games_played ?? 0)
  const [streak,      setStreak]      = useState(profile?.streak      ?? 0)

  const displayName = profile?.name || 'Player'
  const sportsCount = profile?.sports?.length ?? 0
  const today       = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  useEffect(() => {
    setGamesPlayed(profile?.games_played ?? 0)
    setStreak(profile?.streak ?? 0)
  }, [profile?.games_played, profile?.streak])

  useEffect(() => {
    if (isAvailableToday === true) {
      setStreak((prev) => Math.max(prev, (profile?.streak ?? 0) + 1))
    }
  }, [isAvailableToday, profile?.streak])

  useEffect(() => {
    if (!user) return
    const fetchMyEvents = async () => {
      try {
        const { data } = await supabase
          .from('event_participants')
          .select(`event_id, events (id, sport, emoji, gradient, title, location, event_date, event_time, status)`)
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false })
          .limit(5)

        if (data) {
          const events = data.map((d: any) => d.events).filter(Boolean) as DbEvent[]
          setDbEvents(events)
          if (events.length > 0) setGamesPlayed((prev) => Math.max(prev, events.length))
        }
      } catch { /* fall back */ }
    }
    fetchMyEvents()
  }, [user])

  // Handle joining a nearby card
  const handleNearbyJoin = (cardId: string) => {
    const card = matchCards.find((c) => c.id === cardId)
    if (!card || hasJoined(cardId)) {
      // Already joined — go straight to chat
      navigate(`/chat/${cardId}`)
      return
    }

    const captain = card.players[Math.floor(Math.random() * card.players.length)]?.name ?? card.captain

    joinEvent({
      id: card.id,
      sport: card.sport,
      emoji: card.emoji,
      gradient: card.gradient,
      title: `${card.emoji} ${card.location}`,
      time: card.time,
      location: card.location,
      captain,
      joinedAt: Date.now(),
    })

    setJustJoined(cardId)
    setTimeout(() => setJustJoined(null), 2000)
  }

  // Stat cards
  const statCards = [
    { label: 'Games played', value: gamesPlayed + joinedEvents.length, emoji: '🏅', icon: Trophy,  color: 'text-warning',     highlight: gamesPlayed > 0 || joinedEvents.length > 0 },
    { label: 'Sports',       value: sportsCount,                        emoji: '⚽', icon: Dumbbell, color: 'text-primary',     highlight: false },
    { label: 'Day streak',   value: streak,                             emoji: isAvailableToday === true ? '🔥' : '⚡', icon: Flame, color: streak > 0 ? 'text-orange-400' : 'text-text-muted', highlight: isAvailableToday === true },
  ]

  // Upcoming: DB events + created events (mock fallback only if both empty)
  const upcomingCards = [
    ...dbEvents.map((evt) => ({
      id: evt.id,
      emoji: evt.emoji || '⚽',
      gradient: evt.gradient || 'from-primary to-secondary',
      title: evt.title,
      time: `${evt.event_date} at ${evt.event_time}`,
      location: evt.location,
      confirmed: true,
      isCreatedByUser: false,
    })),
    ...createdEvents.map((evt) => ({
      id: evt.id,
      emoji: evt.emoji,
      gradient: evt.gradient,
      title: evt.title,
      time: evt.time,
      location: evt.location,
      confirmed: true,
      isCreatedByUser: true,
    })),
  ]

  return (
    <div className="min-h-screen bg-dark-bg pb-32 lg:pb-8">
      <div className="max-w-md lg:max-w-none mx-auto p-4 space-y-6">

        {/* Header — no bell */}
        <div className="pt-4">
          <h1 className="text-3xl lg:text-display-lg font-display font-bold text-white">
            Hey, {displayName} 👋
          </h1>
          <p className="text-text-muted text-sm mt-1">{today}</p>
        </div>

        {/* ShowUpToday banner */}
        <AnimatePresence>
          {isAvailableToday === true && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-green-500/20 to-accent/10 border border-green-500/30"
            >
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-green-400 font-sans font-semibold text-sm">You're available today!</p>
                <p className="text-text-muted text-xs">Today's matches are prioritized for you</p>
              </div>
              {streak > 0 && (
                <div className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
                  <span className="text-sm">🔥</span>
                  <span className="text-orange-400 text-xs font-bold">{streak}d</span>
                </div>
              )}
            </motion.div>
          )}
          {isAvailableToday === false && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10"
            >
              <span className="text-2xl">😴</span>
              <p className="text-text-muted font-sans text-sm">Rest day — see you next time!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {statCards.map(({ label, value, emoji, color, highlight }, idx) => (
            <motion.div
              key={label}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.08 }}
              className={`bg-card-bg border rounded-2xl p-3 text-center transition-all ${
                highlight ? 'border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.15)]' : 'border-white/10'
              }`}
            >
              <p className="text-2xl mb-1">{emoji}</p>
              <motion.div key={value} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className={`text-2xl font-display font-bold ${color}`}>
                {value}
              </motion.div>
              <p className="text-text-muted text-xs mt-1">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── My Joined Events ─────────────────────────────────────────── */}
        {joinedEvents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-white">My Upcoming Events</h3>
              <Badge variant="accent" size="sm">{joinedEvents.length} joined</Badge>
            </div>
            <div className="space-y-3">
              {joinedEvents.map((evt) => (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`bg-gradient-to-r ${evt.gradient} rounded-2xl p-4 flex items-center justify-between`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{evt.emoji}</span>
                      <p className="text-white font-sans font-semibold truncate">{evt.title}</p>
                    </div>
                    <p className="text-white/80 text-xs">{evt.time}</p>
                    <p className="text-white/70 text-xs mt-0.5">👑 Captain: {evt.captain}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/chat/${evt.id}`)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-sans font-semibold transition-colors flex-shrink-0 ml-3"
                  >
                    <MessageCircle size={14} />
                    Chat
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Created events (if any) ───────────────────────────────────── */}
        {upcomingCards.length > 0 && (
          <div>
            <h3 className="text-lg font-display font-bold text-white mb-4">Your upcoming games</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0">
              {upcomingCards.map((event) => (
                <motion.div
                  key={event.id}
                  whileHover={{ scale: 1.03 }}
                  className="flex-shrink-0 w-48 lg:w-auto rounded-2xl overflow-hidden bg-card-bg border border-white/10"
                >
                  <div className={`h-20 bg-gradient-to-br ${event.gradient} relative`}>
                    {event.isCreatedByUser && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/80 text-white text-xs font-sans font-semibold">
                        You created
                      </span>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{event.emoji}</span>
                      <p className="font-sans font-semibold text-white text-sm truncate">{event.title}</p>
                    </div>
                    <div className="text-xs text-text-muted space-y-0.5">
                      <p>{event.time}</p>
                      <p>{event.location}</p>
                    </div>
                    <Badge variant={event.confirmed ? 'success' : 'warning'} size="sm">
                      {event.confirmed ? '✓ Confirmed' : 'Pending'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Happening Near You ────────────────────────────────────────── */}
        <div>
          <h3 className="text-lg font-display font-bold text-white mb-4">Happening near you</h3>
          <div className="space-y-4">
            {matchCards.slice(0, 3).map((card, idx) => {
              const joined  = hasJoined(card.id)
              const success = justJoined === card.id
              const venues  = getNearbyVenues(card.sport, profile?.location || 'Bucharest')

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="rounded-2xl overflow-hidden bg-card-bg border border-white/10"
                >
                  {/* Event row */}
                  <div className={`bg-gradient-to-r ${card.gradient} p-4 flex items-center justify-between`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-sans font-semibold">{card.location}</p>
                      <p className="text-white/80 text-sm">{card.time}</p>
                      <div className="flex gap-1 mt-2 items-center">
                        {card.players.slice(0, 2).map((player) => (
                          <Avatar key={player.id} initials={player.avatarInitials} color={player.avatarColor} size="sm" />
                        ))}
                        <span className="text-white/70 text-xs ml-1">{card.spotsLeft} spots left</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-end flex-shrink-0 ml-3">
                      <AnimatePresence mode="wait">
                        {success ? (
                          <motion.div
                            key="success"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/30 text-white text-xs font-bold"
                          >
                            <Check size={13} /> Joined!
                          </motion.div>
                        ) : joined ? (
                          <motion.button
                            key="chat"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={() => navigate(`/chat/${card.id}`)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-sans font-semibold transition-colors"
                          >
                            <MessageCircle size={13} /> Chat
                          </motion.button>
                        ) : (
                          <motion.div key="join" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                            <Button variant="secondary" size="sm" onClick={() => handleNearbyJoin(card.id)}>
                              Join
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Venue suggestions */}
                  {venues.length > 0 && (
                    <div className="p-3 space-y-2">
                      <p className="text-text-muted text-xs font-sans font-semibold uppercase tracking-wider">
                        📍 Nearby venues
                      </p>
                      {venues.slice(0, 2).map((venue) => (
                        <div key={venue.name} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base flex-shrink-0">{venue.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-white text-xs font-sans font-semibold truncate">{venue.name}</p>
                              <p className="text-text-muted text-xs">{venue.pricePerHour} RON/h</p>
                            </div>
                          </div>
                          <a
                            href={getGoogleMapsUrl(venue)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-sans font-semibold text-primary hover:text-accent transition-colors flex-shrink-0"
                          >
                            <ExternalLink size={11} />
                            Maps
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
