-- Drop the current public read policy that exposes email addresses
DROP POLICY IF EXISTS "Enable public read access for all users" ON public.leadership_team;

-- Create a policy for authenticated users to access all leadership team data
CREATE POLICY "Authenticated users can view full leadership team data" 
ON public.leadership_team 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create a view for public access that excludes sensitive information like email
CREATE OR REPLACE VIEW public.leadership_team_public AS
SELECT 
  id,
  name,
  title,
  tagline,
  image_url,
  linkedin_url,
  twitter_url,
  professional_background,
  education,
  work_experience,
  leadership_and_boards,
  accomplishments_and_awards,
  media_and_news,
  display_order,
  created_at
FROM public.leadership_team
ORDER BY display_order ASC NULLS LAST;

-- Enable RLS on the view (though it inherits from the base table)
-- Grant public access to the view
GRANT SELECT ON public.leadership_team_public TO anon;
GRANT SELECT ON public.leadership_team_public TO authenticated;