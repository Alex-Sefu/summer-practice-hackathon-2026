import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Users } from 'lucide-react'
import { chatRooms, matchCards } from '../data/mockData'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Avatar } from '../components/Avatar'
import { Message } from '../types'
import { useAuth } from '../context/AuthContext'
import { useEvents } from '../context/EventsContext'
import { supabase } from '../lib/supabase'

interface DbMessage {
  id: string
  room_id: string
  sender_id: string
  text: string
  created_at: string
  profiles?: { name: string; avatar_emoji: string }
}

const toLocalMessage = (msg: DbMessage, currentUserId: string): Message => ({
  id: msg.id,
  senderId: msg.sender_id,
  senderName: msg.profiles?.name || 'Player',
  senderInitials: (msg.profiles?.name || 'P').charAt(0).toUpperCase(),
  text: msg.text,
  time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  isOwn: msg.sender_id === currentUserId,
})

// Seed messages for dynamically-joined events (so chat is never empty)
const SEED_MESSAGES: Message[] = [
  { id: 's1', senderId: '2', senderName: 'Alex', senderInitials: 'A', text: 'Hey everyone! Ready for today? 🔥', time: '5:30 PM', isOwn: false },
  { id: 's2', senderId: '3', senderName: 'Maria', senderInitials: 'M', text: 'Absolutely! See you there 💪', time: '5:32 PM', isOwn: false },
  { id: 's3', senderId: '4', senderName: 'Luca', senderInitials: 'L', text: 'I\'ll bring the extra ball just in case', time: '5:35 PM', isOwn: false },
]

