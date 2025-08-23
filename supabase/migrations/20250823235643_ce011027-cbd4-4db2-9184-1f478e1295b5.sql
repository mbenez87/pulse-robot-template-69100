-- Create documents table with comprehensive metadata
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  storage_path text NOT NULL,
  category text GENERATED ALWAYS AS (
    CASE 
      WHEN mime_type LIKE 'image/%' THEN 'images'
      WHEN mime_type LIKE 'video/%' THEN 'videos'
      WHEN mime_type = 'application/pdf' OR title ILIKE '%.pdf' THEN 'pdfs'
      WHEN mime_type IN ('application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                         'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
           OR title ~* '\.(docx?|xlsx?)$' THEN 'documents'
      ELSE 'other'
    END
  ) STORED,
  tags text[] DEFAULT '{}',
  summary text,
  width integer,
  height integer,
  duration_seconds numeric,
  capture_at timestamp with time zone,
  camera_make text,
  camera_model text,
  gps_lat numeric,
  gps_lon numeric,
  meta jsonb DEFAULT '{}',
  is_folder boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create document_activity table
CREATE TABLE IF NOT EXISTS public.document_activity (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('upload', 'rename', 'move', 'duplicate', 'delete', 'restore', 'download', 'share_link', 'summary_refresh', 'replace')),
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create document_versions table
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

-- Update trigger for documents.updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can manage their own documents" ON public.documents
  FOR ALL USING (auth.uid() = owner_id);

-- RLS Policies for document_activity
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

-- RLS Policies for document_versions
CREATE POLICY "Users can manage versions for their documents" ON public.document_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_versions.document_id 
      AND owner_id = auth.uid()
    )
  );

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON public.documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_document_activity_document_id ON public.document_activity(document_id);
CREATE INDEX IF NOT EXISTS idx_document_activity_created_at ON public.document_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_version ON public.document_versions(document_id, version DESC);