# User Data Storage - Complete Guide

## 📊 Where User Data is Stored

### 1. **Clerk (Authentication Data) - AUTOMATIC, NO WORK NEEDED**

**What Clerk Stores:**
- User email addresses
- Password hashes (encrypted)
- Session tokens
- User metadata (name, profile picture, etc.)
- Authentication history

**Location:** Clerk's cloud database (managed by Clerk)
**Your Work:** ✅ **NONE** - Clerk handles everything automatically

**How it works:**
- When users sign up/login, Clerk stores their credentials
- Clerk provides JWT tokens for authentication
- You never touch passwords or auth data directly

---

### 2. **Your Supabase Database (Application Data) - YOU NEED TO CREATE**

**What You Store:**
- User profiles (role, category)
- Questions
- User-generated content (notes, flashcards, mind maps, etc.)
- Question papers
- Practice sessions

**Location:** Your Supabase PostgreSQL database

**Tables You Need to Create:**

#### A. `user_profiles` Table
Stores role and category for each user:

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,  -- Links to Clerk user
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  category TEXT CHECK (category IN ('college', 'school', 'competition')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Your Work:** ✅ **CREATE THIS TABLE** (see Step 1 below)

#### B. `questions` Table (Already exists, but needs updates)
Stores question library:

```sql
-- Add category column if missing
ALTER TABLE questions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id);
```

**Your Work:** ✅ **RUN THESE ALTER STATEMENTS** (see Step 2 below)

#### C. Future Tables (For storing user-generated content)
You'll need these later:

```sql
-- User notes
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_pdf_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User flashcards
CREATE TABLE IF NOT EXISTS user_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  subject TEXT,
  topic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User mind maps
CREATE TABLE IF NOT EXISTS user_mind_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  data JSONB NOT NULL,  -- Stores mind map structure
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User question papers
CREATE TABLE IF NOT EXISTS user_question_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  question_ids UUID[] NOT NULL,  -- Array of question IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User practice sessions
CREATE TABLE IF NOT EXISTS user_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  question_ids UUID[] NOT NULL,
  score INTEGER,
  total_questions INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Your Work:** ✅ **CREATE THESE WHEN YOU NEED THEM** (optional for now)

---

## 🔧 What You Need To Do

### Step 1: Create `user_profiles` Table (REQUIRED)

1. Go to your Supabase Dashboard
2. Click **SQL Editor**
3. Click **New Query**
4. Paste this SQL:

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  category TEXT CHECK (category IN ('college', 'school', 'competition')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_user_id);
```

5. Click **Run**

**This is REQUIRED** - Without this table, onboarding won't work!

---

### Step 2: Update `questions` Table (REQUIRED)

In the same SQL Editor, run:

```sql
-- Add category column if it doesn't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS category TEXT;

-- Add user_id column if it doesn't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
```

---

### Step 3: Create Backend Profile Endpoints (REQUIRED)

You need to create the backend code to save/retrieve profiles. See `CLERK_INTEGRATION_GUIDE.md` for the complete code.

**Files to create:**
- `server/app/models/profile.py`
- `server/app/services/profile_service.py`
- `server/app/api/v1/endpoints/profile.py`
- Update `server/app/api/v1/api.py` to include profile router

---

## 📋 Data Flow Summary

### When User Signs Up:
1. **Clerk** stores authentication (email, password) ✅ Automatic
2. User completes **onboarding** (selects role/category)
3. **Your backend** saves to `user_profiles` table in Supabase
4. **Your app** uses this profile to show correct dashboard

### When User Logs In:
1. **Clerk** verifies credentials ✅ Automatic
2. **Your app** fetches profile from `user_profiles` table
3. **Your app** shows dashboard based on role/category

### When User Creates Content:
1. User generates notes/flashcards/etc. via AI
2. **Your backend** saves to respective tables in Supabase
3. Content is linked to user via `user_id` (from `user_profiles`)

---

## 🔐 Security & Privacy

### Clerk Data:
- ✅ Encrypted at rest
- ✅ Compliant with security standards
- ✅ You never see passwords
- ✅ Managed by Clerk (you don't manage it)

### Your Database Data:
- ⚠️ You are responsible for securing Supabase
- ⚠️ Use Row Level Security (RLS) policies in Supabase
- ⚠️ Never expose sensitive data in API responses
- ⚠️ Validate all inputs before saving

---

## ✅ Checklist

- [ ] Create `user_profiles` table in Supabase
- [ ] Update `questions` table with category and user_id columns
- [ ] Create backend profile endpoints (see CLERK_INTEGRATION_GUIDE.md)
- [ ] Test onboarding flow
- [ ] (Optional) Create tables for user-generated content when needed

---

## 🆘 Troubleshooting

### "Profile not found" error
- ✅ Check `user_profiles` table exists
- ✅ Check backend profile endpoints are created
- ✅ Verify Clerk user ID is being sent correctly

### "Category filter not working"
- ✅ Check `questions` table has `category` column
- ✅ Verify questions have category values set
- ✅ Check backend filtering logic

### Data not persisting
- ✅ Check Supabase connection in `.env`
- ✅ Verify table permissions
- ✅ Check backend error logs






