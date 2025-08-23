-- Create document_chunks table first (it was referenced in earlier migration but never created)
CREATE TABLE public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_id TEXT NOT NULL UNIQUE,
  text_content TEXT NOT NULL,
  embedding vector(1536),
  org_id TEXT DEFAULT '',
  room_id TEXT DEFAULT '',
  owner_id UUID NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  confidence FLOAT DEFAULT 1.0,
  processing_method TEXT,
  source_page INTEGER,
  source_block_id UUID
);

-- Enable RLS on document_chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Now create the Knowledge Suite tables

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

-- Add foreign key reference to ocr_blocks
ALTER TABLE document_chunks 
ADD CONSTRAINT fk_source_block_id 
FOREIGN KEY (source_block_id) REFERENCES ocr_blocks(id);

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

-- Enable RLS on all new tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE pii_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Add room_id to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id);