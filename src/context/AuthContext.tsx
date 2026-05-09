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
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  console.log('fetchProfile result:', data, error)
  if (data) setProfile(data)
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
    localStorage.clear()
    sessionStorage.clear()
    setSession(null)
    setUser(null)
    setProfile(null)
  }

const updateProfile = async (updates: Partial<Profile>) => {
  if (!user) return { error: 'Not authenticated' }
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
  
  if (updateError) {
    console.error('updateProfile error:', updateError)
    return { error: updateError }
  }
  
  await fetchProfile(user.id)
  return { error: null }
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
