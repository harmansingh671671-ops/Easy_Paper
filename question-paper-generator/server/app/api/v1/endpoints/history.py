from fastapi import APIRouter, Depends, HTTPException
from app.core.auth_deps import get_current_user
from app.core.database import get_supabase
from supabase import Client

router = APIRouter()

@router.get("/all")
async def get_history(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Get a list of all topics that have generated content for the current user.
    """
    try:
        user_id = user.id
        
        # We query the lecture_notes table for distinct topics
        # Note: In a production app with millions of rows, we might want a dedicated 'topics' table.
        # But for this use case, we can select distinct topics from lecture_notes.
        
        response = supabase.table("lecture_notes").select("topic, created_at").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        # We might have duplicates if we store multiple entries (though logic tries to prevent it).
        # Let's dedup by topic in python for simplicity if needed, but select should handle it if distinct wasn't available.
        # Supabase/PostgREST doesn't support SELECT DISTINCT easy via JS/Python client without RPC usually,
        # so we'll just fetch all headers and dedup here.
        
        history = []
        seen_topics = set()
        
        if response.data:
            for item in response.data:
                t = item['topic']
                if t not in seen_topics:
                    seen_topics.add(t)
                    history.append({
                        "topic": t,
                        "date": item['created_at']
                    })
        
        return history
    except Exception as e:
        import traceback
        print(f"History Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
