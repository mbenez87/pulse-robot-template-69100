import { supabase } from "@/integrations/supabase/client";

export async function uploadToUserFolder(file: File) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  
  const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("docs").upload(path, file, { upsert: false });
  
  if (error) throw error;
  return path;
}