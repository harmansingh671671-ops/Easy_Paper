-- Create tables for AI generated content if they don't exist
-- This aligns the database schema with the backend code (ai.py, history.py)

-- 1. Lecture Notes (Short Notes)
create table if not exists public.lecture_notes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    topic text,
    content text not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 2. Flashcards
create table if not exists public.ai_flashcards (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    topic text,
    cards jsonb not null default '[]'::jsonb, -- List of {front, back}
    created_at timestamptz default now() not null
);

-- 3. Quizzes
create table if not exists public.ai_quizzes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    topic text,
    questions jsonb not null default '[]'::jsonb, -- List of question objects
    created_at timestamptz default now() not null
);

-- 4. Mind Maps
create table if not exists public.ai_mindmaps (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    topic text,
    structure jsonb not null default '{}'::jsonb, -- Mind map structure
    created_at timestamptz default now() not null
);

-- Indexes for performance
create index if not exists idx_lecture_notes_user_id on public.lecture_notes(user_id);
create index if not exists idx_ai_flashcards_user_id on public.ai_flashcards(user_id);
create index if not exists idx_ai_quizzes_user_id on public.ai_quizzes(user_id);
create index if not exists idx_ai_mindmaps_user_id on public.ai_mindmaps(user_id);

-- RLS Policies (Row Level Security)
-- Ensure RLS is enabled
alter table public.lecture_notes enable row level security;
alter table public.ai_flashcards enable row level security;
alter table public.ai_quizzes enable row level security;
alter table public.ai_mindmaps enable row level security;

-- Create policies (using DO block to avoid error if policy exists, or simple CREATE POLICY IF NOT EXISTS syntax if supported by Postgres version, but standard postgres doesn't support IF NOT EXISTS for policies easily without a block. We'll use simple CREATE and ignore error if user runs it and it fails on policy existence, or drop first).
-- Simpler approach: drop policy if exists then create.

drop policy if exists "Users can CRUD their own lecture notes" on public.lecture_notes;
create policy "Users can CRUD their own lecture notes"
  on public.lecture_notes for all
  using ( auth.uid() = user_id );

drop policy if exists "Users can CRUD their own ai flashcards" on public.ai_flashcards;
create policy "Users can CRUD their own ai flashcards"
  on public.ai_flashcards for all
  using ( auth.uid() = user_id );

drop policy if exists "Users can CRUD their own ai quizzes" on public.ai_quizzes;
create policy "Users can CRUD their own ai quizzes"
  on public.ai_quizzes for all
  using ( auth.uid() = user_id );

drop policy if exists "Users can CRUD their own ai mindmaps" on public.ai_mindmaps;
create policy "Users can CRUD their own ai mindmaps"
  on public.ai_mindmaps for all
  using ( auth.uid() = user_id );
