from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
import os

app = FastAPI(title="Question Paper Generator API")

# Configure CORS origins from env var `ALLOW_ORIGINS` (comma-separated).
# If set to '*', allow all origins (useful for quick local testing).
allow_origins_env = os.getenv('ALLOW_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')
if allow_origins_env.strip() == '*':
    allow_origins = ["*"]
else:
    allow_origins = [o.strip() for o in allow_origins_env.split(',') if o.strip()]

# Add common local development origins to be safe
if "http://localhost:5173" not in allow_origins:
    allow_origins.append("http://localhost:5173")
if "http://127.0.0.1:5173" not in allow_origins:
    allow_origins.append("http://127.0.0.1:5173")

allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Mount API router under /api/v1
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"status": "ok", "service": "question-paper-generator"}


