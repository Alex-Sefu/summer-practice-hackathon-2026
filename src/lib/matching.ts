import { Profile } from '../context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SmartMatch {
  profile: Profile
  score: number          // 0–100
  sharedSports: string[]
  sharedDays: string[]
  skillGap: number
  reason: string
}

// ─── Venue data ───────────────────────────────────────────────────────────────

export interface Venue {
  name: string
  city: string
  sports: string[]
  address: string
  pricePerHour: number   // RON
  rating: number         // 1–5
  emoji: string
}

export const VENUES: Venue[] = [
  // Bucharest
  { name: 'Pescariu Sports & Spa', city: 'Bucharest', sports: ['tennis', 'swimming', 'padel'], address: 'Str. Pescarilor 1, Bucharest', pricePerHour: 120, rating: 4.8, emoji: '🏊' },
  { name: 'Baza Sportivă Unirea', city: 'Bucharest', sports: ['football', 'basketball', 'volleyball'], address: 'Piața Unirii 2, Bucharest', pricePerHour: 80, rating: 4.3, emoji: '⚽' },
  { name: 'Gheorgheni Park Arena', city: 'Bucharest', sports: ['football', 'running'], address: 'Parcul Gheorgheni, Bucharest', pricePerHour: 60, rating: 4.5, emoji: '🏃' },
  { name: 'Padel Club Floreasca', city: 'Bucharest', sports: ['padel', 'tennis'], address: 'Calea Floreasca 55, Bucharest', pricePerHour: 100, rating: 4.7, emoji: '🎾' },
  { name: 'Arena Națională Fitness', city: 'Bucharest', sports: ['basketball', 'volleyball', 'football'], address: 'Bd. Basarabia 37, Bucharest', pricePerHour: 90, rating: 4.2, emoji: '🏀' },
  { name: 'Velodrom București', city: 'Bucharest', sports: ['cycling', 'running'], address: 'Str. Maior Coravu 6, Bucharest', pricePerHour: 50, rating: 4.4, emoji: '🚴' },
  // Cluj
  { name: 'Cluj Arena Sports Hub', city: 'Cluj', sports: ['football', 'basketball'], address: 'Str. Locotent Corneliu Bodea 1, Cluj', pricePerHour: 75, rating: 4.6, emoji: '⚽' },
  { name: 'Baza Sportivă Gheorgheni Cluj', city: 'Cluj', sports: ['tennis', 'padel', 'volleyball'], address: 'Calea Turzii 178, Cluj', pricePerHour: 85, rating: 4.4, emoji: '🎾' },
  { name: 'Aquapark Someșul', city: 'Cluj', sports: ['swimming'], address: 'Str. Fabricii 2, Cluj', pricePerHour: 45, rating: 4.1, emoji: '🏊' },
  { name: 'Velo Cluj Cycling Center', city: 'Cluj', sports: ['cycling', 'running'], address: 'Bd. Muncii 12, Cluj', pricePerHour: 40, rating: 4.3, emoji: '🚴' },
  // Timisoara
  { name: 'Complexul Sportiv Olimpia', city: 'Timisoara', sports: ['football', 'basketball', 'volleyball'], address: 'Str. Olimpia 1, Timisoara', pricePerHour: 70, rating: 4.5, emoji: '🏐' },
  { name: 'Padel Timișoara', city: 'Timisoara', sports: ['padel', 'tennis'], address: 'Calea Torontalului 22, Timisoara', pricePerHour: 90, rating: 4.6, emoji: '🎾' },
]

/** Returns venues matching a sport (and optionally a city), sorted by rating */
export function getSuggestedVenues(sport: string, city?: string): Venue[] {
  return VENUES
    .filter((v) => v.sports.includes(sport) && (!city || v.city.toLowerCase() === city.toLowerCase()))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)
}

/**
 * Alias used by HomeScreen "Happening Near Me" section.
 * Falls back to all cities if no city match found.
 */
