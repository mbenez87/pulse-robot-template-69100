-- Create RPC function to get document counts by category
CREATE OR REPLACE FUNCTION public.counts_by_category(p_owner UUID)
RETURNS TABLE(category TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.category,
    COUNT(d.id) as count
  FROM documents d
  WHERE d.user_id = p_owner 
    AND d.is_folder = false
  GROUP BY d.category
  UNION ALL
  SELECT 'all' as category, COUNT(d.id) as count
  FROM documents d
  WHERE d.user_id = p_owner 
    AND d.is_folder = false
  UNION ALL
  SELECT 'folders' as category, COUNT(d.id) as count
  FROM documents d
  WHERE d.user_id = p_owner 
    AND d.is_folder = true;
END;
$$;