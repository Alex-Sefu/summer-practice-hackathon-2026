import React, { createContext, useContext, useState } from 'react'
import { supabase } from '../lib/supabase'

interface ShowUpContextType {
  isAvailableToday: boolean | null
  setIsAvailableToday: (value: boolean) => void
}

const ShowUpContext = createContext<ShowUpContextType | null>(null)

export const ShowUpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAvailableToday, setIsAvailableToday] = useState<boolean | null>(() => {
    const answered = sessionStorage.getItem('showUpAnswered')
    if (answered === 'yes') return true
    if (answered === 'no') return false
    return null
  })

  const handleSet = async (value: boolean) => {
    // 1. Persist answer for this browser session
    sessionStorage.setItem('showUpAnswered', value ? 'yes' : 'no')
    setIsAvailableToday(value)

    // 2. Write daily_availability to Supabase (fire-and-forget)
    //    We get the current user inline so ShowUpContext doesn't depend on AuthContext
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ daily_availability: value })
          .eq('id', user.id)
      }
    } catch {
      // Silently ignore — session state is the source of truth for the UI
    }
  }

  return (
    <ShowUpContext.Provider value={{ isAvailableToday, setIsAvailableToday: handleSet }}>
      {children}
    </ShowUpContext.Provider>
  )
}

export const useShowUp = () => {
  const context = useContext(ShowUpContext)
  if (!context) {
    throw new Error('useShowUp must be used within ShowUpProvider')
  }
  return context
}
