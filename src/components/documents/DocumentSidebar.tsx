import React from "react";
import { 
  FolderOpen, 
  FileText, 
  Image, 
  Video, 
  Archive, 
  Star,
  Clock,
  Trash2,
  Folder
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentSidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: "all", label: "All Files", icon: FolderOpen },
  { id: "images", label: "Images", icon: Image },
  { id: "videos", label: "Videos", icon: Video },
  { id: "pdfs", label: "PDFs", icon: FileText },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "other", label: "Other", icon: Archive },
];

const quickAccess = [
  { id: "starred", label: "Starred", icon: Star, count: 0 },
  { id: "recent", label: "Recent", icon: Clock, count: 0 },
  { id: "trash", label: "Trash", icon: Trash2, count: 0 },
];

const DocumentSidebar = ({ selectedCategory, onCategoryChange }: DocumentSidebarProps) => {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold text-foreground mb-4">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors",
                  selectedCategory === category.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{category.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Access */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold text-foreground mb-4">Quick Access</h3>
        <div className="space-y-2">
          {quickAccess.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onCategoryChange(item.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors",
                  selectedCategory === item.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Storage Usage */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold text-foreground mb-4">Storage Usage</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium text-foreground">0 B / 5 GB</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: "0%" }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            You have 5 GB of free space available
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentSidebar;