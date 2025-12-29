from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID

class StudentService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_note(self, user_id: str, title: str, content: str, source_pdf: Optional[str] = None) -> Dict[str, Any]:
        data = {
            "user_id": user_id,
            "topic": title, # Mapping title to topic
            "content": content
        }
        res = self.supabase.table("lecture_notes").insert(data).execute()
        return res.data[0] if res.data else None

    async def get_notes(self, user_id: str) -> List[Dict[str, Any]]:
        # Map back 'topic' -> 'title' for frontend compatibility if needed, or just return as is
        res = self.supabase.table("lecture_notes").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        # Transform for frontend compatibility
        return [{"id": n['id'], "title": n['topic'], "content": n['content'], "source_pdf_name": n.get('topic'), "created_at": n['created_at']} for n in res.data]

    async def create_flashcards(self, user_id: str, deck_title: str, cards: List[Dict[str, str]], source_pdf: Optional[str] = None) -> Dict[str, Any]:
        data = {
            "user_id": user_id,
            "topic": deck_title,
            "cards": cards
        }
        res = self.supabase.table("ai_flashcards").insert(data).execute()
        return res.data[0] if res.data else None

    async def get_flashcards(self, user_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("ai_flashcards").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return [{"id": f['id'], "deck_title": f['topic'], "cards": f['cards'], "created_at": f['created_at']} for f in res.data]

    async def create_quiz(self, user_id: str, title: str, questions: List[Dict[str, Any]], source_pdf: Optional[str] = None) -> Dict[str, Any]:
        data = {
            "user_id": user_id,
            "topic": title,
            "questions": questions
        }
        res = self.supabase.table("ai_quizzes").insert(data).execute()
        return res.data[0] if res.data else None
    
    async def get_quizzes(self, user_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("ai_quizzes").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return [{"id": q['id'], "title": q['topic'], "questions": q['questions'], "created_at": q['created_at']} for q in res.data]

    async def create_mindmap(self, user_id: str, title: str, mindmap_data: Dict[str, Any], source_pdf: Optional[str] = None) -> Dict[str, Any]:
        data = {
            "user_id": user_id,
            "topic": title,
            "structure": mindmap_data
        }
        res = self.supabase.table("ai_mindmaps").insert(data).execute()
        return res.data[0] if res.data else None

    async def get_mindmaps(self, user_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("ai_mindmaps").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return [{"id": m['id'], "title": m['topic'], "data": m['structure'], "created_at": m['created_at']} for m in res.data]
