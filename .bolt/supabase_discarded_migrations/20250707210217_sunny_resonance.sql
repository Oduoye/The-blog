/*
  # Fix Contact Submissions Public Access

  1. Security Updates
    - Add RLS policy to allow anonymous users to insert contact submissions
    - Ensure public users can submit contact forms without authentication
    - Maintain security by only allowing INSERT operations for public users

  2. Changes
    - Add policy for anonymous/public users to insert contact submissions
    - Keep existing policies for authenticated users to manage submissions
*/

-- Allow anonymous users to insert contact submissions
CREATE POLICY "Allow public to submit contact forms"
  ON contact_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Also allow authenticated users to insert (in case they're logged in)
CREATE POLICY "Allow authenticated to submit contact forms"
  ON contact_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);