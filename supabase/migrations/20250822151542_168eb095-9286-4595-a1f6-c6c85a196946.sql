-- Hide the vault.decrypted_secrets view from the API to address security linter warning
-- This view contains SECURITY DEFINER properties which are intentional for vault functionality
-- but should not be exposed through the API

-- Revoke access from anon and authenticated roles to the vault schema views
REVOKE ALL ON vault.decrypted_secrets FROM anon;
REVOKE ALL ON vault.decrypted_secrets FROM authenticated;
REVOKE ALL ON SCHEMA vault FROM anon;
REVOKE ALL ON SCHEMA vault FROM authenticated;

-- Ensure the vault schema is not exposed in the API
-- The PostgREST API respects schema-level permissions
COMMENT ON SCHEMA vault IS 'Vault schema for secrets management - not exposed to API';