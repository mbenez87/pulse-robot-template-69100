-- Drop existing trigger and update documents table
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;

-- Add new columns to existing documents table if they don't exist
ALTER TABLE public.documents 
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS size_bytes bigint,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer,
  ADD COLUMN IF NOT EXISTS duration_seconds numeric,
  ADD COLUMN IF NOT EXISTS capture_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS camera_make text,
  ADD COLUMN IF NOT EXISTS camera_model text,
  ADD COLUMN IF NOT EXISTS gps_lat numeric,
  ADD COLUMN IF NOT EXISTS gps_lon numeric,
  ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Update file_name to title where title is null
UPDATE public.documents SET title = file_name WHERE title IS NULL;

-- Update user_id to owner_id where owner_id is null  
UPDATE public.documents SET owner_id = user_id WHERE owner_id IS NULL;

-- Update file_type to mime_type where mime_type is null
UPDATE public.documents SET mime_type = file_type WHERE mime_type IS NULL;

-- Update file_size to size_bytes where size_bytes is null
UPDATE public.documents SET size_bytes = file_size WHERE size_bytes IS NULL;

-- Make required columns not null after update
ALTER TABLE public.documents 
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN owner_id SET NOT NULL,
  ALTER COLUMN mime_type SET NOT NULL,
  ALTER COLUMN size_bytes SET NOT NULL,
  ALTER COLUMN storage_path SET NOT NULL;

-- Add category as generated column
ALTER TABLE public.documents 
  ADD COLUMN IF NOT EXISTS category text GENERATED ALWAYS AS (
    CASE 
      WHEN mime_type LIKE 'image/%' THEN 'images'
      WHEN mime_type LIKE 'video/%' THEN 'videos'
      WHEN mime_type = 'application/pdf' OR title ILIKE '%.pdf' THEN 'pdfs'
      WHEN mime_type IN ('application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                         'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
           OR title ~* '\.(docx?|xlsx?)$' THEN 'documents'
      ELSE 'other'
    END
  ) STORED;

-- Create new activity and versions tables
CREATE TABLE IF NOT EXISTS public.document_activity (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('upload', 'rename', 'move', 'duplicate', 'delete', 'restore', 'download', 'share_link', 'summary_refresh', 'replace')),
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version integer NOT NULL,
  title text NOT NULL,
  storage_path text NOT NULL,
  size_bytes bigint NOT NULL,
  mime_type text NOT NULL,
  checksum text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(document_id, version)
);

-- Recreate the trigger
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.document_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can manage their own documents" ON public.documents;
CREATE POLICY "Users can manage their own documents" ON public.documents
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users can view activity for their documents" ON public.document_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_activity.document_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activity for their documents" ON public.document_activity
  FOR INSERT WITH CHECK (
    auth.uid() = actor_id AND
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_activity.document_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage versions for their documents" ON public.document_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_versions.document_id 
      AND owner_id = auth.uid()
    )
  );

-- Helper function to get next version number
CREATE OR REPLACE FUNCTION public.next_version(doc_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE((SELECT MAX(version) + 1 FROM public.document_versions WHERE document_id = doc_id), 1);
END;
$$;

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON public.documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_document_activity_document_id ON public.document_activity(document_id);
CREATE INDEX IF NOT EXISTS idx_document_activity_created_at ON public.document_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_version ON public.document_versions(document_id, version DESC);