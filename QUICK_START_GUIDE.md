# Quick Start Guide - What You Need To Do

## ✅ Fixed Issues

1. ✅ **Google Generative AI package installed** - Server should start now
2. ✅ **AI Service updated** - Now uses Gemini API correctly
3. ✅ **Clerk integration complete** - Frontend ready for Clerk auth

---

## 📍 Where User Data is Stored - Simple Answer

### **Clerk (Authentication) - ZERO WORK**
- Stores: Email, password, sessions
- Location: Clerk's cloud (you don't manage it)
- Your work: **NONE** - Clerk handles everything

### **Your Supabase Database - YOU NEED TO CREATE TABLES**
- Stores: User profiles (role, category), questions, user content
- Location: Your Supabase PostgreSQL database
- Your work: **CREATE TABLES** (see below)

---

## 🔧 What You Must Do (Step by Step)

### Step 1: Get API Keys

#### A. Clerk Publishable Key
1. Go to https://clerk.com/
2. Create account → Create application
3. Copy **Publishable Key** (starts with `pk_...`)

#### B. Gemini API Key
1. Go to https://aistudio.google.com/apikey
2. Create API key
3. Copy the key

### Step 2: Add Environment Variables

#### Frontend (`question-paper-generator/client/.env`):
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here
VITE_API_URL=http://localhost:8000/api/v1
```

#### Backend (`question-paper-generator/server/.env`):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET_KEY=your_jwt_secret_key
ALLOW_ORIGINS=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
```

### Step 3: Create Database Tables (REQUIRED)

Go to Supabase Dashboard → SQL Editor → Run this:

```sql
-- 1. Create user_profiles table (REQUIRED)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  category TEXT CHECK (category IN ('college', 'school', 'competition')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_user_id);

-- 2. Update questions table (REQUIRED)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
```

### Step 4: Create Backend Profile Endpoints (REQUIRED)

You need to create these files. See `CLERK_INTEGRATION_GUIDE.md` for complete code:

1. `server/app/models/profile.py`
2. `server/app/services/profile_service.py`
3. `server/app/api/v1/endpoints/profile.py`
4. Update `server/app/api/v1/api.py` to include profile router

**Quick copy-paste code is in `CLERK_INTEGRATION_GUIDE.md` section "Step 4"**

### Step 5: Test

1. Start backend: `cd question-paper-generator/server && uvicorn app.main:app --reload`
2. Start frontend: `cd question-paper-generator/client && pnpm run dev`
3. Visit http://localhost:5173
4. Sign up with Clerk
5. Complete onboarding
6. Check Supabase `user_profiles` table - you should see your profile

---

## 📊 Data Storage Summary

| What | Where | You Manage? |
|------|-------|-------------|
| Email/Password | Clerk Cloud | ❌ No (automatic) |
| Role/Category | Supabase `user_profiles` | ✅ Yes (create table) |
| Questions | Supabase `questions` | ✅ Yes (add columns) |
| User Notes | Browser memory (for now) | ⚠️ Later (create table) |
| Flashcards | Browser memory (for now) | ⚠️ Later (create table) |

---

## 🎯 Your Work Checklist

- [ ] Get Clerk publishable key → Add to `client/.env`
- [ ] Get Gemini API key → Add to `server/.env`
- [ ] Create `user_profiles` table in Supabase
- [ ] Update `questions` table (add category, user_id columns)
- [ ] Create backend profile endpoints (4 files)
- [ ] Test sign up → onboarding → dashboard flow

---

## 🐛 Common Issues

### Server won't start
- ✅ Fixed: `google-generativeai` package installed
- If still errors: Check `GEMINI_API_KEY` is in `.env`

### "Profile not found"
- Check `user_profiles` table exists
- Check backend profile endpoints are created
- Verify Clerk user ID is being sent

### Frontend shows Clerk warning
- This is normal for development
- Production keys won't show this warning

---

## 📚 Detailed Guides

- **`CLERK_INTEGRATION_GUIDE.md`** - Complete Clerk setup with code
- **`DATA_STORAGE_EXPLAINED.md`** - Detailed data storage explanation
- **`USER_DATA_STORAGE_GUIDE.md`** - Database schema details

---

## 🚀 Next Steps After Setup

1. Test authentication flow
2. Test AI features (upload PDF, generate notes)
3. Test role-based filtering (students see student content, teachers see teacher content)
4. (Later) Add persistence for user-generated content






