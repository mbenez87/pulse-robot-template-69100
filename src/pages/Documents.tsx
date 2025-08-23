import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import DocumentHeader from "@/components/documents/DocumentHeader";
import DocumentGrid from "@/components/documents/DocumentGrid";
import DocumentSidebar from "@/components/documents/DocumentSidebar";
import UploadModal from "@/components/documents/UploadModal";
import AIDocumentSearch from "@/components/documents/AIDocumentSearch";
import { PerplexitySearch } from "@/components/documents/PerplexitySearch";

const Documents = () => {
  const { user, isAuthenticated } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "ai-search" | "web-search">("grid");
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>();
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>([]);

  // AuthGate handles authentication - no need for manual redirect logic

  const handleFolderChange = (folderId?: string) => {
    setCurrentFolderId(folderId);
    // Update folder path based on navigation
    // This would ideally fetch the folder hierarchy from the database
    if (!folderId) {
      setFolderPath([]);
    }
    // For now, simple path management - would need proper implementation
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-8">
        <div className="section-container">
          <DocumentHeader 
            onUpload={() => setIsUploadModalOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
            <DocumentSidebar 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            
            <div className="lg:col-span-3">
              {viewMode === 'ai-search' ? (
                <AIDocumentSearch onDocumentSelect={(doc) => console.log('Selected document:', doc)} />
              ) : viewMode === 'web-search' ? (
                <PerplexitySearch />
              ) : (
                <DocumentGrid 
                  searchQuery={searchQuery}
                  selectedCategory={selectedCategory}
                  viewMode={viewMode as 'grid' | 'list'}
                  currentFolderId={currentFolderId}
                  onFolderChange={handleFolderChange}
                  folderPath={folderPath}
                />
              )}
            </div>
          </div>
        </div>
      </main>
      
      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentFolderId={currentFolderId}
      />
    </div>
  );
};

export default Documents;