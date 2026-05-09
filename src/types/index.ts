export interface Sport {
  id: string
  label: string
  emoji: string
  gradient: string
  groupSizeMin: number
  groupSizeMax: number
}

export interface User {
  id: string
  name: string
  avatarInitials: string
  avatarColor: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro'
  sports: string[]
  bio: string
  location: string
}

export interface MatchCard {
  id: string
  sport: string
  emoji: string
  gradient: string
  time: string
  location: string
  distance: string
  players: User[]
  spotsLeft: number
  totalSpots: number
  weather: string
  captain: string
  tags: string[]
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderInitials: string
  text: string
  time: string
  isOwn: boolean
}

export interface ChatRoom {
  id: string
  sport: string
  emoji: string
  gradient: string
  name: string
  messages: Message[]
  lastMessage: string
  unread: number
  members: string[]
}

export interface Event {
  id: string
  sport: string
  emoji: string
  gradient: string
  title: string
  time: string
  location: string
  participants: Array<{ initials: string; color: string }>
  confirmed: boolean
}
