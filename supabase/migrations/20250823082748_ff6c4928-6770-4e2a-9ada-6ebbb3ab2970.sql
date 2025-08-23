-- Keep the vector extension in public schema since it's already in use
-- Just fix the search path for the function
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_org_id text DEFAULT '',
  filter_room_ids text[] DEFAULT '{}',
  filter_owner_id uuid DEFAULT null
)
RETURNS TABLE(
  id uuid,
  document_id uuid,
  chunk_id text,
  text_content text,
  embedding vector(1536),
  similarity float,
  chunk_index int,
  metadata jsonb,
  org_id text,
  room_id text,
  owner_id uuid,
  created_at timestamptz,
  documents jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id,
    dc.document_id,
    dc.chunk_id,
    dc.text_content,
    dc.embedding,
    (1 - (dc.embedding <=> query_embedding)) as similarity,
    dc.chunk_index,
    dc.metadata,
    dc.org_id,
    dc.room_id,
    dc.owner_id,
    dc.created_at,
    to_jsonb(d.*) as documents
  FROM document_chunks dc
  LEFT JOIN documents d ON d.id = dc.document_id
  WHERE 
    (1 - (dc.embedding <=> query_embedding)) > match_threshold
    AND (filter_org_id = '' OR dc.org_id = filter_org_id)
    AND (array_length(filter_room_ids, 1) IS NULL OR dc.room_id = ANY(filter_room_ids))
    AND (filter_owner_id IS NULL OR dc.owner_id = filter_owner_id)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;