import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { matchCards, sports } from '../data/mockData'
import { MatchCard as MatchCardComponent } from '../components/MatchCard'
import { Button } from '../components/Button'
import { X, Star, Check } from 'lucide-react'
import { useShowUp } from '../context/ShowUpContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { MatchCard } from '../types'

/** Returns true if the event time string refers to today */
const isToday = (timeString: string): boolean =>
  timeString.toLowerCase().includes('today')

export const MatchScreen: React.FC = () => {
  const navigate = useNavigate()
  const { isAvailableToday } = useShowUp()
  const { user } = useAuth()

  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [showMatchModal, setShowMatchModal] = useState<MatchCard | null>(null)

  // Build filtered + sorted card list
  const filteredCards = useMemo(() => {
    let cards = selectedSport
      ? matchCards.filter((c) => c.sport === selectedSport)
      : [...matchCards]

    if (isAvailableToday === false) {
      cards = cards.filter((c) => !isToday(c.time))
    } else if (isAvailableToday === true) {
      const todayCards = cards.filter((c) => isToday(c.time))
      const futureCards = cards.filter((c) => !isToday(c.time))
      cards = [...todayCards, ...futureCards]
    }

    return cards
  }, [selectedSport, isAvailableToday])

  const advanceCard = () => {
    setCurrentIndex((prev) => prev + 1)
    setShowMatchModal(null)
    setDragX(0)
  }

  const handleSkip = () => {
    setCurrentIndex((prev) => prev + 1)
    setDragX(0)
  }

  const handleJoin = (card?: MatchCard) => {
    const target = card ?? filteredCards[currentIndex]
    if (target) {
      // Try to record join in Supabase (fire-and-forget, don't block UI)
      if (user) {
        supabase
          .from('event_participants')
          .insert({ event_id: target.id, user_id: user.id })
          .then(({ error }) => {
            // Silently ignore — mock card IDs won't exist in DB, that's fine
            if (!error) {
              // Optionally increment current_players
              supabase.rpc('increment_players', { event_id: target.id }).catch(() => {})
            }
          })
          .catch(() => {})
      }
      setShowMatchModal(target)
    }
  }

  const handleSuperJoin = () => {
    advanceCard()
  }

  const handleDragEnd = (_event: any, info: any) => {
    const offset = info.offset.x
    if (offset > 120) {
      handleJoin()
    } else if (offset < -120) {
      handleSkip()
    } else {
      setDragX(0)
    }
  }

  const currentCard = filteredCards[currentIndex]
  const nextCards = filteredCards.slice(currentIndex + 1, currentIndex + 3)
  const isEmpty = currentIndex >= filteredCards.length

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 pb-32 lg:pb-6">
      <div className="w-full max-w-md lg:max-w-[480px]">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-white mb-4">Find your game</h1>

          {/* Availability banner */}
          {isAvailableToday === false && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-sans"
            >
              Showing upcoming matches only — you're off today 😴
            </motion.div>
          )}
          {isAvailableToday === true && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-sans"
            >
              Today's matches are prioritized for you 🔥
            </motion.div>
          )}

          {/* Sport filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <motion.button
              onClick={() => { setSelectedSport(null); setCurrentIndex(0) }}
              whileHover={{ scale: 1.05 }}
              className={`px-4 py-2 rounded-full font-sans font-semibold whitespace-nowrap transition-all ${
                selectedSport === null
                  ? 'bg-primary text-white'
                  : 'bg-card-bg border border-white/10 text-text-muted hover:text-white'
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
        </div>

        {/* Empty state */}
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <p className="text-5xl mb-4">🎯</p>
            <h2 className="text-2xl font-display font-bold text-white mb-2">No more matches right now</h2>
            <p className="text-text-muted mb-8">Come back later!</p>
            <Button onClick={() => { setCurrentIndex(0) }} size="lg" className="w-full">
              Start over
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Card stack */}
            <div className="relative h-96 mb-8">
              <AnimatePresence mode="popLayout">
                {/* Background cards */}
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

                {/* Main card */}
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
                    <MatchCardComponent card={currentCard} isDragging={true} dragX={dragX} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Swipe hint */}
            <p className="text-center text-text-muted text-xs mb-4 font-sans">
              ← swipe to skip &nbsp;·&nbsp; swipe to join →
            </p>

            {/* Action buttons */}
            <div className="flex gap-4 justify-center items-center">
              <Button variant="danger" size="lg" onClick={handleSkip} className="flex-1">
                <X size={20} />
                Skip
              </Button>
              <Button variant="outline" size="lg" onClick={handleSuperJoin} className="flex-1 border-warning text-warning hover:bg-warning/10">
                <Star size={20} />
                Super
              </Button>
              <Button variant="success" size="lg" onClick={() => handleJoin()} className="flex-1">
                <Check size={20} />
                Join
              </Button>
            </div>
          </>
        )}

        {/* Match confirmation modal */}
        <AnimatePresence>
          {showMatchModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 30 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="bg-card-bg border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="text-5xl"
                >
                  🎉
                </motion.div>

                <div>
                  <h2 className="text-2xl font-display font-bold text-white mb-2">You're in!</h2>
                  <p className="text-text-muted">{showMatchModal.location}</p>
                  <p className="text-text-muted text-sm">{showMatchModal.time}</p>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 text-left space-y-2">
                  <p className="text-white/80 text-sm">With:</p>
                  <div className="flex gap-2">
                    {showMatchModal.players.slice(0, 3).map((player) => (
                      <div
                        key={player.id}
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${player.avatarColor} flex items-center justify-center text-white text-xs font-semibold`}
                      >
                        {player.avatarInitials}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      advanceCard()
                      navigate('/chat')
                    }}
                    size="lg"
                    className="w-full"
                  >
                    Open Group Chat
                  </Button>
                  <Button onClick={advanceCard} variant="outline" size="lg" className="w-full">
                    Back to Matching
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
