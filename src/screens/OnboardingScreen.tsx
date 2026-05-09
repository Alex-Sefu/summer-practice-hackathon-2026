import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { sports } from '../data/mockData'
import { SportCard } from '../components/SportCard'
import { Button } from '../components/Button'
import { useAuth } from '../context/AuthContext'

const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro'] as const
const timePreferences = [
  { label: 'Morning', emoji: '🌅', id: 'morning' },
  { label: 'Afternoon', emoji: '☀️', id: 'afternoon' },
  { label: 'Evening', emoji: '🌙', id: 'evening' },
]
const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface OnboardingScreenProps {
  onComplete: () => void
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
 const { updateProfile } = useAuth()

  const [step, setStep] = useState(1)
  const [avatarEmoji, setAvatarEmoji] = useState('👤')
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [skillLevel, setSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Pro' | null>(null)
  const [availability, setAvailability] = useState<string[]>([])
  const [timePreference, setTimePreference] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSportToggle = (sportId: string) => {
    if (selectedSports.includes(sportId)) {
      setSelectedSports(selectedSports.filter((id) => id !== sportId))
    } else {
      setSelectedSports([...selectedSports, sportId])
    }
  }

  const handleDayToggle = (day: string) => {
    if (availability.includes(day)) {
      setAvailability(availability.filter((d) => d !== day))
    } else {
      setAvailability([...availability, day])
    }
  }


const handleContinue = async () => {
  console.log("Buton apăsat la pasul:", step); // Vezi asta în consolă (F12)

  if (step === 1 && name.trim()) {
    console.log("Trec la pasul 2");
    setStep(2);
  } else if (step === 2 && selectedSports.length > 0) {
    console.log("Trec la pasul 3");
    setStep(3);
  } else if (step === 3 && skillLevel && availability.length > 0 && timePreference) {
    setSaving(true);
    console.log("Încep salvarea finală în Supabase...");
    
// 1. Lansăm salvarea fără să mai punem 'await' în fața ei
    // Astfel, codul nu mai îngheață dacă Supabase nu răspunde
    updateProfile({
      full_name: name,
      bio,
      location,
      avatar_emoji: avatarEmoji,
      sports: selectedSports,
      skill_level: skillLevel,
      availability,
      time_preference: timePreference,
      has_completed_onboarding: true,
    }).catch(err => console.error("Background save failed:", err));

    // 2. Navigăm imediat, fără să mai așteptăm baza de date
    console.log("Forțez navigarea către Home...");
    setSaving(false);
    onComplete();

    localStorage.setItem('onboarding_complete_fallback', 'true');
    window.location.href = "/";

  } 
};
  const isStepValid = () => {
    if (step === 1) return name.trim().length > 0
    if (step === 2) return selectedSports.length > 0
    if (step === 3) return skillLevel && availability.length > 0 && timePreference
    return false
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg lg:bg-card-bg lg:rounded-3xl lg:p-10 lg:shadow-2xl lg:mt-12">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                animate={{ flex: s <= step ? 1 : 0.3 }}
                className={`h-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-white/10'}`}
              />
            ))}
          </div>
          <p className="text-text-muted text-sm mt-4">Step {step} of 3</p>
        </div>

        {/* Step 1: Who are you? */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Who are you?</h1>
                <p className="text-text-muted">Let's get to know you better</p>
              </div>

              {/* Avatar selector */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-5xl cursor-pointer hover:scale-105 transition-transform">
                  {avatarEmoji}
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {['👤', '😊', '🤓', '😎', '🏋️', '🎯'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setAvatarEmoji(emoji)}
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name input */}
              <div>
                <label className="block text-white font-sans font-semibold mb-2">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  className="w-full px-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Bio textarea */}
              <div>
                <label className="block text-white font-sans font-semibold mb-2">Short Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* Location input */}
              <div>
                <label className="block text-white font-sans font-semibold mb-2">City/Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where are you based?"
                  className="w-full px-4 py-3 rounded-2xl bg-card-bg border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <Button onClick={handleContinue} disabled={!isStepValid()} size="lg" className="w-full">
                Continue <ArrowRight size={20} />
              </Button>
            </motion.div>
          )}

          {/* Step 2: What do you play? */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">Pick your sports</h1>
                <p className="text-text-muted">Select all that apply</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {sports.map((sport) => (
                  <SportCard
                    key={sport.id}
                    sport={sport}
                    selected={selectedSports.includes(sport.id)}
                    onSelect={() => handleSportToggle(sport.id)}
                    size="md"
                  />
                ))}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)} size="lg" className="flex-1">
                  Back
                </Button>
                <Button onClick={handleContinue} disabled={!isStepValid()} size="lg" className="flex-1">
                  Continue <ArrowRight size={20} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: When can you play? */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">When can you play?</h1>
                <p className="text-text-muted">Help us match you with the right events</p>
              </div>

              {/* Skill level */}
              <div>
                <label className="block text-white font-sans font-semibold mb-3">Skill Level</label>
                <div className="flex gap-2">
                  {skillLevels.map((level) => (
                    <motion.button
                      key={level}
                      onClick={() => setSkillLevel(level)}
                      whileHover={{ scale: 1.05 }}
                      className={`flex-1 py-3 px-3 rounded-2xl font-sans font-semibold transition-all ${
                        skillLevel === level
                          ? 'bg-gradient-to-r from-primary to-secondary text-white'
                          : 'bg-card-bg border border-white/10 text-text-muted hover:text-white'
                      }`}
                    >
                      {level}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Weekly availability */}
              <div>
                <label className="block text-white font-sans font-semibold mb-3">When are you available?</label>
                <div className="grid grid-cols-7 gap-2">
                  {daysOfWeek.map((day) => (
                    <motion.button
                      key={day}
                      onClick={() => handleDayToggle(day)}
                      whileHover={{ scale: 1.05 }}
                      className={`py-2 px-1 rounded-lg font-sans font-semibold text-sm transition-all ${
                        availability.includes(day)
                          ? 'bg-primary text-white'
                          : 'bg-card-bg border border-white/10 text-text-muted hover:text-white'
                      }`}
                    >
                      {day}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Time preference */}
              <div>
                <label className="block text-white font-sans font-semibold mb-3">Preferred Time</label>
                <div className="grid grid-cols-3 gap-3">
                  {timePreferences.map(({ id, emoji, label }) => (
                    <motion.button
                      key={id}
                      onClick={() => setTimePreference(id)}
                      whileHover={{ scale: 1.05 }}
                      className={`py-4 px-3 rounded-2xl flex flex-col items-center gap-2 font-sans font-semibold transition-all ${
                        timePreference === id
                          ? 'bg-gradient-to-br from-primary to-secondary text-white'
                          : 'bg-card-bg border border-white/10 text-text-muted hover:text-white'
                      }`}
                    >
                      <span className="text-2xl">{emoji}</span>
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)} size="lg" className="flex-1">
                  Back
                </Button>
                <Button onClick={handleContinue} disabled={!isStepValid() || saving} size="lg" className="flex-1">
                  {saving ? 'Saving... ⏳' : "Let's go! 🚀"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