export function getNearbyVenues(sport: string, city?: string): Venue[] {
  const cityMatches = getSuggestedVenues(sport, city)
  if (cityMatches.length > 0) return cityMatches
  // Fallback: return top venues for the sport regardless of city
  return VENUES
    .filter((v) => v.sports.includes(sport))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)
}

/**
 * Generates a Google Maps search URL for a venue.
 * Format: https://www.google.com/maps/search/?api=1&query=Venue+Name+City
 */
export function getGoogleMapsUrl(venue: Venue): string {
  const query = encodeURIComponent(`${venue.name} ${venue.city}`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

// ─── Fallback profiles (shown when Supabase returns 0 results) ────────────────

export const FALLBACK_PROFILES: Profile[] = [
  {
    id: 'fb-001', name: 'Alexandru Ionescu', bio: 'Passionate about football and long-distance running.',
    location: 'Bucharest', avatar_emoji: '😎', skill_level: 'Advanced',
    sports: ['football', 'running'], availability: ['Mon', 'Wed', 'Fri', 'Sat'],
    time_preference: 'evening', games_played: 24, streak: 7,
    has_completed_onboarding: true, daily_availability: false,
  },
  {
    id: 'fb-002', name: 'Maria Constantin', bio: 'Tennis enthusiast since age 12. Recently got into padel!',
    location: 'Bucharest', avatar_emoji: '🎯', skill_level: 'Intermediate',
    sports: ['tennis', 'padel'], availability: ['Tue', 'Thu', 'Sat', 'Sun'],
    time_preference: 'morning', games_played: 18, streak: 5,
    has_completed_onboarding: true, daily_availability: false,
  },
  {
    id: 'fb-003', name: 'Andrei Popescu', bio: 'Just moved to Cluj, looking for people to play with.',
    location: 'Cluj', avatar_emoji: '🏋️', skill_level: 'Beginner',
    sports: ['basketball', 'football'], availability: ['Sat', 'Sun'],
    time_preference: 'afternoon', games_played: 6, streak: 2,
    has_completed_onboarding: true, daily_availability: false,
  },
  {
    id: 'fb-004', name: 'Sofia Dumitrescu', bio: 'Marathon runner and triathlete. Coaching available.',
    location: 'Bucharest', avatar_emoji: '🏃', skill_level: 'Pro',
    sports: ['running', 'cycling', 'swimming'], availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    time_preference: 'morning', games_played: 87, streak: 21,
    has_completed_onboarding: true, daily_availability: false,
  },
  {
    id: 'fb-005', name: 'Mihai Georgescu', bio: 'Played semi-pro football for 3 years in Timisoara.',
    location: 'Timisoara', avatar_emoji: '😊', skill_level: 'Advanced',
    sports: ['football', 'basketball', 'volleyball'], availability: ['Wed', 'Fri', 'Sat', 'Sun'],
    time_preference: 'evening', games_played: 45, streak: 12,
    has_completed_onboarding: true, daily_availability: false,
  },
  {
    id: 'fb-006', name: 'Elena Radu', bio: 'Weekend warrior. Love racket sports and beach volleyball.',
    location: 'Cluj', avatar_emoji: '😊', skill_level: 'Intermediate',
    sports: ['tennis', 'padel', 'volleyball'], availability: ['Sat', 'Sun'],
    time_preference: 'morning', games_played: 31, streak: 8,
    has_completed_onboarding: true, daily_availability: false,
  },
  {
    id: 'fb-007', name: 'Cristian Munteanu', bio: '100km rides every weekend, looking for pace partners.',
    location: 'Timisoara', avatar_emoji: '🤓', skill_level: 'Intermediate',
    sports: ['cycling', 'running'], availability: ['Sat', 'Sun'],
    time_preference: 'morning', games_played: 19, streak: 4,
    has_completed_onboarding: true, daily_availability: false,
  },
  {
    id: 'fb-008', name: 'Ioana Stanescu', bio: 'Padel addict. Ranked top 50 in Bucharest amateur circuit.',
    location: 'Bucharest', avatar_emoji: '🎯', skill_level: 'Advanced',
    sports: ['padel', 'tennis'], availability: ['Mon', 'Wed', 'Fri', 'Sat'],
    time_preference: 'evening', games_played: 52, streak: 15,
    has_completed_onboarding: true, daily_availability: false,
  },
]

// ─── Scoring constants ────────────────────────────────────────────────────────

const SKILL_ORDER: Record<string, number> = {
  Beginner: 0, Intermediate: 1, Advanced: 2, Pro: 3,
}

const SPORT_EMOJIS: Record<string, string> = {
  football: '⚽', basketball: '🏀', tennis: '🎾', padel: '🎾',
  running: '🏃', cycling: '🚴', swimming: '🏊', volleyball: '🏐',
}

const SPORT_LABELS: Record<string, string> = {
  football: 'Football', basketball: 'Basketball', tennis: 'Tennis', padel: 'Padel',
  running: 'Running', cycling: 'Cycling', swimming: 'Swimming', volleyball: 'Volleyball',
}

const TIME_LABELS: Record<string, string> = {
  morning: 'morning', afternoon: 'afternoon', evening: 'evening',
}

// ─── Score calculation ────────────────────────────────────────────────────────

/**
 * Weighted 0–100 compatibility score.
 *
 * Sports overlap    : 40 pts
 * Skill proximity   : 25 pts
 * Same location     : 20 pts
 * Availability days : 10 pts
 * Time preference   :  5 pts
 */
export function calculateCompatibilityScore(
  me: Profile,
  other: Profile,
): Pick<SmartMatch, 'score' | 'sharedSports' | 'sharedDays' | 'skillGap'> {
  const mySports    = me.sports    ?? []
  const otherSports = other.sports ?? []
  const myDays      = me.availability    ?? []
  const otherDays   = other.availability ?? []

  // Sports (40 pts)
  const sharedSports = mySports.filter((s) => otherSports.includes(s))
  const maxSports    = Math.max(mySports.length, otherSports.length, 1)
  const sportScore   = (sharedSports.length / maxSports) * 40

  // Skill (25 pts)
  const mySkill    = SKILL_ORDER[me.skill_level    ?? 'Beginner'] ?? 0
  const otherSkill = SKILL_ORDER[other.skill_level ?? 'Beginner'] ?? 0
  const skillGap   = Math.abs(mySkill - otherSkill)
  const skillScore = Math.max(0, 25 - skillGap * 8)

  // Location (20 pts)
  const locationScore =
    me.location && other.location &&
    me.location.toLowerCase() === other.location.toLowerCase()
      ? 20 : 0

  // Availability (10 pts)
  const sharedDays = myDays.filter((d) => otherDays.includes(d))
  const maxDays    = Math.max(myDays.length, otherDays.length, 1)
  const availScore = (sharedDays.length / maxDays) * 10

  // Time preference (5 pts)
  const timeScore =
    me.time_preference && other.time_preference &&
    me.time_preference === other.time_preference
      ? 5 : 0

  const score = Math.round(sportScore + skillScore + locationScore + availScore + timeScore)

  return { score, sharedSports, sharedDays, skillGap }
}

// ─── AI reason ────────────────────────────────────────────────────────────────

export function getAIRecommendationReason(me: Profile, other: Profile): string {
  const { sharedSports, sharedDays, skillGap } = calculateCompatibilityScore(me, other)

  const myTime    = TIME_LABELS[me.time_preference    ?? ''] ?? ''
  const otherTime = TIME_LABELS[other.time_preference ?? ''] ?? ''
  const sameTime  = myTime && otherTime && myTime === otherTime
  const sameCity  = me.location?.toLowerCase() === other.location?.toLowerCase()

  const sportPhrase = (() => {
    if (sharedSports.length === 0) return null
    if (sharedSports.length === 1) {
      return `${SPORT_EMOJIS[sharedSports[0]] ?? ''} ${SPORT_LABELS[sharedSports[0]] ?? sharedSports[0]}`
    }
    return sharedSports.slice(0, 2)
      .map((s) => `${SPORT_EMOJIS[s] ?? ''} ${SPORT_LABELS[s] ?? s}`)
      .join(' and ')
  })()

  const availPhrase = (() => {
    if (sharedDays.length === 0) return null
    if (sharedDays.length >= 5) return 'almost every day'
    if (sharedDays.length >= 3) return 'several days a week'
    const weekend = sharedDays.some((d) => d === 'Sat' || d === 'Sun')
    const weekday = sharedDays.some((d) => !['Sat', 'Sun'].includes(d))
    if (weekend && !weekday) return 'on weekends'
    if (!weekend && weekday) return 'on weekdays'
    return 'during the week'
  })()

  const parts: string[] = []

  if (sportPhrase) {
    if (sameTime) {
      parts.push(`Both enjoy ${sportPhrase} in the ${myTime}`)
    } else {
      parts.push(`You both play ${sportPhrase}`)
    }
  }

  if (availPhrase) {
    if (parts.length > 0) parts[0] += ` and are free ${availPhrase}`
    else parts.push(`Both available ${availPhrase}`)
  }

  if (sameCity && me.location) parts.push(`based in ${me.location}`)

  if (skillGap === 0 && me.skill_level) parts.push(`same ${me.skill_level} level`)
  else if (skillGap === 1) parts.push(`compatible skill levels`)

  if (parts.length === 0) {
    return `${other.name} is active in ${other.location ?? 'your area'} — worth connecting!`
  }

  const sentence = parts.join(', ')
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.'
}

// ─── Rank ─────────────────────────────────────────────────────────────────────

export function rankMatches(me: Profile, others: Profile[]): SmartMatch[] {
  return others
    .filter((o) => o.id !== me.id)
    .map((other) => {
      const { score, sharedSports, sharedDays, skillGap } = calculateCompatibilityScore(me, other)
      return {
        profile: other,
        score,
        sharedSports,
        sharedDays,
        skillGap,
        reason: getAIRecommendationReason(me, other),
      }
    })
    .sort((a, b) => b.score - a.score)
}

// ─── Smart Description parser ─────────────────────────────────────────────────

export interface ParsedDescription {
  detectedSport: string | null
  detectedSkillLevel: string | null
  detectedPlayers: number | null
  detectedCity: string | null
  detectedTime: string | null   // HH:MM format if found
}

const SPORT_KEYWORDS: Record<string, string[]> = {
  football:   ['football', 'soccer', 'fotbal', 'fotball', '5v5', '7v7', '11v11', 'futsal', 'minge', 'teren de fotbal'],
  basketball: ['basketball', 'baschet', 'hoops', '3v3', 'basket'],
  tennis:     ['tennis', 'tenis', 'singles', 'doubles', 'racheta', 'rachetă'],
  padel:      ['padel'],
  running:    ['running', 'run', 'jogging', 'marathon', 'sprint', 'alergare', 'alerg', 'fuga', 'fugă'],
  cycling:    ['cycling', 'bike', 'bicicletă', 'bicicleta', 'ciclism', 'pedalat'],
  swimming:   ['swimming', 'swim', 'înot', 'inot', 'piscina', 'piscină'],
  volleyball: ['volleyball', 'volei', 'beach volleyball', 'volley'],
}

const SKILL_KEYWORDS: Record<string, string[]> = {
  Beginner:     ['beginner', 'casual', 'friendly', 'fun', 'relaxed', 'easy', 'newbie', 'incepator', 'începător', 'amator', 'recreativ'],
  Intermediate: ['intermediate', 'medium', 'moderate', 'regular', 'mediu', 'semi'],
  Advanced:     ['advanced', 'competitive', 'serious', 'avanzat', 'avansat', 'experienced', 'competitiv', 'serios'],
  Pro:          ['pro', 'professional', 'elite', 'expert', 'tournament', 'turneu', 'profesionist'],
}

const CITY_KEYWORDS: Record<string, string[]> = {
  Bucharest: ['bucharest', 'bucurești', 'bucuresti', 'buc', 'capitala', 'capitală'],
  Cluj:      ['cluj', 'cluj-napoca', 'clujul', 'napoca'],
  Timisoara: ['timisoara', 'timișoara', 'timis', 'timiș'],
  Iasi:      ['iasi', 'iași', 'iasul'],
  Brasov:    ['brasov', 'brașov', 'brasovul'],
  Constanta: ['constanta', 'constanța', 'constanta'],
}

// Time-of-day keywords → suggested time values
const TIME_KEYWORDS: Array<{ keywords: string[]; time: string; label: string }> = [
  { keywords: ['dimineata', 'dimineață', 'morning', 'matinal', 'devreme'], time: '08:00', label: 'morning' },
  { keywords: ['pranz', 'prânz', 'noon', 'amiaza', 'amiază', 'midday'], time: '12:00', label: 'noon' },
  { keywords: ['dupa-amiaza', 'după-amiază', 'dupa amiaza', 'afternoon', 'dupamasa'], time: '15:00', label: 'afternoon' },
  { keywords: ['seara', 'seară', 'evening', 'diseara', 'diseară', 'tonight', 'noapte'], time: '19:00', label: 'evening' },
]

const PLAYER_REGEX = /(\d+)\s*(?:v\s*\d+|players?|people|spots?|jucatori|jucători|persoane)/i
const TIME_REGEX   = /\b([01]?\d|2[0-3]):([0-5]\d)\b/

export function parseSmartDescription(text: string): ParsedDescription {
  const lower = text.toLowerCase()

  // Sport
  let detectedSport: string | null = null
  for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      detectedSport = sport
      break
    }
  }

  // Skill level
  let detectedSkillLevel: string | null = null
  for (const [level, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      detectedSkillLevel = level
      break
    }
  }

  // Player count — "5 la 5" / "5v5" / "10 jucatori"
  let detectedPlayers: number | null = null
  // Romanian "5 la 5" pattern
  const laLaMatch = text.match(/(\d+)\s*la\s*\d+/i)
  if (laLaMatch) {
    const n = parseInt(laLaMatch[1], 10)
    if (n >= 2 && n <= 15) detectedPlayers = n * 2
  }
  if (!detectedPlayers) {
    const playerMatch = text.match(PLAYER_REGEX)
    if (playerMatch) {
      const n = parseInt(playerMatch[1], 10)
      if (n >= 2 && n <= 22) detectedPlayers = n * 2
    }
  }
  if (!detectedPlayers) {
    const plainMatch = text.match(/(\d+)\s*(?:players?|people|jucatori|jucători|persoane)/i)
    if (plainMatch) {
      const n = parseInt(plainMatch[1], 10)
      if (n >= 2 && n <= 30) detectedPlayers = n
    }
  }

  // City
  let detectedCity: string | null = null
  for (const [city, keywords] of Object.entries(CITY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      detectedCity = city
      break
    }
  }

  // Time — explicit HH:MM first, then keyword-based
  let detectedTime: string | null = null
  const explicitTime = text.match(TIME_REGEX)
  if (explicitTime) {
    detectedTime = `${explicitTime[1].padStart(2, '0')}:${explicitTime[2]}`
  } else {
    for (const { keywords, time } of TIME_KEYWORDS) {
      if (keywords.some((kw) => lower.includes(kw))) {
        detectedTime = time
        break
      }
    }
  }

  return { detectedSport, detectedSkillLevel, detectedPlayers, detectedCity, detectedTime }
}
