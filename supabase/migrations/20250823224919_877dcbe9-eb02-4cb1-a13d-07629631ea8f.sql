-- Add metadata columns to documents table for media files
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS width INT,
  ADD COLUMN IF NOT EXISTS height INT,
  ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC,
  ADD COLUMN IF NOT EXISTS capture_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS camera_make TEXT,
  ADD COLUMN IF NOT EXISTS camera_model TEXT,
  ADD COLUMN IF NOT EXISTS gps_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS gps_lon NUMERIC,
  ADD COLUMN IF NOT EXISTS meta JSONB; -- arbitrary EXIF/extra fields