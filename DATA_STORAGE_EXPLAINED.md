# User Data Storage - Detailed Explanation

## 📍 Where User Data is Stored

### 1. **Clerk (Authentication & Identity) - ZERO WORK FROM YOU**

**What Clerk Stores:**
- ✅ User email addresses
- ✅ Encrypted password hashes (you never see passwords)
- ✅ Session tokens and refresh tokens
- ✅ User profile information (name, profile picture)
- ✅ Authentication history and security logs
- ✅ Multi-factor authentication settings

**Location:** Clerk's secure cloud database (managed entirely by Clerk)

**Your Work Required:** ✅ **NONE - Clerk handles everything automatically**

**How It Works:**
1. User signs up → Clerk creates account in their database
2. User logs in → Clerk verifies credentials and issues JWT token
3. Your app uses the JWT token to identify the user
4. You never touch passwords or auth data directly

**Important:** You don't need to create any tables or manage any code for Clerk authentication. It's completely handled by Clerk's service.

---

### 2. **Your Supabase Database (Application Data) - YOU NEED TO CREATE**

This is where **your application data** lives. You need to create these tables.

#### A. `user_profiles` Table (REQUIRED - Create This First!)

**Purpose:** Stores each user's role (student/teacher) and category (college/school/competition)

**What It Stores:**
- `clerk_user_id` - Links to Clerk user (this is how you connect Clerk to your data)
- `role` - 'teacher' or 'student'
- `category` - 'college', 'school', 'competition', or NULL (for teachers)

**Your Work:** ✅ **CREATE THIS TABLE** (see SQL below)

**SQL to Run in Supabase:**
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

**When Data is Saved:**
- User completes onboarding → Your backend saves to this table
- This happens via `POST /api/v1/profile` endpoint (you need to create this)

---

#### B. `questions` Table (Already Exists, But Needs Updates)

**Purpose:** Stores the question library

**What It Stores:**
- Question text, options, answers
- Subject, class, difficulty
- **NEW:** `category` column (to filter by college/school/competition)
- **NEW:** `user_id` column (to link questions to users who created them)

**Your Work:** ✅ **ADD THESE COLUMNS** (see SQL below)

**SQL to Run:**
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

#### C. User-Generated Content Tables (Optional - Create When Needed)

These store content created by users (notes, flashcards, etc.):

**1. `user_notes`** - Stores AI-generated short notes
**2. `user_flashcards`** - Stores flashcards created from PDFs
**3. `user_mind_maps`** - Stores mind map structures
**4. `user_question_papers`** - Stores question papers created by teachers
**5. `user_practice_sessions`** - Stores practice session results

**Your Work:** ⚠️ **CREATE THESE LATER** when you implement persistence (for now, data is only in browser memory)

---

## 🔄 Complete Data Flow

### When User Signs Up:

1. **Clerk (Automatic):**
   - User enters email/password on Clerk's sign-up page
   - Clerk stores credentials in their database ✅ (You do nothing)
   - Clerk creates a user ID (e.g., `user_2abc123xyz`)

2. **Your App (You Need to Handle):**
   - User is redirected to `/onboarding`
   - User selects role (student/teacher)
   - If student, user selects category (college/school/competition)
   - Your frontend calls `POST /api/v1/profile` with:
     ```json
     {
       "role": "student",
       "category": "college"
     }
     ```
   - Your backend saves to `user_profiles` table in Supabase
   - **This is where you need to create the backend code!**

### When User Logs In:

1. **Clerk (Automatic):**
   - User enters email/password
   - Clerk verifies and issues JWT token ✅ (You do nothing)

2. **Your App (You Need to Handle):**
   - Frontend gets JWT token from Clerk
   - Frontend calls `GET /api/v1/profile/me` with Clerk user ID
   - Backend looks up `user_profiles` table by `clerk_user_id`
   - Returns `{ role: "student", category: "college" }`
   - Frontend uses this to show correct dashboard
   - **This is where you need to create the backend code!**

### When User Creates Content:

1. **AI Generation:**
   - User uploads PDF or pastes text
   - Backend calls Gemini AI to generate notes/flashcards/etc.
   - Content is returned to frontend

2. **Storage (Currently in Browser Memory):**
   - Content is stored in React state (temporary)
   - Lost when user refreshes page

3. **Future: Persistence (You'll Add Later):**
   - Save to `user_notes`, `user_flashcards`, etc. tables
   - Link to user via `user_id` from `user_profiles`

---

## ✅ What You Need To Do

### Step 1: Create Database Tables (REQUIRED)

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from sections A and B above
3. Verify tables exist in Table Editor

### Step 2: Create Backend Profile Endpoints (REQUIRED)

Create these files (see `CLERK_INTEGRATION_GUIDE.md` for full code):

- `server/app/models/profile.py` - Pydantic models
- `server/app/services/profile_service.py` - Database operations
- `server/app/api/v1/endpoints/profile.py` - API endpoints
- Update `server/app/api/v1/api.py` - Add profile router

### Step 3: Add Gemini API Key (REQUIRED)

Add to `question-paper-generator/server/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

Get your key from: https://aistudio.google.com/apikey

### Step 4: Test the Flow

1. Sign up with Clerk
2. Complete onboarding
3. Check `user_profiles` table in Supabase - you should see your profile
4. Login again - dashboard should show based on role

---

## 🔐 Security Summary

### Clerk Data:
- ✅ Fully encrypted
- ✅ SOC 2 compliant
- ✅ You never see passwords
- ✅ Managed by Clerk (zero maintenance)

### Your Database Data:
- ⚠️ You are responsible for security
- ⚠️ Use Supabase Row Level Security (RLS)
- ⚠️ Validate all inputs
- ⚠️ Never expose sensitive data

---

## 📊 Data Ownership

| Data Type | Stored By | You Manage? | Location |
|-----------|-----------|-------------|----------|
| Email/Password | Clerk | ❌ No | Clerk Cloud |
| Role/Category | You | ✅ Yes | Supabase `user_profiles` |
| Questions | You | ✅ Yes | Supabase `questions` |
| User Notes | You | ✅ Yes (later) | Supabase `user_notes` |
| Flashcards | You | ✅ Yes (later) | Supabase `user_flashcards` |

---

## 🎯 Summary

**Clerk Handles:**
- ✅ Authentication (sign up, login, password management)
- ✅ Session management
- ✅ User identity

**You Handle:**
- ✅ User profiles (role, category) - **CREATE TABLE + BACKEND CODE**
- ✅ Application data (questions, notes, etc.) - **CREATE TABLES + BACKEND CODE**
- ✅ Business logic (filtering, permissions, etc.)

**Bottom Line:** Clerk = Authentication only. Everything else = Your database + your code.






