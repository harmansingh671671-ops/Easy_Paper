from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID

class TeacherService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_paper(self, user_id: str, title: str, category: str, 
                          total_marks: int, duration_minutes: int, 
                          instructions: str, questions: List[Dict[str, Any]]) -> Dict[str, Any]:
        data = {
            "user_id": user_id,
            "title": title,
            "category": category,
            "total_marks": total_marks,
            "duration_minutes": duration_minutes,
            "instructions": instructions,
            "questions": questions
        }
        res = self.supabase.table("question_papers").insert(data).execute()
        return res.data[0] if res.data else None

    async def get_papers(self, user_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("question_papers").select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()
        return res.data
    
    async def get_paper_by_id(self, paper_id: str) -> Optional[Dict[str, Any]]:
        res = self.supabase.table("question_papers").select("*").eq("id", paper_id).execute()
        return res.data[0] if res.data else None
