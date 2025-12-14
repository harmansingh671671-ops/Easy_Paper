from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.api.v1.api import api_router

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title=os.getenv("APP_NAME", "Question Paper Generator API"),
    description="API for generating custom question papers with polymorphic question types",
    version="1.0.0",
    debug=os.getenv("DEBUG", "True") == "True"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "Question Paper Generator API is running",
        "version": "1.0.0"
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to Question Paper Generator API",
        "docs": "/docs",
        "health": "/health",
        "api": "/api/v1/questions"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)