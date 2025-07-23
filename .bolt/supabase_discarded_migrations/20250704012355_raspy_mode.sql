/*
  # Add featured posts functionality

  1. Changes
    - Add `featured` column to blog_posts table
    - Create index for featured posts queries
    - Update existing posts to have featured = false by default

  2. Purpose
    - Allow admins to manually select which posts appear in the featured carousel
    - Improve performance with dedicated index for featured posts
*/

-- Add featured column to blog_posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'featured'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN featured boolean DEFAULT false;
  END IF;
END $$;

-- Create index for featured posts queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured, published_at DESC) WHERE featured = true AND is_published = true;

-- Update existing posts to have featured = false (if not already set)
UPDATE blog_posts SET featured = false WHERE featured IS NULL;