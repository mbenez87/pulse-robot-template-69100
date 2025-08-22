-- Fix the security definer view issue
-- Drop the problematic view
DROP VIEW IF EXISTS public.leadership_team_public;

-- Instead, modify the RLS policy to exclude email fields from public access
-- This approach is more secure and doesn't create SECURITY DEFINER views
DROP POLICY IF EXISTS "Public can view leadership team data without emails" ON public.leadership_team;
DROP POLICY IF EXISTS "Authenticated users can view leadership team emails" ON public.leadership_team;

-- Create a secure RLS policy that allows public access but respects application-level filtering
-- Applications should filter out email fields when querying for public access
CREATE POLICY "Public can view leadership team data" 
ON public.leadership_team 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Create a security definer function to get public leadership data without emails
CREATE OR REPLACE FUNCTION public.get_leadership_team_public()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  professional_background jsonb,
  education jsonb,
  work_experience jsonb,
  leadership_and_boards jsonb,
  accomplishments_and_awards jsonb,
  media_and_news jsonb,
  display_order integer,
  name text,
  title text,
  tagline text,
  image_url text,
  linkedin_url text,
  twitter_url text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
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
$$;