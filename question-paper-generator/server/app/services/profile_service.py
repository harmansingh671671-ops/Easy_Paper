from supabase import Client
from app.models.profile import ProfileCreate, ProfileUpdate
from typing import Optional

class ProfileService:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table = "user_profiles"
    
    async def create_or_update_profile(self, user_id: str, profile_data: ProfileCreate) -> dict:
        """Create or update user profile"""
        # Check if profile exists
        existing = self.supabase.table(self.table)\
            .select("*")\
            .eq("id", user_id)\
            .execute()
        
        profile_dict = {
            "id": user_id,
            "role": profile_data.role,
        }
        if profile_data.category:
            profile_dict["category"] = profile_data.category
        if profile_data.categories:
            profile_dict["categories"] = profile_data.categories
        
        if existing.data and len(existing.data) > 0:
            # Update existing
            self.supabase.table(self.table)\
                .update(profile_dict)\
                .eq("id", user_id)\
                .execute()
        else:
            # Create new
            self.supabase.table(self.table)\
                .insert(profile_dict)\
                .execute()
        
        # Explicitly fetch the profile to ensure we return the latest data
        # This avoids issues where insert/update might not return the row
        return await self.get_profile_by_user_id(user_id)
    
    async def get_profile_by_user_id(self, user_id: str) -> Optional[dict]:
        """Get profile by User ID"""
        response = self.supabase.table(self.table)\
            .select("*")\
            .eq("id", user_id)\
            .execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    
    async def update_profile(self, user_id: str, profile_update: ProfileUpdate) -> Optional[dict]:
        """Update profile fields"""
        update_data = profile_update.model_dump(exclude_unset=True)
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        if not update_data:
            return None
        
        response = self.supabase.table(self.table)\
            .update(update_data)\
            .eq("id", user_id)\
            .execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None






