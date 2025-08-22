import React from "react";
import { Search, Upload, Grid, List, Brain, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DocumentHeaderProps {
  onUpload: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: "grid" | "list" | "ai-search" | "web-search";
  onViewModeChange: (mode: "grid" | "list" | "ai-search" | "web-search") => void;
}

const DocumentHeader = ({
  onUpload,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: DocumentHeaderProps) => {
  console.log("DocumentHeader rendering with:", { searchQuery, viewMode });
  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-pulse-100 text-pulse-600 border border-pulse-200">
          <span className="text-sm font-medium">Document Management</span>
        </div>
        <h1 className="section-title">
          Your Digital 
          <span className="bg-hero-gradient bg-clip-text text-transparent"> Workspace</span>
        </h1>
        <p className="section-subtitle mx-auto">
          Organize, manage, and access your documents with AI-powered efficiency
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white rounded-2xl p-6 shadow-elegant">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-gray-200 focus:border-pulse-500 focus:ring-pulse-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "grid" 
                  ? "bg-white text-pulse-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "list" 
                  ? "bg-white text-pulse-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange("ai-search")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "ai-search" 
                  ? "bg-white text-pulse-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Brain className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange("web-search")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "web-search" 
                  ? "bg-white text-pulse-600 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Globe className="h-4 w-4" />
            </button>
          </div>

          {/* Upload Button */}
          <Button onClick={onUpload} className="button-primary gap-2">
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentHeader;