-- Recreate the view without SECURITY DEFINER to fix the linter warning
DROP VIEW IF EXISTS public.leadership_team_public;

-- Create a standard view for public access that excludes sensitive information like email
CREATE VIEW public.leadership_team_public AS
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

-- Grant access to the view for both anonymous and authenticated users
GRANT SELECT ON public.leadership_team_public TO anon;
GRANT SELECT ON public.leadership_team_public TO authenticated;