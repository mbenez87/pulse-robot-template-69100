-- Knowledge Suite Database Schema

-- Rooms for organizing documents and controlling access
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  org_id TEXT NOT NULL,
  owner_id UUID NOT NULL,
  settings JSONB DEFAULT '{}',
  answer_only_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- OCR Pages - stores extracted text from document pages
CREATE TABLE public.ocr_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  raw_text TEXT,
  confidence FLOAT,
  language TEXT,
  processing_method TEXT, -- 'pdf.js', 'gemini-1.5-pro', 'gpt-4o', 'claude-3.5'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- OCR Blocks - granular text blocks within pages
CREATE TABLE public.ocr_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ocr_page_id UUID NOT NULL REFERENCES ocr_pages(id) ON DELETE CASCADE,
  block_index INTEGER NOT NULL,
  text_content TEXT NOT NULL,
  confidence FLOAT,
  bounding_box JSONB, -- {x, y, width, height}
  block_type TEXT, -- 'paragraph', 'heading', 'table', 'image'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced document chunks with room and confidence info
ALTER TABLE document_chunks 
ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS processing_method TEXT,
ADD COLUMN IF NOT EXISTS source_page INTEGER,
ADD COLUMN IF NOT EXISTS source_block_id UUID REFERENCES ocr_blocks(id);

-- Room access tokens for sharing
CREATE TABLE public.room_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  permissions JSONB DEFAULT '{"query_only": true}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- Document lineage for tracking redactions and watermarks
CREATE TABLE public.doc_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_document_id UUID NOT NULL REFERENCES documents(id),
  derived_document_id UUID NOT NULL REFERENCES documents(id),
  operation_type TEXT NOT NULL, -- 'redaction', 'watermark', 'ocr_correction'
  operation_details JSONB NOT NULL,
  performed_by UUID NOT NULL,
  performed_at TIMESTAMPTZ DEFAULT now()
);

-- PII/PHI detection results
CREATE TABLE public.pii_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  ocr_block_id UUID REFERENCES ocr_blocks(id) ON DELETE CASCADE,
  detection_type TEXT NOT NULL, -- 'pii', 'phi', 'secrets', 'custom'
  entity_type TEXT NOT NULL, -- 'ssn', 'phone', 'email', 'credit_card', etc.
  text_content TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  bounding_box JSONB,
  status TEXT DEFAULT 'detected', -- 'detected', 'reviewed', 'redacted', 'approved'
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API key settings (encrypted)
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  service_name TEXT NOT NULL, -- 'openai', 'anthropic', 'google', 'perplexity'
  key_hash TEXT NOT NULL, -- encrypted key
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, service_name)
);

-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE pii_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Users can manage rooms in their org" ON rooms
  FOR ALL USING (auth.uid() = owner_id);

-- RLS Policies for OCR data
CREATE POLICY "Users can access OCR data for their documents" ON ocr_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM documents d 
      WHERE d.id = ocr_pages.document_id 
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access OCR blocks for their documents" ON ocr_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ocr_pages op
      JOIN documents d ON d.id = op.document_id
      WHERE op.id = ocr_blocks.ocr_page_id 
      AND d.user_id = auth.uid()
    )
  );

-- RLS Policies for room tokens
CREATE POLICY "Users can manage tokens for their rooms" ON room_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = room_tokens.room_id 
      AND r.owner_id = auth.uid()
    )
  );

-- RLS Policies for document lineage
CREATE POLICY "Users can view lineage for their documents" ON doc_lineage
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM documents d 
      WHERE (d.id = doc_lineage.parent_document_id OR d.id = doc_lineage.derived_document_id)
      AND d.user_id = auth.uid()
    )
  );

-- RLS Policies for PII detections
CREATE POLICY "Users can manage PII detections for their documents" ON pii_detections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM documents d 
      WHERE d.id = pii_detections.document_id 
      AND d.user_id = auth.uid()
    )
  );

-- RLS Policies for API keys
CREATE POLICY "Users can manage API keys for their org" ON api_keys
  FOR ALL USING (auth.uid() = created_by);

-- Add room_id to documents table if not exists
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id);

-- Update document chunks RLS to include room access
DROP POLICY IF EXISTS "Users can view their own documents or shared documents" ON document_chunks;
CREATE POLICY "Users can access chunks for authorized rooms" ON document_chunks
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = document_chunks.room_id 
      AND r.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM document_shares ds
      WHERE ds.document_id = document_chunks.document_id 
      AND ds.shared_with = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_ocr_pages_document_id ON ocr_pages(document_id);
CREATE INDEX idx_ocr_blocks_page_id ON ocr_blocks(ocr_page_id);
CREATE INDEX idx_pii_detections_document_id ON pii_detections(document_id);
CREATE INDEX idx_room_tokens_hash ON room_tokens(token_hash);
CREATE INDEX idx_documents_room_id ON documents(room_id);

-- Triggers for updated_at
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();