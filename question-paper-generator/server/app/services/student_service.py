from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID

class StudentService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_note(self, user_id: str, title: str, content: str, source_pdf: Optional[str] = None) -> Dict[str, Any]:
        data = {
            "user_id": user_id,
            "title": title,
            "content": content,
            "source_pdf_name": source_pdf
        }
        res = self.supabase.table("user_notes").insert(data).execute()
        return res.data[0] if res.data else None

    async def get_notes(self, user_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("user_notes").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data

    async def create_flashcards(self, user_id: str, deck_title: str, cards: List[Dict[str, str]], source_pdf: Optional[str] = None) -> Dict[str, Any]:
        data = {
            "user_id": user_id,
            "deck_title": deck_title,
            "cards": cards,
            "source_pdf_name": source_pdf
        }
        res = self.supabase.table("user_flashcards").insert(data).execute()
        return res.data[0] if res.data else None

    async def get_flashcards(self, user_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("user_flashcards").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data

    async def create_quiz(self, user_id: str, title: str, questions: List[Dict[str, Any]], source_pdf: Optional[str] = None) -> Dict[str, Any]:
        data = {
            "user_id": user_id,
            "title": title,
            "questions": questions,
            "source_pdf_name": source_pdf
        }
        res = self.supabase.table("user_quizzes").insert(data).execute()
        return res.data[0] if res.data else None
    
    async def get_quizzes(self, user_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("user_quizzes").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data

    async def create_mindmap(self, user_id: str, title: str, mindmap_data: Dict[str, Any], source_pdf: Optional[str] = None) -> Dict[str, Any]:
        data = {
            "user_id": user_id,
            "title": title,
            "data": mindmap_data,
            "source_pdf_name": source_pdf
        }
        res = self.supabase.table("user_mindmaps").insert(data).execute()
        return res.data[0] if res.data else None

    async def get_mindmaps(self, user_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("user_mindmaps").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data
