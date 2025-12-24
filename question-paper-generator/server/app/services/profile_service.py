from supabase import Client
from app.models.profile import ProfileCreate, ProfileUpdate
from typing import Optional

class ProfileService:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table = "user_profiles"
    
    async def create_or_update_profile(self, clerk_user_id: str, profile_data: ProfileCreate) -> dict:
        """Create or update user profile"""
        # Check if profile exists
        existing = self.supabase.table(self.table)\
            .select("*")\
            .eq("clerk_user_id", clerk_user_id)\
            .execute()
        
        profile_dict = {
            "clerk_user_id": clerk_user_id,
            "role": profile_data.role,
        }
        if profile_data.category:
            profile_dict["category"] = profile_data.category
        
        if existing.data and len(existing.data) > 0:
            # Update existing
            response = self.supabase.table(self.table)\
                .update(profile_dict)\
                .eq("clerk_user_id", clerk_user_id)\
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
    
    async def update_profile(self, clerk_user_id: str, profile_update: ProfileUpdate) -> Optional[dict]:
        """Update profile fields"""
        update_data = profile_update.model_dump(exclude_unset=True)
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        if not update_data:
            return None
        
        response = self.supabase.table(self.table)\
            .update(update_data)\
            .eq("clerk_user_id", clerk_user_id)\
            .execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None






