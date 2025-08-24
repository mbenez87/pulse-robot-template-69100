import { supabase } from "@/integrations/supabase/client";

export async function logActivity(documentId: string, action: string, details: any = {}) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  try {
    await supabase.from('document_activity').insert({
      document_id: documentId,
      actor_id: user.user.id,
      action,
      details
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}