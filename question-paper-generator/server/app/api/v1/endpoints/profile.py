from fastapi import APIRouter, HTTPException, Depends
from app.core.auth_deps import get_current_user
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
    user: dict = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service)
):
    """
    Create or update user profile
    """
    # Use Supabase user ID from the token
    try:
        print(f"Creating profile for user: {user.id}")
        return await service.create_or_update_profile(user.id, profile_data)
    except Exception as e:
        print(f"Error creating profile: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/me", response_model=Profile)
async def get_my_profile(
    user: dict = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service)
):
    """
    Get current user's profile
    """
    profile = await service.get_profile_by_user_id(user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/me", response_model=Profile)
async def update_my_profile(
    profile_data: ProfileUpdate,
    user: dict = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service)
):
    """
    Update current user's profile
    """
    return await service.update_profile(user.id, profile_data)
