from supabase import Client
from app.models.user import UserCreate, UserLogin, UserUpdate
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from uuid import UUID
import os

# Load environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table = "users"

    def verify_password(self, plain_password, hashed_password):
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password):
        return pwd_context.hash(password)

    def create_access_token(self, data: dict):
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    async def register_user(self, user_data: UserCreate):
        # Check if user exists
        existing_user = self.supabase.table(self.table).select("id").eq("email", user_data.email).execute()
        if existing_user.data:
            raise ValueError("Email already registered")

        hashed_password = self.get_password_hash(user_data.password)
        
        new_user_data = {
            "email": user_data.email,
            "password_hash": hashed_password,
            "role": user_data.role,
            "category": user_data.category
        }
        
        response = self.supabase.table(self.table).insert(new_user_data).execute()

        if not response.data:
            raise Exception("Failed to create user")

        new_user = response.data[0]
        access_token = self.create_access_token(data={"sub": str(new_user['id'])})
        return {"access_token": access_token, "token_type": "bearer", "user": new_user}

    async def authenticate_user(self, login_data: UserLogin):
        response = self.supabase.table(self.table).select("*").eq("email", login_data.email).execute()
        if not response.data:
            return None
        
        user = response.data[0]
        if not self.verify_password(login_data.password, user["password_hash"]):
            return None
        
        access_token = self.create_access_token(data={"sub": str(user['id'])})
        return {"access_token": access_token, "token_type": "bearer", "user": user}

    async def get_user_by_id(self, user_id: UUID):
        response = self.supabase.table(self.table).select("*").eq("id", str(user_id)).execute()
        if not response.data:
            return None
        return response.data[0]

    async def update_user(self, user_id: UUID, user_update: UserUpdate):
        update_data = user_update.model_dump(exclude_unset=True)
        if not update_data:
            return None
            
        response = self.supabase.table(self.table).update(update_data).eq("id", str(user_id)).execute()
        if not response.data:
            return None
        return response.data[0]
