-- DATA LOSS WARNING: This script drops existing tables to fix the schema mismatch.
-- This is necessary because we are changing user_id from TEXT (Clerk) to UUID (Supabase).
-- Since IDs change, old data would be orphaned anyway.

DROP TABLE IF EXISTS public.question_papers CASCADE;
DROP TABLE IF EXISTS public.user_notes CASCADE;
DROP TABLE IF EXISTS public.user_flashcards CASCADE;
DROP TABLE IF EXISTS public.user_quizzes CASCADE;
DROP TABLE IF EXISTS public.user_mindmaps CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Re-create tables with correct UUID schema

-- User Profiles (linked to Supabase Auth Users)
create table public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('teacher', 'student')),
  category text check (category in ('college', 'school', 'competition')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS for Profiles
alter table public.user_profiles enable row level security;

create policy "Users can view their own profile"
  on public.user_profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.user_profiles for update
  using ( auth.uid() = id );

create policy "Users can insert their own profile"
  on public.user_profiles for insert
  with check ( auth.uid() = id );

-- User Notes
create table public.user_notes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    title text,
    content text not null,
    source_pdf_name text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- User Flashcards
create table public.user_flashcards (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    deck_title text,
    cards jsonb not null default '[]'::jsonb,
    source_pdf_name text,
    created_at timestamptz default now() not null
);

-- User Quizzes
create table public.user_quizzes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    title text,
    questions jsonb not null default '[]'::jsonb,
    score integer,
    total_questions integer,
    source_pdf_name text,
    created_at timestamptz default now() not null
);

-- User Mindmaps
create table public.user_mindmaps (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    title text,
    data jsonb not null default '{}'::jsonb,
    source_pdf_name text,
    created_at timestamptz default now() not null
);

-- Question Papers (Teachers)
create table public.question_papers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  title text not null,
  category text not null,
  total_marks integer,
  duration_minutes integer,
  instructions text,
  questions jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes
create index idx_user_notes_user_id on public.user_notes(user_id);
create index idx_user_flashcards_user_id on public.user_flashcards(user_id);
create index idx_user_quizzes_user_id on public.user_quizzes(user_id);
create index idx_user_mindmaps_user_id on public.user_mindmaps(user_id);
create index idx_question_papers_user_id on public.question_papers(user_id);

-- RLS for User Content
alter table public.user_notes enable row level security;
create policy "Users can CRUD their own notes"
  on public.user_notes for all
  using ( auth.uid() = user_id );

alter table public.user_flashcards enable row level security;
create policy "Users can CRUD their own flashcards"
  on public.user_flashcards for all
  using ( auth.uid() = user_id );

alter table public.user_quizzes enable row level security;
create policy "Users can CRUD their own quizzes"
  on public.user_quizzes for all
  using ( auth.uid() = user_id );

alter table public.user_mindmaps enable row level security;
create policy "Users can CRUD their own mindmaps"
  on public.user_mindmaps for all
  using ( auth.uid() = user_id );

alter table public.question_papers enable row level security;
create policy "Teachers can CRUD their own papers"
  on public.question_papers for all
  using ( auth.uid() = user_id );
