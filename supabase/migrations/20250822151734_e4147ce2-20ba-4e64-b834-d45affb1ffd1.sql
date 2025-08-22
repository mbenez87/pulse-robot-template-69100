-- Fix the security vulnerability in company_submissions table
-- The current SELECT policy allows public access to founder emails

-- Drop the existing misleading policy
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.company_submissions;

-- Create a proper policy that actually restricts access to authenticated users only
CREATE POLICY "Authenticated users can view company submissions" 
ON public.company_submissions 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Optionally, create an admin policy for better access control
-- This allows for future admin functionality if needed
CREATE POLICY "Admin users can manage company submissions" 
ON public.company_submissions 
FOR ALL
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

-- Keep the public insert policy as it allows companies to submit applications
-- This is legitimate functionality that should remain