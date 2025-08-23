-- Create RLS policies for the docs bucket storage
-- Policy for viewing documents (SELECT)
DO $$
BEGIN
  -- Drop existing policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
  
  -- Create new policies
  -- Users can view their own documents
  EXECUTE 'CREATE POLICY "Users can view their own documents" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = ''docs'' AND auth.uid()::text = (storage.foldername(name))[1])';

  -- Users can upload their own documents
  EXECUTE 'CREATE POLICY "Users can upload their own documents" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = ''docs'' AND auth.uid()::text = (storage.foldername(name))[1])';

  -- Users can update their own documents
  EXECUTE 'CREATE POLICY "Users can update their own documents" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = ''docs'' AND auth.uid()::text = (storage.foldername(name))[1])';

  -- Users can delete their own documents
  EXECUTE 'CREATE POLICY "Users can delete their own documents" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = ''docs'' AND auth.uid()::text = (storage.foldername(name))[1])';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create storage policies: %', SQLERRM;
END $$;