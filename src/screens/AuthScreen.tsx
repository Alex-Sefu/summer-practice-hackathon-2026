import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const AuthScreen: React.FC = () => {
  const { signIn, signUp } = useAuth()
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')

  // Sign in state
  const [siEmail, setSiEmail] = useState('')
  const [siPassword, setSiPassword] = useState('')
  const [siError, setSiError] = useState('')
  const [siLoading, setSiLoading] = useState(false)

  // Sign up state
  const [suName, setSuName] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPassword, setSuPassword] = useState('')
  const [suError, setSuError] = useState('')
  const [suLoading, setSuLoading] = useState(false)
  const [suSuccess, setSuSuccess] = useState(false)

  const [showSiPass, setShowSiPass] = useState(false)
  const [showSuPass, setShowSuPass] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSiError('')
    setSiLoading(true)
    const { error } = await signIn(siEmail, siPassword)
    setSiLoading(false)
    if (error) setSiError(error.message || 'Sign in failed. Check your credentials.')
    // On success, App.tsx re-renders via auth state change — no navigate needed
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuError('')
    if (suPassword.length < 6) {
      setSuError('Password must be at least 6 characters.')
      return
    }
    setSuLoading(true)
    const { error } = await signUp(suEmail, suPassword, suName)
    setSuLoading(false)
    if (error) {
      setSuError(error.message || 'Sign up failed. Try again.')
    } else {
      setSuSuccess(true)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-5xl mb-4"
          >
            🏃
          </motion.div>
          <h1 className="font-display font-bold text-3xl">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ShowUp</span>
            <span className="text-white">2Move</span>
          </h1>
          <p className="text-text-muted text-sm mt-2">Find your game. Show up.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-card-bg rounded-2xl p-1 mb-8 border border-white/10">
          {(['signin', 'signup'] as const).map((t) => (
            <motion.button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl font-sans font-semibold text-sm transition-colors ${
                tab === t ? 'bg-primary text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              {t === 'signin' ? 'Sign In' : 'Sign Up'}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* SIGN IN */}
          {tab === 'signin' && (
            <motion.form
              key="signin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSignIn}
              className="space-y-4"
            >
              {/* Email */}
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={siEmail}
                  onChange={(e) => setSiEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type={showSiPass ? 'text' : 'password'}
                  value={siPassword}
                  onChange={(e) => setSiPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowSiPass(!showSiPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                >
                  {showSiPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Error */}
              <AnimatePresence>
                {siError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-sm font-sans px-1"
                  >
                    {siError}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={siLoading}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-sans font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
              >
                {siLoading ? 'Signing in...' : 'Sign In'}
              </motion.button>

              <p className="text-center text-text-muted text-sm">
                No account?{' '}
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className="text-primary hover:underline font-semibold"
                >
                  Sign up
                </button>
              </p>
            </motion.form>
          )}

          {/* SIGN UP */}
          {tab === 'signup' && (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSignUp}
              className="space-y-4"
            >
              {suSuccess ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center space-y-4 py-6"
                >
                  <div className="text-5xl">📬</div>
                  <h3 className="text-white font-display font-bold text-xl">Check your email!</h3>
                  <p className="text-text-muted text-sm">
                    We sent a confirmation link to <span className="text-white">{suEmail}</span>.
                    Click it to activate your account, then sign in.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab('signin')}
                    className="text-primary hover:underline font-sans font-semibold text-sm"
                  >
                    Go to Sign In →
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Name */}
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      value={suName}
                      onChange={(e) => setSuName(e.target.value)}
                      placeholder="Display name"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="email"
                      value={suEmail}
                      onChange={(e) => setSuEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type={showSuPass ? 'text' : 'password'}
                      value={suPassword}
                      onChange={(e) => setSuPassword(e.target.value)}
                      placeholder="Password (min 6 chars)"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-12 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSuPass(!showSuPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                    >
                      {showSuPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {suError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-400 text-sm font-sans px-1"
                      >
                        {suError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={suLoading}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.01 }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-sans font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                  >
                    {suLoading ? 'Creating account...' : 'Create Account'}
                  </motion.button>

                  <p className="text-center text-text-muted text-sm">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setTab('signin')}
                      className="text-primary hover:underline font-semibold"
                    >
                      Sign in
                    </button>
                  </p>
                </>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
