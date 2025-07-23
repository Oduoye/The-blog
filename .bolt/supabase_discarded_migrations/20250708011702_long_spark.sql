/*
  # Remove contact submissions table and related components

  1. Purpose
    - Remove contact_submissions table completely
    - Drop all related policies and triggers
    - Clean up database from contact form submission storage
    - Prepare for Formspree integration

  2. Changes
    - Drop contact_submissions table
    - Remove all related RLS policies
    - Remove triggers and indexes
*/

-- Drop all policies on contact_submissions table if they exist
DO $$
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Enable insert for form submission " ON contact_submissions;
  DROP POLICY IF EXISTS "contact_submissions_auth_read" ON contact_submissions;
  DROP POLICY IF EXISTS "contact_submissions_auth_update" ON contact_submissions;
  DROP POLICY IF EXISTS "contact_submissions_auth_delete" ON contact_submissions;
  DROP POLICY IF EXISTS "Allow public to submit contact forms" ON contact_submissions;
  DROP POLICY IF EXISTS "Allow authenticated to submit contact forms" ON contact_submissions;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist, continue
    NULL;
END $$;

-- Drop triggers if they exist
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_contact_submissions_updated_at ON contact_submissions;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist, continue
    NULL;
END $$;

-- Drop indexes if they exist
DO $$
BEGIN
  DROP INDEX IF EXISTS idx_contact_submissions_status;
  DROP INDEX IF EXISTS idx_contact_submissions_email;
  DROP INDEX IF EXISTS idx_contact_submissions_created_at;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist, continue
    NULL;
END $$;

-- Drop the table completely if it exists
DROP TABLE IF EXISTS contact_submissions CASCADE;