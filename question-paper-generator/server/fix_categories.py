
import asyncio
import os
import sys

# Add current directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_supabase

def fix_categories():
    try:
        supabase = get_supabase()
        print("Connected to Supabase.")
        
        # 1. Check how many have NULL category
        # syntax: is_("column", "null")
        res = supabase.table("questions").select("*", count="exact").is_("category", "null").execute()
        count = res.count if hasattr(res, 'count') else len(res.data)
        
        supabase = get_supabase()
        print("Connected.")
        
        # specific debugging
        res = supabase.table("questions").select("category").execute()
        cats = set([r.get('category') for r in res.data])
        print(f"Existing Categories: {cats}")
        
        # If we see None/Null, we update strictly
        if None in cats:
            print("Found None/Null categories. Updating...")
            supabase.table("questions").update({"category": "School"}).is_("category", "null").execute()
            print("Updated NULLs.")
            
        # Also check for lowercase "school" or empty string
        for c in cats:
             if c == "school": # lowercase
                 print("Updating 'school' to 'School'...")
                 supabase.table("questions").update({"category": "School"}).eq("category", "school").execute()
             elif c == "":
                 print("Updating empty strings to 'School'...")
                 supabase.table("questions").update({"category": "School"}).eq("category", "").execute()

            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_categories()
