import React, { createContext, useContext, useState } from 'react'

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

interface EventsContextType {
  events: CreatedEvent[]
  addEvent: (event: CreatedEvent) => void
}

const EventsContext = createContext<EventsContextType | null>(null)

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<CreatedEvent[]>([])

  const addEvent = (event: CreatedEvent) => {
    setEvents((prev) => [event, ...prev])
  }

  return <EventsContext.Provider value={{ events, addEvent }}>{children}</EventsContext.Provider>
}

export const useEvents = () => {
  const context = useContext(EventsContext)
  if (!context) {
    throw new Error('useEvents must be used within EventsProvider')
  }
  return context
}
