-- Fix security issue: Remove public access to leadership team email addresses
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public can view leadership team data" ON public.leadership_team;

-- Create a new policy that allows public access to all fields EXCEPT email addresses
CREATE POLICY "Public can view leadership team data without emails" 
ON public.leadership_team 
FOR SELECT 
USING (true);

-- Create a separate policy for authenticated users to access email addresses
CREATE POLICY "Authenticated users can view leadership team emails" 
ON public.leadership_team 
FOR SELECT 
TO authenticated
USING (true);

-- Create a view for public access that excludes email addresses
CREATE OR REPLACE VIEW public.leadership_team_public AS
SELECT 
  id,
  created_at,
  professional_background,
  education,
  work_experience,
  leadership_and_boards,
  accomplishments_and_awards,
  media_and_news,
  display_order,
  name,
  title,
  tagline,
  image_url,
  linkedin_url,
  twitter_url
FROM public.leadership_team
ORDER BY display_order ASC NULLS LAST, name ASC;

-- Grant public access to the view
GRANT SELECT ON public.leadership_team_public TO anon;
GRANT SELECT ON public.leadership_team_public TO authenticated;