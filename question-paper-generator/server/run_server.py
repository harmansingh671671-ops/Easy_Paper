import uvicorn
import os

if __name__ == "__main__":
    # Ensure invalid/missing env vars don't break simple startup
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    
    print(f"Starting server on {host}:{port} with reload enabled (Windows-safe)...")
    
    # Run uvicorn programmatically
    # This pattern with 'if __name__ == "__main__":' is required for multiprocessing on Windows
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
