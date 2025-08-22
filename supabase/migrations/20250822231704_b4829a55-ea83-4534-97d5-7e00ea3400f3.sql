-- Fix function search path security warning
-- Update the get_folder_contents function to have immutable search_path
DROP FUNCTION IF EXISTS public.get_folder_contents(uuid);

CREATE OR REPLACE FUNCTION public.get_folder_contents(folder_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  file_name text,
  is_folder boolean,
  file_size bigint,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  file_type text,
  storage_path text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.id,
    d.file_name,
    d.is_folder,
    d.file_size,
    d.created_at,
    d.updated_at,
    d.file_type,
    d.storage_path
  FROM public.documents d
  WHERE d.user_id = auth.uid()
    AND (
      (folder_id IS NULL AND d.parent_folder_id IS NULL) OR
      (folder_id IS NOT NULL AND d.parent_folder_id = folder_id)
    )
  ORDER BY d.is_folder DESC, d.file_name ASC;
$$;