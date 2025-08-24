import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { extractFileMetadata } from '@/lib/metadataExtractor';
import { toast } from '@/hooks/use-toast';

export interface Document {
  id: string;
  title: string;
  owner_id: string;
  folder_id: string | null;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  category: string | null;
  tags: string[] | null;
  summary: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  capture_at: string | null;
  camera_make: string | null;
  camera_model: string | null;
  gps_lat: number | null;
  gps_lon: number | null;
  meta: any;
  is_folder: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCounts {
  all: number;
  folders: number;
  images: number;
  videos: number;
  pdfs: number;
  documents: number;
  other: number;
}

type FilterType = 'all' | 'folders' | 'images' | 'videos' | 'pdfs' | 'documents' | 'recent' | 'starred' | 'trash';

export function useDocuments(folderId: string | null = null, filter: FilterType = 'all') {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({
    all: 0,
    folders: 0,
    images: 0,
    videos: 0,
    pdfs: 0,
    documents: 0,
    other: 0
  });

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      // Apply folder filter
      if (folderId) {
        query = query.eq('parent_folder_id', folderId);
      } else {
        query = query.is('parent_folder_id', null);
      }

      // Apply category filter
      if (filter === 'folders') {
        query = query.eq('is_folder', true);
      } else if (filter !== 'all' && filter !== 'recent' && filter !== 'starred' && filter !== 'trash') {
        query = query.eq('category', filter).eq('is_folder', false);
      } else if (filter === 'recent') {
        query = query.eq('is_folder', false).order('created_at', { ascending: false }).limit(50);
      }

      // Default ordering
      if (filter !== 'recent') {
        query = query.order('is_folder', { ascending: false }).order('title', { ascending: true });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform the data to match our interface - data already matches our schema
      const transformedData = (data || []).map(doc => ({
        ...doc,
        owner_id: doc.user_id,
        folder_id: doc.parent_folder_id,
        mime_type: doc.file_type || '',
        size_bytes: doc.file_size || 0
      }));

      setDocuments(transformedData);

      // Fetch category counts
      if (user?.id) {
        const { data: counts } = await supabase.rpc('counts_by_category', { p_owner: user.id });
        if (counts) {
          const countsMap = counts.reduce((acc: any, item: any) => {
            acc[item.category] = item.count;
            return acc;
          }, {});
          setCategoryCounts({
            all: countsMap.all || 0,
            folders: countsMap.folders || 0,
            images: countsMap.images || 0,
            videos: countsMap.videos || 0,
            pdfs: countsMap.pdfs || 0,
            documents: countsMap.documents || 0,
            other: countsMap.other || 0
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (name: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('documents').insert({
      file_name: name,
      user_id: user.id,
      parent_folder_id: folderId,
      file_type: 'folder',
      file_size: 0,
      storage_path: '',
      is_folder: true
    });

    if (error) throw error;

    // Log activity
    await logActivity('upload', { name, type: 'folder' });
    
    await fetchDocuments();
  };

  const deleteDocument = async (documentId: string) => {
    if (!user) throw new Error('Not authenticated');

    // Soft delete
    const { error } = await supabase
      .from('documents')
      .update({ is_deleted: true })
      .eq('id', documentId);

    if (error) throw error;

    // Log activity
    await logActivity('delete', { documentId });

    await fetchDocuments();
  };

  const moveDocument = async (documentId: string, targetFolderId: string | null) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('documents')
      .update({ parent_folder_id: targetFolderId })
      .eq('id', documentId);

    if (error) throw error;

    // Log activity
    await logActivity('move', { documentId, targetFolderId });

    await fetchDocuments();
  };

  const duplicateDocument = async (documentId: string) => {
    if (!user) throw new Error('Not authenticated');

    const { data: original, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;

    if (original) {
      const { error } = await supabase.from('documents').insert({
        ...original,
        id: undefined,
        file_name: `${original.file_name} (copy)`,
        created_at: undefined,
        updated_at: undefined
      });

      if (error) throw error;

      // Log activity
      await logActivity('duplicate', { originalId: documentId });

      await fetchDocuments();
    }
  };

  const uploadDocument = async (file: File) => {
    if (!user) throw new Error('Not authenticated');

    // Extract metadata
    const metadata = await extractFileMetadata(file);

    // Upload file to storage
    const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('docs')
      .upload(path, file);

    if (uploadError) throw uploadError;

    // Create document record
    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert({
        file_name: file.name,
        user_id: user.id,
        parent_folder_id: folderId,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        storage_path: path,
        width: metadata.width,
        height: metadata.height,
        duration_seconds: metadata.duration_seconds,
        capture_at: metadata.capture_at,
        camera_make: metadata.camera_make,
        camera_model: metadata.camera_model,
        gps_lat: metadata.gps_lat,
        gps_lon: metadata.gps_lon,
        meta: metadata.meta || {}
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Log activity
    await logActivity('upload', { 
      fileName: file.name, 
      fileSize: file.size,
      documentId: document.id 
    });

    // Trigger AI summary generation (async, non-blocking)
    if (document) {
      generateSummary(document.id).catch(console.error);
    }

    await fetchDocuments();
    return document;
  };

  const generateSummary = async (documentId: string) => {
    try {
      await supabase.functions.invoke('generate-document-summary', {
        body: { documentId }
      });
      
      // Log activity
      await logActivity('summary_refresh', { documentId });
    } catch (error) {
      console.error('Failed to generate summary:', error);
    }
  };

  const logActivity = async (action: string, details: any) => {
    if (!user) return;

    try {
      await supabase.from('document_activity').insert({
        document_id: details.documentId || null,
        actor_id: user.id,
        action,
        details
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, folderId, filter]);

  useEffect(() => {
    fetchDocuments();
  }, [user, folderId, filter]);

  return {
    documents,
    loading,
    error,
    categoryCounts,
    createFolder,
    deleteDocument,
    moveDocument,
    duplicateDocument,
    uploadDocument,
    generateSummary,
    refreshDocuments: fetchDocuments
  };
}