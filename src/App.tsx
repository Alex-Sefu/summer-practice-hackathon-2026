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

// ─── Layout ────────────────────────────────────────────────────────────────

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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

// ─── Route Guards (Modificate pentru Bypass) ────────────────────────────────

const RootGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, profile, loading } = useAuth()
  
  // Verificăm dacă există flag-ul de fallback în browser (Emergency Bypass)
  const isOnboardingDoneLocal = localStorage.getItem('onboarding_complete_fallback') === 'true'

  if (loading) return <FullscreenSpinner />
  
  // 1. Dacă nu e logat -> Trimite la Auth
  if (!session) return <Navigate to="/auth" replace />
  
  // 2. Verificăm dacă onboarding-ul este gata (în DB sau LocalStorage)
  const isDone = profile?.has_completed_onboarding || isOnboardingDoneLocal
  
  if (!isDone) {
    return <Navigate to="/onboarding" replace />
  }
  
  return <>{children}</>
}

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, profile, loading } = useAuth()
  const isOnboardingDoneLocal = localStorage.getItem('onboarding_complete_fallback') === 'true'

  if (loading) return <FullscreenSpinner />
  
  if (session) {
    const isDone = profile?.has_completed_onboarding || isOnboardingDoneLocal
    return <Navigate to={isDone ? "/" : "/onboarding"} replace />
  }
  
  return <>{children}</>
}

// ─── App shell ─────────────────────────────────────────────────────────────

const AppContent: React.FC = () => {
  const { signOut, refreshProfile, session, profile, loading } = useAuth()
  
  // Flag pentru a decide dacă arătăm elementele de UI din Home
  const isOnboardingDoneLocal = localStorage.getItem('onboarding_complete_fallback') === 'true'
  const isAppReady = session && (profile?.has_completed_onboarding || isOnboardingDoneLocal)

  const handleOnboardingComplete = async () => {
    // Încercăm să împrospătăm datele din DB, dar fallback-ul local ne va lăsa să trecem oricum
    await refreshProfile()
  }

  const handleLogout = async () => {
    // Curățăm tot la logout
    localStorage.removeItem('onboarding_complete_fallback')
    await signOut()
  }

  if (loading) return <FullscreenSpinner />

  return (
    <CurrentUserProvider>
      <EventsProvider>
        <ShowUpProvider>
          <BrowserRouter>
            {/* ShowUpModal apare doar dacă suntem în interiorul aplicației */}
            {isAppReady && <ShowUpModal />}
            
            <Routes>
              {/* Ruta de Auth */}
              <Route
                path="/auth"
                element={
                  <AuthGuard>
                    <AuthScreen />
                  </AuthGuard>
                }
              />

              {/* Ruta de Onboarding */}
              <Route
                path="/onboarding"
                element={
                  session && !(profile?.has_completed_onboarding || isOnboardingDoneLocal) ? (
                    <OnboardingScreen onComplete={handleOnboardingComplete} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />

              {/* Rute Protejate */}
              <Route path="/" element={<RootGuard><Layout><HomeScreen /></Layout></RootGuard>} />
              <Route path="/match" element={<RootGuard><Layout><MatchScreen /></Layout></RootGuard>} />
              <Route path="/events/create" element={<RootGuard><Layout><EventCreationScreen /></Layout></RootGuard>} />
              <Route path="/chat" element={<RootGuard><Layout><ChatScreen /></Layout></RootGuard>} />
              <Route path="/chat/:roomId" element={<RootGuard><Layout><ChatScreen /></Layout></RootGuard>} />
              <Route path="/profile" element={<RootGuard><Layout><ProfileScreen onLogout={handleLogout} /></Layout></RootGuard>} />

              {/* Fallback universal */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ShowUpProvider>
      </EventsProvider>
    </CurrentUserProvider>
  )
}

export const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
)

export default App