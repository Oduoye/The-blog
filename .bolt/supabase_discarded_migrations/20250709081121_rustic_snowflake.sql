/*
  # Restore Anonymous Commenting System

  1. Changes Made
    - Remove authentication requirement for commenting
    - Allow anonymous users to comment with just name and optional email
    - Keep author_id as optional for authenticated users
    - Update RLS policies to support both anonymous and authenticated comments

  2. Security
    - Enable RLS on comments table
    - Allow public to insert comments (anonymous)
    - Allow public to read approved comments
    - Allow authenticated users to manage all comments (admin functionality)
*/

-- Update RLS policies to support anonymous commenting
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Anyone can read approved comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can manage all comments" ON comments;

-- New RLS policies supporting anonymous comments
CREATE POLICY "Anyone can insert comments"
  ON comments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read approved comments"
  ON comments
  FOR SELECT
  TO public
  USING (is_approved = true);

CREATE POLICY "Authenticated users can manage all comments"
  ON comments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Make author_id optional (it already is, but ensuring it's clear)
-- Anonymous users will have author_id as NULL
-- Authenticated users will have their user ID in author_id

-- Update the comments table to ensure proper defaults
ALTER TABLE comments ALTER COLUMN author_name SET NOT NULL;
ALTER TABLE comments ALTER COLUMN content SET NOT NULL;
ALTER TABLE comments ALTER COLUMN is_approved SET DEFAULT true;