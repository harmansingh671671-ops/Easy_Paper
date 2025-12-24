from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class ProfileBase(BaseModel):
    clerk_user_id: str
    role: str  # 'teacher' or 'student'
    category: Optional[str] = None  # 'college', 'school', 'competition' or None

class ProfileCreate(BaseModel):
    role: str  # 'teacher' or 'student'
    category: Optional[str] = None  # 'college', 'school', 'competition' or None

class Profile(ProfileBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    role: Optional[str] = None
    category: Optional[str] = None






