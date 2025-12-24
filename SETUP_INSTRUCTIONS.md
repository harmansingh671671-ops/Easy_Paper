# Easy Paper - Setup Instructions

## Project Overview
Easy Paper is a comprehensive educational platform for teachers and students with AI-powered features.

## Prerequisites
- Node.js (v18 or higher)
- Python (v3.11 or higher)
- Supabase account (for database and authentication)

## Backend Setup

1. Navigate to the server directory:
```bash
cd question-paper-generator/server
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file in the `server` directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET_KEY=your_jwt_secret_key_change_in_production
ALLOW_ORIGINS=http://localhost:5173
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

**Note:** Get your OpenAI API key from https://platform.openai.com/api-keys

6. Set up Supabase database:
   - Create a `users` table with the following schema:
     - id (UUID, primary key)
     - email (text, unique)
     - password_hash (text)
     - role (text) - 'teacher' or 'student'
     - category (text) - 'college', 'school', or 'competition'
     - created_at (timestamp)
     - updated_at (timestamp)
   
   - Create a `questions` table (or update existing):
     - Add `category` column (text, nullable) - 'college', 'school', or 'competition'
     - Add `user_id` column (UUID, nullable, foreign key to users.id)

7. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

## Frontend Setup

1. Navigate to the client directory:
```bash
cd question-paper-generator/client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Features Implemented

### ✅ Completed
1. User Authentication (Signup/Login)
2. User Profiles with Role and Category
3. Role-based Dashboards (Teacher/Student)
4. Category-based Content Filtering
5. Question Library with Filtering
6. Question Paper Generation (existing feature)
7. Protected Routes
8. Local Storage for User Sessions

### 🚧 In Progress / To Do
1. PDF Upload for Students
2. AI-powered Features (Notes, Flashcards, Quizzes, Mind Maps)
3. Practice Sessions
4. Lecture Preparation Tools
5. Enhanced Question Management

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  category TEXT NOT NULL CHECK (category IN ('college', 'school', 'competition')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Questions Table
```sql
-- Add category column if it doesn't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/me` - Update user profile

### Questions
- `GET /api/v1/questions/` - Get questions (with filters including category)
- `POST /api/v1/questions/` - Create question
- `GET /api/v1/questions/{id}` - Get single question
- `PUT /api/v1/questions/{id}` - Update question
- `DELETE /api/v1/questions/{id}` - Delete question
- `PATCH /api/v1/questions/{id}/star` - Toggle star
- `POST /api/v1/questions/generate-pdf` - Generate PDF

## Notes

- The application automatically filters questions by the user's category
- Teachers and students see different dashboards based on their role
- All user data is stored locally in localStorage for session persistence
- The question library is integrated into both teacher and student dashboards

## Troubleshooting

1. **CORS Errors**: Make sure `ALLOW_ORIGINS` in backend `.env` matches your frontend URL
2. **Database Connection**: Verify Supabase credentials in `.env`
3. **Authentication Issues**: Check JWT_SECRET_KEY is set in backend `.env`
4. **Category Filtering**: Ensure questions table has a `category` column

