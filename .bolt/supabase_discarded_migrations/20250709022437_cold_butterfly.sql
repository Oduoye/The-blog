/*
  # Create real-time comments and likes system

  1. New Tables
    - `comments` - Store blog post comments
      - `id` (uuid, primary key)
      - `post_id` (uuid, references blog_posts)
      - `author_name` (text, required)
      - `author_email` (text, optional)
      - `content` (text, required)
      - `is_approved` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `post_likes` - Track post likes
      - `id` (uuid, primary key)
      - `post_id` (uuid, references blog_posts)
      - `visitor_id` (text, required) - unique visitor identifier
      - `ip_address` (text, optional)
      - `user_agent` (text, optional)
      - `created_at` (timestamp)

    - `post_shares` - Track post shares
      - `id` (uuid, primary key)
      - `post_id` (uuid, references blog_posts)
      - `visitor_id` (text, required)
      - `share_type` (text, default 'unknown')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Allow public to insert comments, likes, and shares
    - Allow authenticated users to manage content
    - Prevent duplicate likes per visitor per post

  3. Indexes
    - Add indexes for efficient querying
    - Unique constraint on visitor_id + post_id for likes
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text,
  content text NOT NULL,
  is_approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create post_shares table
CREATE TABLE IF NOT EXISTS post_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  share_type text DEFAULT 'unknown',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Anyone can read approved comments"
  ON comments
  FOR SELECT
  TO public
  USING (is_approved = true);

CREATE POLICY "Anyone can insert comments"
  ON comments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage comments"
  ON comments
  FOR ALL
  TO authenticated
  USING (true);

-- Post likes policies
CREATE POLICY "Anyone can read post likes"
  ON post_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert post likes"
  ON post_likes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage post likes"
  ON post_likes
  FOR ALL
  TO authenticated
  USING (true);

-- Post shares policies
CREATE POLICY "Anyone can read post shares"
  ON post_shares
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert post shares"
  ON post_shares
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage post shares"
  ON post_shares
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_approved ON comments(is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_visitor ON post_likes(visitor_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares(post_id);

-- Add unique constraint to prevent duplicate likes
CREATE UNIQUE INDEX IF NOT EXISTS unique_visitor_post_like ON post_likes(visitor_id, post_id);

-- Add updated_at trigger for comments
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();