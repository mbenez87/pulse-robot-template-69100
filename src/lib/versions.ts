import { supabase } from "@/integrations/supabase/client";

interface CreateVersionParams {
  document_id: string;
  title: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string;
}

export async function createVersion(params: CreateVersionParams) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data: versionData } = await supabase.rpc('next_version', { doc_id: params.document_id });
  const version = versionData || 1;
  
  const { error } = await supabase.from('document_versions').insert({
    document_id: params.document_id,
    version: version,
    title: params.title,
    storage_path: params.storage_path,
    size_bytes: params.size_bytes,
    mime_type: params.mime_type,
    created_by: user.user.id
  });

  if (error) throw error;
}