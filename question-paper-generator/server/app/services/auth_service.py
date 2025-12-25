from supabase import Client
from app.models.user import UserCreate, UserLogin, User, UserUpdate
from typing import Optional
from uuid import UUID
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError(
        "Missing JWT_SECRET_KEY environment variable. Set a secure JWT_SECRET_KEY before starting the application."
    )
ALGORITHM = "HS256"
# Token expiry in minutes (default: 30 days). Can be overridden with JWT_EXPIRE_MINUTES env var.
try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", str(30 * 24 * 60)))
except Exception:
    ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60

class AuthService:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table = "users"
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    async def register_user(self, user_data: UserCreate) -> dict:
        """Register a new user"""
        try:
            # Check if user already exists
            existing = self.supabase.table(self.table)\
                .select("*")\
                .eq("email", user_data.email)\
                .execute()
            
            if existing.data and len(existing.data) > 0:
                raise ValueError("User with this email already exists")
            
            # Hash password
            hashed_password = self.get_password_hash(user_data.password)
            
            # Create user
            user_dict = {
                "email": user_data.email,
                "password_hash": hashed_password,
                "role": user_data.role.value,
                "category": user_data.category.value,
            }
            
            response = self.supabase.table(self.table)\
                .insert(user_dict)\
                .execute()
            
            if not response.data or len(response.data) == 0:
                error_msg = "Failed to create user. Please ensure the 'users' table exists in your database."
                if hasattr(response, 'error') and response.error:
                    error_msg += f" Error: {response.error}"
                raise ValueError(error_msg)
            
            user = response.data[0]
            
            # Create access token
            token_data = {"sub": str(user["id"]), "email": user["email"]}
            access_token = self.create_access_token(token_data)
            
            return {
                "user": user,
                "access_token": access_token,
                "token_type": "bearer"
            }
        except ValueError:
            # Re-raise ValueError as-is
            raise
        except Exception as e:
            # Wrap other exceptions
            error_msg = f"Database error: {str(e)}"
            if "does not exist" in str(e).lower() or "relation" in str(e).lower():
                error_msg += " Please run the database setup script to create the 'users' table."
            raise ValueError(error_msg)
    
    async def authenticate_user(self, login_data: UserLogin) -> Optional[dict]:
        """Authenticate a user and return token"""
        try:
            # Get user by email
            response = self.supabase.table(self.table)\
                .select("*")\
                .eq("email", login_data.email)\
                .execute()
            
            if not response.data or len(response.data) == 0:
                return None
            
            user = response.data[0]
            
            # Verify password
            password_hash = user.get("password_hash", "")
            if not password_hash or not self.verify_password(login_data.password, password_hash):
                return None
            
            # Create access token
            token_data = {"sub": str(user["id"]), "email": user["email"]}
            access_token = self.create_access_token(token_data)
            
            return {
                "user": user,
                "access_token": access_token,
                "token_type": "bearer"
            }
        except Exception as e:
            # Log error but don't expose details to user
            print(f"Authentication error: {str(e)}")
            return None
    
    async def get_user_by_id(self, user_id: UUID) -> Optional[dict]:
        """Get user by ID"""
        response = self.supabase.table(self.table)\
            .select("*")\
            .eq("id", str(user_id))\
            .execute()
        
        if response.data:
            return response.data[0]
        return None
    
    async def get_user_by_email(self, email: str) -> Optional[dict]:
        """Get user by email"""
        response = self.supabase.table(self.table)\
            .select("*")\
            .eq("email", email)\
            .execute()
        
        if response.data:
            return response.data[0]
        return None
    
    async def update_user(self, user_id: UUID, user_update: UserUpdate) -> Optional[dict]:
        """Update user profile"""
        update_data = user_update.model_dump(exclude_unset=True)
        
        # Convert enum to string if present
        if "role" in update_data:
            update_data["role"] = update_data["role"].value
        if "category" in update_data:
            update_data["category"] = update_data["category"].value
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        if not update_data:
            return None
        
        response = self.supabase.table(self.table)\
            .update(update_data)\
            .eq("id", str(user_id))\
            .execute()
        
        if response.data:
            return response.data[0]
        return None

