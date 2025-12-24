# Clerk Integration - Complete Guide

## ✅ What Has Been Done

### 1. Frontend Updates
- ✅ **main.jsx** - Added ClerkProvider wrapper
- ✅ **App.jsx** - Completely refactored to use Clerk components:
  - Replaced custom auth with Clerk's `<SignedIn>`, `<SignedOut>`, `<SignIn>`, `<SignUp>`
  - Added ProfileProvider to manage user role/category
  - Created protected routes using Clerk
  - Added onboarding flow integration
- ✅ **Onboarding.jsx** - New page for role/category selection
- ✅ **StudentDashboard.jsx** - Updated to use Clerk's `useUser` and `useProfile`
- ✅ **TeacherDashboard.jsx** - Updated to use Clerk's `useUser` and `useProfile`
- ✅ **api.js** - Updated to use Clerk tokens instead of localStorage

### 2. Routing Structure
- `/sign-in` - Clerk sign in page
- `/sign-up` - Clerk sign up page
- `/onboarding` - Role and category selection (first time users)
- `/dashboard` - Main dashboard (student or teacher based on profile)

## 🔧 What You Need To Do

### Step 1: Create Clerk Account & Get Keys

1. Go to https://clerk.com/ and sign up/login
2. Create a new application
3. In Clerk Dashboard → **API Keys**:
   - Copy the **Publishable Key** (starts with `pk_...`)

### Step 2: Add Environment Variable

Create or update `question-paper-generator/client/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_API_URL=http://localhost:8000/api/v1
```

**Important:** Replace `pk_test_your_key_here` with your actual Clerk publishable key.

### Step 3: Install Dependencies

The dependencies are already in `package.json`, but make sure they're installed:

```bash
cd question-paper-generator/client
pnpm install
```

### Step 4: Create Backend Profile Endpoints

You need to create backend endpoints to store user profiles. Create these files:

#### `question-paper-generator/server/app/models/profile.py`

```python
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class ProfileBase(BaseModel):
    clerk_user_id: str
    role: str  # 'teacher' or 'student'
    category: Optional[str] = None  # 'college', 'school', 'competition' or None

class ProfileCreate(ProfileBase):
    pass

class Profile(ProfileBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    role: Optional[str] = None
    category: Optional[str] = None
```

#### `question-paper-generator/server/app/api/v1/endpoints/profile.py`

```python
from fastapi import APIRouter, HTTPException, Depends, Header
from app.models.profile import Profile, ProfileCreate, ProfileUpdate
from app.services.profile_service import ProfileService
from app.core.database import get_supabase
from supabase import Client
from typing import Optional

router = APIRouter()

def get_profile_service(supabase: Client = Depends(get_supabase)) -> ProfileService:
    return ProfileService(supabase)

# For now, we'll extract clerk_user_id from a custom header
# In production, verify Clerk JWT token properly
@router.post("/profile", response_model=Profile, status_code=201)
async def create_or_update_profile(
    profile_data: ProfileCreate,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    service: ProfileService = Depends(get_profile_service)
):
    """Create or update user profile"""
    # In production, verify Clerk JWT and extract user_id from token
    # For now, accept it from header (you'll send it from frontend)
    if not x_clerk_user_id:
        raise HTTPException(status_code=400, detail="Missing user ID")
    
    profile_data.clerk_user_id = x_clerk_user_id
    profile = await service.create_or_update_profile(profile_data)
    return profile

@router.get("/profile/me", response_model=Profile)
async def get_my_profile(
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    service: ProfileService = Depends(get_profile_service)
):
    """Get current user's profile"""
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    profile = await service.get_profile_by_clerk_id(x_clerk_user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
```

#### `question-paper-generator/server/app/services/profile_service.py`

