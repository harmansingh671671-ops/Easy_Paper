from dotenv import load_dotenv
import os
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print("=" * 60)
print("Testing Supabase Connection")
print("=" * 60)
print(f"\nSupabase URL: {SUPABASE_URL}")
print(f"API Key (first 20 chars): {SUPABASE_KEY[:20]}...")

try:
    # Create client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("\n✅ Supabase client created successfully!")
    
    # Try to fetch questions
    print("\nFetching questions from database...")
    response = supabase.table("questions").select("*").execute()
    
    print(f"\n✅ Query successful!")
    print(f"Total questions found: {len(response.data)}")
    
    if response.data:
        print("\nFirst question:")
        print(f"  Type: {response.data[0].get('question_type')}")
        print(f"  Subject: {response.data[0].get('subject')}")
        print(f"  Text: {response.data[0].get('question_text')[:50]}...")
    else:
        print("\n⚠️ No questions in database!")
        
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    print(f"Error type: {type(e).__name__}")