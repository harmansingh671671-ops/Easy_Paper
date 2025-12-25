from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum
from datetime import datetime
from uuid import UUID

class UserRole(str, Enum):
    TEACHER = "teacher"
    STUDENT = "student"

class UserCategory(str, Enum):
    COLLEGE = "college"
    SCHOOL = "school"
    COMPETITION = "competition"

class UserBase(BaseModel):
    email: EmailStr
    role: UserRole
    category: UserCategory

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    role: Optional[UserRole] = None
    category: Optional[UserCategory] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User








