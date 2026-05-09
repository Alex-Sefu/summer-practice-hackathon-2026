import React, { createContext, useContext, useState } from 'react'

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

  const handleSet = (value: boolean) => {
    sessionStorage.setItem('showUpAnswered', value ? 'yes' : 'no')
    setIsAvailableToday(value)
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
