import React from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { MatchCard as MatchCardType } from '../types'
import { Avatar } from './Avatar'
import { Badge } from './Badge'

interface MatchCardProps {
  card: MatchCardType
  isDragging?: boolean
  dragX?: number
}

export const MatchCard: React.FC<MatchCardProps> = ({ card, dragX = 0 }) => {
  const rotationAmount = (dragX / 50) * 5 // Max 5 degrees
  const opacityLeft = Math.max(0, -dragX / 100)
  const opacityRight = Math.max(0, dragX / 100)

  return (
    <motion.div
      style={{
        rotate: rotationAmount,
      }}
      className="absolute w-full h-full"
    >
      <div
        className={`w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br ${card.gradient} p-6 flex flex-col justify-between shadow-2xl`}
        style={{
          boxShadow: `0 20px 60px rgba(108, 99, 255, 0.3)`,
        }}
      >
        {/* Drag overlays */}
        <motion.div
          animate={{ opacity: opacityLeft }}
          className="absolute inset-0 bg-red-500/30 flex items-center justify-center pointer-events-none"
        >
          <span className="text-white text-4xl font-bold">✗</span>
        </motion.div>
        <motion.div
          animate={{ opacity: opacityRight }}
          className="absolute inset-0 bg-green-500/30 flex items-center justify-center pointer-events-none"
        >
          <span className="text-white text-4xl font-bold">✓</span>
        </motion.div>

        {/* Top section */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{card.emoji}</span>
            <div className="text-left">
              <p className="text-white font-display font-bold text-lg">{card.sport}</p>
              <p className="text-white/80 text-sm">{card.time}</p>
            </div>
          </div>
          <Badge variant="outline">{card.weather}</Badge>
        </div>

        {/* Middle section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-white font-display font-bold text-2xl mb-2">{card.location}</h3>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <MapPin size={16} />
              {card.distance}
            </div>
          </div>

          {/* Players */}
          <div className="flex items-center gap-2">
            {card.players.slice(0, 3).map((player) => (
              <Avatar key={player.id} initials={player.avatarInitials} color={player.avatarColor} size="md" />
            ))}
            {card.players.length > 3 && (
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 text-xs font-semibold">
                +{card.players.length - 3}
              </div>
            )}
          </div>
        </div>

        {/* Bottom section */}
        <div className="space-y-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/80 text-sm font-sans">Spots available</span>
              <span className="text-white font-sans font-bold">
                {card.spotsLeft} / {card.totalSpots}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((card.totalSpots - card.spotsLeft) / card.totalSpots) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-full bg-gradient-to-r from-white to-white/50"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {card.tags.map((tag) => (
              <Badge key={tag} variant="outline" size="sm">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="text-white/60 text-sm font-sans">
            Hosted by <span className="text-white font-semibold">{card.captain}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
