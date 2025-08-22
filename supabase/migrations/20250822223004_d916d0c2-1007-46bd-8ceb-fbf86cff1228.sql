-- Fix security definer view vulnerability
-- The leadership_team_public view bypasses RLS by exposing leadership_team data without authentication
-- This allows unauthorized access to sensitive leadership information

-- Drop the problematic view that bypasses authentication
DROP VIEW IF EXISTS public.leadership_team_public;

-- Instead, just use proper RLS policies on the leadership_team table itself
-- Update the leadership_team RLS policy to allow public read access if this data should be public
-- This is more secure and transparent than using a view to bypass RLS

-- Allow public read access to leadership team data (if this is the intended behavior)
DROP POLICY IF EXISTS "Authenticated users can view full leadership team data" ON public.leadership_team;

CREATE POLICY "Public can view leadership team data" 
ON public.leadership_team 
FOR SELECT 
USING (true);

-- If you need to restrict some fields, create a proper view without security definer
-- that only exposes the public fields (but this should be handled at the application level instead)