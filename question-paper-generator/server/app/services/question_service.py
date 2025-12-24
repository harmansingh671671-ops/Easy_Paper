from supabase import Client
from app.models.question import QuestionCreate, QuestionUpdate, QuestionFilter
from typing import List, Optional
from uuid import UUID

class QuestionService:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.table = "questions"
    
    async def get_all_questions(
        self, 
        filters: Optional[QuestionFilter] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[dict], int]:
        """Get paginated list of questions with optional filters"""
        
        # Start query
        query = self.supabase.table(self.table).select("*", count="exact")
        
        # Apply filters if provided
        if filters:
            if filters.subject:
                query = query.eq("subject", filters.subject)
            if filters.class_grade:
                query = query.eq("class_grade", filters.class_grade)
            if filters.topic:
                query = query.eq("topic", filters.topic)
            if filters.difficulty:
                query = query.eq("difficulty", filters.difficulty)
            if filters.question_type:
                query = query.eq("question_type", filters.question_type.value)
            if filters.is_starred is not None:
                query = query.eq("is_starred", filters.is_starred)
            if filters.search:
                query = query.ilike("question_text", f"%{filters.search}%")
            if filters.category:
                query = query.eq("category", filters.category)
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.range(offset, offset + page_size - 1)
        
        # Order by created_at descending
        query = query.order("created_at", desc=True)
        
        # Execute query
        response = query.execute()
        
        total_count = response.count if hasattr(response, 'count') else len(response.data)
        
        return response.data, total_count
    
    async def get_question_by_id(self, question_id: UUID) -> Optional[dict]:
        """Get a single question by ID"""
        response = self.supabase.table(self.table)\
            .select("*")\
            .eq("id", str(question_id))\
            .execute()
        
        if response.data:
            return response.data[0]
        return None
    
    async def create_question(self, question: QuestionCreate) -> dict:
        """Create a new question"""
        question_dict = question.model_dump(exclude_unset=True)
        
        # Convert enum to string
        if "question_type" in question_dict:
            question_dict["question_type"] = question_dict["question_type"].value
        
        response = self.supabase.table(self.table)\
            .insert(question_dict)\
            .execute()
        
        return response.data[0]
    
    async def update_question(self, question_id: UUID, question: QuestionUpdate) -> Optional[dict]:
        """Update an existing question"""
        update_data = question.model_dump(exclude_unset=True)
        
        # Convert enum to string if present
        if "question_type" in update_data:
            update_data["question_type"] = update_data["question_type"].value
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        if not update_data:
            return None
        
        response = self.supabase.table(self.table)\
            .update(update_data)\
            .eq("id", str(question_id))\
            .execute()
        
        if response.data:
            return response.data[0]
        return None
    
    async def delete_question(self, question_id: UUID) -> bool:
        """Delete a question"""
        response = self.supabase.table(self.table)\
            .delete()\
            .eq("id", str(question_id))\
            .execute()
        
        return len(response.data) > 0
    
    async def toggle_star(self, question_id: UUID) -> Optional[dict]:
        """Toggle the starred status of a question"""
        # First get current status
        current = await self.get_question_by_id(question_id)
        if not current:
            return None
        
        # Toggle the value
        new_status = not current.get("is_starred", False)
        
        response = self.supabase.table(self.table)\
            .update({"is_starred": new_status})\
            .eq("id", str(question_id))\
            .execute()
        
        if response.data:
            return response.data[0]
        return None
    
    async def get_statistics(self) -> dict:
        """Get question statistics"""
        # Get all questions
        all_questions = self.supabase.table(self.table).select("*").execute()
        questions = all_questions.data
        
        # Calculate stats
        stats = {
            "total_questions": len(questions),
            "by_type": {},
            "by_subject": {},
            "by_difficulty": {},
            "by_class": {},
            "starred_count": sum(1 for q in questions if q.get("is_starred", False))
        }
        
        # Count by type
        for q in questions:
            q_type = q.get("question_type")
            stats["by_type"][q_type] = stats["by_type"].get(q_type, 0) + 1
            
            subject = q.get("subject")
            stats["by_subject"][subject] = stats["by_subject"].get(subject, 0) + 1
            
            difficulty = q.get("difficulty")
            stats["by_difficulty"][difficulty] = stats["by_difficulty"].get(difficulty, 0) + 1
            
            class_grade = q.get("class_grade")
            stats["by_class"][class_grade] = stats["by_class"].get(class_grade, 0) + 1
        
        return stats