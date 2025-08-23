import React, { useState, useCallback } from 'react';
import { Plus, FolderPlus, MoreHorizontal, Search, Download, Trash2, Edit2, FileText, Folder, Image, Video, Archive, RotateCcw } from 'lucide-react';
import { Document, useDocuments } from '@/hooks/useDocuments';
import { useMultiSelection } from '@/hooks/useMultiSelection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FolderNavigation from './FolderNavigation';
import AIDocumentSearch from './AIDocumentSearch';
import AIDocumentActions from './AIDocumentActions';
import DocumentActions from './DocumentActions';
import { FileItem } from './FileItem';
import { BulkActions } from './BulkActions';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DocumentGridProps {
  searchQuery: string;
  selectedCategory: string;
  viewMode: "grid" | "list" | "ai-search";
  currentFolderId?: string;
  onFolderChange?: (folderId?: string) => void;
  folderPath?: Array<{ id: string; name: string }>;
}


const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const DocumentGrid = ({ searchQuery, selectedCategory, viewMode, currentFolderId, onFolderChange, folderPath }: DocumentGridProps) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [draggedDocument, setDraggedDocument] = useState<Document | null>(null);
  const [dragOverDocument, setDragOverDocument] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { documents, loading, createFolder, deleteDocument, downloadDocument, moveDocument } = useDocuments(currentFolderId, selectedCategory);
  
  console.log('DocumentGrid - Raw documents:', documents);
  console.log('DocumentGrid - Current filter:', { searchQuery, selectedCategory, currentFolderId });
  const { toast } = useToast();

  // Filter documents based on search only (category filtering is now handled in the hook)
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Handle special categories that aren't database categories
    let matchesSpecialCategory = true;
    if (selectedCategory === "recent") {
      matchesSpecialCategory = new Date(doc.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (selectedCategory === "starred") {
      // TODO: Implement starred functionality
      matchesSpecialCategory = false;
    } else if (selectedCategory === "trash") {
      // TODO: Implement trash functionality
      matchesSpecialCategory = false;
    }
    
    return matchesSearch && matchesSpecialCategory;
  });

  // Use multi-selection hook
  const {
    selectedIds,
    handleRowClick,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount,
    isAllSelected
  } = useMultiSelection({ items: filteredDocuments });

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreateFolderOpen(false);
    }
  };

  const handleDuplicate = useCallback(async (id: string) => {
    const selectedDocIds = selectedIds.includes(id) ? selectedIds : [id];
    toast({
      title: "Feature coming soon",
      description: `Duplicating ${selectedDocIds.length} item${selectedDocIds.length > 1 ? 's' : ''}...`
    });
  }, [selectedIds, toast]);

  const handleMove = useCallback(async () => {
    toast({
      title: "Feature coming soon",
      description: `Moving ${selectedCount} items...`
    });
  }, [selectedCount, toast]);

  const handleBulkDelete = useCallback(async () => {
    for (const id of selectedIds) {
      await deleteDocument(id);
    }
    clearSelection();
    toast({
      title: "Success",
      description: `Deleted ${selectedIds.length} item${selectedIds.length > 1 ? 's' : ''}`
    });
  }, [selectedIds, deleteDocument, clearSelection, toast]);

  const handleBulkDownload = useCallback(async () => {
    const selectedDocs = documents.filter(doc => selectedIds.includes(doc.id));
    for (const doc of selectedDocs) {
      if (!doc.is_folder) {
        await downloadDocument(doc);
      }
    }
  }, [selectedIds, documents, downloadDocument]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, document: Document) => {
    setDraggedDocument(document);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, targetDocument: Document) => {
    e.preventDefault();
    if (targetDocument.is_folder && draggedDocument && draggedDocument.id !== targetDocument.id) {
      setDragOverDocument(targetDocument.id);
    }
  }, [draggedDocument]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDocument(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetDocument: Document) => {
    e.preventDefault();
    setDragOverDocument(null);
    
    if (draggedDocument && targetDocument.is_folder && draggedDocument.id !== targetDocument.id) {
      await moveDocument(draggedDocument.id, targetDocument.id);
      toast({
        title: "Success",
        description: `Moved "${draggedDocument.file_name}" to "${targetDocument.file_name}"`
      });
    }
    setDraggedDocument(null);
  }, [draggedDocument, moveDocument, toast]);

  const handleOpenDocument = useCallback((document: Document) => {
    if (document.is_folder) {
      onFolderChange?.(document.id);
    } else {
      // TODO: Implement file preview
      toast({
        title: "Feature coming soon",
        description: "File preview will be implemented soon."
      });
    }
  }, [onFolderChange, toast]);

  const handleShare = useCallback((document: Document) => {
    // TODO: Implement sharing functionality
    toast({
      title: "Feature coming soon",
      description: "File sharing will be implemented soon."
    });
  }, [toast]);

  // Handle AI Search mode
  if (viewMode === "ai-search") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AIDocumentSearch onDocumentSelect={() => {}} />
        </div>
        <div>
          <AIDocumentActions 
            onAnalysisComplete={(analysis) => {
              toast({
                title: "Analysis Complete",
                description: "Document analysis has been completed successfully."
              });
            }}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pulse-600"></div>
      </div>
    );
  }

  if (filteredDocuments.length === 0 && !loading) {
    const emptyStateType = searchQuery ? 'search' : (currentFolderId ? 'folder' : 'all-files');
    return (
      <EmptyState
        type={emptyStateType}
        searchQuery={searchQuery}
        folderName={folderPath?.[folderPath.length - 1]?.name}
        onUpload={() => {/* TODO: Trigger upload modal */}}
        onCreateFolder={() => setIsCreateFolderOpen(true)}
        onClearSearch={() => {/* TODO: Clear search */}}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Folder Navigation */}
      {folderPath && folderPath.length > 0 && (
        <FolderNavigation 
          path={folderPath} 
          onNavigate={onFolderChange} 
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentFolderId ? `Folder Contents` : 'All Files'}
          </h2>
          {selectedCount > 0 && (
            <span className="text-sm text-gray-500">
              {selectedCount} of {filteredDocuments.length} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'list' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={selectAll}
              className="gap-2"
            >
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </Button>
          )}
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FolderPlus className="h-4 w-4" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                />
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={selectAll}
                      className="h-4 w-4 text-pulse-600 focus:ring-pulse-500 border-gray-300 rounded"
                    />
                    Name
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modified
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((document, index) => (
                <FileItem
                  key={document.id}
                  document={document}
                  viewMode="list"
                  isSelected={isSelected(document.id)}
                  isDragOver={dragOverDocument === document.id}
                  onSelect={(id, ctrlKey) => handleRowClick({ ctrlKey } as React.MouseEvent, id, index)}
                  onOpen={handleOpenDocument}
                  onRename={() => {}} // TODO: Implement rename
                  onDuplicate={handleDuplicate}
                  onDelete={(id) => setDeleteConfirmId(id)}
                  onDownload={downloadDocument}
                  onShare={handleShare}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredDocuments.map((document, index) => (
            <FileItem
              key={document.id}
              document={document}
              viewMode="grid"
              isSelected={isSelected(document.id)}
              isDragOver={dragOverDocument === document.id}
              onSelect={(id, ctrlKey) => handleRowClick({ ctrlKey } as React.MouseEvent, id, index)}
              onOpen={handleOpenDocument}
              onRename={() => {}} // TODO: Implement rename
              onDuplicate={handleDuplicate}
              onDelete={(id) => setDeleteConfirmId(id)}
              onDownload={downloadDocument}
              onShare={handleShare}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      <BulkActions
        selectedCount={selectedCount}
        onDownload={handleBulkDownload}
        onDuplicate={() => handleDuplicate(selectedIds[0])}
        onMove={handleMove}
        onDelete={handleBulkDelete}
        onClearSelection={clearSelection}
      />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the file from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteConfirmId) {
                  await deleteDocument(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentGrid;