import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  is_folder: boolean;
  parent_folder_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  shared_with?: string[];
  share_link?: string;
}

export const useDocuments = (folderId?: string) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDocuments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('parent_folder_id', folderId || null)
        .order('is_folder', { ascending: false })
        .order('file_name', { ascending: true });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (name: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_name: name,
          file_type: 'folder',
          file_size: 0,
          storage_path: '',
          is_folder: true,
          parent_folder_id: folderId || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchDocuments();
      toast({
        title: "Success",
        description: "Folder created successfully"
      });

      return data;
    } catch (err) {
      console.error('Error creating folder:', err);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      await fetchDocuments();
      toast({
        title: "Success",
        description: "Document deleted successfully"
      });
    } catch (err) {
      console.error('Error deleting document:', err);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const uploadDocument = async (file: File) => {
    if (!user) return null;

    try {
      // Upload file to storage
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('docs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save document metadata
      const { data, error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          storage_path: filePath,
          is_folder: false,
          parent_folder_id: folderId || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchDocuments();
      toast({
        title: "Success",
        description: "File uploaded successfully"
      });

      return data;
    } catch (err) {
      console.error('Error uploading document:', err);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
      return null;
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('docs')
        .download(document.storage_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      toast({
        title: "Success",
        description: "File downloaded successfully"
      });
    } catch (err) {
      console.error('Error downloading document:', err);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user, folderId]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    createFolder,
    deleteDocument,
    uploadDocument,
    downloadDocument,
  };
};