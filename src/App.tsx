import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader } from 'lucide-react'
import { BottomNav } from './components/BottomNav'
import { Sidebar } from './components/Sidebar'
import { RightPanel } from './components/RightPanel'
import { ShowUpModal } from './components/ShowUpModal'
import { AuthScreen } from './screens/AuthScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { HomeScreen } from './screens/HomeScreen'
import { MatchScreen } from './screens/MatchScreen'
import { EventCreationScreen } from './screens/EventCreationScreen'
import { ChatScreen } from './screens/ChatScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { CurrentUserProvider } from './context/CurrentUserContext'
import { EventsProvider } from './context/EventsContext'
import { ShowUpProvider } from './context/ShowUpContext'
import { AuthProvider, useAuth } from './context/AuthContext'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-dark-bg flex">
      <div className="hidden lg:block w-[260px] shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 max-w-[600px] w-full mx-auto px-4 pb-20 lg:pb-6 lg:py-6">
          {children}
        </main>
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
      <div className="hidden xl:block w-[320px] shrink-0">
        <RightPanel />
      </div>
    </div>
  )
}

const FullscreenSpinner: React.FC = () => (
  <div className="min-h-screen bg-dark-bg flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <Loader size={40} className="text-primary" />
    </motion.div>
  </div>
)

const AppContent: React.FC = () => {
  const { session, profile, loading, signOut, refreshProfile } = useAuth()

  const isAuthenticated = !!session
  const isOnboardingDone =
    isAuthenticated &&
    profile !== null &&
    Array.isArray(profile?.sports) &&
    profile.sports.length > 0

  const handleOnboardingComplete = async () => {
    await refreshProfile()
  }

  const handleLogout = async () => {
    await signOut()
  }

  if (loading) return <FullscreenSpinner />

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<AuthScreen />} />
        </Routes>
      </BrowserRouter>
    )
  }

  if (!isOnboardingDone) {
    return (
      <BrowserRouter>
        <Routes>
          <Route
            path="*"
            element={<OnboardingScreen onComplete={handleOnboardingComplete} />}
          />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <CurrentUserProvider>
      <EventsProvider>
        <ShowUpProvider>
          <BrowserRouter>
            <ShowUpModal />
            <Routes>
              <Route path="/" element={<Layout><HomeScreen /></Layout>} />
              <Route path="/match" element={<Layout><MatchScreen /></Layout>} />
              <Route path="/events/create" element={<Layout><EventCreationScreen /></Layout>} />
              <Route path="/chat" element={<Layout><ChatScreen /></Layout>} />
              <Route path="/chat/:roomId" element={<Layout><ChatScreen /></Layout>} />
              <Route
                path="/profile"
                element={<Layout><ProfileScreen onLogout={handleLogout} /></Layout>}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ShowUpProvider>
      </EventsProvider>
    </CurrentUserProvider>
  )
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App