import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { matchCards, sports } from '../data/mockData'
import { MatchCard as MatchCardComponent } from '../components/MatchCard'
import { Button } from '../components/Button'
import { X, Star, Check, Zap, Users, MapPin } from 'lucide-react'
import { useShowUp } from '../context/ShowUpContext'
import { useAuth } from '../context/AuthContext'
import { useEvents } from '../context/EventsContext'
import { supabase } from '../lib/supabase'
import { MatchCard } from '../types'
import { Profile } from '../context/AuthContext'
import {
  rankMatches,
  SmartMatch,
  FALLBACK_PROFILES,
  getSuggestedVenues,
  Venue,
} from '../lib/matching'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isToday = (t: string) => t.toLowerCase().includes('today')

const scoreBadgeClass = (score: number) => {
  if (score >= 80) return 'bg-gradient-to-r from-primary to-accent text-white'
  if (score >= 60) return 'bg-gradient-to-r from-amber-500 to-orange-400 text-white'
  return 'bg-white/10 text-text-muted'
}

/** Pick a random captain name from the card's player list */
const pickCaptain = (card: MatchCard): string => {
  const pool = card.players.map((p) => p.name)
  return pool[Math.floor(Math.random() * pool.length)] ?? card.captain
}

// ─── Smart Match Card ─────────────────────────────────────────────────────────

