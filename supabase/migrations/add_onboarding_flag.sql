-- Add onboarding completion flag to profiles
alter table public.profiles
  add column if not exists has_completed_onboarding boolean not null default false;

-- Mark existing users who already have sports set as onboarded
-- (safe to run on existing data)
update public.profiles
  set has_completed_onboarding = true
  where sports is not null and array_length(sports, 1) > 0;
