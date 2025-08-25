import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import { useMultiSelection } from '@/hooks/useMultiSelection';
import DocumentGrid from '@/components/documents/DocumentGrid';
import DocumentSidebar from '@/components/documents/DocumentSidebar';
import DocumentHeader from '@/components/documents/DocumentHeader';
import UploadModal from '@/components/documents/UploadModal';
import { Button } from '@/components/ui/button';
import { Upload, FolderPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'folders' | 'images' | 'videos' | 'pdfs' | 'documents' | 'recent' | 'starred' | 'trash';

export default function Dashboard() {
  const { user } = useAuth();
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const {
    documents,
    loading,
    error,
    createFolder,
    deleteDocument,
    moveDocument,
    duplicateDocument,
    refreshDocuments,
    categoryCounts
  } = useDocuments(currentFolder, filter);

  const filteredDocuments = documents.filter(doc => {
    if (!searchQuery) return true;
    return doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const multiSelection = useMultiSelection({ items: filteredDocuments });

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:');
    if (name?.trim()) {
      try {
        await createFolder(name.trim());
        toast({ title: "Folder created successfully" });
      } catch (error) {
        toast({ 
          title: "Failed to create folder", 
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive" 
        });
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${multiSelection.selectedIds.length} items?`)) return;
    
    try {
      await Promise.all(
        multiSelection.selectedIds.map(id => deleteDocument(id))
      );
      multiSelection.clearSelection();
      toast({ title: `Deleted ${multiSelection.selectedIds.length} items` });
    } catch (error) {
      toast({ 
        title: "Failed to delete items", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground">Please sign in to access your documents.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-muted/30">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Documents</h2>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-border p-4">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md"
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-border">
            <Button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Files
            </Button>
            <Button variant="outline" onClick={handleCreateFolder} className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4" />
              New Folder
            </Button>
          </div>

          {/* Document Grid/List */}
          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive">Error loading documents: {error}</p>
                <Button onClick={refreshDocuments} className="mt-4">Retry</Button>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No documents yet</h3>
                <p className="text-muted-foreground mb-4">Upload your first document to get started</p>
                <Button onClick={() => setShowUploadModal(true)}>Upload Files</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="font-medium truncate">{doc.title}</h4>
                    <p className="text-sm text-muted-foreground">{doc.mime_type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  );
}