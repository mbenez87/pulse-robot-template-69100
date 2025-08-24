-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view activity for their documents" ON public.document_activity;
DROP POLICY IF EXISTS "Users can insert activity for their documents" ON public.document_activity;
DROP POLICY IF EXISTS "Users can manage versions for their documents" ON public.document_versions;

-- Create RLS policies for document_activity
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

-- Create RLS policies for document_versions
CREATE POLICY "Users can manage versions for their documents" ON public.document_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_versions.document_id 
      AND owner_id = auth.uid()
    )
  );