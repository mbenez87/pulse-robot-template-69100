import React from "react";
import { Upload, Folder, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  type: 'all-files' | 'folder' | 'search' | 'trash';
  searchQuery?: string;
  folderName?: string;
  onUpload?: () => void;
  onCreateFolder?: () => void;
  onClearSearch?: () => void;
}

export const EmptyState = ({
  type,
  searchQuery,
  folderName,
  onUpload,
  onCreateFolder,
  onClearSearch
}: EmptyStateProps) => {
  const getContent = () => {
    switch (type) {
      case 'all-files':
        return {
          icon: FileText,
          title: "No documents yet",
          description: "Upload your first document to get started with your digital workspace.",
          actions: (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={onUpload} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Files
              </Button>
              <Button variant="outline" onClick={onCreateFolder} className="gap-2">
                <Folder className="h-4 w-4" />
                Create Folder
              </Button>
            </div>
          )
        };
      
      case 'folder':
        return {
          icon: Folder,
          title: `${folderName} is empty`,
          description: "This folder doesn't contain any files yet. Upload documents or create subfolders.",
          actions: (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={onUpload} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Files
              </Button>
              <Button variant="outline" onClick={onCreateFolder} className="gap-2">
                <Folder className="h-4 w-4" />
                Create Subfolder
              </Button>
            </div>
          )
        };
      
      case 'search':
        return {
          icon: Search,
          title: "No results found",
          description: `No documents match "${searchQuery}". Try a different search term or check your spelling.`,
          actions: (
            <Button variant="outline" onClick={onClearSearch}>
              Clear Search
            </Button>
          )
        };
      
      case 'trash':
        return {
          icon: FileText,
          title: "Trash is empty",
          description: "No deleted files. Items moved to trash will appear here.",
          actions: null
        };
      
      default:
        return {
          icon: FileText,
          title: "No items",
          description: "Nothing to display here.",
          actions: null
        };
    }
  };

  const { icon: Icon, title, description, actions } = getContent();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="bg-gray-50 rounded-full p-6 mb-6">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-500 mb-6 max-w-md">
        {description}
      </p>
      
      {actions && (
        <div className="flex justify-center">
          {actions}
        </div>
      )}
    </div>
  );
};