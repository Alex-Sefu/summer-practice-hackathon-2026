import React, { createContext, useContext, useState, useCallback } from 'react'

export interface CreatedEvent {
  id: string
  sport: string
  emoji: string
  gradient: string
  title: string
  time: string
  location: string
  maxPlayers: number
  skillLevel: string
  description: string
  isPublic: boolean
  createdBy: string
}

export interface JoinedEvent {
  id: string          // matchCard id (e.g. '1', '2', '3')
  sport: string
  emoji: string
  gradient: string
  title: string
  time: string
  location: string
  captain: string
  joinedAt: number    // Date.now()
}

interface EventsContextType {
  // Created events (in-memory only, reset on page reload)
  events: CreatedEvent[]
  addEvent: (event: CreatedEvent) => void

  // Joined events (persisted to sessionStorage for demo session)
  joinedEvents: JoinedEvent[]
  joinEvent: (event: JoinedEvent) => void
  hasJoined: (id: string) => boolean
}

const STORAGE_KEY = 'showup_joined_events'
const CREATED_KEY = 'showup_created_events'

function loadJoined(): JoinedEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveJoined(events: JoinedEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch { /* ignore */ }
}

function loadCreated(): CreatedEvent[] {
  try {
    const raw = localStorage.getItem(CREATED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCreated(events: CreatedEvent[]) {
  try {
    localStorage.setItem(CREATED_KEY, JSON.stringify(events))
  } catch { /* ignore */ }
}

const EventsContext = createContext<EventsContextType | null>(null)

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<CreatedEvent[]>(loadCreated)
  const [joinedEvents, setJoinedEvents] = useState<JoinedEvent[]>(loadJoined)

  const addEvent = useCallback((event: CreatedEvent) => {
    setEvents((prev) => {
      if (prev.some((e) => e.id === event.id)) return prev
      const next = [event, ...prev]
      saveCreated(next)
      return next
    })
  }, [])

  const joinEvent = useCallback((event: JoinedEvent) => {
    setJoinedEvents((prev) => {
      // Deduplicate by id
      if (prev.some((e) => e.id === event.id)) return prev
      const next = [event, ...prev]
      saveJoined(next)
      return next
    })
  }, [])

  const hasJoined = useCallback(
    (id: string) => joinedEvents.some((e) => e.id === id),
    [joinedEvents],
  )

  return (
    <EventsContext.Provider value={{ events, addEvent, joinedEvents, joinEvent, hasJoined }}>
      {children}
    </EventsContext.Provider>
  )
}

export const useEvents = () => {
  const context = useContext(EventsContext)
  if (!context) throw new Error('useEvents must be used within EventsProvider')
  return context
}
