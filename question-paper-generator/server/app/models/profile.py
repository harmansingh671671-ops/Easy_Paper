from pydantic import BaseModel
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class ProfileBase(BaseModel):
    role: str  # 'teacher' or 'student'
    category: Optional[str] = None  # 'college', 'school', 'competition' or None
    categories: Optional[List[str]] = None

class ProfileCreate(BaseModel):
    role: str  # 'teacher' or 'student'
    category: Optional[str] = None  # 'college', 'school', 'competition' or None
    categories: Optional[List[str]] = None

class Profile(ProfileBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    role: Optional[str] = None
    category: Optional[str] = None
    categories: Optional[List[str]] = None






