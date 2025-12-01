-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
create type program_enum as enum ('PGP', 'EPGP', 'PHD', 'FPM', 'EXEC');
create type activity_type_enum as enum ('Lunch', 'Coffee', 'Walk', 'Sport', 'Study', 'Hangout', 'Chat');
create type slot_status_enum as enum ('Open', 'Matched');

-- Users Table
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text,
  program program_enum,
  year int,
  section char(1),
  interests text[],
  bio text,
  reliability_score float default 5.0,
  created_at timestamp with time zone default now()
);

-- Availability Slots Table
create table availability_slots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  day_of_week text not null, -- e.g., 'Monday', 'Tuesday'
  time_slot time not null,
  activity_type activity_type_enum not null,
  status slot_status_enum default 'Open',
  created_at timestamp with time zone default now()
);

-- Matches Table
create table matches (
  id uuid primary key default uuid_generate_v4(),
  user_1_id uuid references users(id) on delete cascade not null,
  user_2_id uuid references users(id) on delete cascade not null,
  activity_type activity_type_enum not null,
  scheduled_time timestamp with time zone,
  location text,
  rating_user_1 int check (rating_user_1 between 1 and 5),
  rating_user_2 int check (rating_user_2 between 1 and 5),
  created_at timestamp with time zone default now()
);

-- RLS Policies (Basic setup, refine as needed)
alter table users enable row level security;
alter table availability_slots enable row level security;
alter table matches enable row level security;

-- Allow users to read their own data and public profile data (simplified for MVP)
create policy "Public profiles are viewable by everyone" on users for select using (true);
create policy "Users can insert their own profile" on users for insert with check (auth.uid() = id);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

-- Availability policies
create policy "Availability viewable by everyone" on availability_slots for select using (true);
create policy "Users can insert own slots" on availability_slots for insert with check (auth.uid() = user_id);
create policy "Users can update own slots" on availability_slots for update using (auth.uid() = user_id);

-- Matches policies
create policy "Users can view their own matches" on matches for select using (auth.uid() = user_1_id or auth.uid() = user_2_id);
