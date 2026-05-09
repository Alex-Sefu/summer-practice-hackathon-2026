import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface Profile {
  id: string
  name: string
  bio?: string
  location?: string
  avatar_url?: string
  avatar_emoji?: string
  skill_level?: string
  sports?: string[]
  availability?: string[]
  time_preference?: string
  games_played?: number
  streak?: number
  has_completed_onboarding?: boolean
  daily_availability?: boolean
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

const fetchProfile = async (userId: string) => {
  // local_profile_data is the highest-priority source (set by Edit Profile)
  const localProfileData = localStorage.getItem('local_profile_data')
  const localProfile = localProfileData ? JSON.parse(localProfileData) : null

  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      // local_profile_data overrides DB — ensures edits are instant
      setProfile(localProfile ? { ...data, ...localProfile } : data)
    } else {
      // DB returned nothing — use local_profile_data or userProfile fallback
      const fallbackRaw = localStorage.getItem('userProfile')
      const fallback = fallbackRaw ? JSON.parse(fallbackRaw) : {}
      setProfile(localProfile ?? (Object.keys(fallback).length ? fallback : null))
    }
  } catch {
    const fallbackRaw = localStorage.getItem('userProfile')
    const fallback = fallbackRaw ? JSON.parse(fallbackRaw) : {}
    setProfile(localProfile ?? (Object.keys(fallback).length ? fallback : null))
  }
}

useEffect(() => {
  const timeout = setTimeout(() => setLoading(false), 3000) // fallback după 3s

  supabase.auth.getSession().then(async ({ data: { session } }) => {
    setSession(session)
    setUser(session?.user ?? null)
    if (session?.user) {
      await fetchProfile(session.user.id)
    }
    clearTimeout(timeout)
    setLoading(false)
  }).catch(() => {
    clearTimeout(timeout)
    setLoading(false)
  })

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    setSession(session)
    setUser(session?.user ?? null)
    if (session?.user) {
      await fetchProfile(session.user.id)
    } else {
      setProfile(null)
    }
  })

  return () => {
    clearTimeout(timeout)
    subscription.unsubscribe()
  }
}, [])

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    // Clear all demo keys explicitly so a fresh demo run starts clean
    const demoKeys = [
      'userProfile',
      'local_profile_data',
      'onboardingComplete',
      'showup_joined_events',
      'showup_created_events',
    ]
    demoKeys.forEach((k) => localStorage.removeItem(k))
    sessionStorage.clear()
    setSession(null)
    setUser(null)
    setProfile(null)
  }

const updateProfile = async (updates: Partial<Profile>) => {
  // Write to both keys — userProfile (legacy) and local_profile_data (primary)
  const localRaw = localStorage.getItem('userProfile')
  const local = localRaw ? JSON.parse(localRaw) : {}
  const merged = { ...local, ...updates }
  localStorage.setItem('userProfile', JSON.stringify(merged))
  localStorage.setItem('local_profile_data', JSON.stringify(merged))

  // Optimistically update in-memory profile so Sidebar/ProfileScreen re-render instantly
  setProfile((prev) => prev ? { ...prev, ...updates } : (updates as Profile))

  // Try Supabase with a 4-second timeout — silently fall back if it fails
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: null }   // no session — local save is enough

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: currentUser.id, ...updates })
      .abortSignal(controller.signal)

    clearTimeout(timer)
    return { error }
  } catch {
    // DB unreachable — local save already done above
    return { error: null }
  }
}

  const uploadAvatar = async (file: File) => {
    if (!user) return { url: null, error: 'Not authenticated' }
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })
      if (error) return { url: null, error }
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      await updateProfile({ avatar_url: data.publicUrl })
      return { url: data.publicUrl, error: null }
    } catch (error) {
      return { url: null, error }
    }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, signUp, signIn, signOut, updateProfile, uploadAvatar, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
