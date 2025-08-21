import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DocumentHeader from "@/components/documents/DocumentHeader";
import DocumentGrid from "@/components/documents/DocumentGrid";
import DocumentSidebar from "@/components/documents/DocumentSidebar";
import UploadModal from "@/components/documents/UploadModal";

const Documents = () => {
  console.log("Documents component is rendering");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  console.log("Documents state:", { isUploadModalOpen, searchQuery, selectedCategory, viewMode });

  try {
    console.log("About to render Documents JSX");
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
      
      <main className="pt-20">
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
              <DocumentGrid 
                searchQuery={searchQuery}
                selectedCategory={selectedCategory}
                viewMode={viewMode}
              />
            </div>
          </div>
        </div>
      </main>
      
      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
      
      <Footer />
    </div>
  );
  } catch (error) {
    console.error("Error in Documents component:", error);
    return <div>Error loading Documents page</div>;
  }
};

export default Documents;