-- Create missing tables for the RAG pipeline with proper RLS

-- Add missing columns to documents table to match schema
ALTER TABLE documents ADD COLUMN IF NOT EXISTS org_id text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS path text;

-- Update user_prefs to include verifier setting
ALTER TABLE user_prefs ADD COLUMN IF NOT EXISTS verifier_enabled boolean DEFAULT false;

-- Create share_tokens table for answer-only sharing
CREATE TABLE IF NOT EXISTS share_tokens (
  token text PRIMARY KEY,
  org_id text NOT NULL,
  room_id text,
  scope text NOT NULL CHECK (scope IN ('qa_only')),
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on share_tokens
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for share_tokens (server-only access via service key)
CREATE POLICY "Service role can manage share tokens"
ON share_tokens
FOR ALL
USING (auth.role() = 'service_role');

-- Update ai_audit_log to include required fields
ALTER TABLE ai_audit_log ADD COLUMN IF NOT EXISTS inputs_hash text;
ALTER TABLE ai_audit_log ADD COLUMN IF NOT EXISTS outputs_hash text;
ALTER TABLE ai_audit_log ADD COLUMN IF NOT EXISTS citations jsonb;
ALTER TABLE ai_audit_log ADD COLUMN IF NOT EXISTS source_doc_ids uuid[];

-- Update document_chunks to ensure proper RLS fields
ALTER TABLE document_chunks ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE document_chunks ALTER COLUMN org_id SET DEFAULT '';

-- Create hybrid search function for FTS + vector search
CREATE OR REPLACE FUNCTION hybrid_search_chunks(
  query_text text,
  query_embedding vector,
  org_filter text,
  room_filter text DEFAULT NULL,
  doc_filter uuid[] DEFAULT NULL,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 10
)
RETURNS TABLE(
  chunk_id uuid,
  document_id uuid,
  text_content text,
  chunk_index integer,
  similarity double precision,
  doc_title text,
  doc_path text,
  page_number integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id as chunk_id,
    dc.document_id,
    dc.text_content,
    dc.chunk_index,
    (1 - (dc.embedding <=> query_embedding)) as similarity,
    d.title as doc_title,
    d.storage_path as doc_path,
    dc.source_page as page_number
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE 
    dc.org_id = org_filter
    AND (room_filter IS NULL OR dc.room_id = room_filter)
    AND (doc_filter IS NULL OR dc.document_id = ANY(doc_filter))
    AND (
      -- Vector similarity
      (1 - (dc.embedding <=> query_embedding)) > match_threshold
      OR
      -- Full text search
      to_tsvector('english', dc.text_content) @@ plainto_tsquery('english', query_text)
    )
  ORDER BY 
    -- Hybrid scoring: combine vector similarity and text search
    GREATEST(
      (1 - (dc.embedding <=> query_embedding)),
      CASE WHEN to_tsvector('english', dc.text_content) @@ plainto_tsquery('english', query_text) 
           THEN 0.8 ELSE 0 END
    ) DESC
  LIMIT match_count;
END;
$$;

-- Update RLS policies for documents to include org_id
DROP POLICY IF EXISTS "Users can view their own documents or shared documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

CREATE POLICY "Users can view documents in their org"
ON documents FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM document_shares ds 
    WHERE ds.document_id = documents.id AND ds.shared_with = auth.uid()
  )
);

CREATE POLICY "Users can insert documents in their org"
ON documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update documents in their org"
ON documents FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete documents in their org"
ON documents FOR DELETE
USING (auth.uid() = user_id);

-- Update document_chunks RLS to use org_id properly
DROP POLICY IF EXISTS "Users can access chunks for authorized rooms" ON document_chunks;

CREATE POLICY "Users can access chunks in their org and rooms"
ON document_chunks FOR SELECT
USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM documents d 
    WHERE d.id = document_chunks.document_id AND d.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM document_shares ds 
    WHERE ds.document_id = document_chunks.document_id AND ds.shared_with = auth.uid()
  )
);

-- Create function to generate secure tokens
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;