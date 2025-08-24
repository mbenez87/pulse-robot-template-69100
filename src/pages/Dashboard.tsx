import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import { useMultiSelection } from '@/hooks/useMultiSelection';
import DocumentGrid from '@/components/documents/DocumentGrid';
import DocumentSidebar from '@/components/documents/DocumentSidebar';
import DocumentHeader from '@/components/documents/DocumentHeader';
import UploadModal from '@/components/documents/UploadModal';
import FolderNavigation from '@/components/documents/FolderNavigation';
import EmptyState from '@/components/documents/EmptyState';
import BulkActions from '@/components/documents/BulkActions';
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
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

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

  const handleBulkMove = async (targetFolderId: string | null) => {
    try {
      await Promise.all(
        multiSelection.selectedIds.map(id => moveDocument(id, targetFolderId))
      );
      multiSelection.clearSelection();
      toast({ title: `Moved ${multiSelection.selectedIds.length} items` });
    } catch (error) {
      toast({ 
        title: "Failed to move items", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
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
        <DocumentSidebar
          filter={filter}
          onFilterChange={setFilter}
          categoryCounts={categoryCounts}
          currentFolder={currentFolder}
          onFolderChange={setCurrentFolder}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <DocumentHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Folder Navigation */}
          {currentFolder && (
            <FolderNavigation
              currentFolder={currentFolder}
              onNavigate={setCurrentFolder}
            />
          )}

          {/* Bulk Actions */}
          {multiSelection.selectedCount > 0 && (
            <BulkActions
              selectedCount={multiSelection.selectedCount}
              onMove={handleBulkMove}
              onDelete={handleBulkDelete}
              onClear={multiSelection.clearSelection}
              documents={documents}
            />
          )}

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
              <EmptyState 
                filter={filter}
                searchQuery={searchQuery}
                onUpload={() => setShowUploadModal(true)}
                onCreateFolder={handleCreateFolder}
              />
            ) : (
              <DocumentGrid
                documents={filteredDocuments}
                viewMode={viewMode}
                multiSelection={multiSelection}
                onMove={moveDocument}
                onDelete={deleteDocument}
                onDuplicate={duplicateDocument}
                dragOverFolder={dragOverFolder}
                onDragOverFolder={setDragOverFolder}
              />
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        currentFolder={currentFolder}
        onUploadComplete={refreshDocuments}
      />
    </div>
  );
}