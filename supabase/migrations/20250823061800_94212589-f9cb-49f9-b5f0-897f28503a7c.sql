-- Enable real-time updates for documents table
ALTER TABLE public.documents REPLICA IDENTITY FULL;

-- Add the documents table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;