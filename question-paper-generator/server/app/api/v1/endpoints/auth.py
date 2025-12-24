from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.user import UserCreate, UserLogin, User, TokenResponse, UserUpdate
from app.services.auth_service import AuthService, SECRET_KEY, ALGORITHM
from app.core.database import get_supabase
from supabase import Client
from uuid import UUID
from jose import JWTError, jwt
import os

router = APIRouter()
security = HTTPBearer()

# `SECRET_KEY` and `ALGORITHM` are imported from `auth_service` to ensure
# a single source of truth and to force requiring a secure secret via env.

def get_auth_service(supabase: Client = Depends(get_supabase)) -> AuthService:
    return AuthService(supabase)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    service: AuthService = Depends(get_auth_service)
) -> dict:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = await service.get_user_by_id(UUID(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    user_data: UserCreate,
    service: AuthService = Depends(get_auth_service)
):
    """Register a new user"""
    try:
        result = await service.register_user(user_data)
        return TokenResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log internal error server-side, but do not leak internal details to clients
        print(f"Registration internal error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Registration failed due to a server error. Please contact the administrator."
        )

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    service: AuthService = Depends(get_auth_service)
):
    """Login and get access token"""
    result = await service.authenticate_user(login_data)
    if not result:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    return TokenResponse(**result)

@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user)
):
    """Get current user information"""
    # Remove password_hash from response
    current_user.pop("password_hash", None)
    return User(**current_user)

@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service)
):
    """Update current user profile"""
    updated_user = await service.update_user(UUID(current_user["id"]), user_update)
    if not updated_user:
        raise HTTPException(status_code=400, detail="Failed to update user")
    updated_user.pop("password_hash", None)
    return User(**updated_user)