export const ChatScreen: React.FC = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { joinedEvents, events: createdEvents } = useEvents()

  const [messageInput, setMessageInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [usingRealtime, setUsingRealtime] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Resolve room data — mock → joined event → created event
  const mockRoom    = chatRooms.find((r) => r.id === roomId)
  const joinedRoom  = joinedEvents.find((e) => e.id === roomId)
  const createdRoom = createdEvents.find((e) => e.id === roomId)

  // Resolve event card for the info banner (mock cards only)
  const eventCard = matchCards.find((c) => c.id === roomId) ?? matchCards[0]

  // Build a synthetic room object that works for mock, joined, and created events
  const room = mockRoom
    ?? (joinedRoom ? {
        id: joinedRoom.id,
        sport: joinedRoom.sport,
        emoji: joinedRoom.emoji,
        gradient: joinedRoom.gradient,
        name: joinedRoom.title,
        messages: SEED_MESSAGES,
        lastMessage: SEED_MESSAGES[SEED_MESSAGES.length - 1].text,
        unread: 0,
        members: ['You', joinedRoom.captain, 'Alex', 'Maria'],
      } : null)
    ?? (createdRoom ? {
        id: createdRoom.id,
        sport: createdRoom.sport,
        emoji: createdRoom.emoji,
        gradient: createdRoom.gradient,
        name: createdRoom.title,
        messages: SEED_MESSAGES,
        lastMessage: SEED_MESSAGES[SEED_MESSAGES.length - 1].text,
        unread: 0,
        members: ['You (Host)', 'Alex', 'Maria', 'Luca'],
      } : null)

  // Load messages
  useEffect(() => {
    if (!roomId) return

    const loadMessages = async () => {
      if (!user) {
        if (room) setMessages(room.messages)
        return
      }

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, profiles(name, avatar_emoji)')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true })

        if (!error && data && data.length > 0) {
          setMessages(data.map((m: DbMessage) => toLocalMessage(m, user.id)))
          setUsingRealtime(true)
        } else {
          if (room) setMessages(room.messages)
        }
      } catch {
        if (room) setMessages(room.messages)
      }
    }

    loadMessages()
  }, [roomId, user])

  // Realtime subscription
  useEffect(() => {
    if (!roomId || !user || !usingRealtime) return

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const newMsg = payload.new as DbMessage
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev
          return [...prev, toLocalMessage(newMsg, user.id)]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, user, usingRealtime])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return

    if (usingRealtime && user && roomId) {
      const optimistic: Message = {
        id: `opt-${Date.now()}`,
        senderId: user.id,
        senderName: 'You',
        senderInitials: 'Y',
        text: messageInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      }
      setMessages((prev) => [...prev, optimistic])
      setMessageInput('')
      try {
        await supabase.from('messages').insert({ room_id: roomId, sender_id: user.id, text: messageInput.trim() })
      } catch { /* optimistic already shown */ }
    } else {
      setMessages((prev) => [...prev, {
        id: `local-${Date.now()}`,
        senderId: '1',
        senderName: 'You',
        senderInitials: 'Y',
        text: messageInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      }])
      setMessageInput('')
    }
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (!roomId) {
    // Merge mock rooms + joined event rooms (deduplicated)
    const joinedRooms = joinedEvents.map((e) => ({
      id: e.id,
      sport: e.sport,
      emoji: e.emoji,
      gradient: e.gradient,
      name: e.title,
      lastMessage: 'You joined this event 🎉',
      unread: 1,
      isJoined: true,
    }))

    const mockRoomList = chatRooms.map((r) => ({ ...r, isJoined: false }))

    // Joined rooms first, then mock rooms (skip any mock room whose id matches a joined one)
    const joinedIds = new Set(joinedRooms.map((r) => r.id))
    const allRooms = [
      ...joinedRooms,
      ...mockRoomList.filter((r) => !joinedIds.has(r.id)),
    ]

    return (
      <div className="min-h-screen bg-dark-bg pb-32">
        <div className="max-w-md mx-auto p-4">
          <h1 className="text-3xl font-display font-bold text-white mb-6">Messages</h1>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full px-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-3">
            {allRooms.map((chatRoom) => (
              <motion.button
                key={chatRoom.id}
                onClick={() => navigate(`/chat/${chatRoom.id}`)}
                whileHover={{ scale: 1.02 }}
                className="w-full bg-card-bg border border-white/10 rounded-2xl p-4 flex items-center gap-4 transition-colors hover:border-primary/50 text-left"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${chatRoom.gradient} flex items-center justify-center text-xl flex-shrink-0`}>
                  {chatRoom.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-sans font-semibold truncate">{chatRoom.name}</p>
                    {chatRoom.isJoined && (
                      <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold uppercase flex-shrink-0">
                        Joined
                      </span>
                    )}
                  </div>
                  <p className="text-text-muted text-sm truncate">{chatRoom.lastMessage}</p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {chatRoom.unread > 0 && (
                    <Badge variant="primary" size="sm">{chatRoom.unread}</Badge>
                  )}
                  <p className="text-text-muted text-xs">Now</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── ROOM NOT FOUND ─────────────────────────────────────────────────────────
  if (!room) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-5xl">💬</p>
        <p className="text-white font-display font-bold text-xl">Chat not found</p>
        <p className="text-text-muted text-sm text-center">This room doesn't exist yet. Join an event to start chatting!</p>
        <Button onClick={() => navigate('/chat')} variant="outline" size="md">
          Back to Messages
        </Button>
      </div>
    )
  }

  // ── ROOM VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col pb-32">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-dark-bg/95 backdrop-blur-md border-b border-white/5 p-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate('/chat')} className="text-white hover:text-primary transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{room.emoji}</span>
                <h2 className="text-base font-display font-bold text-white truncate">{room.name}</h2>
              </div>
              <div className="flex items-center gap-1 text-text-muted text-xs">
                <Users size={11} />
                {room.members.length} members
              </div>
            </div>
          </div>

          {/* Event info banner */}
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-r ${room.gradient} bg-opacity-20 border border-white/10 rounded-xl p-3`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{room.emoji}</span>
                <div>
                  <p className="text-white font-sans font-semibold text-sm">{room.name}</p>
                  <p className="text-white/70 text-xs">
                    {joinedRoom?.time ?? createdRoom?.time ?? eventCard.time} · {joinedRoom?.location ?? createdRoom?.location ?? eventCard.location}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsConfirmed(!isConfirmed)}
                variant={isConfirmed ? 'success' : 'primary'}
                size="sm"
              >
                {isConfirmed ? '✓ In' : 'Confirm'}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-xs ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                  {!msg.isOwn && (
                    <Avatar initials={msg.senderInitials} color="from-primary to-secondary" size="sm" />
                  )}
                  <div className={msg.isOwn ? 'text-right' : ''}>
                    {!msg.isOwn && (
                      <p className="text-text-muted text-xs mb-1 ml-1">{msg.senderName}</p>
                    )}
                    <div className={`px-4 py-2 rounded-2xl ${
                      msg.isOwn
                        ? `bg-gradient-to-r ${room.gradient} text-white rounded-br-none`
                        : 'bg-white/10 text-white rounded-bl-none'
                    }`}>
                      <p className="text-sm font-sans">{msg.text}</p>
                    </div>
                    <p className="text-text-muted text-xs mt-1">{msg.time}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-dark-bg border-t border-white/5 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary"
            />
            <Button onClick={handleSendMessage} size="md" className="px-4">
              <Send size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
