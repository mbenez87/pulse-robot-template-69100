-- Add folder structure support to documents table
ALTER TABLE public.documents 
ADD COLUMN parent_folder_id uuid REFERENCES public.documents(id),
ADD COLUMN is_folder boolean NOT NULL DEFAULT false,
ADD COLUMN shared_with text[], -- Array of user IDs who have access
ADD COLUMN share_link text, -- Public share link token
ADD COLUMN share_expires_at timestamp with time zone;

-- Add folder support index for better performance
CREATE INDEX idx_documents_parent_folder ON public.documents(parent_folder_id);
CREATE INDEX idx_documents_user_folder ON public.documents(user_id, parent_folder_id);
CREATE INDEX idx_documents_share_link ON public.documents(share_link) WHERE share_link IS NOT NULL;

-- Create document shares table for granular sharing permissions
CREATE TABLE public.document_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES auth.users(id),
  shared_with uuid NOT NULL REFERENCES auth.users(id),
  permission text NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(document_id, shared_with)
);

-- Enable RLS on document_shares
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_shares
CREATE POLICY "Users can view shares they created or received"
ON public.document_shares
FOR SELECT
USING (auth.uid() = shared_by OR auth.uid() = shared_with);

CREATE POLICY "Users can create shares for their own documents"
ON public.document_shares
FOR INSERT
WITH CHECK (
  auth.uid() = shared_by AND
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE id = document_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete shares they created"
ON public.document_shares
FOR DELETE
USING (auth.uid() = shared_by);

-- Update documents RLS to allow access via shares
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "read own documents" ON public.documents;

CREATE POLICY "Users can view their own documents or shared documents"
ON public.documents
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.document_shares 
    WHERE document_id = documents.id AND shared_with = auth.uid()
  )
);

-- Create function to get folder contents
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