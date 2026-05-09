-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add daily_availability column (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists daily_availability boolean default false;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Seed 10 mock profiles
--    These are standalone rows — no auth.users entry needed for demo purposes.
--    We use gen_random_uuid() so each run produces stable-looking but unique ids.
--    If you want fixed ids, replace gen_random_uuid() with the literal UUIDs below.
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.profiles (
  id, name, bio, location,
  avatar_emoji, skill_level,
  sports, availability, time_preference,
  games_played, streak,
  has_completed_onboarding, daily_availability
) values

-- 1 ── Alexandru Ionescu  (Football + Running, Advanced, Bucharest)
(
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Alexandru Ionescu',
  'Passionate about football and long-distance running. Always looking for competitive games.',
  'Bucharest',
  '😎', 'Advanced',
  ARRAY['football','running'],
  ARRAY['Mon','Wed','Fri','Sat'],
  'evening',
  24, 7,
  true, false
),

-- 2 ── Maria Constantin  (Tennis + Padel, Intermediate, Bucharest)
(
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Maria Constantin',
  'Tennis enthusiast since age 12. Recently got into padel and loving it!',
  'Bucharest',
  '🎯', 'Intermediate',
  ARRAY['tennis','padel'],
  ARRAY['Tue','Thu','Sat','Sun'],
  'morning',
  18, 5,
  true, false
),

-- 3 ── Andrei Popescu  (Basketball + Football, Beginner, Cluj)
(
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Andrei Popescu',
  'Just moved to Cluj and looking for people to play with. Beginner but very motivated!',
  'Cluj',
  '🏋️', 'Beginner',
  ARRAY['basketball','football'],
  ARRAY['Sat','Sun'],
  'afternoon',
  6, 2,
  true, false
),

-- 4 ── Sofia Dumitrescu  (Running + Cycling + Swimming, Pro, Bucharest)
(
  'a1b2c3d4-0004-4000-8000-000000000004',
  'Sofia Dumitrescu',
  'Marathon runner and triathlete. Coaching available for serious athletes.',
  'Bucharest',
  '🏃', 'Pro',
  ARRAY['running','cycling','swimming'],
  ARRAY['Mon','Tue','Wed','Thu','Fri'],
  'morning',
  87, 21,
  true, false
),

-- 5 ── Mihai Georgescu  (Football + Basketball + Volleyball, Advanced, Timisoara)
(
  'a1b2c3d4-0005-4000-8000-000000000005',
  'Mihai Georgescu',
  'Team sports are my thing. Played semi-pro football for 3 years in Timisoara.',
  'Timisoara',
  '😊', 'Advanced',
  ARRAY['football','basketball','volleyball'],
  ARRAY['Wed','Fri','Sat','Sun'],
  'evening',
  45, 12,
  true, false
),

-- 6 ── Elena Radu  (Tennis + Padel + Volleyball, Intermediate, Cluj)
(
  'a1b2c3d4-0006-4000-8000-000000000006',
  'Elena Radu',
  'Weekend warrior. Love racket sports and beach volleyball in summer.',
  'Cluj',
  '😊', 'Intermediate',
  ARRAY['tennis','padel','volleyball'],
  ARRAY['Sat','Sun'],
  'morning',
  31, 8,
  true, false
),

-- 7 ── Cristian Munteanu  (Cycling + Running, Intermediate, Timisoara)
(
  'a1b2c3d4-0007-4000-8000-000000000007',
  'Cristian Munteanu',
  'Cycling is my meditation. 100km rides every weekend, looking for pace partners.',
  'Timisoara',
  '🤓', 'Intermediate',
  ARRAY['cycling','running'],
  ARRAY['Sat','Sun'],
  'morning',
  19, 4,
  true, false
),

-- 8 ── Ioana Stanescu  (Padel + Tennis, Advanced, Bucharest)
(
  'a1b2c3d4-0008-4000-8000-000000000008',
  'Ioana Stanescu',
  'Padel addict. Ranked top 50 in Bucharest amateur circuit. Always up for a match.',
  'Bucharest',
  '🎯', 'Advanced',
  ARRAY['padel','tennis'],
  ARRAY['Mon','Wed','Fri','Sat'],
  'evening',
  52, 15,
  true, false
),

-- 9 ── Bogdan Nistor  (Football + Basketball, Beginner, Bucharest)
(
  'a1b2c3d4-0009-4000-8000-000000000009',
  'Bogdan Nistor',
  'Software dev by day, aspiring footballer by night. Looking for casual friendly games.',
  'Bucharest',
  '🤓', 'Beginner',
  ARRAY['football','basketball'],
  ARRAY['Tue','Thu','Sat'],
  'evening',
  9, 3,
  true, false
),

-- 10 ── Laura Popa  (Swimming + Cycling + Running, Pro, Cluj)
(
  'a1b2c3d4-0010-4000-8000-000000000010',
  'Laura Popa',
  'Open-water swimmer and ultra-cyclist. If you want to push your limits, let''s train together.',
  'Cluj',
  '🏋️', 'Pro',
  ARRAY['swimming','cycling','running'],
  ARRAY['Mon','Tue','Wed','Thu','Fri','Sat'],
  'morning',
  63, 18,
  true, false
)

on conflict (id) do update set
  name                    = excluded.name,
  bio                     = excluded.bio,
  location                = excluded.location,
  avatar_emoji            = excluded.avatar_emoji,
  skill_level             = excluded.skill_level,
  sports                  = excluded.sports,
  availability            = excluded.availability,
  time_preference         = excluded.time_preference,
  games_played            = excluded.games_played,
  streak                  = excluded.streak,
  has_completed_onboarding = excluded.has_completed_onboarding;
