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
            
            # New Filters: Handle legacy class_grade for 'grade' filter
            if filters.grade:
                # Ensure it's a list
                grades = filters.grade if isinstance(filters.grade, list) else [filters.grade]
                
                legacy_grades = []
                for g in grades:
                    g_lower = g.lower()
                    
                    # 1. Handle College Years (1st Year -> 1)
                    if 'year' in g_lower:
                        if '1st' in g_lower: legacy_grades.extend(['1', '1st'])
                        elif '2nd' in g_lower: legacy_grades.extend(['2', '2nd'])
                        elif '3rd' in g_lower: legacy_grades.extend(['3', '3rd'])
                        elif '4th' in g_lower: legacy_grades.extend(['4', '4th'])
                    
                    # 2. Handle School Classes (10th -> 10, Class 10, IX, etc.)
                    # User said: "changed all the classes names to 9th, 10th"
                    # But also "store 1st, 2nd... for students in school" (conflicting info, simpler to handle variants)
                    
                    # Add exact legacy version (e.g., '10th' -> '10')
                    clean = g_lower.replace('th', '').replace('st', '').replace('nd', '').replace('rd', '').strip()
                    if clean.isdigit():
                        legacy_grades.append(clean)                    
                        legacy_grades.append(f"Class {clean}")
                    
                    # Add 9th, 10th explicitly if they passed numbers
                    legacy_grades.append(g)

                # Remove duplicates
                legacy_grades = list(set(legacy_grades))
                
                # Combine original and mapped grades
                final_search_grades = list(set(grades + legacy_grades))

                # TARGET CLASS_GRADE DIRECTLY
                # The user's data is in 'class_grade' column (e.g. '12th').
                # Since .or_() is not available, we filter the column where data is known to exist.
                # This supports '12th', '12', 'Class 12' matching against 'class_grade'.
                
                query = query.in_("class_grade", final_search_grades)

            if filters.year:
                # Handle Year mapping (1st Year -> 1, etc)
                years = filters.year if isinstance(filters.year, list) else [filters.year]
                expanded_years = []
                for y in years:
                    y_lower = y.lower()
                    expanded_years.append(y)
                    # Common variations
                    if '1st' in y_lower or '1' == y: expanded_years.extend(['1', '1st', '1st Year'])
                    if '2nd' in y_lower or '2' == y: expanded_years.extend(['2', '2nd', '2nd Year'])
                    if '3rd' in y_lower or '3' == y: expanded_years.extend(['3', '3rd', '3rd Year'])
                    if '4th' in y_lower or '4' == y: expanded_years.extend(['4', '4th', '4th Year'])
                
                final_search_years = list(set(expanded_years))
                query = query.in_("year", final_search_years)
            
            if filters.exam:
                if isinstance(filters.exam, list):
                    query = query.in_("exam", filters.exam)
                else:
                    query = query.eq("exam", filters.exam)
        
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