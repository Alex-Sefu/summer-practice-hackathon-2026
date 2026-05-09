import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { upcomingEvents, matchCards } from '../data/mockData'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { Avatar } from '../components/Avatar'
import { useEvents } from '../context/EventsContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

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
  const { events: createdEvents } = useEvents()
  const { user, profile } = useAuth()
  const [dbEvents, setDbEvents] = useState<DbEvent[]>([])

  const displayName = profile?.name || 'Player'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  // Fetch joined events from Supabase
  useEffect(() => {
    if (!user) return
    const fetchMyEvents = async () => {
      try {
        const { data } = await supabase
          .from('event_participants')
          .select(`
            event_id,
            events (
              id, sport, emoji, gradient, title, location,
              event_date, event_time, status
            )
          `)
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false })
          .limit(5)

        if (data) {
          const events = data
            .map((d: any) => d.events)
            .filter(Boolean) as DbEvent[]
          setDbEvents(events)
        }
      } catch {
        // Silently fall back to mock data
      }
    }
    fetchMyEvents()
  }, [user])

  // Merge: DB events → in-memory created events → mock upcoming events
  const allUpcoming = [
    ...dbEvents.map((evt) => ({
      id: evt.id,
      sport: evt.sport,
      emoji: evt.emoji || '⚽',
      gradient: evt.gradient || 'from-primary to-secondary',
      title: evt.title,
      time: `${evt.event_date} at ${evt.event_time}`,
      location: evt.location,
      participants: [{ initials: 'Y', color: 'from-primary to-secondary' }],
      confirmed: true,
      isCreatedByUser: false,
      isFromDb: true,
    })),
    ...createdEvents.map((evt) => ({
      id: evt.id,
      sport: evt.sport,
      emoji: evt.emoji,
      gradient: evt.gradient,
      title: evt.title,
      time: evt.time,
      location: evt.location,
      participants: [{ initials: 'Y', color: 'from-primary to-secondary' }],
      confirmed: true,
      isCreatedByUser: true,
      isFromDb: false,
    })),
    // Only show mock events if no DB events loaded
    ...(dbEvents.length === 0
      ? upcomingEvents.map((evt) => ({ ...evt, isCreatedByUser: false, isFromDb: false }))
      : []),
  ]

  const gamesPlayed = profile?.games_played ?? 12
  const streak = profile?.streak ?? 4
  const sportsCount = profile?.sports?.length ?? 3

  return (
    <div className="min-h-screen bg-dark-bg pb-32 lg:pb-8">
      <div className="max-w-md lg:max-w-none mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start pt-4">
          <div>
            <h1 className="text-3xl lg:text-display-lg font-display font-bold text-white">
              Hey, {displayName} 👋
            </h1>
            <p className="text-text-muted text-sm mt-1">{today}</p>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} className="relative p-2">
            <Bell size={24} className="text-white" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
          </motion.button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'games', value: gamesPlayed, emoji: '🏅' },
            { label: 'sports', value: sportsCount, emoji: '⚽' },
            { label: 'day streak', value: streak, emoji: '🔥' },
          ].map(({ label, value, emoji }, idx) => (
            <motion.div
              key={label}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card-bg border border-white/10 rounded-2xl p-3 text-center"
            >
              <p className="text-2xl mb-1">{emoji}</p>
              <motion.div className="text-2xl font-display font-bold text-primary">{value}</motion.div>
              <p className="text-text-muted text-xs mt-1">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Upcoming events */}
        <div>
          <h3 className="text-lg font-display font-bold text-white mb-4">Your upcoming games</h3>

          {/* Mobile: horizontal scroll / Desktop: 2-col grid */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0">
            {allUpcoming.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ scale: 1.03 }}
                className="flex-shrink-0 w-48 lg:w-auto rounded-2xl overflow-hidden bg-card-bg border border-white/10"
              >
                {/* Gradient top */}
                <div className={`h-20 bg-gradient-to-br ${event.gradient} relative`}>
                  {event.isCreatedByUser && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/80 text-white text-xs font-sans font-semibold">
                      You created this
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{event.emoji}</span>
                    <p className="font-sans font-semibold text-white text-sm">{event.title}</p>
                  </div>

                  <div className="text-xs text-text-muted space-y-1">
                    <p>{event.time}</p>
                    <p>{event.location}</p>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center gap-1 pt-2">
                    {event.participants.slice(0, 3).map((p, idx) => (
                      <div
                        key={idx}
                        className={`w-6 h-6 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center text-white text-xs font-semibold`}
                      >
                        {p.initials}
                      </div>
                    ))}
                  </div>

                  {/* Status badge */}
                  <Badge variant={event.confirmed ? 'success' : 'warning'} size="sm">
                    {event.confirmed ? '✓ Confirmed' : 'Pending'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Nearby section */}
        <div>
          <h3 className="text-lg font-display font-bold text-white mb-4">Happening near you</h3>
          <div className="space-y-3">
            {matchCards.slice(0, 3).map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-gradient-to-r ${card.gradient} rounded-2xl p-4 flex items-center justify-between`}
              >
                <div className="flex-1">
                  <p className="text-white font-sans font-semibold">{card.location}</p>
                  <p className="text-white/80 text-sm">{card.time}</p>
                  <div className="flex gap-1 mt-2">
                    {card.players.slice(0, 2).map((player) => (
                      <Avatar key={player.id} initials={player.avatarInitials} color={player.avatarColor} size="sm" />
                    ))}
                  </div>
                </div>
                <Button variant="secondary" size="sm">
                  Join
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
