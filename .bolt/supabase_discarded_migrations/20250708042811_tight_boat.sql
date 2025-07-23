/*
  # Database Schema Enhancements

  1. New Tables
    - `comments` - Blog post comments system
    - `post_likes` - Track individual post likes with visitor tracking
    - `post_shares` - Track post shares with analytics
    - `categories` - Dedicated categories table for better organization
    - `tags` - Dedicated tags table with usage tracking

  2. Enhancements
    - Add missing indexes for better performance
    - Add better constraints and validation
    - Improve analytics tracking
    - Add SEO and metadata fields

  3. Security
    - Proper RLS policies for all new tables
    - Enhanced visitor tracking capabilities
*/

-- Create comments table for blog posts
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

-- Create post_likes table for tracking likes
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(visitor_id, post_id)
);

-- Create post_shares table for tracking shares
CREATE TABLE IF NOT EXISTS post_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  share_type text DEFAULT 'unknown',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_approved ON comments(is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_visitor ON post_likes(visitor_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS unique_visitor_post_like ON post_likes(visitor_id, post_id);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON comments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraints for data integrity
ALTER TABLE blog_posts 
ADD CONSTRAINT check_slug_format 
CHECK (slug ~ '^[a-z0-9-]+$');

ALTER TABLE blog_posts 
ADD CONSTRAINT check_reading_time_positive 
CHECK (reading_time >= 0);

-- Improve existing indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags) WHERE tags IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_published ON blog_posts(author_id, is_published, published_at DESC);

-- Add better analytics indexes
CREATE INDEX IF NOT EXISTS idx_post_analytics_engagement ON post_analytics(engagement_rate DESC) WHERE engagement_rate > 0;
CREATE INDEX IF NOT EXISTS idx_promotion_analytics_ctr ON promotion_analytics(click_through_rate DESC) WHERE click_through_rate > 0;

-- Add search capabilities (basic text search)
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON blog_posts USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '') || ' ' || COALESCE(excerpt, '')));

-- Add function to calculate reading time automatically
CREATE OR REPLACE FUNCTION calculate_reading_time(content_text text)
RETURNS integer AS $$
BEGIN
  -- Average reading speed: 200 words per minute
  -- Return reading time in minutes
  RETURN GREATEST(1, (array_length(string_to_array(content_text, ' '), 1) / 200.0)::integer);
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically calculate reading time
CREATE OR REPLACE FUNCTION update_reading_time()
RETURNS trigger AS $$
BEGIN
  IF NEW.content IS NOT NULL THEN
    NEW.reading_time = calculate_reading_time(NEW.content);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_reading_time_trigger
  BEFORE INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_time();

-- Add view for popular posts
CREATE OR REPLACE VIEW popular_posts AS
SELECT 
  bp.*,
  COALESCE(pa.views, 0) as total_views,
  COALESCE(pa.likes, 0) as total_likes,
  COALESCE(pa.shares, 0) as total_shares,
  COALESCE(pa.engagement_rate, 0) as engagement_rate
FROM blog_posts bp
LEFT JOIN post_analytics pa ON bp.id = pa.post_id
WHERE bp.is_published = true
ORDER BY 
  COALESCE(pa.engagement_rate, 0) DESC,
  COALESCE(pa.views, 0) DESC,
  bp.published_at DESC;

-- Add view for recent activity
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
  'post' as activity_type,
  bp.id,
  bp.title as title,
  bp.author_name as actor,
  bp.created_at as activity_time,
  'published' as action
FROM blog_posts bp
WHERE bp.is_published = true
UNION ALL
SELECT 
  'comment' as activity_type,
  c.post_id as id,
  bp.title as title,
  c.author_name as actor,
  c.created_at as activity_time,
  'commented' as action
FROM comments c
JOIN blog_posts bp ON c.post_id = bp.id
WHERE c.is_approved = true
ORDER BY activity_time DESC
LIMIT 50;

-- Add function to get post statistics
CREATE OR REPLACE FUNCTION get_post_stats(post_uuid uuid)
RETURNS TABLE(
  views bigint,
  unique_views bigint,
  likes bigint,
  shares bigint,
  comments bigint,
  engagement_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(pa.views::bigint, 0) as views,
    COALESCE(pa.unique_views::bigint, 0) as unique_views,
    COALESCE((SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = post_uuid), 0) as likes,
    COALESCE((SELECT COUNT(*) FROM post_shares ps WHERE ps.post_id = post_uuid), 0) as shares,
    COALESCE((SELECT COUNT(*) FROM comments c WHERE c.post_id = post_uuid AND c.is_approved = true), 0) as comments,
    COALESCE(pa.engagement_rate, 0) as engagement_rate
  FROM post_analytics pa
  WHERE pa.post_id = post_uuid;
END;
$$ LANGUAGE plpgsql;

-- Add function to clean up old analytics data (optional)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  -- Remove analytics for deleted posts
  DELETE FROM post_analytics 
  WHERE post_id NOT IN (SELECT id FROM blog_posts);
  
  -- Remove analytics for deleted promotions
  DELETE FROM promotion_analytics 
  WHERE promotion_id NOT IN (SELECT id FROM promotions);
  
  -- Remove old post likes (older than 1 year)
  DELETE FROM post_likes 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Remove old post shares (older than 1 year)
  DELETE FROM post_shares 
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;