-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  bio text,
  location text,
  avatar_url text,
  avatar_emoji text default '👤',
  skill_level text check (skill_level in ('Beginner','Intermediate','Advanced','Pro')),
  sports text[] default '{}',
  availability text[] default '{}',
  time_preference text,
  games_played int default 0,
  streak int default 0,
  created_at timestamptz default now()
);

-- EVENTS
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  created_by uuid references public.profiles(id) on delete cascade,
  sport text not null,
  emoji text,
  gradient text,
  title text not null,
  description text,
  location text not null,
  event_date date not null,
  event_time time not null,
  max_players int not null,
  current_players int default 1,
  skill_level text,
  is_public boolean default true,
  status text default 'open' check (status in ('open','full','cancelled','completed')),
  created_at timestamptz default now()
);

-- EVENT PARTICIPANTS
create table public.event_participants (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  status text default 'confirmed' check (status in ('confirmed','pending','declined')),
  joined_at timestamptz default now(),
  unique(event_id, user_id)
);

-- CHAT ROOMS (one per event)
create table public.chat_rooms (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade unique,
  created_at timestamptz default now()
);

-- MESSAGES
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.chat_rooms(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.messages enable row level security;

-- POLICIES: profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- POLICIES: events
create policy "Public events are viewable by everyone"
  on public.events for select using (is_public = true or created_by = auth.uid());

create policy "Authenticated users can create events"
  on public.events for insert with check (auth.uid() = created_by);

create policy "Event creators can update their events"
  on public.events for update using (auth.uid() = created_by);

-- POLICIES: event_participants
create policy "Participants viewable by room members"
  on public.event_participants for select using (true);

create policy "Users can join events"
  on public.event_participants for insert with check (auth.uid() = user_id);

create policy "Users can leave events"
  on public.event_participants for delete using (auth.uid() = user_id);

-- POLICIES: chat_rooms
create policy "Chat rooms viewable by authenticated users"
  on public.chat_rooms for select using (auth.uid() is not null);

-- POLICIES: messages
create policy "Messages viewable by authenticated users"
  on public.messages for select using (auth.uid() is not null);

create policy "Authenticated users can send messages"
  on public.messages for insert with check (auth.uid() = sender_id);

-- FUNCTION: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'New Player'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- STORAGE policy for avatars
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
