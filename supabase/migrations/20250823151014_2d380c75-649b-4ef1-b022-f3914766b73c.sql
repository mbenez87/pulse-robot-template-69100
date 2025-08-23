-- Add aria_mode to user_prefs table
ALTER TABLE user_prefs 
ADD COLUMN IF NOT EXISTS aria_mode text DEFAULT 'docs';

-- Add mode and sources to ai_audit_log table  
ALTER TABLE ai_audit_log
ADD COLUMN IF NOT EXISTS mode text,
ADD COLUMN IF NOT EXISTS sources text[];

-- Update existing rows to have default values
UPDATE user_prefs SET aria_mode = 'docs' WHERE aria_mode IS NULL;
UPDATE ai_audit_log SET mode = 'docs', sources = ARRAY['docs'] WHERE mode IS NULL;