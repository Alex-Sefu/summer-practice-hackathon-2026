import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send } from 'lucide-react'
import { chatRooms, matchCards } from '../data/mockData'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Avatar } from '../components/Avatar'
import { Message } from '../types'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface DbMessage {
  id: string
  room_id: string
  sender_id: string
  text: string
  created_at: string
  profiles?: { name: string; avatar_emoji: string }
}

// Convert a DB message to the local Message type
const toLocalMessage = (msg: DbMessage, currentUserId: string): Message => ({
  id: msg.id,
  senderId: msg.sender_id,
  senderName: msg.profiles?.name || 'Player',
  senderInitials: (msg.profiles?.name || 'P').charAt(0).toUpperCase(),
  text: msg.text,
  time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  isOwn: msg.sender_id === currentUserId,
})

export const ChatScreen: React.FC = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [messageInput, setMessageInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [usingRealtime, setUsingRealtime] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock room/event data
  const room = chatRooms.find((r) => r.id === roomId)
  const event = matchCards.find((c) => c.id === roomId) || matchCards[0]

  // Load initial messages — try Supabase first, fall back to mock
  useEffect(() => {
    if (!roomId) return

    const loadMessages = async () => {
      if (!user) {
        // No auth — use mock data
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
          // No DB messages — use mock data
          if (room) setMessages(room.messages)
        }
      } catch {
        if (room) setMessages(room.messages)
      }
    }

    loadMessages()
  }, [roomId, user])

  // Supabase Realtime subscription
  useEffect(() => {
    if (!roomId || !user || !usingRealtime) return

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as DbMessage
          // Avoid duplicates from our own optimistic updates
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, toLocalMessage(newMsg, user.id)]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, user, usingRealtime])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return

    if (usingRealtime && user && roomId) {
      // Optimistic local add
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

      // Persist to Supabase
      try {
        await supabase.from('messages').insert({
          room_id: roomId,
          sender_id: user.id,
          text: messageInput.trim(),
        })
      } catch {
        // Message already shown optimistically — no action needed
      }
    } else {
      // Local-only fallback (mock rooms)
      const newMessage: Message = {
        id: String(messages.length + 1),
        senderId: '1',
        senderName: 'You',
        senderInitials: 'Y',
        text: messageInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      }
      setMessages([...messages, newMessage])
      setMessageInput('')
    }
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (!roomId) {
    return (
      <div className="min-h-screen bg-dark-bg pb-32">
        <div className="max-w-md mx-auto p-4">
          <h1 className="text-3xl font-display font-bold text-white mb-6">Messages</h1>

          {/* Search bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full px-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary"
            />
          </div>

          {/* Chat rooms list */}
          <div className="space-y-3">
            {chatRooms.map((chatRoom) => (
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
                  <p className="text-white font-sans font-semibold truncate">{chatRoom.name}</p>
                  <p className="text-text-muted text-sm truncate">{chatRoom.lastMessage}</p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {chatRoom.unread > 0 && (
                    <Badge variant="primary" size="sm">
                      {chatRoom.unread}
                    </Badge>
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

  if (!room) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <p className="text-text-muted">Room not found</p>
      </div>
    )
  }

  // ── ROOM VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col pb-32">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-dark-bg/95 backdrop-blur-md border-b border-white/5 p-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate('/chat')} className="text-white hover:text-primary transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{room.emoji}</span>
                <h2 className="text-lg font-display font-bold text-white">{room.name}</h2>
              </div>
              <p className="text-text-muted text-xs">{room.members.length} members</p>
            </div>
          </div>

          {/* Event info banner */}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-xl p-3 overflow-hidden"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{event.emoji}</span>
                  <div>
                    <p className="text-white font-sans font-semibold text-sm">{event.location}</p>
                    <p className="text-text-muted text-xs">{event.time}</p>
                  </div>
                </div>
                <span className="text-primary font-sans font-bold text-sm">2h 45m</span>
              </div>

              <Button
                onClick={() => setIsConfirmed(!isConfirmed)}
                variant={isConfirmed ? 'success' : 'primary'}
                size="sm"
                className="w-full"
              >
                {isConfirmed ? '✓ Confirmed' : 'Confirm attendance'}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Messages area */}
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
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        msg.isOwn
                          ? `bg-gradient-to-r ${room.gradient} text-white rounded-br-none`
                          : 'bg-white/10 text-white rounded-bl-none'
                      }`}
                    >
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

        {/* Message input */}
        <div className="sticky bottom-0 bg-dark-bg border-t border-white/5 p-4 mt-4">
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
