import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Image, 
  Video, 
  Archive, 
  Folder,
  Plus,
  FolderPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDocuments } from "@/hooks/useDocuments";
import DocumentActions from "./DocumentActions";
import FolderNavigation from "./FolderNavigation";
import AIDocumentSearch from "./AIDocumentSearch";
import AIDocumentActions from "./AIDocumentActions";

interface DocumentGridProps {
  searchQuery: string;
  selectedCategory: string;
  viewMode: "grid" | "list" | "ai-search";
  currentFolderId?: string;
  onFolderChange?: (folderId?: string) => void;
  folderPath?: Array<{ id: string; name: string }>;
}

const getFileIcon = (type: string, isFolder: boolean = false) => {
  if (isFolder) return Folder;
  
  switch (type) {
    case "application/pdf":
    case "text/plain":
    case "application/msword":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return FileText;
    case "image/jpeg":
    case "image/png":
    case "image/gif":
    case "image/webp":
      return Image;
    case "video/mp4":
    case "video/avi":
    case "video/mov":
      return Video;
    case "application/zip":
    case "application/x-rar":
      return Archive;
    default:
      return FileText;
  }
};

const getFileTypeColor = (type: string, isFolder: boolean = false) => {
  if (isFolder) return "text-amber-600 bg-amber-50";
  
  if (type.startsWith("image/")) return "text-green-600 bg-green-50";
  if (type.startsWith("video/")) return "text-purple-600 bg-purple-50";
  if (type.includes("zip") || type.includes("rar")) return "text-orange-600 bg-orange-50";
  return "text-blue-600 bg-blue-50";
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const DocumentGrid = ({ 
  searchQuery, 
  selectedCategory, 
  viewMode, 
  currentFolderId,
  onFolderChange,
  folderPath = []
}: DocumentGridProps) => {
  const navigate = useNavigate();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();
  
  const {
    documents,
    loading,
    createFolder,
    deleteDocument,
    downloadDocument,
  } = useDocuments(currentFolderId);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
      (selectedCategory === "documents" && !doc.is_folder && (doc.file_type.includes("pdf") || doc.file_type.includes("text") || doc.file_type.includes("word"))) ||
      (selectedCategory === "images" && !doc.is_folder && doc.file_type.startsWith("image/")) ||
      (selectedCategory === "videos" && !doc.is_folder && doc.file_type.startsWith("video/")) ||
      (selectedCategory === "archives" && !doc.is_folder && (doc.file_type.includes("zip") || doc.file_type.includes("rar"))) ||
      (selectedCategory === "folders" && doc.is_folder);
    
    return matchesSearch && matchesCategory;
  });

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    await createFolder(newFolderName.trim());
    setNewFolderName("");
    setShowCreateFolder(false);
  };

  const handleDocumentClick = (document: any) => {
    if (document.is_folder) {
      onFolderChange?.(document.id);
    } else {
      navigate(`/documents/${document.id}`);
    }
  };

  // Handle AI Search mode
  if (viewMode === "ai-search") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AIDocumentSearch onDocumentSelect={(id) => setSelectedDocumentId(id)} />
        </div>
        <div>
          <AIDocumentActions 
            documentId={selectedDocumentId || undefined}
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Folder Navigation */}
      {folderPath.length > 0 && (
        <FolderNavigation 
          path={folderPath} 
          onNavigate={onFolderChange} 
        />
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
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
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
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

      {/* Empty State */}
      {filteredDocuments.length === 0 && !loading && (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchQuery ? 'No documents found' : 'This folder is empty'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try adjusting your search terms' : 'Upload files or create folders to get started'}
          </p>
        </div>
      )}

      {/* Document Grid */}
      {viewMode === "list" ? (
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Size</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Modified</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocuments.map((doc) => {
                  const Icon = getFileIcon(doc.file_type, doc.is_folder);
                  return (
                    <tr 
                      key={doc.id} 
                      className="hover:bg-muted/50 transition-colors cursor-pointer" 
                      onClick={() => handleDocumentClick(doc)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", getFileTypeColor(doc.file_type, doc.is_folder))}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground truncate">{doc.file_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.is_folder ? 'Folder' : doc.file_type}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {doc.is_folder ? '—' : formatFileSize(doc.file_size)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(doc.updated_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <DocumentActions
                          document={doc}
                          onDownload={downloadDocument}
                          onDelete={deleteDocument}
                          onOpen={handleDocumentClick}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => {
            const Icon = getFileIcon(doc.file_type, doc.is_folder);
            return (
              <div
                key={doc.id}
                className="bg-card rounded-lg border hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
                onClick={() => handleDocumentClick(doc)}
              >
                {/* File Preview */}
                <div className="relative h-32 bg-muted/30 rounded-t-lg overflow-hidden">
                  <div className="flex items-center justify-center h-full">
                    <div className={cn("p-3 rounded-lg", getFileTypeColor(doc.file_type, doc.is_folder))}>
                      <Icon className="h-8 w-8" />
                    </div>
                  </div>
                  
                  {/* Actions Button */}
                  <div className="absolute top-2 right-2">
                    <DocumentActions
                      document={doc}
                      onDownload={downloadDocument}
                      onDelete={deleteDocument}
                      onOpen={handleDocumentClick}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-medium text-foreground truncate mb-1">
                    {doc.file_name}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {doc.is_folder ? 'Folder' : formatFileSize(doc.file_size)}
                    </span>
                    <span>
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

};

export default DocumentGrid;