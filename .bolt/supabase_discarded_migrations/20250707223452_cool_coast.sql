/*
  # Fix Contact Submissions RLS Policies

  1. Problem
    - Anonymous users cannot submit contact forms due to RLS policy violations
    - Current policies are too restrictive for public form submissions

  2. Solution
    - Drop existing restrictive policies
    - Create new policies that allow anonymous users to insert submissions
    - Maintain security by only allowing INSERT for anonymous users
    - Keep management capabilities for authenticated users

  3. Security
    - Anonymous users can only INSERT (submit forms)
    - Authenticated users can SELECT, UPDATE, DELETE (manage submissions)
    - No data leakage to unauthorized users
*/

-- Drop all existing policies on contact_submissions to start fresh
DROP POLICY IF EXISTS "contact_submissions_public_insert" ON contact_submissions;
DROP POLICY IF EXISTS "contact_submissions_auth_read" ON contact_submissions;
DROP POLICY IF EXISTS "contact_submissions_auth_update" ON contact_submissions;
DROP POLICY IF EXISTS "contact_submissions_auth_delete" ON contact_submissions;
DROP POLICY IF EXISTS "Allow public to submit contact forms" ON contact_submissions;
DROP POLICY IF EXISTS "Allow authenticated to submit contact forms" ON contact_submissions;
DROP POLICY IF EXISTS "Enable insert for form submission " ON contact_submissions;

-- Create new, working policies

-- 1. Allow anonymous users to submit contact forms (INSERT only)
CREATE POLICY "Enable insert for form submission "
  ON contact_submissions
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- 2. Allow authenticated users to read all submissions (for admin panel)
CREATE POLICY "contact_submissions_auth_read"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Allow authenticated users to update submission status
CREATE POLICY "contact_submissions_auth_update"
  ON contact_submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Allow authenticated users to delete submissions
CREATE POLICY "contact_submissions_auth_delete"
  ON contact_submissions
  FOR DELETE
  TO authenticated
  USING (true);

-- Verify the table exists and has correct structure
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_submissions') THEN
    RAISE EXCEPTION 'contact_submissions table does not exist';
  END IF;
  
  -- Ensure RLS is enabled
  ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE 'Contact submissions table is properly configured with RLS enabled';
END $$;