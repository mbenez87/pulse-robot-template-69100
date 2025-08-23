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
  ai_summary?: string;
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

      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id);

      if (folderId) {
        query = query.eq('parent_folder_id', folderId);
      } else {
        query = query.is('parent_folder_id', null);
      }

      const { data, error } = await query
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
    if (!user) {
      console.error('No user found for upload');
      return null;
    }

    console.log(`Starting upload for: ${file.name}, size: ${file.size}, type: ${file.type}`);

    try {
      // Generate a clean filename with timestamp and random string
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Replace special chars
      const fileName = `${timestamp}_${randomString}_${cleanFileName}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log('Uploading file with path:', filePath);
      
      console.log(`Uploading to storage path: ${filePath}`);
      
      const { error: uploadError } = await supabase.storage
        .from('docs')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded to storage successfully');

      // Save document metadata
      const documentData = {
        user_id: user.id,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        storage_path: filePath,
        is_folder: false,
        parent_folder_id: folderId || null,
      };

      console.log('Saving document metadata:', documentData);

      const { data, error } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('Document metadata saved successfully:', data);

      // Generate AI summary for the uploaded document
      try {
        console.log('Generating AI summary for document:', data.id);
        await supabase.functions.invoke('generate-document-summary', {
          body: { documentId: data.id }
        });
        console.log('AI summary generation initiated');
      } catch (summaryError) {
        console.error('Error generating summary:', summaryError);
        // Don't fail the upload if summary generation fails
      }

      // Force refresh the documents list
      console.log('Upload successful, refreshing documents list');
      await fetchDocuments();
      
      toast({
        title: "Success",
        description: `"${file.name}" uploaded successfully`,
        duration: 3000
      });

      console.log('Upload process completed successfully');
      return data;
    } catch (err) {
      console.error('Error uploading document:', err);
      toast({
        title: "Error",
        description: `Failed to upload file: ${err.message || 'Unknown error'}`,
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

  // Effect to fetch documents and set up real-time updates
  useEffect(() => {
    if (user) {
      fetchDocuments();
      
      // Set up real-time subscription for document changes
      const channel = supabase
        .channel('documents-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'documents',
            filter: `user_id=eq.${user.id}` // Only listen to current user's documents
          },
          (payload) => {
            console.log('Real-time document change:', payload);
            // Refresh documents when any change occurs
            fetchDocuments();
          }
        )
        .subscribe();

      return () => {
        console.log('Cleaning up real-time subscription');
        supabase.removeChannel(channel);
      };
    }
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