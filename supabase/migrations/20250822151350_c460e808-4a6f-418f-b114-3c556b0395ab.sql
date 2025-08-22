-- Fix the functions to include search_path parameter
-- This addresses the security warnings about mutable search paths

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update set_updated_at function  
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update all other functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_portfolio_overview()
RETURNS TABLE(total_companies bigint, total_investments bigint, total_invested numeric, avg_investment numeric, industries_count bigint)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT c.id) as total_companies,
        COUNT(i.id) as total_investments,
        SUM(i.amount_invested) as total_invested,
        AVG(i.amount_invested) as avg_investment,
        COUNT(DISTINCT c.industry) as industries_count
    FROM companies c
    LEFT JOIN investments i ON c.id = i.company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_industry_breakdown()
RETURNS TABLE(industry text, company_count bigint, total_invested numeric)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.industry,
        COUNT(c.id) as company_count,
        SUM(i.amount_invested) as total_invested
    FROM companies c
    LEFT JOIN investments i ON c.id = i.company_id
    GROUP BY c.industry
    ORDER BY total_invested DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_stage_analysis()
RETURNS TABLE(stage text, company_count bigint, total_invested numeric, avg_investment numeric)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.stage,
        COUNT(c.id) as company_count,
        SUM(i.amount_invested) as total_invested,
        AVG(i.amount_invested) as avg_investment
    FROM companies c
    LEFT JOIN investments i ON c.id = i.company_id
    GROUP BY c.stage
    ORDER BY total_invested DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_investment_trends()
RETURNS TABLE(year double precision, month double precision, investment_count bigint, total_amount numeric)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(YEAR FROM investment_date)::double precision as year,
        EXTRACT(MONTH FROM investment_date)::double precision as month,
        COUNT(*)::bigint as investment_count,
        SUM(amount_invested) as total_amount
    FROM investments
    WHERE investment_date >= NOW() - INTERVAL '2 year'
    GROUP BY EXTRACT(YEAR FROM investment_date), EXTRACT(MONTH FROM investment_date)
    ORDER BY year, month;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_folder_and_contents(folder_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    item_record RECORD;
    file_paths_to_delete TEXT[];
BEGIN
    -- Recursively find all sub-folders and call delete on them first
    FOR item_record IN
        SELECT id FROM data_room_files WHERE parent_folder_id = folder_id_to_delete AND is_folder = true
    LOOP
        PERFORM public.delete_folder_and_contents(item_record.id);
    END LOOP;

    -- Collect storage paths of all files directly in this folder
    SELECT array_agg(storage_path) INTO file_paths_to_delete
    FROM data_room_files
    WHERE parent_folder_id = folder_id_to_delete AND is_folder = false AND storage_path IS NOT NULL;

    -- Delete files from storage if any exist
    IF file_paths_to_delete IS NOT NULL AND array_length(file_paths_to_delete, 1) > 0 THEN
        PERFORM storage.delete_objects('data_room_files', file_paths_to_delete);
    END IF;

    -- Delete all items within this folder from the database
    DELETE FROM data_room_files WHERE parent_folder_id = folder_id_to_delete;

    -- Finally, delete the folder itself
    -- First, get its storage path
    SELECT storage_path INTO file_paths_to_delete FROM data_room_files WHERE id = folder_id_to_delete;
    
    -- Delete from storage if it has a path
    IF file_paths_to_delete IS NOT NULL AND array_length(file_paths_to_delete, 1) > 0 THEN
        PERFORM storage.delete_objects('data_room_files', file_paths_to_delete);
    END IF;

    -- Delete the folder record from the database
    DELETE FROM data_room_files WHERE id = folder_id_to_delete;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_trial_dates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.trial_start_date IS NULL THEN
    NEW.trial_start_date = now();
    NEW.trial_end_date = now() + INTERVAL '3 days';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;