```python
from supabase import Client
from app.models.profile import ProfileCreate, ProfileUpdate
from typing import Optional
from uuid import UUID

class ProfileService:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table = "user_profiles"
    
    async def create_or_update_profile(self, profile_data: ProfileCreate) -> dict:
        """Create or update user profile"""
        # Check if profile exists
        existing = self.supabase.table(self.table)\
            .select("*")\
            .eq("clerk_user_id", profile_data.clerk_user_id)\
            .execute()
        
        profile_dict = {
            "clerk_user_id": profile_data.clerk_user_id,
            "role": profile_data.role,
            "category": profile_data.category,
        }
        
        if existing.data and len(existing.data) > 0:
            # Update existing
            response = self.supabase.table(self.table)\
                .update(profile_dict)\
                .eq("clerk_user_id", profile_data.clerk_user_id)\
                .execute()
        else:
            # Create new
            response = self.supabase.table(self.table)\
                .insert(profile_dict)\
                .execute()
        
        if not response.data or len(response.data) == 0:
            raise ValueError("Failed to save profile")
        
        return response.data[0]
    
    async def get_profile_by_clerk_id(self, clerk_user_id: str) -> Optional[dict]:
        """Get profile by Clerk user ID"""
        response = self.supabase.table(self.table)\
            .select("*")\
            .eq("clerk_user_id", clerk_user_id)\
            .execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
```

#### Update `question-paper-generator/server/app/api/v1/api.py`

```python
from fastapi import APIRouter
from app.api.v1.endpoints import questions, auth, ai, profile

api_router = APIRouter()

# Include auth endpoints (keep for now, or remove if not needed)
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)

# Include question endpoints
api_router.include_router(
    questions.router,
    prefix="/questions",
    tags=["questions"]
)

# Include AI endpoints
api_router.include_router(
    ai.router,
    prefix="/ai",
    tags=["ai"]
)

# Include profile endpoints
api_router.include_router(
    profile.router,
    prefix="",
    tags=["profile"]
)
```

### Step 5: Create Database Table

Run this SQL in your Supabase SQL Editor:

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

### Step 6: Update Frontend to Send Clerk User ID

Update `question-paper-generator/client/src/pages/Onboarding.jsx` to send Clerk user ID:

```jsx
// In handleSubmit function, update the API call:
const response = await api.post('/profile', {
  role,
  category: role === 'student' ? category : null,
}, {
  headers: {
    'X-Clerk-User-Id': user.id  // Add this header
  }
});
```

Also update `question-paper-generator/client/src/App.jsx` in the ProfileProvider:

```jsx
// In fetchProfile function:
const response = await api.get('/profile/me', {
  headers: {
    'X-Clerk-User-Id': user.id  // Add this header
  }
});
```

## 🚀 Testing the Integration

1. **Start Backend:**
   ```bash
   cd question-paper-generator/server
   uvicorn app.main:app --reload
   ```

2. **Start Frontend:**
   ```bash
   cd question-paper-generator/client
   pnpm run dev
   ```

3. **Test Flow:**
   - Go to http://localhost:5173
   - Click "Sign Up" (Clerk will handle this)
   - After sign up, you'll be redirected to `/onboarding`
   - Select role (Student/Teacher)
   - If Student, select category (College/School/Competition)
   - Complete setup → redirected to dashboard
   - Dashboard will show based on role

## 🔒 Security Note

**Current Implementation:** The backend accepts `X-Clerk-User-Id` header from frontend. This is fine for development but **NOT secure for production**.

**For Production:** You should:
1. Verify Clerk JWT tokens on the backend
2. Extract `clerk_user_id` from the verified token
3. Never trust headers from the frontend

You can use Clerk's backend SDK or verify JWTs manually using Clerk's public keys.

## 📝 Next Steps

1. ✅ Add Clerk publishable key to `.env`
2. ✅ Create backend profile endpoints (files above)
3. ✅ Create database table
4. ✅ Update frontend to send Clerk user ID in headers
5. ✅ Test the complete flow
6. ⚠️ For production: Implement proper JWT verification

## 🐛 Troubleshooting

### "Missing Publishable Key" error
- Check that `VITE_CLERK_PUBLISHABLE_KEY` is in `client/.env`
- Restart dev server after adding it

### "Profile not found" error
- Make sure you've created the `user_profiles` table
- Check that the backend endpoint is working
- Verify Clerk user ID is being sent in headers

### Dashboard not showing correctly
- Check browser console for errors
- Verify profile is being fetched correctly
- Check that role/category are set in database






