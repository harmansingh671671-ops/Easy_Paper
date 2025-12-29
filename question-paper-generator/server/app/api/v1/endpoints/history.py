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
        
        # Query all tables to get comprehensive history
        notes = supabase.table("lecture_notes").select("topic, created_at").eq("user_id", user_id).execute()
        flashcards = supabase.table("ai_flashcards").select("topic, created_at").eq("user_id", user_id).execute()
        quizzes = supabase.table("ai_quizzes").select("topic, created_at").eq("user_id", user_id).execute()
        mindmaps = supabase.table("ai_mindmaps").select("topic, created_at").eq("user_id", user_id).execute()
        
        history = []
        seen_topics = set()
        
        # Helper to process results
        def process_rows(rows):
            for item in rows:
                t = item['topic']
                if t and t not in seen_topics:
                    seen_topics.add(t)
                    history.append({
                        "topic": t,
                        "date": item['created_at']
                    })

        if notes.data: process_rows(notes.data)
        if flashcards.data: process_rows(flashcards.data)
        if quizzes.data: process_rows(quizzes.data)
        if mindmaps.data: process_rows(mindmaps.data)
        
        # Sort by date descending
        history.sort(key=lambda x: x['date'], reverse=True)
        
        return history
    except Exception as e:
        import traceback
        print(f"History Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
