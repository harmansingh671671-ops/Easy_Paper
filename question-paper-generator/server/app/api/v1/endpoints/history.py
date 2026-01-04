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
        
        # Structure to track types per topic: { "TopicName": ["notes", "quizzes", ...] }
        topic_types = {}

        def process_rows(rows, type_name):
            for item in rows:
                t = item['topic']
                if t:
                    if t not in topic_types:
                        topic_types[t] = {
                            "date": item['created_at'],
                            "types": set()
                        }
                    # Update date to latest if newer
                    if item['created_at'] > topic_types[t]['date']:
                        topic_types[t]['date'] = item['created_at']
                    
                    topic_types[t]['types'].add(type_name)

        if notes.data: process_rows(notes.data, "notes")
        if flashcards.data: process_rows(flashcards.data, "flashcards")
        if quizzes.data: process_rows(quizzes.data, "quizzes")
        if mindmaps.data: process_rows(mindmaps.data, "mindmaps")
        
        # Convert to list
        for topic, data in topic_types.items():
             history.append({
                 "topic": topic,
                 "date": data['date'],
                 "types": list(data['types'])
             })
        
        # Sort by date descending
        history.sort(key=lambda x: x['date'], reverse=True)
        
        return history
    except Exception as e:
        import traceback
        print(f"History Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/content")
async def get_history_content(
    topic: str,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Get full content (notes, quiz, flashcards, mindmap) for a specific history topic.
    """
    try:
        user_id = user.id
        
        # Fetch latest entry for each category for this topic
        # Using limit(1) and order by created_at desc to get the most recent version
        
        # 1. Notes
        notes_res = supabase.table("lecture_notes").select("content").eq("user_id", user_id).eq("topic", topic).order("created_at", desc=True).limit(1).execute()
        notes = notes_res.data[0]['content'] if notes_res.data else None

        # 2. Flashcards
        flash_res = supabase.table("ai_flashcards").select("cards").eq("user_id", user_id).eq("topic", topic).order("created_at", desc=True).limit(1).execute()
        flashcards = flash_res.data[0]['cards'] if flash_res.data else None

        # 3. Quiz
        quiz_res = supabase.table("ai_quizzes").select("questions").eq("user_id", user_id).eq("topic", topic).order("created_at", desc=True).limit(1).execute()
        quizzes = quiz_res.data[0]['questions'] if quiz_res.data else None

        # 4. Mind Map
        map_res = supabase.table("ai_mindmaps").select("structure").eq("user_id", user_id).eq("topic", topic).order("created_at", desc=True).limit(1).execute()
        mindmap = map_res.data[0]['structure'] if map_res.data else None
        
        return {
            "topic": topic,
            "notes": notes,
            "flashcards": flashcards,
            "quizzes": quizzes,
            "mindmap": mindmap
        }

    except Exception as e:
        print(f"History Content Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
