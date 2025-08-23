-- Add RLS policies for all tables

-- RLS Policies for document_chunks
CREATE POLICY "Users can access chunks for authorized rooms" ON document_chunks
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = document_chunks.room_id::UUID 
      AND r.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM document_shares ds
      WHERE ds.document_id = document_chunks.document_id 
      AND ds.shared_with = auth.uid()
    )
  );

CREATE POLICY "Users can insert chunks for their documents" ON document_chunks
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update chunks for their documents" ON document_chunks
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete chunks for their documents" ON document_chunks
  FOR DELETE USING (auth.uid() = owner_id);

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

-- Indexes for performance
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_room_id ON document_chunks(room_id);
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);
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