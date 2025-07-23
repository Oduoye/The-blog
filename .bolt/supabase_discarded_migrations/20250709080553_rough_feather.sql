/*
  # Add Comments Authentication Integration

  1. Database Schema Updates
    - Add author_id column to comments table linking to profiles
    - Add foreign key constraint for referential integrity
    - Update RLS policies to require authentication for comments

  2. Security Changes
    - Restrict comment insertion to authenticated users only
    - Maintain public read access for approved comments
    - Allow authenticated users full management access

  3. Data Integrity
    - Ensure all comments are linked to user profiles
    - Maintain existing comment approval system
    - Preserve historical comment data structure
*/

-- Add author_id column to comments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'author_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN author_id uuid;
  END IF;
END $$;

-- Add foreign key constraint linking comments to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'comments_author_id_fkey'
  ) THEN
    ALTER TABLE comments 
    ADD CONSTRAINT comments_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

-- Update RLS policies for comments table
DROP POLICY IF EXISTS "Anyone can insert comments" ON comments;
DROP POLICY IF EXISTS "Anyone can read approved comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can manage comments" ON comments;

-- New RLS policies with authentication requirements
CREATE POLICY "Authenticated users can insert comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

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

-- Ensure comments table has proper updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();