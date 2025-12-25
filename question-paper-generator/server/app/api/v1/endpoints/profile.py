from fastapi import APIRouter, HTTPException, Depends, Header
from app.models.profile import Profile, ProfileCreate, ProfileUpdate
from app.services.profile_service import ProfileService
from app.core.database import get_supabase
from supabase import Client
from typing import Optional

router = APIRouter()

def get_profile_service(supabase: Client = Depends(get_supabase)) -> ProfileService:
    return ProfileService(supabase)

@router.post("/profile", response_model=Profile, status_code=201)
async def create_or_update_profile(
    profile_data: ProfileCreate,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    service: ProfileService = Depends(get_profile_service)
):
    """Create or update user profile"""
    # In production, verify Clerk JWT and extract user_id from token
    # For now, accept it from header (sent from frontend)
    if not x_clerk_user_id:
        raise HTTPException(status_code=400, detail="Missing user ID")
    
    # Override clerk_user_id from header (more secure)
    # profile_data.clerk_user_id = x_clerk_user_id
    
    try:
        profile = await service.create_or_update_profile(
            clerk_user_id=x_clerk_user_id,
            profile_data=profile_data
        )
        return profile
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save profile: {str(e)}")

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

@router.put("/profile/me", response_model=Profile)
async def update_my_profile(
    profile_update: ProfileUpdate,
    x_clerk_user_id: Optional[str] = Header(None, alias="X-Clerk-User-Id"),
    service: ProfileService = Depends(get_profile_service)
):
    """Update current user's profile"""
    if not x_clerk_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    updated_profile = await service.update_profile(x_clerk_user_id, profile_update)
    if not updated_profile:
        raise HTTPException(status_code=400, detail="Failed to update profile")
    return updated_profile






