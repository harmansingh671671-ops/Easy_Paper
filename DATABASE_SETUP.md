# Database Setup Guide

## Quick Setup

The authentication is failing because the `users` table doesn't exist in your Supabase database. Follow these steps:

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the Setup Script

Copy and paste the entire contents of `question-paper-generator/server/database_setup.sql` into the SQL editor and click "Run".

Alternatively, copy this SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  category TEXT NOT NULL CHECK (category IN ('college', 'school', 'competition')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add category column to questions table if it doesn't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS category TEXT;

-- Add user_id column to questions table if it doesn't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
```

### Step 3: Verify Table Creation

After running the script, verify the table was created:

1. Go to "Table Editor" in Supabase
2. You should see a `users` table
3. Check that it has these columns:
   - id (uuid)
   - email (text)
   - password_hash (text)
   - role (text)
   - category (text)
   - created_at (timestamp)
   - updated_at (timestamp)

### Step 4: Test Authentication

1. Restart your backend server
2. Try registering a new user from the frontend
3. If it still fails, check the server logs for specific error messages

## Troubleshooting

### Error: "relation 'users' does not exist"
- The table wasn't created. Run the SQL script again.

### Error: "permission denied"
- Make sure you're using the correct Supabase credentials
- Check that your `.env` file has the correct `SUPABASE_URL` and `SUPABASE_KEY`

### Error: "Failed to create user"
- Check Supabase logs for detailed error messages
- Verify all required columns are present
- Make sure the email is unique

### Error: "Database error"
- Check your Supabase connection
- Verify environment variables are set correctly
- Check network connectivity

## Environment Variables

Make sure your `question-paper-generator/server/.env` file has:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
JWT_SECRET_KEY=your-secret-key-here
```

You can find these in:
- Supabase Dashboard → Settings → API
- `SUPABASE_URL` = Project URL
- `SUPABASE_KEY` = anon/public key

## Testing the Setup

After setup, you can test the database connection:

1. Try registering a new user
2. Check the Supabase Table Editor to see if the user was created
3. Try logging in with the created user

If everything works, you should be able to:
- Register new users
- Login with existing users
- Access protected routes








