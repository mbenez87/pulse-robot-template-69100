-- Add a category column and keep it in sync with mime_type/filename
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS category text
  CHECK (category IN ('images','videos','pdfs','documents','other'));

CREATE OR REPLACE FUNCTION public.doc_category(mime text, name text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN mime LIKE 'image/%' THEN 'images'
    WHEN mime LIKE 'video/%' THEN 'videos'
    WHEN mime = 'application/pdf' OR name ILIKE '%.pdf' THEN 'pdfs'
    WHEN mime IN (
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) OR name ~* '\.(docx?|xlsx?)$' THEN 'documents'
    ELSE 'other'
  END
$$;

-- Trigger to auto-fill category
CREATE OR REPLACE FUNCTION public.set_doc_category()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.category := public.doc_category(NEW.file_type, NEW.file_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_doc_category_ins ON public.documents;
CREATE TRIGGER trg_set_doc_category_ins
BEFORE INSERT ON public.documents
FOR EACH ROW EXECUTE PROCEDURE public.set_doc_category();

DROP TRIGGER IF EXISTS trg_set_doc_category_upd ON public.documents;
CREATE TRIGGER trg_set_doc_category_upd
BEFORE UPDATE OF file_type, file_name ON public.documents
FOR EACH ROW EXECUTE PROCEDURE public.set_doc_category();

CREATE INDEX IF NOT EXISTS documents_category_idx ON public.documents(category);

-- Update existing records to populate category
UPDATE public.documents 
SET category = public.doc_category(file_type, file_name) 
WHERE category IS NULL;