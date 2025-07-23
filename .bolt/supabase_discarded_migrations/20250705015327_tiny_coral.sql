/*
  # Add contact settings table

  1. New Table
    - `contact_settings` - Store contact information in database
      - `id` (uuid, primary key)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `website` (text)
      - `description` (text)
      - `social_media` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Allow public read access for contact display
    - Allow authenticated users to manage contact settings
*/

-- Create contact_settings table
CREATE TABLE IF NOT EXISTS contact_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  phone text,
  address text,
  website text,
  description text,
  social_media jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contact_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access for displaying contact info
CREATE POLICY "contact_settings_public_read"
  ON contact_settings
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to manage contact settings
CREATE POLICY "contact_settings_auth_all"
  ON contact_settings
  FOR ALL
  TO authenticated
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_contact_settings_updated_at 
  BEFORE UPDATE ON contact_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default contact settings
INSERT INTO contact_settings (
  email,
  phone,
  address,
  website,
  description,
  social_media
) VALUES (
  'noncefirewall@gmail.com',
  '',
  '',
  'https://noncefirewall.com',
  'Tech based educational blogs and multipurpose blogging arena. We provide cybersecurity insights, tech news, and industry updates.',
  '{
    "twitter": "",
    "facebook": "",
    "linkedin": "",
    "instagram": ""
  }'
) ON CONFLICT DO NOTHING;