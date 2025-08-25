import { supabase } from "@/integrations/supabase/client";

export async function handleUpload(
  e: React.ChangeEvent<HTMLInputElement>,
  userId: string,
  folder: string | null,
  refreshList: () => void
) {
  if (!userId) return;
  const files = e.target.files;
  if (!files) return;

  for (const file of Array.from(files)) {
    const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("docs").upload(path, file);
    if (upErr) {
      alert(upErr.message);
      continue;
    }

    // Use correct column names that match the database schema
    const { error: insertErr } = await supabase.from("documents").insert({
      title: file.name,
      file_name: file.name,
      user_id: userId,
      owner_id: userId,
      folder_id: folder,
      parent_folder_id: folder,
      file_type: file.type || 'application/octet-stream',
      mime_type: file.type || 'application/octet-stream',
      file_size: file.size,
      size_bytes: file.size,
      storage_path: path,
      is_folder: false,
      // category is computed by trigger
    });

    if (insertErr) {
      alert(`Database error: ${insertErr.message}`);
      // Optionally clean up the uploaded file from storage
      await supabase.storage.from("docs").remove([path]);
    }
  }

  refreshList();
  (e.target as HTMLInputElement).value = "";
}