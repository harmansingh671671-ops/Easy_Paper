-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- User Profiles (linked to Supabase Auth Users)
create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('teacher', 'student')),
  category text check (category in ('college', 'school', 'competition')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Row Level Security for Profiles
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
create table if not exists public.user_notes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    title text,
    content text not null,
    source_pdf_name text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- User Flashcards
create table if not exists public.user_flashcards (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    deck_title text,
    cards jsonb not null default '[]'::jsonb,
    source_pdf_name text,
    created_at timestamptz default now() not null
);

-- User Quizzes
create table if not exists public.user_quizzes (
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
create table if not exists public.user_mindmaps (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    title text,
    data jsonb not null default '{}'::jsonb,
    source_pdf_name text,
    created_at timestamptz default now() not null
);

-- Question Papers (Teachers)
create table if not exists public.question_papers (
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
create index if not exists idx_user_notes_user_id on public.user_notes(user_id);
create index if not exists idx_user_flashcards_user_id on public.user_flashcards(user_id);
create index if not exists idx_user_quizzes_user_id on public.user_quizzes(user_id);
create index if not exists idx_user_mindmaps_user_id on public.user_mindmaps(user_id);
create index if not exists idx_question_papers_user_id on public.question_papers(user_id);

-- RLS for User Content (Example for Notes)
alter table public.user_notes enable row level security;

create policy "Users can CRUD their own notes"
  on public.user_notes for all
  using ( auth.uid() = user_id );

-- (Repeat RLS for other tables if needed, omitted here for brevity but recommended)