const SmartMatchCard: React.FC<{
  match: SmartMatch
  onConnect: (m: SmartMatch) => void
}> = ({ match, onConnect }) => {
  const { profile, score, sharedSports, reason } = match
  const initials  = (profile.name ?? 'P').charAt(0).toUpperCase()
  const isTopMatch = score >= 80

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-card-bg border border-white/10 rounded-2xl p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display font-bold text-lg">
            {profile.avatar_emoji && profile.avatar_emoji !== '👤' ? profile.avatar_emoji : initials}
          </div>
          {isTopMatch && <span className="absolute -top-1 -right-1 text-xs">⭐</span>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-sans font-semibold">{profile.name}</p>
            {isTopMatch && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-primary to-accent text-white uppercase">
                Smart Match
              </span>
            )}
          </div>
          <p className="text-text-muted text-xs flex items-center gap-1">
            <MapPin size={10} />
            {profile.location ?? 'Unknown'} · {profile.skill_level ?? 'Unknown'}
          </p>
        </div>

        <div className={`px-3 py-1.5 rounded-xl text-sm font-bold flex-shrink-0 ${scoreBadgeClass(score)}`}>
          {score}%
        </div>
      </div>

      {/* Shared sports */}
      {sharedSports.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {sharedSports.map((s) => {
            const sport = sports.find((sp) => sp.id === s)
            return sport ? (
              <span
                key={s}
                className={`px-2.5 py-1 rounded-full text-xs font-sans font-semibold bg-gradient-to-r ${sport.gradient} text-white`}
              >
                {sport.emoji} {sport.label}
              </span>
            ) : null
          })}
        </div>
      )}

      {/* AI reason */}
      <p className="text-text-muted text-xs font-sans italic leading-relaxed border-l-2 border-primary/40 pl-2">
        "{reason}"
      </p>

      {/* Compatibility bar */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Compatibility</span>
          <span className="text-white text-xs font-semibold">{score}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              score >= 80 ? 'bg-gradient-to-r from-primary to-accent' :
              score >= 60 ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
              'bg-white/30'
            }`}
          />
        </div>
      </div>

      <Button
        onClick={() => onConnect(match)}
        variant={isTopMatch ? 'primary' : 'outline'}
        size="sm"
        className="w-full"
      >
        {isTopMatch ? '⚡ Connect' : 'Connect'}
      </Button>
    </motion.div>
  )
}

// ─── Connect modal ────────────────────────────────────────────────────────────

const ConnectModal: React.FC<{ match: SmartMatch; onClose: () => void }> = ({ match, onClose }) => {
  const navigate = useNavigate()
  const { profile, score, reason, sharedSports } = match

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="bg-card-bg border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl">🤝</div>
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-1">Great match!</h2>
          <p className="text-text-muted text-sm">
            You and <span className="text-white font-semibold">{profile.name}</span> are{' '}
            <span className={`font-bold ${score >= 80 ? 'text-accent' : 'text-warning'}`}>{score}% compatible</span>
          </p>
        </div>

        {sharedSports.length > 0 && (
          <div className="flex gap-2 justify-center flex-wrap">
            {sharedSports.map((s) => {
              const sport = sports.find((sp) => sp.id === s)
              return sport ? (
                <span key={s} className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${sport.gradient} text-white`}>
                  {sport.emoji} {sport.label}
                </span>
              ) : null
            })}
          </div>
        )}

        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-white/80 text-sm italic">"{reason}"</p>
        </div>

        <div className="space-y-3">
          <Button onClick={() => { onClose(); navigate('/chat') }} size="lg" className="w-full">
            Send a message 💬
          </Button>
          <Button onClick={onClose} variant="outline" size="lg" className="w-full">
            Maybe later
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export const MatchScreen: React.FC = () => {
  const navigate = useNavigate()
  const { isAvailableToday } = useShowUp()
  const { user, profile } = useAuth()
  const { joinEvent, hasJoined } = useEvents()

  const [activeTab, setActiveTab] = useState<'events' | 'people'>('events')

  // ── Events tab ────────────────────────────────────────────────────────────
  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [showMatchModal, setShowMatchModal] = useState<{
    card: MatchCard; captain: string
  } | null>(null)
  const [eventVenues, setEventVenues] = useState<Venue[]>([])

  // ── People tab ────────────────────────────────────────────────────────────
  const [dbProfiles, setDbProfiles] = useState<Profile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [connectTarget, setConnectTarget] = useState<SmartMatch | null>(null)

  // Fetch profiles from Supabase; fall back to FALLBACK_PROFILES if empty
  useEffect(() => {
    if (activeTab !== 'people') return
    if (dbProfiles.length > 0) return

    const fetchProfiles = async () => {
      setProfilesLoading(true)
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('has_completed_onboarding', true)
          .neq('id', user?.id ?? '')
          .limit(50)

        if (data && data.length > 0) {
          setDbProfiles(data as Profile[])
        } else {
          // DB empty or unreachable — use fallback so demo always works
          setDbProfiles(FALLBACK_PROFILES)
        }
      } catch {
        setDbProfiles(FALLBACK_PROFILES)
      } finally {
        setProfilesLoading(false)
      }
    }
    fetchProfiles()
  }, [activeTab, user?.id])

  // Ranked smart matches
  const smartMatches = useMemo<SmartMatch[]>(() => {
    if (!profile || dbProfiles.length === 0) {
      // Even without a real profile, show fallback with a generic scorer
      const genericProfile: Profile = {
        id: 'guest',
        name: 'You',
        sports: ['football', 'running'],
        skill_level: 'Intermediate',
        availability: ['Sat', 'Sun'],
        time_preference: 'evening',
        location: 'Bucharest',
      }
      return rankMatches(genericProfile, FALLBACK_PROFILES)
    }
    return rankMatches(profile, dbProfiles)
  }, [profile, dbProfiles])

  const topMatches   = smartMatches.filter((m) => m.score >= 80)
  const otherMatches = smartMatches.filter((m) => m.score < 80)

  // ── Events tab logic ──────────────────────────────────────────────────────
  const filteredCards = useMemo(() => {
    let cards = selectedSport
      ? matchCards.filter((c) => c.sport === selectedSport)
      : [...matchCards]

    if (isAvailableToday === false) {
      cards = cards.filter((c) => !isToday(c.time))
    } else if (isAvailableToday === true) {
      const todayCards  = cards.filter((c) => isToday(c.time))
      const futureCards = cards.filter((c) => !isToday(c.time))
      cards = [...todayCards, ...futureCards]
    }
    return cards
  }, [selectedSport, isAvailableToday])

  const advanceCard = () => {
    setCurrentIndex((prev) => prev + 1)
    setShowMatchModal(null)
    setDragX(0)
    setEventVenues([])
  }

  const handleSkip = () => {
    setCurrentIndex((prev) => prev + 1)
    setDragX(0)
  }

  const handleJoin = (card?: MatchCard) => {
    const target = card ?? filteredCards[currentIndex]
    if (!target) return

    // Captain assignment
    const captain = pickCaptain(target)

    // Venue suggestions for this sport
    setEventVenues(getSuggestedVenues(target.sport, 'Bucharest'))

    // Persist join to local context (sessionStorage-backed)
    joinEvent({
      id: target.id,
      sport: target.sport,
      emoji: target.emoji,
      gradient: target.gradient,
      title: `${target.emoji} ${target.location}`,
      time: target.time,
      location: target.location,
      captain,
      joinedAt: Date.now(),
    })

    // Supabase join (fire-and-forget)
    if (user) {
      supabase
        .from('event_participants')
        .insert({ event_id: target.id, user_id: user.id })
        .then(({ error }) => {
          if (!error) supabase.rpc('increment_players', { event_id: target.id }).catch(() => {})
        })
        .catch(() => {})
    }

    setShowMatchModal({ card: target, captain })
  }

  const handleSuperJoin = () => advanceCard()

  const handleDragEnd = (_e: any, info: any) => {
    const offset = info.offset.x
    if (offset > 120)       handleJoin()
    else if (offset < -120) handleSkip()
    else                    setDragX(0)
  }

  const currentCard = filteredCards[currentIndex]
  const nextCards   = filteredCards.slice(currentIndex + 1, currentIndex + 3)
  const isEmpty     = currentIndex >= filteredCards.length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-bg pb-32 lg:pb-6">
      <div className="max-w-md lg:max-w-[480px] mx-auto p-4">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-white mb-4">Find your game</h1>

          {/* Tab switcher */}
          <div className="flex bg-card-bg rounded-2xl p-1 mb-4 border border-white/10">
            {([
              { id: 'events', icon: Zap,   label: 'Events' },
              { id: 'people', icon: Users, label: 'People' },
            ] as const).map(({ id, icon: Icon, label }) => (
              <motion.button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans font-semibold text-sm transition-colors ${
                  activeTab === id ? 'bg-primary text-white' : 'text-text-muted hover:text-white'
                }`}
              >
                <Icon size={15} />
                {label}
                {id === 'people' && topMatches.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent text-dark-bg text-xs font-bold">
                    {topMatches.length}
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Availability banners */}
          {isAvailableToday === false && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-sans">
              Showing upcoming matches only — you're off today 😴
            </motion.div>
          )}
          {isAvailableToday === true && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-3 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-sans">
              Today's matches are prioritized for you 🔥
            </motion.div>
          )}
        </div>

        {/* ── EVENTS TAB ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === 'events' && (
            <motion.div key="events" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
              {/* Sport filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6">
                <motion.button
                  onClick={() => { setSelectedSport(null); setCurrentIndex(0) }}
                  whileHover={{ scale: 1.05 }}
                  className={`px-4 py-2 rounded-full font-sans font-semibold whitespace-nowrap transition-all ${
                    selectedSport === null ? 'bg-primary text-white' : 'bg-card-bg border border-white/10 text-text-muted hover:text-white'
                  }`}
                >
                  All
                </motion.button>
                {sports.map((sport) => (
                  <motion.button
                    key={sport.id}
                    onClick={() => { setSelectedSport(sport.id); setCurrentIndex(0) }}
                    whileHover={{ scale: 1.05 }}
                    className={`px-4 py-2 rounded-full font-sans font-semibold whitespace-nowrap transition-all ${
                      selectedSport === sport.id
                        ? `bg-gradient-to-r ${sport.gradient} text-white`
                        : 'bg-card-bg border border-white/10 text-text-muted hover:text-white'
                    }`}
                  >
                    {sport.emoji} {sport.label}
                  </motion.button>
                ))}
              </div>

              {isEmpty ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
                  <p className="text-5xl mb-4">🎯</p>
                  <h2 className="text-2xl font-display font-bold text-white mb-2">No more matches right now</h2>
                  <p className="text-text-muted mb-8">Come back later!</p>
                  <Button onClick={() => setCurrentIndex(0)} size="lg" className="w-full">Start over</Button>
                </motion.div>
              ) : (
                <>
                  <div className="relative h-96 mb-8">
                    <AnimatePresence mode="popLayout">
                      {nextCards.map((card, idx) => (
                        <motion.div
                          key={card.id}
                          initial={{ scale: 0.9 - idx * 0.05, y: idx * 20, opacity: 0.7 }}
                          animate={{ scale: 0.95 - idx * 0.05, y: (idx + 1) * 16, opacity: 0.7 - idx * 0.15 }}
                          exit={{ y: 500, opacity: 0 }}
                          className="absolute inset-0"
                        >
                          <MatchCardComponent card={card} />
                        </motion.div>
                      ))}
                      {currentCard && (
                        <motion.div
                          key={currentCard.id}
                          drag="x"
                          dragConstraints={{ left: -300, right: 300 }}
                          dragElastic={0.2}
                          onDrag={(_e, info) => setDragX(info.offset.x)}
                          onDragEnd={handleDragEnd}
                          initial={{ scale: 1, opacity: 1 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ x: dragX > 0 ? 500 : -500, opacity: 0, transition: { duration: 0.3 } }}
                          className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
                        >
                          <MatchCardComponent card={currentCard} isDragging dragX={dragX} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <p className="text-center text-text-muted text-xs mb-4 font-sans">
                    ← swipe to skip &nbsp;·&nbsp; swipe to join →
                  </p>

                  <div className="flex gap-4">
                    <Button variant="danger" size="lg" onClick={handleSkip} className="flex-1">
                      <X size={20} /> Skip
                    </Button>
                   
                    <Button
                      variant={currentCard && hasJoined(currentCard.id) ? 'secondary' : 'success'}
                      size="lg"
                      onClick={() => handleJoin()}
                      className="flex-1"
                    >
                      <Check size={20} />
                      {currentCard && hasJoined(currentCard.id) ? 'Joined ✓' : 'Join'}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── PEOPLE TAB ───────────────────────────────────────────────── */}
          {activeTab === 'people' && (
            <motion.div key="people" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
              {profilesLoading ? (
                <div className="flex flex-col items-center py-16 gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                  />
                  <p className="text-text-muted text-sm font-sans">Finding your best matches…</p>
                </div>
              ) : (
                <>
                  {topMatches.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">⚡</span>
                        <h3 className="text-white font-display font-bold">Smart Recommendations</h3>
                        <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold">
                          {topMatches.length} match{topMatches.length !== 1 ? 'es' : ''}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {topMatches.map((m) => (
                          <SmartMatchCard key={m.profile.id} match={m} onConnect={setConnectTarget} />
                        ))}
                      </div>
                    </div>
                  )}

                  {otherMatches.length > 0 && (
                    <div>
                      <h3 className="text-white font-display font-bold mb-3">Other players nearby</h3>
                      <div className="space-y-3">
                        {otherMatches.map((m) => (
                          <SmartMatchCard key={m.profile.id} match={m} onConnect={setConnectTarget} />
                        ))}
                      </div>
                    </div>
                  )}

                  {smartMatches.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-5xl mb-4">🔍</p>
                      <h2 className="text-xl font-display font-bold text-white mb-2">No profiles yet</h2>
                      <p className="text-text-muted text-sm">Invite friends to join ShowUp2Move!</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Event join modal ──────────────────────────────────────────── */}
        <AnimatePresence>
          {showMatchModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 30 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="bg-card-bg border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 max-h-[90vh] overflow-y-auto"
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                  className="text-5xl">🎉</motion.div>

                <div>
                  <h2 className="text-2xl font-display font-bold text-white mb-2">You're in!</h2>
                  <p className="text-text-muted">{showMatchModal.card.location}</p>
                  <p className="text-text-muted text-sm">{showMatchModal.card.time}</p>
                </div>

                {/* Captain badge */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-warning/10 border border-warning/30"
                >
                  <span className="text-lg">👑</span>
                  <p className="text-warning text-sm font-sans font-semibold">
                    Captain <span className="text-white">{showMatchModal.captain}</span> is organizing this event!
                  </p>
                </motion.div>

                {/* Players */}
                <div className="bg-white/5 rounded-2xl p-4 text-left space-y-2">
                  <p className="text-white/80 text-sm">With:</p>
                  <div className="flex gap-2">
                    {showMatchModal.card.players.slice(0, 3).map((player) => (
                      <div key={player.id}
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${player.avatarColor} flex items-center justify-center text-white text-xs font-semibold`}>
                        {player.avatarInitials}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Venue suggestions */}
                {eventVenues.length > 0 && (
                  <div className="text-left space-y-2">
                    <p className="text-white/80 text-sm font-semibold flex items-center gap-1">
                      <MapPin size={13} /> Nearby venues
                    </p>
                    {eventVenues.slice(0, 2).map((v) => (
                      <div key={v.name} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                        <div>
                          <p className="text-white text-xs font-semibold">{v.emoji} {v.name}</p>
                          <p className="text-text-muted text-xs">{v.city}</p>
                        </div>
                        <span className="text-accent text-xs font-bold">{v.pricePerHour} RON/h</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <Button onClick={() => { advanceCard(); navigate(`/chat/${showMatchModal.card.id}`) }} size="lg" className="w-full">
                    Open Group Chat 💬
                  </Button>
                  <Button onClick={advanceCard} variant="outline" size="lg" className="w-full">
                    Keep Matching
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Connect modal ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {connectTarget && (
            <ConnectModal match={connectTarget} onClose={() => setConnectTarget(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
