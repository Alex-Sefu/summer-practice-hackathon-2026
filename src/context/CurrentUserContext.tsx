import React, { createContext, useContext } from 'react'
import { User } from '../types'
import { users } from '../data/mockData'

const CurrentUserContext = createContext<User | null>(null)

export const CurrentUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = users[0] // First user is the logged-in user

  return <CurrentUserContext.Provider value={currentUser}>{children}</CurrentUserContext.Provider>
}

export const useCurrentUser = () => {
  const context = useContext(CurrentUserContext)
  if (!context) {
    throw new Error('useCurrentUser must be used within CurrentUserProvider')
  }
  return context
}
